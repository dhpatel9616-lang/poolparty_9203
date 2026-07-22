'use client';
import React, { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import ExecutiveOverview from './components/ExecutiveOverview';
import UserIntelligence from './components/UserIntelligence';
import PoolIntelligence from './components/PoolIntelligence';
import SettlementTrust from './components/SettlementTrust';
import SocialGraph from './components/SocialGraph';
import Events from './components/Events';
import Leagues from './components/Leagues';
import Monetization from './components/Monetization';
import SchemaBrowser from './components/SchemaBrowser';
import AuditLog from './components/AuditLog';
import TemplateManagement from './components/TemplateManagement';
import ContentPages from './components/ContentPages';
import LegalManagement from './components/LegalManagement';
import FaqManagement from './components/FaqManagement';
import ContactSubmissions from './components/ContactSubmissions';
import ProblemReports from './components/ProblemReports';
import ReleaseNotesAdmin from './components/ReleaseNotesAdmin';
import ApprovalQueue from './components/ApprovalQueue';
import CMSEditor from './components/CMSEditor';
import SettlementOptimizer from './components/SettlementOptimizer';

type AdminTab =
  | 'overview' | 'users' | 'pools' | 'settlement' | 'settlement-optimizer' | 'social' | 'events' | 'leagues' | 'monetization' | 'schema' | 'audit' | 'templates' | 'content-pages' | 'legal' | 'faqs' | 'contact-submissions' | 'problem-reports' | 'release-notes' | 'approval-queue' | 'cms-editor';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <AdminLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)}>
      {activeTab === 'overview' && <ExecutiveOverview />}
      {activeTab === 'users' && <UserIntelligence />}
      {activeTab === 'pools' && <PoolIntelligence />}
      {activeTab === 'settlement' && <SettlementTrust />}
      {activeTab === 'settlement-optimizer' && <SettlementOptimizer />}
      {activeTab === 'social' && <SocialGraph />}
      {activeTab === 'events' && <Events />}
      {activeTab === 'leagues' && <Leagues />}
      {activeTab === 'monetization' && <Monetization />}
      {activeTab === 'templates' && <TemplateManagement />}
      {activeTab === 'schema' && <SchemaBrowser />}
      {activeTab === 'audit' && <AuditLog />}
      {activeTab === 'cms-editor' && <CMSEditor />}
      {activeTab === 'content-pages' && <ContentPages />}
      {activeTab === 'legal' && <LegalManagement />}
      {activeTab === 'faqs' && <FaqManagement />}
      {activeTab === 'contact-submissions' && <ContactSubmissions />}
      {activeTab === 'problem-reports' && <ProblemReports />}
      {activeTab === 'release-notes' && <ReleaseNotesAdmin />}
      {activeTab === 'approval-queue' && <ApprovalQueue />}
    </AdminLayout>
  );
}
