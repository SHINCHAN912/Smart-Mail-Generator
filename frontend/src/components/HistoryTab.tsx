'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Star, 
  Calendar, 
  ArrowRight,
  BookOpen,
  Filter,
  Clock
} from 'lucide-react';
import { EmailHistoryItem } from '../types';

interface HistoryTabProps {
  history: EmailHistoryItem[];
  token: string | null;
  onLoadDraft: (item: EmailHistoryItem) => void;
  onToggleSave: (id: number, currentSaved: boolean) => Promise<void>;
  onRate: (id: number, rating: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function HistoryTab({
  history,
  token,
  onLoadDraft,
  onToggleSave,
  onRate,
  onDelete,
}: HistoryTabProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in">
        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
          <Clock className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Authentication Required</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
          You must be logged in to view your generation history. Sign up or log in from the sidebar panel to enable cloud synchronization.
        </p>
      </div>
    );
  }

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.subject?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.recipient?.toLowerCase() || '').includes(search.toLowerCase()) ||
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories for dropdown filter
  const categories = ['all', ...Array.from(new Set(history.map((item) => item.category)))];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Generation History
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Retrieve past copies, adjust ratings, or reload them back into the generator workspace.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2.5 max-w-md w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer text-zinc-700 dark:text-zinc-300 font-semibold"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History cards grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
          <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No matching emails found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {history.length === 0 ? "You haven't generated any emails yet." : "Try adjusting your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg transition flex flex-col justify-between relative overflow-hidden"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition" />

              <div>
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/30 dark:border-zinc-800/30">
                      {item.category}
                    </span>
                    <span>•</span>
                    <span>{item.tone}</span>
                    <span>•</span>
                    <span>{item.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Recipient & Subject */}
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">
                  {item.recipient ? `To: ${item.recipient}` : 'To: Recipient'}
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  Subject: {item.subject || 'No Subject'}
                </p>

                {/* Prompt snippet */}
                <div className="my-3 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 text-[11px] text-zinc-500 dark:text-zinc-400 italic line-clamp-2">
                  &ldquo;{item.prompt}&rdquo;
                </div>

                {/* Truncated draft content */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed whitespace-pre-line mb-4 border-l-2 border-zinc-200 dark:border-zinc-800 pl-3">
                  {item.content}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-4 mt-auto">
                {/* Score Indicators */}
                <div className="flex items-center gap-2.5 text-[9px] font-bold text-zinc-400">
                  <div className="flex items-center gap-1" title="Grammar Score">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>G: {item.score_grammar}%</span>
                  </div>
                  <div className="flex items-center gap-1" title="Clarity Score">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>C: {item.score_clarity}%</span>
                  </div>
                  <div className="flex items-center gap-1" title="Spam Probability">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>S: {item.score_spam}%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Rating Stars */}
                  <div className="flex items-center mr-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRate(item.id, star)}
                        className={`p-0.5 hover:scale-110 transition cursor-pointer ${
                          star <= item.rating
                            ? 'text-amber-500'
                            : 'text-zinc-300 dark:text-zinc-700 hover:text-amber-300'
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                    ))}
                  </div>

                  {/* Favorite star */}
                  <button
                    onClick={() => onToggleSave(item.id, item.is_saved)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      item.is_saved
                        ? 'text-amber-500 bg-amber-500/5 border-amber-500/20'
                        : 'text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'
                    }`}
                    title={item.is_saved ? "Remove Star" : "Star Draft"}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.is_saved ? 'fill-current' : ''}`} />
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
