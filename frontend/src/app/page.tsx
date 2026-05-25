'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import EmailWorkspace from '../components/EmailWorkspace';
import HistoryTab from '../components/HistoryTab';
import StarredTab from '../components/StarredTab';
import SettingsTab from '../components/SettingsTab';
import AuthModal from '../components/AuthModal';
import { AppSettings, EmailDraft, EmailHistoryItem } from '../types';

export default function Home() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'starred' | 'settings'>('generator');
  const [darkMode, setDarkMode] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Application Data States
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'groq',
    user_groq_key: '',
  });
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);

  // Helper Functions
  const fetchHistory = async (authToken: string) => {
    try {
      const baseUrl = 'http://localhost:8000';
      const historyRes = await fetch(`${baseUrl}/api/emails/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Error fetching email history', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartmail_token');
    setToken(null);
    setUserEmail(null);
    setHistory([]);
    // Reset draft database sync status
    if (draft) {
      setDraft((prev) => (prev ? { ...prev, id: undefined, is_saved: false, rating: 0 } : null));
    }
    setActiveTab('generator');
  };

  const fetchUserData = async (authToken: string) => {
    try {
      const baseUrl = 'http://localhost:8000';
      const userRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserEmail(userData.email);
        
        // Fetch history once user is confirmed
        fetchHistory(authToken);
      } else {
        // Token might have expired
        handleLogout();
      }
    } catch (err) {
      console.error('Network error checking credentials', err);
    }
  };

  const refreshHistory = async () => {
    if (token) {
      await fetchHistory(token);
    }
  };

  const handleToggleSave = async (id: number, currentSaved: boolean) => {
    if (!token) return;
    try {
      const baseUrl = 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/emails/${id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_saved: !currentSaved }),
      });

      if (res.ok) {
        await fetchHistory(token);
      }
    } catch (err) {
      console.error('Failed to toggle star status', err);
    }
  };

  const handleRate = async (id: number, ratingVal: number) => {
    if (!token) return;
    try {
      const baseUrl = 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/emails/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: ratingVal }),
      });

      if (res.ok) {
        await fetchHistory(token);
      }
    } catch (err) {
      console.error('Failed to submit rating', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this email from your history?')) return;
    try {
      const baseUrl = 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/emails/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        // If the draft currently in editor workspace was deleted, reset draft ID.
        if (draft && draft.id === id) {
          setDraft((prev) => (prev ? { ...prev, id: undefined, is_saved: false, rating: 0 } : null));
        }
        await fetchHistory(token);
      }
    } catch (err) {
      console.error('Failed to delete email record', err);
    }
  };

  const handleLoginSuccess = (authToken: string) => {
    localStorage.setItem('smartmail_token', authToken);
    setToken(authToken);
    fetchUserData(authToken);
  };

  const handleLoadDraft = (item: EmailHistoryItem) => {
    setDraft({
      id: item.id,
      subject: item.subject || '',
      content: item.content,
      score_grammar: item.score_grammar,
      score_spam: item.score_spam,
      score_clarity: item.score_clarity,
      rating: item.rating,
      is_saved: item.is_saved,
    });
    setActiveTab('generator');
  };

  // 1. Theme Synced to DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 2. Load settings and auth from localStorage on mount
  useEffect(() => {
    // Load API settings
    const storedSettings = localStorage.getItem('smartmail_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        const sanitized: AppSettings = {
          provider: 'groq',
          user_groq_key: parsed.user_groq_key || parsed.user_gemini_key || parsed.user_openai_key || '',
        };
        setTimeout(() => {
          setSettings(sanitized);
        }, 0);
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }

    // Load Token & Auth info
    const storedToken = localStorage.getItem('smartmail_token');
    if (storedToken) {
      setTimeout(() => {
        setToken(storedToken);
        fetchUserData(storedToken);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        token={token}
        email={userEmail}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 relative overflow-y-auto h-screen p-8 lg:p-12">
        
        {/* Glow Circles */}
        <div className="bg-glow-purple top-12 left-1/4" />
        <div className="bg-glow-blue bottom-12 right-1/4" />

        <div className="max-w-6xl mx-auto">
          {activeTab === 'generator' && (
            <EmailWorkspace
              token={token}
              settings={settings}
              draft={draft}
              setDraft={setDraft}
              onSaveToggle={handleToggleSave}
              onRate={handleRate}
              refreshHistory={refreshHistory}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              token={token}
              onLoadDraft={handleLoadDraft}
              onToggleSave={handleToggleSave}
              onRate={handleRate}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'starred' && (
            <StarredTab
              history={history}
              token={token}
              onLoadDraft={handleLoadDraft}
              onToggleSave={handleToggleSave}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              key={`${settings.provider}-${settings.user_groq_key}`}
              settings={settings}
              setSettings={setSettings}
            />
          )}
        </div>
      </main>

      {/* Login / Register Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
