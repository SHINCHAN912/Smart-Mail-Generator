'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  ArrowRight, 
  Search
} from 'lucide-react';
import { EmailHistoryItem } from '../types';

interface StarredTabProps {
  history: EmailHistoryItem[];
  token: string | null;
  onLoadDraft: (item: EmailHistoryItem) => void;
  onToggleSave: (id: number, currentSaved: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function StarredTab({
  history,
  token,
  onLoadDraft,
  onToggleSave,
  onDelete,
}: StarredTabProps) {
  const [search, setSearch] = useState('');

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
          <Star className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Authentication Required</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
          Log in from the sidebar panel to see your starred emails and favorites.
        </p>
      </div>
    );
  }

  const starredEmails = history.filter(
    (item) => item.is_saved && (
      (item.subject?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.recipient?.toLowerCase() || '').includes(search.toLowerCase()) ||
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Starred Drafts & Templates
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your collection of curated, starred email results. Perfect for reusing templates.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search starred..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Grid */}
      {starredEmails.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
          <Star className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No starred drafts yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Star generated drafts in the workspace to save them as templates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {starredEmails.map((item) => (
            <div
              key={item.id}
              className="group p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-lg transition flex flex-col justify-between relative overflow-hidden"
            >
              {/* Gold light effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition" />

              <div>
                {/* Meta details */}
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mb-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                    {item.category}
                  </span>
                  <span>•</span>
                  <span>{item.tone}</span>
                  <span>•</span>
                  <span>{item.language}</span>
                </div>

                {/* Recipient & Subject */}
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">
                  {item.recipient ? `To: ${item.recipient}` : 'To: Recipient'}
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  Subject: {item.subject || 'No Subject'}
                </p>

                {/* Content preview */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed whitespace-pre-line my-4 border-l-2 border-amber-500/30 pl-3">
                  {item.content}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-4 mt-auto">
                {/* Score */}
                <span className="text-[10px] text-zinc-400 font-semibold">
                  Clarity: {item.score_clarity}% • Spam: {item.score_spam}%
                </span>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Toggle Save Star */}
                  <button
                    onClick={() => onToggleSave(item.id, item.is_saved)}
                    className="p-1.5 rounded-lg border border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition cursor-pointer"
                    title="Remove Star"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Load Draft */}
                  <button
                    onClick={() => onLoadDraft(item)}
                    className="p-1.5 pl-2.5 pr-2.5 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-600/10"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
