'use client';

import React, { useState } from 'react';
import { Settings, Shield, Sparkles, Save, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsTabProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

export default function SettingsTab({ settings, setSettings }: SettingsTabProps) {
  const [provider] = useState<'groq'>('groq');
  const [groqKey, setGroqKey] = useState(settings.user_groq_key);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: AppSettings = {
      provider,
      user_groq_key: groqKey,
    };
    
    // Save to localStorage
    localStorage.setItem('smartmail_settings', JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Intro Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
          <Settings className="w-6 h-6 animate-pulse-subtle" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            API Keys & Provider Settings
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure your AI connection credentials and preferences.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md space-y-6">
        
        {/* API Key Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs border border-amber-500/20 leading-normal">
          <Shield className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Security Disclaimer:</span>
            <p>
              Your API keys are stored locally in your browser cache via LocalStorage. They are transmitted securely only to complete AI requests and are never permanently saved on our backend databases.
            </p>
          </div>
        </div>

        {/* AI Provider selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Preferred AI Copywriter
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col p-4 rounded-xl border-2 border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 transition cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Groq Cloud (Llama 3.3 70B)</span>
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 leading-normal">
                Active. Powered by Meta Llama 3.3 70B Versatile model. Incredibly fast, high-quality, and expressive email copywriting.
              </span>
            </div>
          </div>
        </div>

        {/* API Key Inputs */}
        <div className="space-y-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          
          {/* Groq API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Groq API Key
              </label>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-semibold text-indigo-500 hover:underline"
              >
                Get Groq Key
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Required if backend key not set"
              className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-lg shadow-indigo-600/15"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>Preferences Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
