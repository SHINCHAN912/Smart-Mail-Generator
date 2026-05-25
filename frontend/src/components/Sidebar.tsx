'use client';

import React from 'react';
import { 
  Mail, 
  PenTool, 
  History, 
  Star, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  LogIn, 
  User,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'generator' | 'history' | 'starred' | 'settings';
  setActiveTab: (tab: 'generator' | 'history' | 'starred' | 'settings') => void;
  token: string | null;
  email: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  token,
  email,
  onLoginClick,
  onLogout,
  darkMode,
  setDarkMode,
}: SidebarProps) {
  
  interface NavItem {
    id: 'generator' | 'history' | 'starred' | 'settings';
    label: string;
    icon: LucideIcon;
    requireAuth?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'generator', label: 'Write Email', icon: PenTool },
    { id: 'history', label: 'History', icon: History, requireAuth: true },
    { id: 'starred', label: 'Starred', icon: Star, requireAuth: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col justify-between h-screen shrink-0 sticky top-0">
      
      {/* Brand logo */}
      <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/10">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              SmartMail AI
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium">Email copywriter v1.0</span>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          // If logged out and item requires auth, disable or hide it, or let it prompt login
          const disabled = item.requireAuth && !token;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (disabled) {
                  onLoginClick();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer group ${
                activeTab === item.id
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500 rounded-l-none pl-2.5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 transition ${
                  activeTab === item.id 
                    ? 'text-indigo-500' 
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`} />
                <span>{item.label}</span>
              </div>
              {disabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-medium">
                  Lock
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer controls & Auth */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
        
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Dark Mode</span>
              </>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
            {darkMode ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* User Card */}
        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30">
          {token ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow shadow-indigo-500/10 shrink-0">
                  {email ? email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate leading-none">
                    Logged In
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5" title={email || ''}>
                    {email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-400 text-center leading-normal">
                Log in to sync drafts across your devices and save favorites.
              </p>
              <button
                onClick={onLoginClick}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-600/15"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
