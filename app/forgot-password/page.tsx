'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#1a1a1a]">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#ececf1] mb-2">Reset password</h1>
                    <p className="text-[#a3a3a3]">We&apos;ll send you a link to reset it</p>
                </div>
                <div className="bg-[#202123] border border-[#2a2b32] rounded-xl p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-2">
                            <div className="w-14 h-14 rounded-full bg-[#10a37f]/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-[#ececf1] font-medium mb-1">Email sent!</p>
                            <p className="text-[#a3a3a3] text-sm">Check <span className="text-[#ececf1]">{email}</span> for a reset link.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#ececf1] mb-1.5">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#343541] bg-[#1a1a1a] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none placeholder-[#a3a3a3] transition-colors"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#10a37f] text-white py-2.5 rounded-lg hover:bg-[#13c18d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {isLoading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
                <p className="text-center text-sm text-[#a3a3a3] mt-6">
                    <Link href="/" className="text-[#10a37f] hover:text-[#13c18d] font-medium transition-colors">
                        ← Back to Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}
