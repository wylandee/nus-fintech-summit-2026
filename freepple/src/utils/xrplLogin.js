import * as xrpl from 'xrpl'
import { connectClient } from './xrplManager' 

/**
 * Login logic: Restores wallet and verifies address match
 * @param {string} seed - The secret key (s...)
 * @param {string} expectedAddress - The user provided address (r...)
 */
export async function getExistingWallet(seed, expectedAddress) {
  const _client = await connectClient()
  console.log("Verifying Credentials...")
  
  try {
    // Restore wallet from seed
    const wallet = xrpl.Wallet.fromSeed(seed)

    if (wallet.address !== expectedAddress) {
      throw new Error(`Mismatch! This seed belongs to ${wallet.address}, not ${expectedAddress}`)
    }
    
    // Get live balance
    const balance = await _client.getXrpBalance(wallet.address)
    
    console.log(`Logged in: ${wallet.address}`)
    return wallet

  } catch (error) {
    console.error("Login Failed:", error)
    throw new Error(error.message || "Invalid Seed or Connection Error")
  }
}