'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import EmailWorkspace from '../components/EmailWorkspace';
import HistoryTab from '../components/HistoryTab';
import StarredTab from '../components/StarredTab';
import SettingsTab from '../components/SettingsTab';
import { AppSettings, EmailDraft, EmailHistoryItem } from '../types';

export default function Home() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'starred' | 'settings'>('generator');

  // Application Data States
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'groq',
    user_groq_key: '',
  });
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);

  // Local Storage Helpers
  const saveHistoryLocally = (newHistory: EmailHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('smartmail_history', JSON.stringify(newHistory));
  };

  const loadHistoryLocally = () => {
    const stored = localStorage.getItem('smartmail_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing history', e);
      }
    }
  };

  const handleToggleSave = async (id: number, currentSaved: boolean) => {
    const updated = history.map(item => item.id === id ? { ...item, is_saved: !currentSaved } : item);
    saveHistoryLocally(updated);
  };

  const handleRate = async (id: number, ratingVal: number) => {
    const updated = history.map(item => item.id === id ? { ...item, rating: ratingVal } : item);
    saveHistoryLocally(updated);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email from your history?')) return;
    const updated = history.filter(item => item.id !== id);
    saveHistoryLocally(updated);
    if (draft && draft.id === id) {
      setDraft((prev) => (prev ? { ...prev, id: undefined, is_saved: false, rating: 0 } : null));
    }
  };

  const handleAddHistory = (newItem: Omit<EmailHistoryItem, 'id' | 'created_at'>) => {
    const newHistoryItem: EmailHistoryItem = {
      ...newItem,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    const updated = [newHistoryItem, ...history];
    saveHistoryLocally(updated);
    return newHistoryItem.id;
  };

  const handleUpdateDraft = (id: number, updates: Partial<EmailHistoryItem>) => {
    const updated = history.map(item => item.id === id ? { ...item, ...updates } : item);
    saveHistoryLocally(updated);
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

  // Force Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Load settings and history from localStorage on mount
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

    loadHistoryLocally();
  }, []);

  return (
    <div className="min-h-screen flex bg-zinc-50 text-zinc-950 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 relative overflow-y-auto h-screen p-8 lg:p-12">
        
        {/* Glow Circles */}
        <div className="bg-glow-purple top-12 left-1/4" />
        <div className="bg-glow-blue bottom-12 right-1/4" />

        <div className="max-w-6xl mx-auto">
          {activeTab === 'generator' && (
            <EmailWorkspace
              settings={settings}
              draft={draft}
              setDraft={setDraft}
              onSaveToggle={handleToggleSave}
              onRate={handleRate}
              onAddHistory={handleAddHistory}
              onUpdateDraft={handleUpdateDraft}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              onLoadDraft={handleLoadDraft}
              onToggleSave={handleToggleSave}
              onRate={handleRate}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'starred' && (
            <StarredTab
              history={history}
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
    </div>
  );
}
