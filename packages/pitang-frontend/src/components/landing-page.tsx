import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Receipt, ShieldCheck, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">

            <header className="sticky top-0 z-50 backdrop-blur bg-white/5 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                        <div className="bg-white/10 h-8 w-8 rounded-lg flex items-center justify-center backdrop-blur">
                            <Receipt className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Pitang</span>
                    </div>

                    <Button
                        onClick={() => navigate({ to: '/register' })}
                        className="rounded-full bg-white text-black hover:bg-gray-200"
                    >
                        Sign Up
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-6">

                <div className="max-w-3xl space-y-6">

                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                        Expense reimbursement <br />
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                            made simple
                        </span>
                    </h1>

                    <p className="text-gray-400 text-lg">
                        Create, track, and manage your reimbursements in seconds.
                        From request to payment, all in one place.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button
                            onClick={() => navigate({ to: '/login' })}
                            className="rounded-full px-8 h-12 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90"
                        >
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-20 max-w-5xl w-full">

                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:scale-105 transition">
                        <ShieldCheck className="mb-3 text-emerald-400" />
                        <h3 className="font-bold text-lg">Full tracking</h3>
                        <p className="text-gray-400 text-sm">
                            Check the status of each request in real time, from submission to payment.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:scale-105 transition">
                        <BarChart3 className="mb-3 text-cyan-400" />
                        <h3 className="font-bold text-lg">Smart management</h3>
                        <p className="text-gray-400 text-sm">
                            Simplified approval flow with defined roles for each step.
                        </p>
                    </div>

                </div>

            </main>

            <footer className="border-t border-white/10 text-center py-6 text-sm text-gray-500">
                © 2026 Pitang
            </footer>
        </div>
    );
}
