import * as xrpl from 'xrpl'

const SERVER_URL = "wss://s.altnet.rippletest.net:51233/"
let client = null

// Singleton Client
export async function connectClient() {
  if (client && client.isConnected()) return client

  console.log("⏳ Connecting to Testnet...")
  client = new xrpl.Client(SERVER_URL)
  await client.connect()
  
  console.log("✅ Connected!")
  return client
}

// Fund Wallet
export async function getDevWallet() {
  const _client = await connectClient()
  console.log("💸 Asking Faucet for funds...")
  const fund_result = await _client.fundWallet()
  const wallet = fund_result.wallet
  console.log(`✅ Wallet Funded: ${wallet.address}`)
  return wallet
}

// Create Escrow
export async function createEscrow(senderWallet, amountXRP, destinationAddress, durationHours = 24) {
  const _client = await connectClient()
  console.log("🔒 Generating Security Keys...")

  // Re-create the Wallet Instance from the seed
  const signerWallet = xrpl.Wallet.fromSeed(senderWallet.seed)

  const randomBytes = window.crypto.getRandomValues(new Uint8Array(32))
  const secretHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', randomBytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  const condition = "A0258020" + hashHex + "810120"

  const expiryDate = new Date(Date.now() + (durationHours * 60 * 60 * 1000))
  const rippleCancelAfter = xrpl.isoTimeToRippleTime(expiryDate.toISOString())

  const escrowTx = {
    TransactionType: "EscrowCreate",
    Account: signerWallet.address, 
    Destination: destinationAddress,
    Amount: xrpl.xrpToDrops(amountXRP),
    Condition: condition, 
    DestinationTag: 2026,
    CancelAfter: rippleCancelAfter 
  }

  console.log("🚀 Submitting Escrow...")
  // Use signerWallet instead of senderWallet
  const result = await _client.submitAndWait(escrowTx, { wallet: signerWallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    return {
      txHash: result.result.hash,
      sequence: result.result.Sequence || result.result.tx_json.Sequence,
      secret: secretHex,
      condition: condition,
      expiry: expiryDate 
    }
  } else {
    throw new Error(`Tx Failed: ${result.result.meta.TransactionResult}`)
  }
}

// Claim Escrow
export async function claimEscrow(wallet, ownerAddress, escrowSequence, condition, secret) {
  const _client = await connectClient()
  console.log("🔓 Constructing Skeleton Key...")
  
  // Re-create the Wallet Instance
  const signerWallet = xrpl.Wallet.fromSeed(wallet.seed)

  const fulfillment = "A0228020" + secret

  const tx = {
    TransactionType: "EscrowFinish",
    Account: signerWallet.address,
    Owner: ownerAddress, 
    OfferSequence: escrowSequence, 
    Condition: condition,
    Fulfillment: fulfillment 
  }

  console.log("🚀 Submitting Claim...")
  const result = await _client.submitAndWait(tx, { wallet: signerWallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ MONEY UNLOCKED!")
    return result.result.hash
  } else {
    throw new Error(`Claim Failed: ${result.result.meta.TransactionResult}`)
  }
}

// Cancel Escrow (Refund)
export async function cancelEscrow(wallet, ownerAddress, escrowSequence) {
  const _client = await connectClient()
  console.log("⏳ Attempting Refund...")

  // Re-create the Wallet Instance
  const signerWallet = xrpl.Wallet.fromSeed(wallet.seed)

  const tx = {
    TransactionType: "EscrowCancel",
    Account: signerWallet.address,
    Owner: ownerAddress, 
    OfferSequence: escrowSequence
  }

  const result = await _client.submitAndWait(tx, { wallet: signerWallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ REFUND SUCCESS! Money returned.")
    return result.result.hash
  } else {
    throw new Error(`Refund Failed: ${result.result.meta.TransactionResult}`)
  }
}

// History Logic
export async function getEscrowHistory(address) {
  const client = await connectClient()
  
  console.log("📜 Fetching History for:", address)

  const response = await client.request({
    command: "account_tx",
    account: address,
    ledger_index_min: -1, 
    ledger_index_max: -1,
    limit: 50,
    binary: false
  })

  const txs = response.result.transactions || []
  console.log(`🔎 RAW LEDGER RETURN: Found ${txs.length} items.`)

  const relevantTypes = ["EscrowFinish", "EscrowCancel", "EscrowCreate"]

  const history = txs.map(t => {
    const tx = t.tx || t.tx_json || t
    const meta = t.meta || tx.meta || {}

    if (!tx || !tx.TransactionType) {
        return null 
    }

    const type = tx.TransactionType
    const result = meta.TransactionResult

    if (!relevantTypes.includes(type)) return null
    if (result !== "tesSUCCESS") return null

    const date = (tx.date || t.date)
        ? new Date(((tx.date || t.date) + 946684800) * 1000).toLocaleString() 
        : "Unknown Date"
    
    let label = "UNKNOWN"
    if (type === "EscrowFinish") label = "COMPLETED" 
    if (type === "EscrowCancel") label = "REFUNDED"
    if (type === "EscrowCreate") label = "CREATED" 

    return {
      id: tx.hash || t.hash,
      type: label,
      date: date,
      sequence: tx.OfferSequence || tx.Sequence, 
      account: tx.Account, 
      owner: tx.Owner, 
      txHash: tx.hash || t.hash
    }
  })
  .filter(item => item !== null)

  console.log(`🎉 Final Clean History Count: ${history.length}`)
  return history
}

// Register Identity
export async function registerIdentity(wallet) {
  const _client = await connectClient()
  
  // Re-create the Wallet Instance
  const signerWallet = xrpl.Wallet.fromSeed(wallet.seed)

  const isAlreadyVerified = await checkIdentity(signerWallet.address)
  if (isAlreadyVerified) {
    console.log("⚠️ Safety Trigger: Wallet already has a DID.")
    return true 
  }

  console.log("🆔 Registering DID...")
  const didUri = "did:xrpl:testnet:" + signerWallet.address
  const didData = xrpl.convertStringToHex(didUri)

  const tx = {
    TransactionType: "DIDSet",
    Account: signerWallet.address,
    URI: didData,
  }

  const result = await _client.submitAndWait(tx, { wallet: signerWallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    localStorage.setItem(`did_verified_${signerWallet.address}`, "true")
    console.log("✅ DID Registered & Cached!")
    return true
  } else {
    throw new Error(`DID Failed: ${result.result.meta.TransactionResult}`)
  }
}

// Check Identity
export async function checkIdentity(address) {
  if (localStorage.getItem(`did_verified_${address}`) === "true") {
    console.log("⚡️ Identity found in Local Cache")
    return true
  }

  const _client = await connectClient()
  try {
    const response = await _client.request({
      command: "account_objects",
      account: address,
      ledger_index: "validated",
      limit: 400 
    })

    const objects = response.result.account_objects
    const hasDID = objects.some(obj => 
      obj.LedgerEntryType && obj.LedgerEntryType.toUpperCase() === "DID"
    )
    
    if (hasDID) {
       localStorage.setItem(`did_verified_${address}`, "true")
    }

    return hasDID
  } catch (e) {
    console.error("Check Identity Failed:", e)
    return false
  }
}