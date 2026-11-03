/**
 * Crypto checkout — the on-chain half of the Unified Commerce storefront.
 *
 * What this replaces and why: `handleCryptoPayment` used to "pay" with
 * `await new Promise(r => setTimeout(r, 2000))` and then wrote
 * `'0x' + Math.random().toString(16).slice(2)` into
 * `academy_enrollments.tx_hash`. That column is the payment proof for an
 * on-chain enrollment, so a random string in it is a fabricated receipt — and
 * the course unlocked for free every single time.
 *
 * Nothing here signs or broadcasts. This module only decides whether a transfer
 * is legal to attempt and with what amount; the signed write is the learner's
 * wallet, through the thirdweb SDK. When the pre-flight cannot pass, the caller
 * gets a reason to show instead of a spinner that ends in nothing.
 *
 * The treasury is configuration (`VITE_ACADEMY_TREASURY_ADDRESS`), never a
 * constant: a staging bundle must not send tuition to an address nobody meant.
 */

import { ARBITRUM_ONE_CHAIN_ID } from './sbt.js';

export const TREASURY_ENV_KEY = 'VITE_ACADEMY_TREASURY_ADDRESS';

/** Micro-ETH precision. Anything finer is dust nobody prices a course in. */
export const ETH_DECIMALS = 6;

const ADDRESS_PATTERN = /^0x[0-9a-f]{40}$/i;
const TX_HASH_PATTERN = /^0x[0-9a-f]{64}$/i;

/** Treasury address for this build, or null when unset/malformed. */
export function getTreasuryAddress(env = import.meta.env) {
  const raw = env?.[TREASURY_ENV_KEY];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return ADDRESS_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * ETH amount due after a percentage discount, truncated (never rounded up) to
 * `ETH_DECIMALS`. Returns null when the price is not a usable number.
 */
export function effectiveEthAmount(priceCrypto, discountPercentage = 0) {
  const price = Number(priceCrypto);
  if (!Number.isFinite(price) || price < 0) return null;

  const rawDiscount = Number(discountPercentage);
  const discount = Number.isFinite(rawDiscount) ? Math.min(100, Math.max(0, rawDiscount)) : 0;

  const factor = 10 ** ETH_DECIMALS;
  // The epsilon keeps 0.1 * 3 style float noise from truncating a whole unit of
  // the last decimal place (e.g. 0.2999999999 -> 0.299999).
  const truncated = Math.floor(price * (1 - discount / 100) * factor + 1e-6) / factor;
  const fixed = truncated.toFixed(ETH_DECIMALS).replace(/\.?0+$/, '');
  return fixed || '0';
}

function blocked(code, message) {
  return { status: 'blocked', code, message };
}

/**
 * Pre-flight for a wallet transfer.
 *
 * Order matters: no treasury is a build problem (nothing the learner can fix),
 * a wrong network is a learner-fixable problem, and a zero amount means the
 * promo code already settled the bill — the 100% grant path owns that case.
 *
 * @returns {{status:'ready', amountEth:string, treasuryAddress:string,
 *            chainId:number, priceCrypto:number}
 *          | {status:'blocked', code:string, message:string}}
 */
export function buildCryptoPaymentPlan({
  priceCrypto,
  discountPercentage = 0,
  treasuryAddress = null,
  walletAddress = null,
  chainId = null,
} = {}) {
  const treasury = String(treasuryAddress ?? '').trim();
  if (!ADDRESS_PATTERN.test(treasury)) {
    return blocked(
      'NO_TREASURY',
      'Crypto checkout is not configured for this build: no treasury address is set, so nothing would reach AXiM.',
    );
  }

  if (!walletAddress) {
    return blocked('NO_WALLET', 'Connect a wallet on Arbitrum One to pay with crypto.');
  }

  if (chainId === null || chainId === undefined || chainId === '') {
    return blocked(
      'UNKNOWN_NETWORK',
      'The wallet has not reported a network. Switch it to Arbitrum One and try again.',
    );
  }

  if (Number(chainId) !== ARBITRUM_ONE_CHAIN_ID) {
    return blocked(
      'WRONG_NETWORK',
      `Switch your wallet to Arbitrum One (chain ${ARBITRUM_ONE_CHAIN_ID}); it is currently on ${chainId}.`,
    );
  }

  const amountEth = effectiveEthAmount(priceCrypto, discountPercentage);
  if (amountEth === null) {
    return blocked(
      'INVALID_PRICE',
      'This course has no usable ETH price, so it cannot be paid on-chain.',
    );
  }

  if (Number(amountEth) <= 0) {
    return blocked(
      'NOTHING_DUE',
      'This code brings the tuition to zero. Use "Unlock Course Immediately" instead of a wallet transfer.',
    );
  }

  return {
    status: 'ready',
    amountEth,
    treasuryAddress: treasury,
    chainId: ARBITRUM_ONE_CHAIN_ID,
    priceCrypto: Number(priceCrypto),
  };
}

/**
 * Pull a transaction hash out of a thirdweb `TransactionResult`, whose shape is
 * `{ receipt: TransactionReceipt }` — there is no top-level `transactionHash`.
 * A value that is not a 32-byte hex hash is rejected rather than stored.
 */
export function extractTransactionHash(result) {
  const candidate =
    result?.transactionHash ?? result?.receipt?.transactionHash ?? result?.hash ?? null;
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  return TX_HASH_PATTERN.test(trimmed) ? trimmed : null;
}

/** Wallet/provider errors are noisy; the learner gets one sentence. */
export function describeWalletError(err) {
  const message = String(err?.message ?? err ?? '').trim();
  if (/user rejected|user denied|action_rejected|\b4001\b/i.test(message)) {
    return 'Payment cancelled in wallet.';
  }
  if (/insufficient funds/i.test(message)) {
    return 'Insufficient funds in this wallet for the transfer plus gas.';
  }
  if (/chain|network/i.test(message)) {
    return 'The wallet is on the wrong network. Switch it to Arbitrum One and retry.';
  }
  return message ? message.slice(0, 200) : 'The wallet transaction failed.';
}
