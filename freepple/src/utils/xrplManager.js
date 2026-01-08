import * as xrpl from 'xrpl'

// 1. Singleton Client
const SERVER_URL = "wss://s.altnet.rippletest.net:51233/"
let client = null

export async function connectClient() {
  if (client && client.isConnected()) return client

  console.log("⏳ Connecting to Testnet...")
  client = new xrpl.Client(SERVER_URL)
  await client.connect()
  
  console.log("✅ Connected!")
  return client
}

// 2. Fund Wallet
export async function getDevWallet() {
  const _client = await connectClient()
  console.log("💸 Asking Faucet for funds...")
  const fund_result = await _client.fundWallet()
  const wallet = fund_result.wallet
  console.log(`✅ Wallet Funded: ${wallet.address}`)
  return wallet
}

// 3. Create Escrow
export async function createEscrow(senderWallet, amountXRP, destinationAddress, durationHours = 24) {
  const _client = await connectClient()
  console.log("🔒 Generating Security Keys...")

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
    Account: senderWallet.address,
    Destination: destinationAddress,
    Amount: xrpl.xrpToDrops(amountXRP),
    Condition: condition, 
    DestinationTag: 2026,
    CancelAfter: rippleCancelAfter 
  }

  console.log("🚀 Submitting Escrow...")
  const result = await _client.submitAndWait(escrowTx, { wallet: senderWallet })

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

// 4. Claim Escrow
export async function claimEscrow(wallet, ownerAddress, escrowSequence, condition, secret) {
  const _client = await connectClient()
  console.log("🔓 Constructing Skeleton Key...")
  const fulfillment = "A0228020" + secret

  const tx = {
    TransactionType: "EscrowFinish",
    Account: wallet.address,
    Owner: ownerAddress, 
    OfferSequence: escrowSequence, 
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

// 5. Cancel Escrow (Refund)
export async function cancelEscrow(wallet, ownerAddress, escrowSequence) {
  const _client = await connectClient()
  console.log("⏳ Attempting Refund...")

  const tx = {
    TransactionType: "EscrowCancel",
    Account: wallet.address,
    Owner: ownerAddress, 
    OfferSequence: escrowSequence
  }

  const result = await _client.submitAndWait(tx, { wallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("✅ REFUND SUCCESS! Money returned.")
    return result.result.hash
  } else {
    throw new Error(`Refund Failed: ${result.result.meta.TransactionResult}`)
  }
}

/**
 * 6. HISTORY LOGIC (Ultimate Parsers)
 */
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
    // 🛠️ ULTIMATE PARSER: Check all possible locations for data
    const tx = t.tx || t.tx_json || t
    const meta = t.meta || tx.meta || {}

    // 🛑 DEBUGGING: If we still can't find the type, log the keys to see what's wrong
    if (!tx || !tx.TransactionType) {
        console.warn("⚠️ Skipping item (Missing TransactionType). Keys found:", Object.keys(t))
        return null 
    }

    const type = tx.TransactionType
    const result = meta.TransactionResult

    // 1. Filter out non-Escrow transactions (like Payments from the faucet)
    if (!relevantTypes.includes(type)) {
        // console.log(`   ℹ️ Ignored non-escrow tx: ${type}`)
        return null
    }

    // 2. Filter out failed transactions
    if (result !== "tesSUCCESS") {
        console.log(`   ❌ Found failed ${type}: ${result}`)
        return null
    }

    console.log(`   ✅ Found valid entry: ${type}`)

    // Format the valid item
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

/**
 * 🆔 REGISTER IDENTITY (With Safety Check)
 */
export async function registerIdentity(wallet) {
  const _client = await connectClient()
  
  // 1. SAFETY CHECK: Check Ledger one last time before spending money
  const isAlreadyVerified = await checkIdentity(wallet.address)
  if (isAlreadyVerified) {
    console.log("⚠️ Safety Trigger: Wallet already has a DID.")
    return true // Return success without sending Tx
  }

  console.log("🆔 Registering DID...")
  const didUri = "did:xrpl:testnet:" + wallet.address
  const didData = xrpl.convertStringToHex(didUri)

  const tx = {
    TransactionType: "DIDSet",
    Account: wallet.address,
    URI: didData,
  }

  const result = await _client.submitAndWait(tx, { wallet })

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    // 2. CACHE IT: Save to LocalStorage so UI updates instantly next time
    localStorage.setItem(`did_verified_${wallet.address}`, "true")
    console.log("✅ DID Registered & Cached!")
    return true
  } else {
    throw new Error(`DID Failed: ${result.result.meta.TransactionResult}`)
  }
}

/**
 * 🕵️‍♂️ CHECK IDENTITY (The Bulletproof Version)
 */
export async function checkIdentity(address) {
  // 1. FAST CHECK: Check Browser Cache first (Instant UI fix)
  if (localStorage.getItem(`did_verified_${address}`) === "true") {
    console.log("⚡️ Identity found in Local Cache")
    return true
  }

  const _client = await connectClient()
  try {
    // 2. DEEP CHECK: Fetch ALL objects from Ledger
    const response = await _client.request({
      command: "account_objects",
      account: address,
      ledger_index: "validated",
      limit: 400 // Fetch everything
    })

    const objects = response.result.account_objects
    
    // Debug: Print types found so we can see if DID is hiding
    const typesFound = objects.map(o => o.LedgerEntryType)
    console.log(`🔎 Found Object Types for ${address}:`, typesFound)

    // 3. FUZZY FIND: Check for "DID" (Case Insensitive)
    const hasDID = objects.some(obj => 
      obj.LedgerEntryType && obj.LedgerEntryType.toUpperCase() === "DID"
    )
    
    // 4. Update Cache if found
    if (hasDID) {
       localStorage.setItem(`did_verified_${address}`, "true")
    }

    return hasDID
  } catch (e) {
    console.error("Check Identity Failed:", e)
    return false
  }
}