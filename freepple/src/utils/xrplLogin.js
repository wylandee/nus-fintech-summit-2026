import * as xrpl from 'xrpl'
import { connectClient } from './xrplManager' 

/**
 * LOGIN LOGIC: Restores wallet and verifies address match
 * @param {string} seed - The secret key (sEd...)
 * @param {string} expectedAddress - The user provided address (r...)
 */
export async function getExistingWallet(seed, expectedAddress) {
  const _client = await connectClient()
  console.log("🔑 Verifying Credentials...")
  
  try {
    // 1. Restore wallet from seed
    const wallet = xrpl.Wallet.fromSeed(seed)

    // 2. 🛡️ SECURITY CHECK: Does the seed generate the address the user claims?
    if (wallet.address !== expectedAddress) {
      throw new Error(`Mismatch! This seed belongs to ${wallet.address}, not ${expectedAddress}`)
    }
    
    // 3. Get live balance
    const balance = await _client.getXrpBalance(wallet.address)
    
    console.log(`✅ Logged in: ${wallet.address}`)
    return wallet

  } catch (error) {
    console.error("Login Failed:", error)
    // Throw the specific mismatch error if it happened, otherwise generic
    throw new Error(error.message || "Invalid Seed or Connection Error")
  }
}