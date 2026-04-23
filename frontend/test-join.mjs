import { Contract, Networks, TransactionBuilder, BASE_FEE, Account, Address } from '@stellar/stellar-sdk'

const POOL = 'CDMMAR6XO6X2GSUY6CUKZ3W4SBTXIFHI3GDAX7AWBB76A7ZSR7DUJVEF'
const USER = 'GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44'

const hr = await fetch(`https://horizon-testnet.stellar.org/accounts/${USER}`)
const hd = await hr.json()
console.log('seq:', hd.sequence, 'balance:', hd.balances?.[0]?.balance)

const account = new Account(hd.id, hd.sequence)
const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(new Contract(POOL).call('join', Address.fromString(USER).toScVal()))
  .setTimeout(30).build()

const res = await fetch('https://soroban-testnet.stellar.org', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'simulateTransaction', params: { transaction: tx.toXDR() } })
})
const j = await res.json()
console.log('sim error:', j.result?.error ?? 'none')
console.log('transactionData:', j.result?.transactionData ? 'present' : 'MISSING')
console.log('minResourceFee:', j.result?.minResourceFee)
