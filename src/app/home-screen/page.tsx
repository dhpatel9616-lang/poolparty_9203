'use client';
import React, { useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import TrustScoreHero from './components/TrustScoreHero';
import QuickStatsStrip from './components/QuickStatsStrip';
import FilteredContent from './components/FilteredContent';
import PaymentsDue from './components/PaymentsDue';
import SmartSuggestion from './components/SmartSuggestion';
import HomeHeader from './components/HomeHeader';
import LegalReacceptanceModal from '@/components/LegalReacceptanceModal';
import FriendsActiveContracts from './components/FriendsActiveContracts';
import { useAuth } from '@/contexts/AuthContext';
import type { HomeFilter } from './components/QuickStatsStrip';

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState<HomeFilter>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const { user } = useAuth();

  return (
    <MobileLayout>
      {user && !legalAccepted && (
        <LegalReacceptanceModal onAccepted={() => setLegalAccepted(true)} />
      )}
      <div className="px-4 pt-4 space-y-4">
        <HomeHeader onSearchChange={setSearchQuery} />
        <TrustScoreHero />
        <QuickStatsStrip activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <SmartSuggestion />
        <FilteredContent filter={activeFilter} searchQuery={searchQuery} />
        {!activeFilter && <PaymentsDue />}
        {!activeFilter && <FriendsActiveContracts />}
      </div>
    </MobileLayout>
  );
}