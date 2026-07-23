'use client';
import React, { useState, useEffect, useCallback } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Star, Flame, TrendingUp, Zap, ChevronRight, BadgeCheck, Sparkles, Clock, X, Store, CheckCircle, Share2, UserPlus } from 'lucide-react';
import TemplateCard from './components/TemplateCard';
import CategoryBrowser from './components/CategoryBrowser';
import PoolCloneFlow from './components/PoolCloneFlow';
import AIRecommendedPools from './components/AIRecommendedPools';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


export interface PoolTemplate {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category_id: string | null;
  cover_image: string | null;
  icon: string;
  pool_type: string;
  is_featured: boolean;
  is_official: boolean;
  launch_count: number;
  participant_count: number;
  difficulty_score: number;
  default_expiration: string;
  resolution_rules: string | null;
  default_options: unknown[];
  category?: {name: string;icon: string;} | null;
  resolution_source?: {name: string;} | null;
  analytics?: {views: number;clones: number;viral_coefficient: number;} | null;
}

interface SuggestedCreator {
  id: string;
  display_name: string;
  tagline: string;
  is_verified: boolean;
  follower_count: number;
  public_pool_count: number;
  creator_score: number;
}

const MOCK_TEMPLATES: PoolTemplate[] = [
{ id: 'mock-1', title: 'NFL Weekly Picks', subtitle: 'Pick the winner of every NFL game this week', description: 'Classic NFL weekly prediction pool.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1c55e4a60-1780004001983.png", icon: '🏈', pool_type: 'prediction', is_featured: true, is_official: true, launch_count: 4821, participant_count: 32400, difficulty_score: 2, default_expiration: '7 days', resolution_rules: 'Official NFL results', default_options: ['Home Team', 'Away Team'], category: { name: 'Sports', icon: '🏆' }, resolution_source: { name: 'Official NFL Stats' }, analytics: { views: 24105, clones: 4821, viral_coefficient: 2.4 } },
{ id: 'mock-2', title: 'Super Bowl Champion', subtitle: 'Who will win the Super Bowl?', description: 'The ultimate NFL prediction pool.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_135494750-1769050578781.png", icon: '🏆', pool_type: 'prediction', is_featured: true, is_official: true, launch_count: 3102, participant_count: 18900, difficulty_score: 3, default_expiration: '180 days', resolution_rules: 'Official NFL.com', default_options: [], category: { name: 'Sports', icon: '🏆' }, resolution_source: { name: 'Official NFL Stats' }, analytics: { views: 15510, clones: 3102, viral_coefficient: 2.1 } },
{ id: 'mock-3', title: 'Bitcoin Price Prediction', subtitle: 'Will BTC hit $100K this month?', description: 'Predict whether Bitcoin will reach a target price.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1cdd708d7-1769452205945.png", icon: '₿', pool_type: 'prediction', is_featured: true, is_official: false, launch_count: 2478, participant_count: 14200, difficulty_score: 2, default_expiration: '30 days', resolution_rules: 'CoinMarketCap closing price', default_options: ['Yes', 'No'], category: { name: 'Crypto', icon: '₿' }, resolution_source: { name: 'Exchange Reference Price' }, analytics: { views: 12390, clones: 2478, viral_coefficient: 1.9 } },
{ id: 'mock-4', title: 'March Madness Bracket', subtitle: 'Fill out your NCAA bracket', description: 'Complete bracket challenge for March Madness.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1651f69c0-1778317748334.png", icon: '🏀', pool_type: 'bracket', is_featured: true, is_official: true, launch_count: 1987, participant_count: 11600, difficulty_score: 4, default_expiration: '21 days', resolution_rules: 'Official NCAA tournament', default_options: [], category: { name: 'Sports', icon: '🏆' }, resolution_source: { name: 'Official NBA Stats' }, analytics: { views: 9935, clones: 1987, viral_coefficient: 2.0 } },
{ id: 'mock-5', title: 'Office Fantasy Draft', subtitle: 'Annual office fantasy sports league', description: 'Classic office fantasy sports pool.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_153f69d9a-1784600096128.png", icon: '🏢', pool_type: 'fantasy', is_featured: false, is_official: false, launch_count: 1543, participant_count: 8900, difficulty_score: 3, default_expiration: '90 days', resolution_rules: 'Player performance stats', default_options: [], category: { name: 'Office Pools', icon: '🏢' }, resolution_source: null, analytics: { views: 7715, clones: 1543, viral_coefficient: 1.8 } },
{ id: 'mock-6', title: 'Stock Market Challenge', subtitle: 'Pick the best performing stock this quarter', description: 'Each player picks a stock.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1922484b2-1767357223613.png", icon: '📈', pool_type: 'challenge', is_featured: false, is_official: true, launch_count: 1201, participant_count: 7100, difficulty_score: 3, default_expiration: '90 days', resolution_rules: 'Yahoo Finance closing price', default_options: [], category: { name: 'Stocks', icon: '📈' }, resolution_source: { name: 'Market Close Price' }, analytics: { views: 6005, clones: 1201, viral_coefficient: 1.7 } },
{ id: 'mock-7', title: 'Reality TV Finale', subtitle: 'Who will win the season finale?', description: 'Predict the winner of your favorite reality TV show.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1e8f7b171-1778293283098.png", icon: '📺', pool_type: 'prediction', is_featured: false, is_official: false, launch_count: 987, participant_count: 5400, difficulty_score: 1, default_expiration: '14 days', resolution_rules: 'Official show announcement', default_options: [], category: { name: 'TV Shows', icon: '📺' }, resolution_source: null, analytics: { views: 4935, clones: 987, viral_coefficient: 1.6 } },
{ id: 'mock-8', title: '30-Day Fitness Challenge', subtitle: 'Who can hit their fitness goal first?', description: 'Group accountability challenge.', category_id: null, cover_image: "https://img.rocket.new/generatedImages/rocket_gen_img_1efac8663-1779462581166.png", icon: '💪', pool_type: 'challenge', is_featured: false, is_official: false, launch_count: 612, participant_count: 2800, difficulty_score: 2, default_expiration: '30 days', resolution_rules: 'Self-reported with group verification', default_options: [], category: { name: 'Personal Challenges', icon: '💪' }, resolution_source: null, analytics: { views: 3060, clones: 612, viral_coefficient: 1.5 } }];

const MOCK_CREATORS: SuggestedCreator[] = [
{ id: 'c1', display_name: 'PoolMaster Pro', tagline: 'Creating the best sports pools since 2023 🏆', is_verified: true, follower_count: 1247, public_pool_count: 34, creator_score: 94 },
{ id: 'c2', display_name: 'CryptoOracle', tagline: 'Crypto & finance prediction specialist 📈', is_verified: true, follower_count: 892, public_pool_count: 21, creator_score: 88 },
{ id: 'c3', display_name: 'SportsProphet', tagline: 'NFL, NBA, MLB — I call them all 🏈', is_verified: false, follower_count: 543, public_pool_count: 15, creator_score: 79 },
{ id: 'c4', display_name: 'TriviaKing', tagline: 'Pop culture & trivia pools every week 🎬', is_verified: false, follower_count: 321, public_pool_count: 28, creator_score: 72 }];

const SECTIONS = [
{ id: 'featured', label: 'Featured', icon: Star, color: '#FFD700' },
{ id: 'official', label: 'Official', icon: BadgeCheck, color: '#7C5CFF' },
{ id: 'trending', label: 'Trending', icon: TrendingUp, color: '#FF4D8D' },
{ id: 'creators', label: 'Creators', icon: Store, color: '#00C9A7' },
{ id: 'ai', label: 'AI Picks', icon: Sparkles, color: '#7C5CFF' },
{ id: 'fastest', label: 'Fastest Growing', icon: Flame, color: '#FF6B35' },
{ id: 'recent', label: 'Recent', icon: Clock, color: '#B8B4C8' }];

// Pool detail modal
function PoolDetailModal({ template, onUse, onClose }: {template: PoolTemplate;onUse: (t: PoolTemplate) => void;onClose: () => void;}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="overflow-y-auto flex-1 px-5 py-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'var(--elevated)' }}>
              {template.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">{template.title}</h3>
              {template.subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{template.subtitle}</p>}
            </div>
          </div>
          {template.description &&
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>{template.description}</p>
          }
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--elevated)' }}>
              <p className="text-base font-bold text-foreground">{template.launch_count.toLocaleString()}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Launches</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--elevated)' }}>
              <p className="text-base font-bold text-foreground">{template.participant_count.toLocaleString()}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Players</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--elevated)' }}>
              <p className="text-base font-bold text-foreground">{template.difficulty_score}/5</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Difficulty</p>
            </div>
          </div>
          {template.category &&
          <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(124,92,255,0.12)', color: 'var(--primary)' }}>
                {template.category.icon} {template.category.name}
              </span>
              {template.is_official &&
            <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: 'rgba(0,201,167,0.12)', color: '#00C9A7' }}>
                  <BadgeCheck size={10} /> Official
                </span>
            }
            </div>
          }
          {template.resolution_rules &&
          <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <p className="text-2xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>RESOLUTION RULES</p>
              <p className="text-xs text-foreground">{template.resolution_rules}</p>
            </div>
          }
        </div>
        <div className="px-5 pb-6 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => {onUse(template);onClose();}}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            
            Use This Pool Template
          </button>
        </div>
      </div>
    </div>);

}

function SeeAllModal({ title, templates, onUse, onClose }: {title: string;templates: PoolTemplate[];onUse: (t: PoolTemplate) => void;onClose: () => void;}) {
  const [detailTarget, setDetailTarget] = useState<PoolTemplate | null>(null);
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div
          className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
              <X size={14} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-4 pb-8">
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) =>
              <button key={t.id} onClick={() => setDetailTarget(t)} className="text-left">
                  <TemplateCard template={t} onUse={(tmpl) => {onUse(tmpl);onClose();}} compact />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {detailTarget &&
      <PoolDetailModal
        template={detailTarget}
        onUse={(t) => {onUse(t);onClose();}}
        onClose={() => setDetailTarget(null)} />

      }
    </>);

}

