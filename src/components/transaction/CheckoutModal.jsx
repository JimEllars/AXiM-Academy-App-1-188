import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAcademyStore } from '@/store/useAcademyStore';
import { useAddress, useSDK } from '@thirdweb-dev/react';
import IdentityGateway from './IdentityGateway';
import SafeIcon from '../../common/SafeIcon';
import { trackAcademyEvent } from '@/lib/utils';

export default function CheckoutModal({ course, onClose }) {
  const address = useAddress();
  const sdk = useSDK();
  const { enrollInCourse, enrollments } = useAcademyStore();
  const [method, setMethod] = useState(null); // 'fiat' or 'crypto'
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStep, setTxStep] = useState('');

  const [promoCode, setPromoCode] = useState('');
  const [isProcessingPromo, setIsProcessingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [discount, setDiscount] = useState(0);



  const handlePromoSubmit = async () => {
    if (!promoCode) return;
    setIsProcessingPromo(true);
    const start = performance.now();

    // Simulate promo router validation latency
    await new Promise(r => setTimeout(r, 800));
    const latency = performance.now() - start;

    // Find promo code in store (or mock validation)
    const { promoCodes } = useAcademyStore.getState();
    const promo = promoCodes.find(p => p.code === promoCode.toUpperCase());

    if (promo && promo.uses < promo.max) {
      setDiscount(promo.discount);
      setPromoMessage(`${promo.discount}% discount applied!`);
      trackAcademyEvent('PROMO_APPLIED', { code: promoCode, discount: promo.discount, latencyMs: latency });
    } else {
      setDiscount(0);
      setPromoMessage('Invalid or expired promo code.');
      trackAcademyEvent('PROMO_REJECTED', { code: promoCode, latencyMs: latency });
    }

    setIsProcessingPromo(false);
  };

  const isAlreadyEnrolled = enrollments.some(e => e.course_id === course.id);

  const handleCryptoPayment = async () => {
    if (!address) return;
    
    setIsProcessing(true);
    setTxStep('Initializing Secure Ledger...');
    
    try {
      // 1. Simulate finding the contract
      await new Promise(r => setTimeout(r, 1000));
      setTxStep(`Requesting ${course.price_crypto} ETH...`);
      
      // 2. Simulate wallet sign request
      await new Promise(r => setTimeout(r, 2000));
      setTxStep('Confirming Block Inclusion...');
      
      // 3. Complete enrollment
      const mockHash = "0x" + Math.random().toString(16).slice(2);
      enrollInCourse(course.id, 'crypto', mockHash);
      
      setTxStep('Access Granted!');
      await new Promise(r => setTimeout(r, 1000));
      onClose();
    } catch (err) {
      console.error(err);
      setTxStep('Transaction Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiatPayment = async () => {
    setIsProcessing(true);
    setTxStep('Redirecting to Stripe...');
    await new Promise(r => setTimeout(r, 1500));
    enrollInCourse(course.id, 'fiat');
    onClose();
  };

  if (isAlreadyEnrolled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center">
          <SafeIcon name="CheckCircle" className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Already Owned</h3>
          <p className="text-gray-400 text-sm mb-6">You are already enrolled in this curriculum.</p>
          <button onClick={onClose} className="w-full bg-gray-800 py-3 rounded-xl font-bold text-white hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {!address && !method ? (
          <IdentityGateway key="auth" onComplete={() => {}} />
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-800 flex justify-between items-start bg-gray-950/50">
              <div>
                <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">Access Protocol</h3>
                <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                  <SafeIcon name="Shield" className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Checkout</span>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                <SafeIcon name="X" className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Course Brief */}
              <div className="flex items-center space-x-4 p-4 bg-gray-950 rounded-2xl border border-gray-800">
                <img src={course.thumbnail} className="h-16 w-16 rounded-xl object-cover border border-gray-800" alt="" />
                <div className="flex-1">
                  <h4 className="text-white font-bold leading-tight">{course.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">AXiM Professional Certification</p>
                </div>
              </div>


              {/* Promo Code Input */}
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Promo Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all uppercase"
                    placeholder="ENTER CODE"
                  />
                  <button
                    onClick={handlePromoSubmit}
                    disabled={isProcessingPromo || !promoCode}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-xl border border-gray-700 transition-all disabled:opacity-50"
                  >
                    {isProcessingPromo ? 'Verifying...' : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs mt-2 ${promoMessage.includes('Invalid') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              {/* Payment Selector */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setMethod('crypto');
                    trackAcademyEvent('CHECKOUT_INITIALIZED', { method: 'crypto', courseId: course.id, walletAddress: address });
                  }}
                  className={`p-6 rounded-2xl border transition-all text-left group ${method === 'crypto' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-950 border-gray-800 hover:border-gray-700'}`}
                >
                  <SafeIcon name="Zap" className={`h-6 w-6 mb-4 ${method === 'crypto' ? 'text-emerald-400' : 'text-gray-500'}`} />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Pay with Crypto</p>
                  <p className="text-xl font-bold text-white">
                    {discount > 0 ? (
                      <>
                        <span className="line-through text-gray-500 text-sm mr-2">{course.price_crypto}</span>
                        <span>{(course.price_crypto * (1 - discount/100)).toFixed(4)}</span>
                      </>
                    ) : (
                      <span>{course.price_crypto}</span>
                    )} ETH
                  </p>
                </button>
                <button 
                  onClick={() => {
                    setMethod('fiat');
                    trackAcademyEvent('CHECKOUT_INITIALIZED', { method: 'fiat', courseId: course.id });
                  }}
                  className={`p-6 rounded-2xl border transition-all text-left group ${method === 'fiat' ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-950 border-gray-800 hover:border-gray-700'}`}
                >
                  <SafeIcon name="CreditCard" className={`h-6 w-6 mb-4 ${method === 'fiat' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Legacy Payment</p>
                  <p className="text-xl font-bold text-white">
                    {discount > 0 ? (
                      <>
                        <span className="line-through text-gray-500 text-sm mr-2">${course.price_usd.toFixed(0)}</span>
                        <span>${(course.price_usd * (1 - discount/100)).toFixed(0)}</span>
                      </>
                    ) : (
                      <span>${course.price_usd.toFixed(0)}</span>
                    )} USD
                  </p>
                </button>
              </div>

              {/* Action Button */}
              {method && (
                <button 
                  onClick={method === 'crypto' ? handleCryptoPayment : handleFiatPayment}
                  disabled={isProcessing}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all ${
                    method === 'crypto' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
                  } text-white disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <>
                      <SafeIcon name="Loader" className="h-5 w-5 animate-spin" />
                      <span>{txStep}</span>
                    </>
                  ) : (
                    <>
                      <SafeIcon name={method === 'crypto' ? 'Unlock' : 'ArrowRight'} className="h-5 w-5" />
                      <span>{method === 'crypto' ? 'Initialize Smart Contract' : 'Proceed to Checkout'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Security Footer */}
            <div className="p-4 bg-gray-950 border-t border-gray-800 text-center">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                Arbitrum One Layer-2 Network Verified
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}