import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { supabase, supabaseConfigured } from '../lib/supabase';
import {
  isCredentialHash,
  normalizeHashInput,
  resolveIssuedAt,
} from '../lib/credentialHash';

const ENROLLMENT_COLUMNS =
  'id, status, completed_at, created_at, sbt_mint_status, certificate_hash, academy_courses(title)';

/**
 * Credential verification.
 *
 * Accepts the SHA-256 digest printed on the certificate, or the enrollment id
 * that older links used. The previous version only accepted the raw id, so the
 * hash the certificate printed could never resolve — the two halves of the
 * dual-credentialing pipeline disagreed about what a credential id was.
 */
export default function VerificationPage() {
  const { hash } = useParams();
  const [inputHash, setInputHash] = useState(hash || '');
  const [status, setStatus] = useState('idle'); // idle, searching, found, not_found, unavailable
  const [certData, setCertData] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  const handleVerify = async (event) => {
    event?.preventDefault();
    const normalized = normalizeHashInput(inputHash);
    if (!normalized) return;

    setStatus('searching');
    setErrorDetail(null);

    if (!supabaseConfigured) {
      setStatus('unavailable');
      setErrorDetail('This build has no Supabase credentials, so the ledger cannot be queried.');
      return;
    }

    const byHash = isCredentialHash(normalized);

    try {
      const query = supabase.from('academy_enrollments').select(ENROLLMENT_COLUMNS);
      const { data, error } = byHash
        ? await query.eq('certificate_hash', normalized).maybeSingle()
        : await query.eq('id', normalized).maybeSingle();

      if (error) {
        // A database without the 2026-11-02 migration has no certificate_hash
        // column; fall back to answering only the id form.
        const columnMissing = ['42703', 'PGRST204'].includes(String(error.code));
        if (byHash && columnMissing) {
          setStatus('not_found');
          setErrorDetail('This ledger does not index certificate hashes yet. Paste the enrollment id instead.');
          return;
        }
        throw error;
      }

      if (!data || data.status !== 'completed') {
        setStatus('not_found');
        return;
      }

      setCertData(data);
      setStatus('found');
    } catch (err) {
      setStatus('not_found');
      setErrorDetail(err.message);
    }
  };

  useEffect(() => {
    if (hash) {
      setInputHash(hash);
      handleVerify();
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <SafeIcon name="ShieldCheck" className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Credential Verification</h1>
          <p className="text-gray-400 mt-2">Validate the authenticity of AXiM Academy certificates via the Core Ledger.</p>
        </div>

        <form onSubmit={handleVerify} className="relative mb-12">
          <input
            type="text"
            value={inputHash}
            onChange={(e) => setInputHash(e.target.value)}
            placeholder="SHA-256 digest or enrollment id"
            aria-label="Certificate hash"
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-32 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={status === 'searching'}
            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {status === 'searching' ? <SafeIcon name="Loader" className="h-5 w-5 animate-spin" /> : 'Verify'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'found' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <SafeIcon name="Check" className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Authenticity Confirmed</h2>
              <p className="text-emerald-400/80 text-sm mb-6">This credential was issued to a verified candidate on the AXiM Network.</p>

              <div className="grid grid-cols-2 gap-4 text-left border-t border-emerald-500/10 pt-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Course Title</p>
                  <p className="text-sm font-medium text-gray-200">{certData?.academy_courses?.title || 'Unknown Course'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Issue Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {resolveIssuedAt(certData) ? new Date(resolveIssuedAt(certData)).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Credential Status</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {certData?.sbt_mint_status === 'minted' ? 'Arbitrum SBT Minted' : 'Verified PDF Certificate'}
                  </p>
                </div>
                {certData?.certificate_hash && (
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Ledger Digest (SHA-256)</p>
                    <p className="text-[10px] font-mono text-gray-300 break-all">{certData.certificate_hash}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {status === 'not_found' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <SafeIcon name="X" className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verification Failed</h2>
              <p className="text-red-400/80 text-sm">No record found matching this hash in the AXiM Core Ledger.</p>
              {errorDetail && <p className="text-red-400/60 text-xs mt-2">{errorDetail}</p>}
            </motion.div>
          )}

          {status === 'unavailable' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon name="AlertTriangle" className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verification Unavailable</h2>
              <p className="text-amber-300/80 text-sm">{errorDetail}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
