/**
 * Soulbound Token (SBT) minting configuration for CredentialWallet.
 *
 * The Academy app is a satellite: it holds no signing key and no contract
 * owner privileges. Minting runs through the learner's connected wallet against
 * the Arbitrum One contract, which is why the client only needs the address and
 * an ABI that matches the deployed bytecode.
 *
 * The address is configuration, not a constant. `VITE_SBT_CONTRACT_ADDRESS` is
 * set per environment; when it is absent the wallet UI refuses to mint rather
 * than pretending. A simulated "Mining Block..." timer that ends in nothing is
 * indistinguishable from a working mint until a learner asks for their token on
 * Arbiscan and it is not there.
 */

/** Arbitrum One. ThirdwebProvider in App.jsx is pinned to the same chain. */
export const ARBITRUM_ONE_CHAIN_ID = 42161;
export const ARBISCAN_BASE_URL = 'https://arbiscan.io';

/**
 * Minimal ERC-721-style mint surface: `safeMint(address to, string uri)`.
 * If the deployed contract exposes a different entrypoint, change this ABI and
 * ONYX_SBT_MINT_METHOD together — do not paper over a mismatch in the UI.
 */
export const SBT_MINT_METHOD = 'safeMint';

export const SBT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    name: 'safeMint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
];

/** Contract address for the current build, or null when unconfigured. */
export function getSbtContractAddress(env = import.meta.env) {
  const raw = env?.VITE_SBT_CONTRACT_ADDRESS;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return /^0x[0-9a-fA-F]{40}$/.test(trimmed) ? trimmed : null;
}

/**
 * Pre-flight for a mint attempt.
 * @returns {{status:'ready'|'no_contract'|'no_wallet', message:string|null}}
 */
export function getMintReadiness({ contractAddress, walletAddress }) {
  if (!contractAddress) {
    return {
      status: 'no_contract',
      message: 'SBT contract not configured for this environment.',
    };
  }
  if (!walletAddress) {
    return {
      status: 'no_wallet',
      message: 'Connect a wallet on Arbitrum One to claim your SBT.',
    };
  }
  return { status: 'ready', message: null };
}

/**
 * Token metadata URI for a credential. Points at the verification page, which
 * is public, so a marketplace/wallet can render the credential and a human can
 * check it in one click.
 */
export function buildCredentialUri({ origin = '', hashHex }) {
  const hash = String(hashHex ?? '').trim().toLowerCase();
  const base = origin.replace(/\/$/, '');
  return `${base}/verify/${hash}`;
}

export function buildArbiscanTxUrl(txHash) {
  return txHash ? `${ARBISCAN_BASE_URL}/tx/${txHash}` : ARBISCAN_BASE_URL;
}
