import {
  Contract, Networks, TransactionBuilder, BASE_FEE,
  nativeToScVal, scValToNative, xdr, Address, Account,
  rpc as StellarRpc,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'

const RPC        = import.meta.env.VITE_RPC        ?? 'https://soroban-testnet.stellar.org'
const HORIZON    = import.meta.env.VITE_HORIZON    ?? 'https://horizon-testnet.stellar.org'
const PASSPHRASE = import.meta.env.VITE_PASSPHRASE ?? 'Test SDF Network ; September 2015'

export const CONTRACTS = {
  POOL: import.meta.env.VITE_POOL ?? '',
  CARE: import.meta.env.VITE_CARE ?? '',
  HC:   import.meta.env.VITE_HC   ?? '',
  CV:   import.meta.env.VITE_CV   ?? '',
}

// ── Contract error codes ──────────────────────────────────────────────────────

const CONTRACT_ERRORS: Record<number, string> = {
  1:  'Contract already initialized.',
  2:  'You are already a member of this pool.',
  3:  'You must join the pool first.',
  4:  'Claim has not been approved yet.',
  5:  'Claimant address mismatch.',
  6:  'You have already voted on this.',
  7:  'Proposal already executed.',
  8:  'Proposal has not passed.',
  9:  'Not found.',
  10: 'You need CARE tokens to vote.',
}

/**
 * Soroban simulation errors come back as plain strings like:
 *   "HostError: Error(Contract, #2)"
 *   "HostError: Error(WasmVm, InvalidInput)"
 * On-chain failures come back as base64 XDR TransactionResult.
 * We handle both here.
 */
function friendlyError(raw: string): string {
  if (!raw) return 'Unknown error.'
  console.log('[stellar] raw error:', raw)

  // ── Simulation error string (most common path) ────────────────────────────
  // Soroban RPC returns: "HostError: Error(Contract, #N)"
  const contractMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/)
  if (contractMatch) {
    const code = Number(contractMatch[1])
    return CONTRACT_ERRORS[code] ?? `Contract error #${code}`
  }

  // ── On-chain failure XDR (base64) ─────────────────────────────────────────
  // Only attempt XDR decode if it looks like base64 (no spaces, long string)
  if (!raw.includes(' ') && raw.length > 20) {
    try {
      // getTransaction returns resultXdr as a TransactionResult (not Pair)
      const result = xdr.TransactionResult.fromXDR(raw, 'base64')
      const txResult = result.result()
      // txResult is a TransactionResultResult union; on failure it has results()
      const opResults = (txResult as any).results?.()
      if (opResults?.length) {
        const opInner = opResults[0]
        // opInner.tr() gives OperationResult.Tr union
        const tr = (opInner as any).tr?.()
        // tr.invokeHostFunctionResult() gives InvokeHostFunctionResult
        const ihfr = (tr as any).invokeHostFunctionResult?.()
        if (ihfr) {
          const arm = ihfr.switch?.()
          // InvokeHostFunctionResultCode: success=0, malformed=-1, trapped=-2
          if (arm?.value === 0) return 'Transaction succeeded.'
          if (arm?.value === -1) return 'Malformed transaction.'
          if (arm?.value === -2) {
            // The trap value is an ScError — decode it
            // Try to get the contract error code from the ScError
            try {
              const trapVal = ihfr.value?.() // ScVal or similar
              if (trapVal) {
                const native = scValToNative(trapVal)
                console.log('[stellar] trap native:', native)
              }
            } catch { /* ignore */ }
            return 'Transaction was rejected by the contract.'
          }
        }
      }
    } catch (e) {
      console.log('[stellar] XDR parse failed:', e)
      // not valid TransactionResult XDR, try TransactionResultPair
      try {
        const pair = xdr.TransactionResultPair.fromXDR(raw, 'base64')
        const result = pair.result()
        const opResults = (result.result() as any).results?.()
        if (opResults?.length) {
          const tr = (opResults[0] as any).tr?.()
          const ihfr = (tr as any).invokeHostFunctionResult?.()
          if (ihfr?.switch?.()?.value === -2) {
            return 'Transaction was rejected by the contract.'
          }
        }
      } catch { /* ignore */ }
    }
  }

  // ── Known string patterns ─────────────────────────────────────────────────
  if (raw.includes('AlreadyMember') || raw.includes('#2'))  return CONTRACT_ERRORS[2]
  if (raw.includes('NotMember')     || raw.includes('#3'))  return CONTRACT_ERRORS[3]
  if (raw.includes('AlreadyVoted')  || raw.includes('#6'))  return CONTRACT_ERRORS[6]
  if (raw.includes('AlreadyExec')   || raw.includes('#7'))  return CONTRACT_ERRORS[7]
  if (raw.includes('NotPassed')     || raw.includes('#8'))  return CONTRACT_ERRORS[8]
  if (raw.includes('NoCare')        || raw.includes('#10')) return CONTRACT_ERRORS[10]
  if (raw.includes('Account not found'))
    return 'Account not found — fund your wallet on Testnet first.'
  if (raw.includes('ERR_FAILED') || raw.includes('Failed to fetch'))
    return 'Network error — check your connection or RPC endpoint.'
  if (raw.includes('HostError'))
    return `Contract execution failed: ${raw.replace(/^.*HostError:\s*/, '')}`

  return raw
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function rpc(method: string, params: unknown): Promise<unknown> {
  const r = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!r.ok) throw new Error(`RPC HTTP error ${r.status}`)
  const j = await r.json() as { result?: unknown; error?: { message: string } }
  if (j.error) throw new Error(j.error.message)
  return j.result
}

