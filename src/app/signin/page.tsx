'use client';

import '@/styles/Polysentience.css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Simple admin email verification
            const response = await fetch('/api/admin/email-signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                console.log('[SignIn] Admin login successful, redirecting...');
                setSuccess(true);

                // Try multiple redirect approaches
                setTimeout(() => {
                    console.log('[SignIn] Attempting redirect to /dashboard');
                    // Try router first
                    router.push('/dashboard');

                    // Fallback to window.location after a brief delay
                    setTimeout(() => {
                        console.log('[SignIn] Fallback redirect using window.location');
                        window.location.href = '/dashboard';
                    }, 500);
                }, 800);
            } else {
                setError(data.error || 'Invalid admin email');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen  text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        ADMIN SIGN IN
                    </h1>
                    <p className="text-sm text-white-600">
                        RESTRICTED ACCESS - ADMINISTRATORS ONLY
                    </p>
                </div>

                {/* Sign In Form */}
                <div className="border-1 border-gray  p-6"
                    style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="text-4xl mb-4">✓</div>
                            <div className="text-lg font-bold text-green-600">
                                ADMIN ACCESS GRANTED
                            </div>
                            <div className="text-xs text-white-600 mb-4">
                                Redirecting to dashboard...
                            </div>
                            <button
                                onClick={() => {
                                    console.log('[SignIn] Manual redirect clicked');
                                    window.location.href = '/dashboard';
                                }}
                                className="border-2 border-gray px-4 py-2 font-bold  hover:border-white text-sm"
                                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                            >
                                GO TO DASHBOARD →
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-2">
                                    ADMIN EMAIL ADDRESS
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter admin email..."
                                    className="w-full border-2 border-gray px-4 py-3 text-sm font-bold  focus:outline-none focus:ring-2 focus:ring-black"
                                    required
                                    disabled={isLoading}
                                />
                                <div className="text-xs text-white-500 mt-1">
                                    Only authorized admin emails are accepted
                                </div>
                            </div>

                            {error && (
                                <div className="border-2 border-red-500 bg-red-50 p-3">
                                    <div className="text-xs font-bold text-red-600">
                                        ERROR: {error}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full border-2 border-gray px-4 py-3 font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50 text-sm"
                                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                            >
                                {isLoading ? 'VERIFYING...' : 'SIGN IN'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <div className="text-xs text-white-500">
                        This page is for system administrators only.
                        <br />
                        If you don't have admin access, please contact support.
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="mt-4 text-xs text-white-600 hover:text-white underline"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}