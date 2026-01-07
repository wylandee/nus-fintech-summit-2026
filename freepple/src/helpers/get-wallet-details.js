import { Wallet, classicAddressToXAddress } from 'xrpl';

export async function getWalletDetails({ client }) {
  const seed = import.meta.env.VITE_SEED;
  if (!seed) {
    throw new Error('VITE_SEED not set in .env file');
  }

  const explorerNetwork = (import.meta.env.VITE_EXPLORER_NETWORK || 'testnet').toLowerCase();
  const isTestNetwork = explorerNetwork !== 'mainnet';

  const wallet = Wallet.fromSeed(seed);

  const accountInfo = await client.request({
    command: 'account_info',
    account: wallet.address,
    ledger_index: 'validated',
  });

  const serverInfo = await client.request({ command: 'server_info' });
  const accountReserve =
    serverInfo.result.info.validated_ledger?.reserve_base_xrp ?? null;

  return {
    address: wallet.address,
    xAddress: classicAddressToXAddress(wallet.address, false, isTestNetwork),
    account_data: accountInfo.result.account_data,
    accountReserve,
  };
}
