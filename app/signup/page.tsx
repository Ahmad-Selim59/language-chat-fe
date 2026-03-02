'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else if (data.session) {
            // Email confirmation is disabled — session returned immediately
            router.push('/chat');
        } else {
            // Email confirmation required
            setSuccess(true);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#1a1a1a]">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-[#10a37f]/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#ececf1] mb-3">Check your email</h2>
                    <p className="text-[#a3a3a3] mb-6">
                        We sent a confirmation link to <span className="text-[#ececf1] font-medium">{email}</span>. Click the link to activate your account.
                    </p>
                    <Link href="/" className="text-[#10a37f] hover:text-[#13c18d] text-sm transition-colors">
                        Back to Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#1a1a1a]">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#ececf1] mb-2">Create an account</h1>
                    <p className="text-[#a3a3a3]">Start your language learning journey</p>
                </div>
                <div className="bg-[#202123] border border-[#2a2b32] rounded-xl p-8 shadow-2xl">
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#ececf1] mb-1.5">
                                Email
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
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#ececf1] mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#343541] bg-[#1a1a1a] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none placeholder-[#a3a3a3] transition-colors"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#ececf1] mb-1.5">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#343541] bg-[#1a1a1a] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none placeholder-[#a3a3a3] transition-colors"
                                placeholder="••••••••"
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
                            className="w-full bg-[#10a37f] text-white py-2.5 rounded-lg hover:bg-[#13c18d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold mt-2"
                        >
                            {isLoading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-sm text-[#a3a3a3] mt-6">
                    Already have an account?{' '}
                    <Link href="/" className="text-[#10a37f] hover:text-[#13c18d] font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
