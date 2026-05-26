'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (activeTab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      if (activeTab === 'register') {
        const response = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Registration failed. Try again.');
        }

        setSuccessMsg('Account created successfully! Auto-logging in...');
        // Auto-login after registration
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!loginResponse.ok) {
          throw new Error('Auto-login failed. Please sign in manually.');
        }

        const loginData = await loginResponse.json();
        onSuccess(loginData.access_token);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Invalid email or password.');
        }

        const data = await response.json();
        onSuccess(data.access_token);
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel shadow-2xl animate-slide-up border border-zinc-200/50 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-900/90 text-zinc-950 dark:text-zinc-50">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse-subtle" />
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              SmartMail AI Account
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex px-6 pt-4">
          <button
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition ${
              activeTab === 'login'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition ${
              activeTab === 'register'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs border border-red-500/20">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-500/20">
              <Sparkles className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-60 cursor-pointer shadow-lg shadow-indigo-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : activeTab === 'login' ? (
              'Log In to Dashboard'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 pb-6 text-center text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
          By signing up, you agree to our terms of service and privacy policy. 
          SmartMail AI securely encrypts and stores your preference data.
        </div>
      </div>
    </div>
  );
}
