/**
 * Reproduces the exact invoke() flow from stellar.ts
 * to find where the transaction fails.
 */
import { Contract, Networks, TransactionBuilder, BASE_FEE, Account, Address, xdr } from '@stellar/stellar-sdk'

const POOL = 'CDMMAR6XO6X2GSUY6CUKZ3W4SBTXIFHI3GDAX7AWBB76A7ZSR7DUJVEF'
const USER = 'GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44'
const RPC  = 'https://soroban-testnet.stellar.org'
const HOR  = 'https://horizon-testnet.stellar.org'

// Step 1: get account
const hr = await fetch(`${HOR}/accounts/${USER}`)
const hd = await hr.json()
const account = new Account(hd.id, hd.sequence)
console.log('1. Account seq:', hd.sequence)

// Step 2: build tx
const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(new Contract(POOL).call('join', Address.fromString(USER).toScVal()))
  .setTimeout(30).build()
console.log('2. TX built, XDR length:', tx.toXDR().length)

// Step 3: simulate
const simRes = await fetch(RPC, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'simulateTransaction', params:{ transaction: tx.toXDR() } })
})
const simJ = await simRes.json()
const sim = simJ.result
console.log('3. Sim error:', sim.error ?? 'none')
console.log('   transactionData:', sim.transactionData ? 'present' : 'MISSING')
console.log('   minResourceFee:', sim.minResourceFee)

// Step 4: rebuild with SAME account (same sequence number)
const sameAccount = new Account(account.accountId(), account.sequenceNumber())
const prepared = new TransactionBuilder(sameAccount, {
  fee: String(Number(BASE_FEE) + Number(sim.minResourceFee ?? 0)),
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(new Contract(POOL).call('join', Address.fromString(USER).toScVal()))
  .setTimeout(30)
  .setSorobanData(xdr.SorobanTransactionData.fromXDR(sim.transactionData, 'base64'))
  .build()
console.log('4. Prepared TX XDR length:', prepared.toXDR().length)

// Step 5: verify prepared tx by simulating it again
const verRes = await fetch(RPC, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc:'2.0', id:2, method:'simulateTransaction', params:{ transaction: prepared.toXDR() } })
})
const verJ = await verRes.json()
console.log('5. Verify prepared TX:')
console.log('   error:', verJ.result?.error ?? 'none')
console.log('   result xdr:', verJ.result?.results?.[0]?.xdr ?? 'none')
console.log('')
console.log('✅ If no errors above, the TX is valid. The issue is in Freighter signing or submission.')
console.log('   Prepared TX XDR (pass to Freighter):')
console.log('   ', prepared.toXDR().slice(0, 60) + '...')
