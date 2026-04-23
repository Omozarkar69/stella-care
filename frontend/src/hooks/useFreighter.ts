import { useState, useEffect, useCallback } from 'react'
import { isConnected, isAllowed, requestAccess, getAddress, getNetwork } from '@stellar/freighter-api'

export type Wallet =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'not_installed' }
  | { status: 'connected'; address: string; network: string }
  | { status: 'error'; msg: string }

export function useFreighter() {
  const [wallet, setWallet] = useState<Wallet>({ status: 'idle' })

  useEffect(() => { check() }, [])

  async function check() {
    setWallet({ status: 'checking' })
    try {
      const c = await isConnected()
      if (!c.isConnected) { setWallet({ status: 'not_installed' }); return }
      const al = await isAllowed()
      if (!al.isAllowed) { setWallet({ status: 'idle' }); return }
      const addr = await getAddress()
      const net  = await getNetwork()
      if (addr.error) { setWallet({ status: 'idle' }); return }
      setWallet({ status: 'connected', address: addr.address, network: net.network ?? 'TESTNET' })
    } catch { setWallet({ status: 'not_installed' }) }
  }

  const connect = useCallback(async () => {
    setWallet({ status: 'checking' })
    try {
      const c = await isConnected()
      if (!c.isConnected) { setWallet({ status: 'not_installed' }); return }
      const acc = await requestAccess()
      if (acc.error) { setWallet({ status: 'error', msg: acc.error }); return }
      const addr = await getAddress()
      const net  = await getNetwork()
      if (addr.error) { setWallet({ status: 'error', msg: addr.error }); return }
      setWallet({ status: 'connected', address: addr.address, network: net.network ?? 'TESTNET' })
    } catch (e) {
      setWallet({ status: 'error', msg: e instanceof Error ? e.message : 'Unknown error' })
    }
  }, [])

  const disconnect = useCallback(() => setWallet({ status: 'idle' }), [])

  const address = wallet.status === 'connected' ? wallet.address : null
  const short   = address ? `${address.slice(0,4)}…${address.slice(-4)}` : null

  return { wallet, connect, disconnect, address, short }
}
