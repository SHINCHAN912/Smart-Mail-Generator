'use client';

import React from 'react';
import { 
  Mail, 
  PenTool, 
  History, 
  Star, 
  Settings, 
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'generator' | 'history' | 'starred' | 'settings';
  setActiveTab: (tab: 'generator' | 'history' | 'starred' | 'settings') => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
}: SidebarProps) {
  
  interface NavItem {
    id: 'generator' | 'history' | 'starred' | 'settings';
    label: string;
    icon: LucideIcon;
  }

  const navItems: NavItem[] = [
    { id: 'generator', label: 'Write Email', icon: PenTool },
    { id: 'history', label: 'History', icon: History },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200/50 bg-white/70 backdrop-blur-md flex flex-col justify-between h-screen shrink-0 sticky top-0">
      
      {/* Brand logo */}
      <div className="p-6 border-b border-zinc-200/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/10">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SmartMail AI
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium">Email copywriter v1.0</span>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer group ${
                activeTab === item.id
                  ? 'bg-indigo-500/10 text-indigo-600 border-l-2 border-indigo-500 rounded-l-none pl-2.5'
                  : 'text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 transition ${
                  activeTab === item.id 
                    ? 'text-indigo-500' 
                    : 'text-zinc-400 group-hover:text-zinc-600'
                }`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
