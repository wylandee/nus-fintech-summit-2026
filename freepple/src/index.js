// Backend-only entry point for XRPL transaction management
export { default as submitTransaction } from './helpers/submit-transaction';
export { default as getWalletDetails } from './helpers/get-wallet-details.js';

// Utilities
export { client } from './utils/client.js';
export { getFundingWallet } from './utils/wallet.js';
export { healthCheck } from './utils/healthCheck.js';
export { initXRPLManager, getXRPLManager } from './utils/xrplManager.js';

// XRPL exports for convenience
export * from 'xrpl';