async function getAccount(addr: string): Promise<Account> {
  const r = await fetch(`${HORIZON}/accounts/${addr}`)
  if (!r.ok) throw new Error('Account not found — fund your wallet on Testnet first (friendbot.stellar.org).')
  const d = await r.json() as { id: string; sequence: string }
  return new Account(d.id, d.sequence)
}

// ── simulate (read-only) ──────────────────────────────────────────────────────

export async function simulate(contractId: string, fn: string, args: xdr.ScVal[], caller: string) {
  const account = await getAccount(caller)
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(contractId).call(fn, ...args))
    .setTimeout(30)
    .build()

  const res = await rpc('simulateTransaction', { transaction: tx.toXDR() }) as {
    results?: Array<{ xdr: string }>; error?: string
  }
  if (res.error) throw new Error(friendlyError(res.error))
  if (!res.results?.[0]?.xdr) return null
  return scValToNative(xdr.ScVal.fromXDR(res.results[0].xdr, 'base64'))
}

// ── invoke (write — Freighter signs) ─────────────────────────────────────────

export async function invoke(contractId: string, fn: string, args: xdr.ScVal[], signer: string) {
  // 1. Fetch account
  const account = await getAccount(signer)
  const seqStr = account.sequenceNumber()

  // 2. Build tx
  const tx = new TransactionBuilder(
    new Account(account.accountId(), seqStr),
    { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }
  )
    .addOperation(new Contract(contractId).call(fn, ...args))
    .setTimeout(30)
    .build()

  // 3. Simulate
  const server = new StellarRpc.Server(RPC)
  const simResult = await server.simulateTransaction(tx)
  console.log('[stellar] sim response:', JSON.stringify({ error: (simResult as any).error, hasData: !!(simResult as any).transactionData }))

  if (StellarRpc.Api.isSimulationError(simResult)) {
    throw new Error(friendlyError((simResult as StellarRpc.Api.SimulateTransactionErrorResponse).error))
  }

  // 4. assembleTransaction sets soroban data + auth entries from simulation
  const prepared = StellarRpc.assembleTransaction(tx, simResult).build()

  // 5. Sign with Freighter
  let signedXdr: string
  try {
    const result = await signTransaction(prepared.toXDR(), { networkPassphrase: PASSPHRASE })
    if (typeof result === 'string') {
      signedXdr = result
    } else if (result && typeof result === 'object') {
      const r = result as { signedTxXdr?: string; error?: string }
      if (r.error) throw new Error(`Freighter: ${r.error}`)
      if (!r.signedTxXdr) throw new Error('Freighter returned no signed XDR.')
      signedXdr = r.signedTxXdr
    } else {
      throw new Error('Unexpected Freighter response.')
    }
  } catch (e) {
    if (e instanceof Error && (e.message.includes('User declined') || e.message.includes('rejected'))) {
      throw new Error('Transaction rejected in Freighter.')
    }
    throw e
  }

  // 6. Submit
  const send = await rpc('sendTransaction', { transaction: signedXdr }) as {
    hash: string; status: string; errorResultXdr?: string
  }
  if (send.status === 'ERROR') {
    const msg = send.errorResultXdr ? friendlyError(send.errorResultXdr) : 'Transaction rejected by network.'
    throw new Error(msg)
  }

  // 7. Poll for result
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1500))
    const poll = await rpc('getTransaction', { hash: send.hash }) as {
      status: string; returnValue?: string; resultXdr?: string
    }
    if (poll.status === 'SUCCESS') {
      return poll.returnValue ? scValToNative(xdr.ScVal.fromXDR(poll.returnValue, 'base64')) : null
    }
    if (poll.status === 'FAILED') {
      console.log('[stellar] poll FAILED resultXdr:', poll.resultXdr)
      const msg = poll.resultXdr ? friendlyError(poll.resultXdr) : 'Transaction failed on-chain.'
      throw new Error(msg)
    }
  }
  throw new Error('Transaction timed out after 45 seconds.')
}

