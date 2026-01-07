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
  const fund_result = await _client.fundWallet()

  const wallet = fund_result.wallet
  const balance = fund_result.balance
  
  console.log(`✅ Wallet Funded: ${wallet.address}`)
  console.log(`💰 Balance: ${balance} XRP`)
  
  return wallet
}

/**
 * CORE LOGIC: Creates the escrow
 * @param {Object} senderWallet - The wallet object sending the money
 * @param {string} amountXRP - Amount in XRP (string, e.g. "10")
 * @param {string} destinationAddress - The freelancer's address
 */
export async function createEscrow(senderWallet, amountXRP, destinationAddress) {
  const _client = await connectClient()

  console.log("🔒 Generating Security Keys...")

  // 1. GENERATE THE SECRET (The Key)
  // We create a random 32-byte password. 
  // This is what the Freelancer needs to unlock the funds later.
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(32))
  
  // Convert random bytes to a HEX string (e.g. "A1B2C3...")
  const secretHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  // 2. GENERATE THE LOCK (The Condition)
  // We hash the secret using SHA-256. The Ledger holds this Hash.
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', randomBytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  // 🛠️ MAGIC PREFIX: "A0258020"
  // This tells XRPL: "This is a standard SHA-256 Preimage Condition"
  const condition = "A0258020" + hashHex + "810120"

  console.log("Secret (Save this!):", secretHex)
  console.log("Condition (Public):", condition)

  // 3. SUBMIT THE ESCROW TRANSACTION
  const escrowTx = {
    TransactionType: "EscrowCreate",
    Account: senderWallet.address,
    Destination: destinationAddress,
    Amount: xrpl.xrpToDrops(amountXRP), // Converts "10" to "10000000" drops
    Condition: condition, 
    DestinationTag: 2026, // Optional tag
    // Safety Net: If not claimed in 24 hours, money returns to you.
    CancelAfter: xrpl.isoTimeToRippleTime(new Date(Date.now() + 86400000).toISOString()) 
  }

  console.log("🚀 Submitting Escrow to Ledger...")
  
  const result = await _client.submitAndWait(escrowTx, { wallet: senderWallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ SUCCESS: Funds Locked!")
    return {
      txHash: result.result.hash,
      sequence: result.result.Sequence || result.result.tx_json.Sequence,
      secret: secretHex,    // Display this to the user!
      condition: condition
    }
  } else {
    throw new Error(`Tx Failed: ${result.result.meta.TransactionResult}`)
  }
}

/**
 * CLAIM LOGIC: Unlocks the funds using the Secret
 * @param {Object} wallet - The Freelancer's wallet
 * @param {string} ownerAddress - The Client's address (who created the lock)
 * @param {number} escrowSequence - The Tx Sequence number of the creation (The ID)
 * @param {string} condition - The Lock string (A025...)
 * @param {string} secret - The Secret Key (Preimage)
 */
export async function claimEscrow(wallet, ownerAddress, escrowSequence, condition, secret) {
  const _client = await connectClient()

  console.log("🔓 Constructing Skeleton Key...")

  // 1. GENERATE THE FULFILLMENT (The Key)
  // Structure: [A0 24] [80 20 SECRET...]
  // A0 = Composite, 24 = Length 36 (0x24), 80 = Type, 20 = Length 32
  const fulfillment = "A0228020" + secret

  const tx = {
    TransactionType: "EscrowFinish",
    Account: wallet.address,
    Owner: ownerAddress, // The person who locked the money
    OfferSequence: escrowSequence, // The ID of the lock
    Condition: condition,
    Fulfillment: fulfillment 
  }

  console.log("🚀 Submitting Claim...")
  const result = await _client.submitAndWait(tx, { wallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ MONEY UNLOCKED!")
    return result.result.hash
  } else {
    throw new Error(`Claim Failed: ${result.result.meta.TransactionResult}`)
  }
}