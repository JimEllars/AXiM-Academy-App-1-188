import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { useAcademyStore } from '../../store/useAcademyStore';
import { API_ENDPOINTS, trackAcademyEvent } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddress, useContract, useContractWrite } from '@thirdweb-dev/react';
import {
  SBT_ABI,
  SBT_MINT_METHOD,
  buildArbiscanTxUrl,
  buildCredentialUri,
  getMintReadiness,
  getSbtContractAddress,
} from '../../lib/sbt';
import { hashEnrollment } from '../../lib/credentialHash';

/**
 * Credential wallet — the Arbitrum One half of the dual-credentialing pipeline.
 *
 * Minting is a real contract write through the learner's wallet. When the
 * contract address is not configured, or no wallet is connected, the button
 * reports exactly that and does nothing: the previous implementation ran a
 * three-second timer and cleared its spinner, which is indistinguishable from a
 * successful mint until the learner looks on Arbiscan.
 */
export default function CredentialWallet() {
  const { enrollments, courses, markCredentialMinted } = useAcademyStore();
  const [pendingId, setPendingId] = useState(null);
  const [errorById, setErrorById] = useState({});

  const walletAddress = useAddress();
  const contractAddress = getSbtContractAddress();
  const { contract } = useContract(contractAddress || undefined, SBT_ABI);
  const { mutateAsync: mintSbt, isLoading: isMinting } = useContractWrite(contract, SBT_MINT_METHOD);

  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  const handleMint = async (enrollment) => {
    const readiness = getMintReadiness({ contractAddress, walletAddress });
    if (readiness.status !== 'ready') {
      setErrorById((prev) => ({ ...prev, [enrollment.id]: readiness.message }));
      trackAcademyEvent('CREDENTIAL_CLAIM_BLOCKED', {
        enrollmentId: enrollment.id,
        reason: readiness.status,
      });
      return;
    }

    setPendingId(enrollment.id);
    setErrorById((prev) => ({ ...prev, [enrollment.id]: null }));
    trackAcademyEvent('CREDENTIAL_CLAIM_INITIATED', {
      courseId: enrollment.course_id,
      sbtStatus: 'minting',
      contractAddress,
    });

    try {
      const credentialHash = await hashEnrollment(enrollment);
      const tokenUri = buildCredentialUri({ origin: window.location.origin, hashHex: credentialHash });

      const receipt = await mintSbt({ args: [walletAddress, tokenUri] });
      const txHash = receipt?.transactionHash ?? receipt?.receipt?.transactionHash ?? null;

      // The ledger is the system of record for sbt_mint_status, so ask the
      // credential service to confirm the block before we say "minted".
      let ledgerSynced = false;
      try {
        const response = await fetch(API_ENDPOINTS.MINT_CREDENTIAL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollment_id: enrollment.id,
            tx_hash: txHash,
            certificate_hash: credentialHash,
            contract_address: contractAddress,
          }),
        });
        ledgerSynced = response.ok;
      } catch {
        ledgerSynced = false;
      }

      await markCredentialMinted(enrollment.id, { txHash, ledgerSynced });
      trackAcademyEvent('CREDENTIAL_MINT_CONFIRMED', {
        enrollmentId: enrollment.id,
        txHash,
        ledgerSynced,
      });
    } catch (err) {
      const message = err?.message?.includes('user rejected')
        ? 'Mint cancelled in wallet.'
        : err?.message || 'Mint failed.';
      setErrorById((prev) => ({ ...prev, [enrollment.id]: message }));
      trackAcademyEvent('CREDENTIAL_MINT_FAILED', {
        enrollmentId: enrollment.id,
        error: err?.message,
      });
    } finally {
      setPendingId(null);
    }
  };

  if (completedEnrollments.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
        <SafeIcon name="Award" className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No credentials earned yet. Complete a course to mint your SBT or download your PDF.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {completedEnrollments.map((enr) => {
        const course = courses.find((c) => c.id === enr.course_id);
        const isMinted = enr.sbt_mint_status === 'minted';
        const isAwaitingLedger = enr.sbt_mint_status === 'pending';
        const isPending = pendingId === enr.id;
        const cardError = errorById[enr.id];

        return (
          <div
            key={enr.id}
            className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative overflow-hidden hover:border-emerald-500/50 transition-all"
          >
            {(isMinted || isPending) && (
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            )}

            <div className="flex items-start justify-between mb-6 z-10">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    isMinted
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-gray-300'
                  }`}
                >
                  <SafeIcon name={isMinted ? 'Hexagon' : 'FileText'} className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{course?.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {isMinted
                      ? 'Arbitrum Soulbound Token'
                      : isPending
                        ? 'Minting in progress...'
                        : isAwaitingLedger
                          ? 'Mint submitted, ledger confirming'
                          : 'Legacy PDF Certificate'}
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {cardError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-red-400 mb-4 z-10"
                >
                  {cardError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-auto pt-4 border-t border-gray-800 z-10 flex space-x-3">
              {isMinted ? (
                <a
                  href={buildArbiscanTxUrl(enr.tx_hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <SafeIcon name="ExternalLink" className="h-4 w-4" />
                  <span>View on Arbiscan</span>
                </a>
              ) : isPending || isMinting ? (
                <div className="flex-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium py-2.5 px-4 rounded-lg border border-emerald-500/20 flex items-center justify-center space-x-2">
                  <SafeIcon name="Loader" className="h-4 w-4 animate-spin" />
                  <span>Awaiting wallet...</span>
                </div>
              ) : (
                <>
                  <Link
                    to={`/certificate/${enr.id}`}
                    onClick={() =>
                      trackAcademyEvent('CREDENTIAL_CLAIM_INITIATED', { courseId: course?.id, sbtStatus: 'pdf' })
                    }
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <SafeIcon name="Eye" className="h-4 w-4" />
                    <span>View PDF</span>
                  </Link>
                  <button
                    onClick={() => handleMint(enr)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <SafeIcon name="Zap" className="h-4 w-4" />
                    <span>Mint SBT</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