// ── ScVal helpers ─────────────────────────────────────────────────────────────

const a    = (addr: string)  => new Address(addr).toScVal()
const i128 = (n: bigint)     => nativeToScVal(n, { type: 'i128' })
const str  = (s: string)     => nativeToScVal(s, { type: 'string' })
const u64  = (n: bigint)     => nativeToScVal(n, { type: 'u64' })
const bool = (b: boolean)    => nativeToScVal(b, { type: 'bool' })

// ── Pool read functions ───────────────────────────────────────────────────────

export const memberCount = (addr: string) =>
  simulate(CONTRACTS.POOL, 'member_count', [], addr).then(r => Number(r ?? 0))

export const totalFunds = (addr: string) =>
  simulate(CONTRACTS.POOL, 'total_funds', [], addr).then(r => BigInt(String(r ?? 0)))

export const isMember = (addr: string) =>
  simulate(CONTRACTS.POOL, 'is_member', [a(addr)], addr).then(r => Boolean(r))

export const getMember = (addr: string) =>
  simulate(CONTRACTS.POOL, 'get_member', [a(addr)], addr)

export const careBalance = (addr: string) =>
  simulate(CONTRACTS.CARE, 'balance', [a(addr)], addr).then(r => BigInt(String(r ?? 0)))

export const hcCredits = (addr: string) =>
  simulate(CONTRACTS.HC, 'credits', [a(addr)], addr).then(r => BigInt(String(r ?? 0)))

export const claimCount = (addr: string) =>
  simulate(CONTRACTS.CV, 'count', [], addr).then(r => BigInt(String(r ?? 0)))

export const getClaim = (addr: string, id: bigint) =>
  simulate(CONTRACTS.CV, 'get', [u64(id)], addr)

export const getProposal = (addr: string, pid: bigint) =>
  simulate(CONTRACTS.POOL, 'get_proposal', [u64(pid)], addr)

// ── Pool write functions ──────────────────────────────────────────────────────

export const joinPool = (addr: string) =>
  invoke(CONTRACTS.POOL, 'join', [a(addr)], addr)

export const contribute = (addr: string) =>
  invoke(CONTRACTS.POOL, 'contribute', [a(addr)], addr)

export const submitClaim = (addr: string, amount: bigint, desc: string) =>
  invoke(CONTRACTS.POOL, 'submit_claim', [a(addr), i128(amount), str(desc)], addr)
    .then(r => BigInt(String(r ?? 0)))

export const voteClaim = (addr: string, id: bigint, approve: boolean) =>
  invoke(CONTRACTS.CV, 'vote', [a(addr), u64(id), bool(approve)], addr)

export const createProposal = (addr: string, desc: string, newContrib: bigint) =>
  invoke(CONTRACTS.POOL, 'create_proposal', [a(addr), str(desc), i128(newContrib)], addr)
    .then(r => BigInt(String(r ?? 0)))

export const voteProposal = (addr: string, pid: bigint, approve: boolean) =>
  invoke(CONTRACTS.POOL, 'vote_proposal', [a(addr), u64(pid), bool(approve)], addr)

export const executeProposal = (addr: string, pid: bigint) =>
  invoke(CONTRACTS.POOL, 'execute_proposal', [u64(pid)], addr)
