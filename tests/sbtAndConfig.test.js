import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARBITRUM_ONE_CHAIN_ID,
  SBT_ABI,
  SBT_MINT_METHOD,
  buildArbiscanTxUrl,
  buildCredentialUri,
  getMintReadiness,
  getSbtContractAddress,
} from '../src/lib/sbt.js';
import { isConfiguredSupabase, isPlaceholderValue, readSbtConfig, readSupabaseConfig } from '../src/lib/runtimeConfig.js';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

test('the SBT is minted on Arbitrum One', () => {
  assert.equal(ARBITRUM_ONE_CHAIN_ID, 42161);
});

test('the ABI exposes the configured mint entrypoint', () => {
  const entry = SBT_ABI.find((item) => item.type === 'function' && item.name === SBT_MINT_METHOD);
  assert.ok(entry, `${SBT_MINT_METHOD} must exist in the ABI`);
  assert.deepEqual(entry.inputs.map((i) => i.type), ['address', 'string']);
  assert.equal(entry.stateMutability, 'nonpayable');
});

test('minting is refused without a contract or a wallet', () => {
  assert.equal(getMintReadiness({ contractAddress: null, walletAddress: ADDRESS }).status, 'no_contract');
  assert.equal(getMintReadiness({ contractAddress: ADDRESS, walletAddress: null }).status, 'no_wallet');
  assert.deepEqual(getMintReadiness({ contractAddress: ADDRESS, walletAddress: ADDRESS }), {
    status: 'ready',
    message: null,
  });
});

test('a placeholder or malformed contract address is treated as unconfigured', () => {
  assert.equal(getSbtContractAddress({}), null);
  assert.equal(getSbtContractAddress({ VITE_SBT_CONTRACT_ADDRESS: '' }), null);
  assert.equal(getSbtContractAddress({ VITE_SBT_CONTRACT_ADDRESS: '0xNOPE' }), null);
  assert.equal(getSbtContractAddress({ VITE_SBT_CONTRACT_ADDRESS: 'not-an-address' }), null);
  assert.equal(getSbtContractAddress({ VITE_SBT_CONTRACT_ADDRESS: ADDRESS }), ADDRESS);
  assert.deepEqual(readSbtConfig({ VITE_SBT_CONTRACT_ADDRESS: ADDRESS }), {
    address: ADDRESS,
    configured: true,
  });
});

test('the credential URI points at the public verification route', () => {
  const hash = 'a'.repeat(64);
  assert.equal(buildCredentialUri({ origin: 'https://academy.axim.systems', hashHex: hash }), `https://academy.axim.systems/verify/${hash}`);
  assert.equal(buildCredentialUri({ origin: 'https://academy.axim.systems/', hashHex: hash.toUpperCase() }), `https://academy.axim.systems/verify/${hash}`);
});

test('arbiscan links fall back to the explorer root', () => {
  assert.equal(buildArbiscanTxUrl('0xabc'), 'https://arbiscan.io/tx/0xabc');
  assert.equal(buildArbiscanTxUrl(null), 'https://arbiscan.io');
});

test('placeholder credentials are detected, real ones are not', () => {
  assert.equal(isPlaceholderValue('https://your-project-id.supabase.co'), true);
  assert.equal(isPlaceholderValue(''), true);
  assert.equal(isPlaceholderValue(undefined), true);
  assert.equal(isPlaceholderValue('https://abcdefghijklmnop.supabase.co'), false);

  // The values committed in this repository's .env.
  assert.equal(
    isConfiguredSupabase({ url: 'https://your-project-id.supabase.co', key: 'your-anon-key' }),
    false,
  );

  // A real project URL with a publishable key: long enough, no placeholder token.
  const publishable = 'sb_publishable_academy_test_0123456789abcdef';
  assert.equal(isConfiguredSupabase({ url: 'https://abcdefghijklmnop.supabase.co', key: publishable }), true);
  assert.equal(isConfiguredSupabase({ url: 'http://abcdefghijklmnop.supabase.co', key: publishable }), false);
  assert.equal(isConfiguredSupabase({ url: 'https://abcdefghijklmnop.supabase.co', key: 'short' }), false);

  assert.deepEqual(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://your-project-id.supabase.co', VITE_SUPABASE_ANON_KEY: 'your-anon-key' }), {
    url: 'https://your-project-id.supabase.co',
    key: 'your-anon-key',
    configured: false,
  });
});
