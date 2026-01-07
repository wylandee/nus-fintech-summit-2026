import * as xrpl from 'xrpl'
import { connectClient } from './xrplManager' // Reuse the connection logic

/**
 * LOGIN LOGIC: Restores a wallet from a specific seed
 * @param {string} seed - The secret key (e.g. "sEd...")
 */
export async function getExistingWallet(seed) {
  const _client = await connectClient()
  console.log("🔑 Restoring Wallet from Seed...")
  
  try {
    // 1. Restore from seed
    const wallet = xrpl.Wallet.fromSeed(seed)
    
    // 2. Get live balance
    const balance = await _client.getXrpBalance(wallet.address)
    
    console.log(`✅ Logged in: ${wallet.address} (${balance} XRP)`)
    return wallet
  } catch (error) {
    console.error("Login Failed:", error)
    throw new Error("Invalid Seed or Connection Error")
  }
}