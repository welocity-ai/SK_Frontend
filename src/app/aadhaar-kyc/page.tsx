'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ShieldCheck, CreditCard, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/shared/ui/Navbar';
import { kycService } from '@/services/api';

type Step = 'aadhaar' | 'otp' | 'success';

function AadhaarKYCContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [step, setStep] = useState<Step>('aadhaar');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        let sid = searchParams.get('session_id') || localStorage.getItem('kyc_session_id');
        if (!sid) {
            sid = 'akyc_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('kyc_session_id', sid);
        }
        setSessionId(sid);
    }, [searchParams]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatAadhaar = (val: string) =>
        val.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');

    const startResendCountdown = () => {
        setResendCountdown(30);
        const t = setInterval(() => {
            setResendCountdown(c => {
                if (c <= 1) { clearInterval(t); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    // ── Step 1: Send OTP ───────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        const raw = aadhaarNumber.replace(/\s/g, '');
        if (!/^\d{12}$/.test(raw)) {
            setError('Please enter a valid 12-digit Aadhaar number.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const data = await kycService.generateAadhaarOtp({
                aadhaar_number: raw,
                session_id: sessionId
            });

            if (data.success && data.reference_id) {
                setReferenceId(data.reference_id);
                setStep('otp');
                startResendCountdown();
            } else {
                setError(data.error || 'Failed to send OTP. Please try again.');
            }
        } catch (e) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        const rawOtp = otp.trim();
        if (!/^\d{6}$/.test(rawOtp)) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const data = await kycService.verifyAadhaarOtp({
                reference_id: referenceId,
                otp: rawOtp,
                session_id: sessionId,
            });

            if (data.success) {
                setStep('success');
                setTimeout(() => {
                    router.push('/kycdone?session_id=' + sessionId);
                }, 1500);
            } else {
                if (data.expired) {
                    setError('OTP has expired. Please request a new one.');
                } else {
                    setError(data.error || 'Invalid OTP. Please try again.');
                }
            }
        } catch (e) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ─────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resendCountdown > 0) return;
        setOtp('');
        setError('');
        setLoading(true);

        try {
            const raw = aadhaarNumber.replace(/\s/g, '');
            const data = await kycService.generateAadhaarOtp({
                aadhaar_number: raw,
                session_id: sessionId
            });

            if (data.success && data.reference_id) {
                setReferenceId(data.reference_id);
                startResendCountdown();
            } else {
                setError(data.error || 'Failed to resend OTP.');
            }
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />

            <div className="flex flex-col items-center justify-center px-4 pt-32 pb-12">
                <div className="w-full max-w-md">
                    
                    {/* Back button */}
                    {step !== 'success' && (
                        <button 
                            onClick={() => step === 'otp' ? setStep('aadhaar') : router.back()}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {step === 'otp' ? 'Back to Aadhaar' : 'Back'}
                        </button>
                    )}

                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 space-y-8 border border-slate-100 relative overflow-hidden">
                        
                        {/* Step indicator */}
                        {step !== 'success' && (
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === 'aadhaar' ? 'bg-orange-600 text-white' : 'bg-green-500 text-white'}`}>
                                    {step === 'aadhaar' ? '1' : '✓'}
                                </div>
                                <div className={`flex-1 h-1 rounded transition-colors ${step === 'aadhaar' ? 'bg-slate-100' : 'bg-green-500'}`} />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === 'otp' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    2
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Aadhaar Input ── */}
                        {step === 'aadhaar' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <h1 className="text-2xl font-bold text-slate-900">Enter Aadhaar Number</h1>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        An OTP will be sent to your Aadhaar-linked mobile number for secure verification.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Aadhaar Number
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="XXXX XXXX XXXX"
                                        value={aadhaarNumber}
                                        onChange={e => setAadhaarNumber(formatAadhaar(e.target.value))}
                                        className="w-full border-2 border-slate-100 rounded-2xl px-4 py-4 text-xl text-center tracking-[0.2em] font-mono focus:outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all"
                                        maxLength={14}
                                    />
                                </div>

                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm text-orange-800 leading-relaxed flex gap-3">
                                    <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                    <p>
                                        By clicking "Send OTP", you provide consent to SkillKendra to verify your identity via UIDAI for official KYC purposes.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading || aadhaarNumber.replace(/\s/g, '').length !== 12}
                                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg ${
                                        loading || aadhaarNumber.replace(/\s/g, '').length !== 12
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-200 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Send OTP
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ── Step 2: OTP Input ── */}
                        {step === 'otp' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <h1 className="text-2xl font-bold text-slate-900">Enter OTP</h1>
                                    <p className="text-sm text-slate-500">
                                        6-digit code sent to your linked mobile number.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0 0 0 0 0 0"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full border-2 border-slate-100 rounded-2xl px-4 py-4 text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-orange-500 focus:bg-orange-50/30 transition-all"
                                        maxLength={6}
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 border border-red-100">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length !== 6}
                                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg ${
                                        loading || otp.length !== 6
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-200 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Verify & Complete
                                        </>
                                    )}
                                </button>

                                <div className="text-center pt-2">
                                    {resendCountdown > 0 ? (
                                        <p className="text-sm text-slate-400">Resend OTP in <span className="font-bold text-orange-600">{resendCountdown}s</span></p>
                                    ) : (
                                        <button
                                            onClick={handleResend}
                                            disabled={loading}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-bold transition-colors underline underline-offset-4"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Success ── */}
                        {step === 'success' && (
                            <div className="text-center space-y-6 py-8 animate-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-extrabold text-slate-900">Aadhaar Verified!</h2>
                                    <p className="text-slate-500 font-medium">Finalizing your KYC profile...</p>
                                </div>
                                <div className="flex justify-center">
                                    <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                                </div>
                            </div>
                        )}

                        {/* Trust Badges */}
                        {step !== 'success' && (
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-center gap-6 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-green-600" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">100% Secure</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UIDAI Official</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AadhaarKYCPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            </div>
        }>
            <AadhaarKYCContent />
        </Suspense>
    );
}
