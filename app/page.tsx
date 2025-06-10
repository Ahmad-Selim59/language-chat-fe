'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/get-cookie');
                const data = await res.json();
                if (data.userId) {
                    router.push('/chat');
                }
            } catch {
                // Ignore errors during auth check
            }
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!userId.trim()) {
            setError('Please enter a user ID');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/set-cookie', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId.trim() }),
            });

            if (res.ok) {
                router.push('/chat');
            } else {
                setError('Failed to set user ID. Please try again.');
                setIsLoading(false);
            }
        } catch {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#1a1a1a]">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
                <h1 className="text-4xl font-bold text-center mb-8 text-[#ececf1]">Welcome to son of anton the third</h1>
                <p className="text-center text-lg mb-8 text-[#a3a3a3]">
                    Your personal AI genie.
                </p>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-[#202123] p-8 rounded-xl shadow-lg border border-[#2a2b32]">
                    <div className="mb-4">
                        <label htmlFor="userId" className="block text-sm font-medium text-[#ececf1] mb-2">
                            Enter your User ID
                        </label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full px-4 py-2 border border-[#343541] bg-[#1a1a1a] text-[#ececf1] rounded-lg focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] placeholder-[#a3a3a3]"
                            placeholder="Enter your user ID"
                            disabled={isLoading}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-400">{error}</p>
                        )}
                    </div>
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="bg-[#10a37f] text-white px-6 py-3 rounded-lg hover:bg-[#13c18d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : 'Start Chatting'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
