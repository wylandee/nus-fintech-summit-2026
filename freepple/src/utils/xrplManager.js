import * as xrpl from 'xrpl'

// 1. Singleton Client (So we don't open 100 connections)
const SERVER_URL = "wss://s.altnet.rippletest.net:51233/"
let client = null

export async function connectClient() {
  // If already connected, reuse it
  if (client && client.isConnected()) return client

  console.log("⏳ Connecting to Testnet...")
  client = new xrpl.Client(SERVER_URL)
  await client.connect()
  
  console.log("✅ Connected!")
  return client
}

// 2. The Funding Function (Your code, wrapped)
export async function getDevWallet() {
  const _client = await connectClient()

  console.log("💸 Asking Faucet for funds...")
  
  // This function does the heavy lifting: 
  // 1. Generates keys 
  // 2. Talks to the Faucet 
  // 3. Waits for the ledger to confirm the balance
  const { wallet, balance } = await _client.fundWallet()
  
  console.log(`✅ Wallet Funded: ${wallet.address}`)
  console.log(`💰 Balance: ${balance} XRP`)
  
  return {
    wallet,
    balance,
    explorer: `https://testnet.xrpl.org/accounts/${wallet.address}`
  }
}