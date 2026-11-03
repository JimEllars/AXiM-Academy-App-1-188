import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ETH_DECIMALS,
  TREASURY_ENV_KEY,
  buildCryptoPaymentPlan,
  describeWalletError,
  effectiveEthAmount,
  extractTransactionHash,
  getTreasuryAddress,
} from '../src/lib/cryptoPayment.js';
import { ARBITRUM_ONE_CHAIN_ID } from '../src/lib/sbt.js';

const TREASURY = '0x1234567890abcdef1234567890abcdef12345678';
const WALLET = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const TX_HASH = '0x' + 'ab'.repeat(32);

test('the treasury is read from configuration, never hard-coded', () => {
  assert.equal(getTreasuryAddress({}), null);
  assert.equal(getTreasuryAddress({ [TREASURY_ENV_KEY]: '' }), null);
  assert.equal(getTreasuryAddress({ [TREASURY_ENV_KEY]: '0xTREASURY' }), null);
  assert.equal(getTreasuryAddress({ [TREASURY_ENV_KEY]: ` ${TREASURY} ` }), TREASURY);
});

test('a plan is refused when no treasury is configured', () => {
  const plan = buildCryptoPaymentPlan({
    priceCrypto: 0.25,
    treasuryAddress: null,
    walletAddress: WALLET,
    chainId: ARBITRUM_ONE_CHAIN_ID,
  });
  assert.equal(plan.status, 'blocked');
  assert.equal(plan.code, 'NO_TREASURY');
  assert.match(plan.message, /not configured/i);
});

test('a plan is refused without a connected wallet', () => {
  const plan = buildCryptoPaymentPlan({
    priceCrypto: 0.25,
    treasuryAddress: TREASURY,
    walletAddress: null,
    chainId: ARBITRUM_ONE_CHAIN_ID,
  });
  assert.equal(plan.code, 'NO_WALLET');
});

test('a wallet on any chain but Arbitrum One is refused with the chain it is on', () => {
  const plan = buildCryptoPaymentPlan({
    priceCrypto: 0.25,
    treasuryAddress: TREASURY,
    walletAddress: WALLET,
    chainId: 1,
  });
  assert.equal(plan.code, 'WRONG_NETWORK');
  assert.match(plan.message, /42161/);
  assert.match(plan.message, /currently on 1/);
});

test('an unreported network is refused instead of assumed to be Arbitrum', () => {
  const plan = buildCryptoPaymentPlan({
    priceCrypto: 0.25,
    treasuryAddress: TREASURY,
    walletAddress: WALLET,
    chainId: null,
  });
  assert.equal(plan.code, 'UNKNOWN_NETWORK');
});

test('the discount is applied to the ETH amount, truncated to micro-ETH', () => {
  assert.equal(effectiveEthAmount(0.25, 15), '0.2125');
  assert.equal(effectiveEthAmount(0.25, 0), '0.25');
  assert.equal(effectiveEthAmount(1, 33.333), '0.66667');
  // Truncation, never rounding up, so the learner is never over-charged.
  assert.equal(effectiveEthAmount(0.1, 10), '0.09');
  assert.equal(ETH_DECIMALS, 6);
});

test('a nonsense discount cannot produce a negative or NaN amount', () => {
  assert.equal(effectiveEthAmount(0.5, -20), '0.5');
  assert.equal(effectiveEthAmount(0.5, 250), '0');
  assert.equal(effectiveEthAmount(0.5, 'not-a-number'), '0.5');
  assert.equal(effectiveEthAmount('not-a-price', 0), null);
  assert.equal(effectiveEthAmount(-1, 0), null);
});

test('a 100% code is routed to the grant path, not to a zero-value transfer', () => {
  const plan = buildCryptoPaymentPlan({
    priceCrypto: 0.25,
    discountPercentage: 100,
    treasuryAddress: TREASURY,
    walletAddress: WALLET,
    chainId: ARBITRUM_ONE_CHAIN_ID,
  });
  assert.equal(plan.code, 'NOTHING_DUE');
  assert.match(plan.message, /Unlock Course Immediately/);
});

test('a ready plan carries the amount, the treasury and the chain', () => {
  assert.deepEqual(
    buildCryptoPaymentPlan({
      priceCrypto: 0.25,
      discountPercentage: 20,
      treasuryAddress: TREASURY,
      walletAddress: WALLET,
      chainId: ARBITRUM_ONE_CHAIN_ID,
    }),
    {
      status: 'ready',
      amountEth: '0.2',
      treasuryAddress: TREASURY,
      chainId: ARBITRUM_ONE_CHAIN_ID,
      priceCrypto: 0.25,
    },
  );
});

test('a tx hash is read from the real thirdweb TransactionResult shape', () => {
  // `TransactionResult` is `{ receipt }` — there is no top-level transactionHash.
  assert.equal(extractTransactionHash({ receipt: { transactionHash: TX_HASH } }), TX_HASH);
  assert.equal(extractTransactionHash({ transactionHash: TX_HASH }), TX_HASH);
  assert.equal(extractTransactionHash({ receipt: {} }), null);
  assert.equal(extractTransactionHash(null), null);
});

test('a fabricated or malformed hash is never accepted as payment proof', () => {
  // This is exactly what the old simulator wrote into academy_enrollments.tx_hash.
  const simulated = '0x' + Math.random().toString(16).slice(2);
  assert.equal(extractTransactionHash({ transactionHash: simulated }), null);
  assert.equal(extractTransactionHash({ transactionHash: '0xdeadbeef' }), null);
  assert.equal(extractTransactionHash({ transactionHash: 42 }), null);
});

test('wallet errors are reduced to one actionable sentence', () => {
  assert.equal(
    describeWalletError(new Error('MetaMask Tx Signature: User denied transaction signature.')),
    'Payment cancelled in wallet.',
  );
  assert.equal(
    describeWalletError(new Error('underlying error (code=4001): ACTION_REJECTED')),
    'Payment cancelled in wallet.',
  );
  assert.equal(
    describeWalletError(new Error('insufficient funds for gas * price + value')),
    'Insufficient funds in this wallet for the transfer plus gas.',
  );
  assert.match(describeWalletError(new Error('wrong chain')), /wrong network/i);
  assert.equal(describeWalletError(new Error('boom')), 'boom');
  assert.equal(describeWalletError(undefined), 'The wallet transaction failed.');
});
