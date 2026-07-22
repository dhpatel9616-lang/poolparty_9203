'use client';
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShieldCheck,
  Share2,
  DollarSign,
  Calendar,
  Trophy,
  Database,
  FileText,
  LayoutGrid,
  BookOpen,
  Scale,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Tag,
  Menu,
  X,
  ChevronRight,
  ClipboardCheck,
  PenSquare,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Executive Overview', icon: LayoutDashboard, tab: 'overview' },
  { label: 'Approval Queue', icon: ClipboardCheck, tab: 'approval-queue' },
  { label: 'User Intelligence', icon: Users, tab: 'users' },
  { label: 'Pool Intelligence', icon: Layers, tab: 'pools' },
  { label: 'Settlement & Trust', icon: ShieldCheck, tab: 'settlement' },
  { label: 'Settlement Optimizer', icon: Zap, tab: 'settlement-optimizer' },
  { label: 'Social Graph', icon: Share2, tab: 'social' },
  { label: 'Events', icon: Calendar, tab: 'events' },
  { label: 'Leagues', icon: Trophy, tab: 'leagues' },
  { label: 'Monetization', icon: DollarSign, tab: 'monetization' },
  { label: 'Template Marketplace', icon: LayoutGrid, tab: 'templates' },
  { label: 'Schema Browser', icon: Database, tab: 'schema' },
  { label: 'Audit Log', icon: FileText, tab: 'audit' },
];

const CMS_ITEMS = [
  { label: 'CMS Editor', icon: PenSquare, tab: 'cms-editor' },
  { label: 'Content Pages', icon: BookOpen, tab: 'content-pages' },
  { label: 'Legal Docs', icon: Scale, tab: 'legal' },
  { label: 'FAQs', icon: HelpCircle, tab: 'faqs' },
  { label: 'Contact Submissions', icon: MessageSquare, tab: 'contact-submissions' },
  { label: 'Problem Reports', icon: AlertTriangle, tab: 'problem-reports' },
  { label: 'Release Notes', icon: Tag, tab: 'release-notes' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onTabChange?.(tab);
    setSidebarOpen(false);
  };

  const allItems = [...NAV_ITEMS, ...CMS_ITEMS];
  const activeLabel = allItems.find((n) => n.tab === activeTab)?.label ?? 'Admin Dashboard';

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--background)', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              PP
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">PoolParty</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                Admin Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Main nav items */}
          <div className="space-y-0.5 mb-4">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.tab;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavClick(item.tab)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: isActive ? 'rgba(124,92,255,0.12)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  <ItemIcon size={17} />
                  {item.label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* CMS section */}
          <div
            className="px-3 py-2 mb-1"
          >
            <p className="text-2xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
              Content Management
            </p>
          </div>
          <div className="space-y-0.5">
            {CMS_ITEMS.map((item) => {
              const isActive = activeTab === item.tab;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavClick(item.tab)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: isActive ? 'rgba(124,92,255,0.12)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  <ItemIcon size={17} />
                  {item.label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
            PoolParty Admin v1.0.0
          </p>
          <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Role-gated access only
          </p>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-6 py-4 flex items-center gap-4"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <Menu size={18} style={{ color: 'var(--foreground)' }} />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{activeLabel}</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E676' }} />
            <span className="text-xs font-medium" style={{ color: '#00E676' }}>
              Live
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
