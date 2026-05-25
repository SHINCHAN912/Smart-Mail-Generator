'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Star, 
  Loader2, 
  RefreshCw,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { AppSettings, EmailConfig, EmailDraft, ScoreResponse } from '../types';

interface EmailWorkspaceProps {
  token: string | null;
  settings: AppSettings;
  draft: EmailDraft | null;
  setDraft: React.Dispatch<React.SetStateAction<EmailDraft | null>>;
  onSaveToggle: (id: number, currentSaved: boolean) => Promise<void>;
  onRate: (id: number, rating: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export default function EmailWorkspace({
  token,
  settings,
  draft,
  setDraft,
  onSaveToggle,
  onRate,
  refreshHistory,
}: EmailWorkspaceProps) {
  // Form Config state
  const [config, setConfig] = useState<EmailConfig>({
    category: 'Professional',
    recipient: '',
    subject: '',
    prompt: '',
    tone: 'Professional',
    length: 'Medium',
    language: 'English',
    provider: 'groq',
  });

  // Action states
  const [generating, setGenerating] = useState(false);
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  
  // Scoring and suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  // Handle draft loading
  const handleCopy = async () => {
    if (!draft?.content) return;
    try {
      const fullText = `Subject: ${draft.subject}\n\n${draft.content}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!draft?.content) return;
    const fullText = `Subject: ${draft.subject}\n\n${draft.content}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.subject || 'email-draft'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 1. Generate Email
  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:8000/api/emails/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...config,
          provider: 'groq',
          user_groq_key: settings.user_groq_key || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await res.json();
      
      // If user is authenticated, we will refresh history since backend auto-saves it.
      if (token) {
        await refreshHistory();
      }

      setDraft({
        subject: data.subject,
        content: data.content,
        score_grammar: data.score_grammar,
        score_spam: data.score_spam,
        score_clarity: data.score_clarity,
        is_saved: false,
      });

      // Clear suggestions on fresh generation, wait for manual run if edited
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);
      alert('Error generating email. Please check your network and API keys in settings.');
    } finally {
      setGenerating(false);
    }
  };

  // 2. Expand/Improve Prompt
  const handleImprovePrompt = async () => {
    if (!config.prompt.trim()) return;
    setImprovingPrompt(true);
    try {
      const res = await fetch('http://localhost:8000/api/emails/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt,
          user_groq_key: settings.user_groq_key || null,
          provider: 'groq',
        }),
      });