// AI Recommended Pools Modal
function AIRecommendedModal({ templates, userHistory, onUse, onClose }: {templates: PoolTemplate[];userHistory: any;onUse: (t: PoolTemplate) => void;onClose: () => void;}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '92dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}>
        
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C5CFF, #FF4D8D)' }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <h3 className="text-base font-bold text-foreground">AI Recommended Pools</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--elevated)' }}>
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 pb-8">
          <AIRecommendedPools templates={templates} userHistory={userHistory} onUse={(t) => {onUse(t);onClose();}} />
        </div>
      </div>
    </div>);

}

function CreatorCard({ creator, onView }: {creator: SuggestedCreator;onView: (id: string) => void;}) {
  const [following, setFollowing] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {toast.error('Sign in to follow creators');return;}
    setFollowing((f) => !f);
    try {
      if (following) {
        await supabase.from('creator_follows').delete().eq('follower_id', user.id).eq('creator_id', creator.id);
      } else {
        await supabase.from('creator_follows').insert({ follower_id: user.id, creator_id: creator.id });
      }
    } catch {
      setFollowing((f) => !f);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location?.origin}/creator-profile?id=${creator.id}`;
    if (navigator.share) {
      navigator.share({ title: `${creator.display_name} on PoolParty`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success('Link copied!');
    }
  };

  return (
    <button
      onClick={() => onView(creator.id)}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-98"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), #00C9A7)' }}>
          {creator.display_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-foreground truncate">{creator.display_name}</p>
            {creator.is_verified && <CheckCircle size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
          </div>
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>{creator.tagline}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{creator.follower_count.toLocaleString()} followers</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{creator.public_pool_count} pools</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleFollow}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{
            background: following ? 'var(--elevated)' : 'rgba(124,92,255,0.15)',
            color: following ? 'var(--muted-foreground)' : 'var(--primary)',
            border: following ? '1px solid var(--border)' : '1px solid rgba(124,92,255,0.3)'
          }}>
          <UserPlus size={12} className="inline mr-1" />
          {following ? 'Following' : 'Follow'}
        </button>
        <button
          onClick={handleShare}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          <Share2 size={14} style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>
    </button>);

}

export default function DiscoverPoolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [templates, setTemplates] = useState<PoolTemplate[]>(MOCK_TEMPLATES);
  const [creators, setCreators] = useState<SuggestedCreator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [cloneTarget, setCloneTarget] = useState<PoolTemplate | null>(null);
  const [seeAllTarget, setSeeAllTarget] = useState<{title: string;templates: PoolTemplate[];} | null>(null);
  const [poolDetailTarget, setPoolDetailTarget] = useState<PoolTemplate | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userHistory, setUserHistory] = useState<{createdCategories: string[];joinedCategories: string[];groupActivity: string[];}>({ createdCategories: [], joinedCategories: [], groupActivity: [] });

  const anyModalOpen = !!(cloneTarget || seeAllTarget || poolDetailTarget || showAIModal);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.
      from('pool_templates').
      select('*, category:pool_template_categories(name, icon), resolution_source:verified_resolution_sources(name), analytics:pool_template_analytics(views, clones, viral_coefficient)').
      eq('status', 'active').
      order('launch_count', { ascending: false }).
      limit(50);
      if (data && data.length > 0) setTemplates(data as PoolTemplate[]);
    } catch {/* fallback to mock */} finally {setIsLoading(false);}
  }, [supabase]);

  const fetchCreators = useCallback(async () => {
    try {
      const { data } = await supabase.
      from('creator_profiles').
      select('id, display_name, tagline, is_verified, follower_count, public_pool_count, creator_score').
      eq('is_public', true).
      order('creator_score', { ascending: false }).
      limit(8);
      if (data) setCreators(data as SuggestedCreator[]);
    } catch {/* fallback to mock */}
  }, [supabase]);

  const fetchUserHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data: createdPools } = await supabase.from('pools').select('category').eq('creator_id', user.id).limit(20);
      const { data: joinedEntries } = await supabase.from('pool_entries').select('pool:pool_id(category)').eq('user_id', user.id).limit(20);
      const { data: groupMemberships } = await supabase.from('group_members').select('group:group_id(name)').eq('user_id', user.id).limit(10);
      const createdCategories = [...new Set((createdPools ?? []).map((p: any) => p.category).filter(Boolean) as string[])];
      const joinedCategories = [...new Set((joinedEntries ?? []).map((e: any) => e.pool?.category).filter(Boolean) as string[])];
      const groupActivity = [...new Set((groupMemberships ?? []).map((m: any) => m.group?.name).filter(Boolean) as string[])];
      setUserHistory({ createdCategories, joinedCategories, groupActivity });
    } catch {/* keep default */}
  }, [supabase, user]);

  useEffect(() => {fetchTemplates();fetchCreators();}, [fetchTemplates, fetchCreators]);
  useEffect(() => {fetchUserHistory();}, [fetchUserHistory]);

  const filtered = templates.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
    t.title.toLowerCase().includes(q) ||
    (t.subtitle ?? '').toLowerCase().includes(q) ||
    (t.description ?? '').toLowerCase().includes(q) ||
    (t.category?.name ?? '').toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || t.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = filtered.filter((t) => t.is_featured);
  const official = filtered.filter((t) => t.is_official);
  const trending = [...filtered].sort((a, b) => b.launch_count - a.launch_count).slice(0, 8);
  const fastest = [...filtered].sort((a, b) => (b.analytics?.viral_coefficient ?? 0) - (a.analytics?.viral_coefficient ?? 0)).slice(0, 8);
  const recent = [...filtered].slice(0, 8);

  const handleUseTemplate = (template: PoolTemplate) => setCloneTarget(template);
  const handleViewCreator = (id: string) => router.push(`/creator-profile?id=${id}&from=discover`);

  function SectionRow({ title, items, sectionId }: {title: string;items: PoolTemplate[];sectionId: string;}) {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <button
            onClick={() => setSeeAllTarget({ title, templates: items })}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: 'var(--primary)' }}>
            
            See All <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
          {items.slice(0, 6).map((t) =>
          <button key={t.id} onClick={() => setPoolDetailTarget(t)} className="flex-shrink-0 w-44 text-left">
              <TemplateCard template={t} onUse={handleUseTemplate} compact />
            </button>
          )}
        </div>
      </div>);

  }

  return (
    <MobileLayout modalOpen={anyModalOpen}>
      <div className="flex flex-col min-h-full pb-28">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>Discover</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Pools, groups & creators</p>
            </div>
            <button
              onClick={() => setShowAIModal(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C5CFF, #FF4D8D)' }}>
              <Zap size={16} color="#fff" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search pools, groups, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)' }} />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} style={{ color: 'var(--muted-foreground)' }} /></button>}
          </div>
        </div>

        {/* Section Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{ background: !activeSection ? 'var(--primary)' : 'var(--surface)', color: !activeSection ? '#fff' : 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
            All
          </button>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(isActive ? null : s.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{ background: isActive ? s.color : 'var(--surface)', color: isActive ? '#fff' : 'var(--muted-foreground)', border: `1px solid ${isActive ? s.color : 'var(--border)'}` }}>
                <Icon size={11} />
                {s.label}
              </button>);

          })}
        </div>

        {/* Search results */}
        {searchQuery &&
        <div className="px-4 mb-4">
            <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            {filtered.length === 0 ?
          <div className="text-center py-8">
                <p className="text-sm font-semibold text-foreground">No pools found</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Try a different search term</p>
              </div> :

          <div className="grid grid-cols-2 gap-3">
                {filtered.slice(0, 12).map((t) =>
            <button key={t.id} onClick={() => setPoolDetailTarget(t)} className="text-left">
                    <TemplateCard template={t} onUse={handleUseTemplate} compact />
                  </button>
            )}
              </div>
          }
          </div>
        }

        {/* Main content (hidden when searching) */}
        {!searchQuery &&
        <>
            <CategoryBrowser onSelectCategory={setSelectedCategory} selectedCategory={selectedCategory} />

            {/* AI Recommended Section */}
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C5CFF, #FF4D8D)' }}>
                    <Sparkles size={13} color="#fff" />
                  </div>
                  <span className="text-sm font-bold text-foreground">AI Picks For You</span>
                </div>
                <button onClick={() => setShowAIModal(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  See All <ChevronRight size={12} />
                </button>
              </div>
              <AIRecommendedPools templates={templates} userHistory={userHistory} onUse={handleUseTemplate} />
            </div>

            <SectionRow title="Featured Pools" items={featured} sectionId="featured" />
            <SectionRow title="Official Pools" items={official} sectionId="official" />
            <SectionRow title="Trending Now" items={trending} sectionId="trending" />

            {/* Creators */}
            {(!activeSection || activeSection === 'creators') && creators.length === 0 && activeSection === 'creators' && (
              <div className="text-center py-12 px-4">
                <p className="text-sm font-semibold text-foreground">No creators yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Be the first — set up a Creator Profile from your profile page.</p>
              </div>
            )}
            {(!activeSection || activeSection === 'creators') && creators.length > 0 &&
          <div className="mb-6">
                <div className="flex items-center justify-between mb-3 px-4">
                  <h2 className="text-sm font-bold text-foreground">Top Creators</h2>
                  <button className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                    See All <ChevronRight size={12} />
                  </button>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
                  {creators.slice(0, 4).map((c) =>
              <div key={c.id} className="flex-shrink-0 w-64">
                      <CreatorCard creator={c} onView={handleViewCreator} />
                    </div>
              )}
                </div>
              </div>
          }

            <SectionRow title="Fastest Growing" items={fastest} sectionId="fastest" />
            <SectionRow title="Recently Added" items={recent} sectionId="recent" />
          </>
        }
      </div>

      {/* Modals */}
      {cloneTarget &&
      <PoolCloneFlow
        template={cloneTarget}
        onClose={() => setCloneTarget(null)}
        onLaunched={(poolId) => {setCloneTarget(null);toast.success('Pool created!');router.push(poolId ? `/contract-detail-screen?id=${poolId}` : '/discover-pools');}} />

      }
      {seeAllTarget &&
      <SeeAllModal
        title={seeAllTarget.title}
        templates={seeAllTarget.templates}
        onUse={handleUseTemplate}
        onClose={() => setSeeAllTarget(null)} />

      }
      {poolDetailTarget &&
      <PoolDetailModal
        template={poolDetailTarget}
        onUse={handleUseTemplate}
        onClose={() => setPoolDetailTarget(null)} />

      }
      {showAIModal &&
      <AIRecommendedModal
        templates={templates}
        userHistory={userHistory}
        onUse={handleUseTemplate}
        onClose={() => setShowAIModal(false)} />

      }
    </MobileLayout>);

}