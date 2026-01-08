#  Freepple: Trustless Gig Economy on XRPL

## The Problem
* **Freelancers** get ghosted by clients after doing the work.
* **Clients** are afraid to pay upfront for fear of scams.
* **Middlemen** charge **high fees** just to hold the money.

## Our Solution: Freepple
Freepple is a **Trustless Escrow & Identity Platform** built on the **XRP Ledger**.
We replace the "Middleman" with a **Smart Contract**.

* **Zero Fees:** We charge 0% commission. You only pay the network gas (**very low**).
* **Trustless Payments:** Clients lock funds *before* work starts. Funds are locked on the ledger until the work is delivered.
* **On-Chain Identity:** We use **XLS-40 DID** to mint "Verified" badges. Your reputation lives on the blockchain.

---

## Key Features

### 1. Smart Escrow Vaults
Funds are locked on the XRPL using a **Preimage Sha256 Condition**.
* **Client** proves solvency by locking the money.
* **Freelancer** sees the "Locked" status and feels safe to work.
* **Release:** The money is released instantly when the Freelancer inputs the correct Secret Key (exchanged upon delivery).

### 2. Decentralized Identity (DID)
Integrated with the **XLS-40 Standard**.
* Users can "Mint" a verification badge directly to the ledger.
* **Green Badge:** Verified Identity (Trusted).
* **Orange Badge:** Unverified (High Risk).
* Users can transact with unverified wallets at their discretion
* Freelancers can build a portable reputation.
* Clients are disincentivised from ghosting for fear of destroying their on-chain reputation.

### 3. Safety Refunds
If a freelancer disappears, the client's money is secure.
* Funds have a **Timeout Duration** (e.g., 24 hours).
* After expiry, the client can unilaterally **Claim Refund** to pull funds back.

If the client does not hand over the Secret Key, freelancers are protected
* **Raise Dispute** button to raise a transaction issue.
* Clients risk damage to their on-chain reputation, linked through DID.

### 4. One-Click Invoicing
* Freelancers generate secure payment links.
* Encodes amount, memo, and destination to prevent user error.
* Fields are locked to prevent tampering.

---

## Sample Workflow

1. Client and freelancer agree on a price and job request on their separate communication channel (e.g. Whatsapp, Email).
2. Freelancer logs onto Freepple and creates a new request, filling in the fields as per their agreement.
3. A payment link is auto-generated and freelancer sends it to the client.
4. Client clicks on the link, bringing him to the payment page after logging in.
5. Client sets the timeout duration and locks the XRP on the blockchain.
6. Client saves the secret key somewhere safe.
7. Freelancer checks his dashboard and sees that the XRP is on the blockchain.
8. Freelancer can start his work knowing that the XRP is secure.
9. Freelancer submits the completed work to client.
10. Client is happy with the work and sends over the secret key to freelancer.
11. Freelancer unlocks the funds with the secret key.

---

## Planned Enhancements

1. Add support for **RLUSD** and other tokens.
2. Add support for browser wallets such as **Crossmark**.
3. Add a **3rd party mediator** to resolve payment disputes.
4. Add **better DID verification** through proper **DID document URI**.
5. Add a feature to **flag out or blacklist scammers** through their DID. 

---

## Tech Stack

* **Frontend:** React + Vite
* **Styling:** Tailwind CSS + Lucide React
* **Backend:** XRPL.js (Client Library)
* **Network:** XRP Ledger Testnet

---

## How to Run Locally

### Prerequisites
* Node.js (v18+)
* npm or yarn

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/wylandee/nus-fintech-summit-2026.git

# 2. Install dependencies
cd freepple
npm install

# 3. Start the dev server
npm run dev
```