      if (!res.ok) throw new Error('Failed to improve prompt');
      const data = await res.json();
      setConfig((prev) => ({ ...prev, prompt: data.improved_prompt }));
    } catch (err) {
      console.error(err);
      alert('Failed to expand prompt. Using original draft.');
    } finally {
      setImprovingPrompt(false);
    }
  };

  // 3. Rewrite Draft
  const handleRewrite = async () => {
    if (!draft?.content || !rewriteInstruction.trim()) return;
    setRewriting(true);
    try {
      const res = await fetch('http://localhost:8000/api/emails/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_content: draft.content,
          instruction: rewriteInstruction,
          tone: config.tone,
          length: config.length,
          user_groq_key: settings.user_groq_key || null,
          provider: 'groq',
        }),
      });

      if (!res.ok) throw new Error('Failed to rewrite email');
      const data = await res.json();
      setDraft((prev) => ({
        ...prev!,
        subject: data.subject || prev!.subject,
        content: data.content,
      }));
      setRewriteInstruction('');
    } catch (err) {
      console.error(err);
      alert('Rewrite error. Please check your API keys.');
    } finally {
      setRewriting(false);
    }
  };

  // 4. Manually Re-Score and get Suggestions
  const handleGetScores = async () => {
    if (!draft?.content) return;
    setScoring(true);
    try {
      const res = await fetch('http://localhost:8000/api/emails/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_content: draft.content,
          user_groq_key: settings.user_groq_key || null,
          provider: 'groq',
        }),
      });

      if (!res.ok) throw new Error('Failed to score email');
      const data: ScoreResponse = await res.json();
      
      setDraft((prev) => ({
        ...prev!,
        score_grammar: data.score_grammar,
        score_spam: data.score_spam,
        score_clarity: data.score_clarity,
      }));
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
    } finally {
      setScoring(false);
    }
  };

  // 5. Star/Unstar loaded drafts (if saved in DB with ID)
  const handleToggleStar = async () => {
    if (!draft?.id) return;
    try {
      const newSavedState = !draft.is_saved;
      await onSaveToggle(draft.id, draft.is_saved || false);
      setDraft((prev) => ({ ...prev!, is_saved: newSavedState }));
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Rate loaded drafts
  const handleRating = async (ratingVal: number) => {
    if (!draft?.id) return;
    try {
      await onRate(draft.id, ratingVal);
      setDraft((prev) => ({ ...prev!, rating: ratingVal }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-slide-up">
      
      {/* Left Column - Configuration Form */}
      <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <Wand2 className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Configure Copywriter</h2>
        </div>

        {/* Category & Recipient */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Category</label>
            <select
              value={config.category}
              onChange={(e) => setConfig({ ...config, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer text-zinc-800 dark:text-zinc-200 font-semibold"
            >
              <option value="Professional">Professional</option>
              <option value="Leave Request">Leave Request</option>
              <option value="Cold Email">Cold Outreach</option>
              <option value="Interview Follow-up">Job Follow-up</option>
              <option value="Thank You">Thank You</option>
              <option value="Custom">Custom Template</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Recipient Name</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jennings"
              value={config.recipient}
              onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Tone, Length & Language */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Tone</label>
            <select
              value={config.tone}
              onChange={(e) => setConfig({ ...config, tone: e.target.value })}
              className="w-full px-2.5 py-2 text-[11px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Formal">Formal</option>
              <option value="Casual">Casual</option>
              <option value="Empathetic">Empathetic</option>
              <option value="Persuasive">Persuasive</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Length</label>
            <select
              value={config.length}
              onChange={(e) => setConfig({ ...config, length: e.target.value })}
              className="w-full px-2.5 py-2 text-[11px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Long">Long</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Language</label>
            <select
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value })}
              className="w-full px-2.5 py-2 text-[11px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="Chinese">Chinese</option>
            </select>
          </div>
        </div>

        {/* Custom Subject context */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Subject Context (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Schedule meeting regarding project updates"
            value={config.subject}
            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition text-zinc-800 dark:text-zinc-200"
          />
        </div>

        {/* Main Prompt */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Prompt Instructions</label>
            <button
              onClick={handleImprovePrompt}
              disabled={improvingPrompt || !config.prompt.trim()}
              className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 transition flex items-center gap-1 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
            >
              {improvingPrompt ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Sparkles className="w-2.5 h-2.5" />
              )}
              <span>Expand Prompt with AI</span>
            </button>
          </div>
          <textarea
            rows={5}
            placeholder="What do you want the email to communicate? Describe the context, key details, dates, or calls to action."
            value={config.prompt}
            onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !config.prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/15 mt-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Premium Draft...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Compose Email Draft</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column - Response view & Editor */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Editor Board */}
        <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col flex-1 min-h-[420px] relative overflow-hidden">
          
          {!draft ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 animate-pulse-subtle mb-3" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Email Draft Workspace</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1 leading-normal">
                Enter your details on the left and click Compose. Your generated email, live scoring dashboard, and editor will appear here.
              </p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              
              {/* Header Action Tools */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {draft.id ? "Syncing to cloud history" : "Temporary Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Rating Stars (only if draft is saved in database) */}
                  {draft.id && (
                    <div className="flex items-center border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className={`p-0.5 hover:scale-115 transition cursor-pointer ${
                            star <= (draft.rating || 0)
                              ? 'text-amber-500'
                              : 'text-zinc-300 dark:text-zinc-700 hover:text-amber-400'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Star Starred toggle */}
                  {draft.id && (
                    <button
                      onClick={handleToggleStar}
                      className={`p-1.5 rounded-lg border transition cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                        draft.is_saved
                          ? 'text-amber-500 bg-amber-500/5 border-amber-500/20'
                          : 'text-zinc-400 dark:text-zinc-500 border-zinc-200/50 dark:border-zinc-800/50'
                      }`}
                    >
                      {draft.is_saved ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                    title="Download as TXT"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit Subject Line */}
              <div className="space-y-1 mb-4">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Subject Line</span>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-zinc-800 dark:text-zinc-200"
                />
              </div>

              {/* Edit Body Text */}
              <div className="space-y-1 flex-grow flex flex-col mb-4">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Email Body</span>
                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  rows={10}
                  className="w-full flex-grow p-4 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-700 dark:text-zinc-200 font-sans leading-relaxed whitespace-pre-wrap outline-none border-dashed resize-none min-h-[160px]"
                />
              </div>

              {/* Live Rewrite bar */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">Rewrite with Instruction</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Change the signature name to Bob, or Shorten the intro..."
                    value={rewriteInstruction}
                    onChange={(e) => setRewriteInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-700 dark:text-zinc-300"
                  />
                  <button
                    onClick={handleRewrite}
                    disabled={rewriting || !rewriteInstruction.trim()}
                    className="px-4.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {rewriting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    )}
                    <span>Apply</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Scoring & Analytics panel */}
        {draft && (
          <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Copywriter Analytics</h3>
              </div>

              <button
                onClick={handleGetScores}
                disabled={scoring}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {scoring ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Recalculate Scores</span>
              </button>
            </div>

            {/* Score grids */}
            <div className="grid grid-cols-3 gap-4">
              
              {/* Grammar Score */}
              <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/20 dark:border-zinc-800/20 space-y-1.5">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Grammar Accuracy</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-emerald-500">{draft.score_grammar}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${draft.score_grammar}%` }}
                  />
                </div>
              </div>

              {/* Clarity Score */}
              <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/20 dark:border-zinc-800/20 space-y-1.5">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Readability Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-indigo-500">{draft.score_clarity}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${draft.score_clarity}%` }}
                  />
                </div>
              </div>

              {/* Spam likelihood */}
              <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/20 dark:border-zinc-800/20 space-y-1.5">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Spam Likelihood</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-extrabold ${draft.score_spam > 30 ? 'text-amber-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {draft.score_spam}%
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${draft.score_spam > 30 ? 'bg-amber-500' : 'bg-zinc-500'}`}
                    style={{ width: `${draft.score_spam}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Suggestions accordion */}
            {suggestions.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Suggestions for Improvement ({suggestions.length})</span>
                  </span>
                  {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSuggestions && (
                  <ul className="mt-2 space-y-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3.5 py-1">
                    {suggestions.map((sug, index) => (
                      <li key={index} className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed list-disc">
                        {sug}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
