'use client';

import { createClient } from '@/lib/supabase/client';

// ─── User / Profile ───────────────────────────────────────────────────────────

export async function fetchCurrentUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function fetchAccountabilityScore(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('accountability_scores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function fetchUserBadges(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badge:seasonal_badges(badge_key, badge_name, badge_icon, badge_tier, badge_description)')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchReliabilityHistory(userId: string, limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reliability_history')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export async function fetchUserDisputes(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('disputes')
    .select('*, opener:opened_by(full_name), against:against_user_id(full_name)')
    .or(`opened_by.eq.${userId},against_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function createDispute(params: {
  title: string;
  description: string;
  opened_by: string;
  against_user_id?: string;
  pool_id?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('disputes')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addDisputeComment(params: {
  dispute_id: string;
  author_id: string;
  content: string;
  is_moderator_note?: boolean;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dispute_comments')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addDisputeVote(params: {
  dispute_id: string;
  voter_id: string;
  vote_for_opener: boolean;
  reasoning?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dispute_votes')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Seasonal Leaderboard ─────────────────────────────────────────────────────

export async function fetchActiveSeason() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('season_status', 'active')
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function fetchSeasonRankings(seasonId: string, limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('seasonal_rankings')
    .select('*, user:user_id(full_name, username, avatar_url)')
    .eq('season_id', seasonId)
    .order('rank_position', { ascending: true })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchSeasonBadges(seasonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('seasonal_badges')
    .select('*')
    .eq('season_id', seasonId);
  if (error) return [];
  return data ?? [];
}

// ─── Creator Profiles ─────────────────────────────────────────────────────────

export async function fetchCreatorProfiles(sortBy: 'creator_score' | 'follower_count' | 'public_pool_count' = 'creator_score', limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*, user:user_id(full_name, avatar_url)')
    .eq('is_public', true)
    .order(sortBy, { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function followCreator(followerId: string, creatorId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('creator_follows')
    .insert({ follower_id: followerId, creator_id: creatorId });
  if (error) throw error;
  // Increment follower_count (best-effort; don't fail the follow action if this errors)
  try {
    await supabase.rpc('increment_creator_followers', { creator_id: creatorId });
  } catch {
    // non-fatal
  }
}

export async function unfollowCreator(followerId: string, creatorId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('creator_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('creator_id', creatorId);
  if (error) throw error;
}

export async function fetchFollowedCreatorIds(followerId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('creator_follows')
    .select('creator_id')
    .eq('follower_id', followerId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.creator_id);
}

// ─── Pool Templates ───────────────────────────────────────────────────────────

export async function fetchPoolTemplates(params?: {
  categoryId?: string;
  isFeatured?: boolean;
  isOfficial?: boolean;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from('pool_templates')
    .select(`
      *,
      category:pool_template_categories(name, icon),
      resolution_source:verified_resolution_sources(name),
      analytics:pool_template_analytics(views, clones, viral_coefficient)
    `)
    .eq('status', 'active');

  if (params?.categoryId) query = query.eq('category_id', params.categoryId);
  if (params?.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);
  if (params?.isOfficial !== undefined) query = query.eq('is_official', params.isOfficial);

  query = query.order('launch_count', { ascending: false }).limit(params?.limit ?? 50);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function fetchTemplateCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pool_template_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function recordTemplateView(templateId: string, userId?: string) {
  const supabase = createClient();
  await supabase
    .from('pool_template_views')
    .insert({ template_id: templateId, user_id: userId ?? null });
}

export async function cloneTemplate(params: {
  template_id: string;
  user_id: string;
  title?: string;
  custom_rules?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pool_template_clones')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAIRecommendations(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ai_pool_recommendations')
    .select('*, template:pool_templates(*, category:pool_template_categories(name, icon))')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('score', { ascending: false })
    .limit(5);
  if (error) return [];
  return data ?? [];
}

// ─── Trust Graph ──────────────────────────────────────────────────────────────

export async function fetchTrustEdges(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trust_graph_edges')
    .select('*, to_user:to_user_id(full_name, avatar_url), from_user:from_user_id(full_name, avatar_url)')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('edge_weight', { ascending: false })
    .limit(50);
  if (error) return [];
  return data ?? [];
}

export async function fetchTrustClusters() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trust_clusters')
    .select('*')
    .order('avg_trust_score', { ascending: false });
  if (error) return [];
  return data ?? [];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(userId: string, limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function fetchActivities(limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

// ─── Settlement / Payments ────────────────────────────────────────────────────

// ─── Contract Participants (real pool_entries, not mock data) ─────────────────

export interface ContractParticipant {
  userId: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  trustScore: number;
  stakeAmount: number;
  outcomeId: string | null;
  outcomeLabel: string | null;
}

export async function fetchContractParticipants(poolId: string): Promise<ContractParticipant[]> {
  const supabase = createClient();

  const { data: entries, error } = await supabase
    .from('pool_entries')
    .select(`
      user_id,
      stake_amount,
      outcome_id,
      user:user_id ( full_name, username, avatar_url ),
      outcome:outcome_id ( label )
    `)
    .eq('pool_id', poolId);

  if (error) throw error;
  if (!entries || entries.length === 0) return [];

  const userIds = entries.map((e: any) => e.user_id);
  const { data: scores } = await supabase
    .from('accountability_scores')
    .select('user_id, accountability_score')
    .in('user_id', userIds);

  const scoreMap = new Map(
    (scores ?? []).map((s: any) => [s.user_id, Math.round(Number(s.accountability_score) * 10)])
  );

  return entries.map((e: any) => {
    const user = Array.isArray(e.user) ? e.user[0] : e.user;
    const outcome = Array.isArray(e.outcome) ? e.outcome[0] : e.outcome;
    return {
      userId: e.user_id,
      fullName: user?.full_name || 'Player',
      username: user?.username ?? null,
      avatarUrl: user?.avatar_url ?? null,
      trustScore: scoreMap.get(e.user_id) ?? 500,
      stakeAmount: Number(e.stake_amount) || 0,
      outcomeId: e.outcome_id,
      outcomeLabel: outcome?.label ?? null,
    };
  });
}

// ─── Group / All Contracts lists (real pools, not mock data) ──────────────────

export interface GroupContractSummary {
  id: string;
  title: string;
  status: string;
  icon: string;
  participant_count: number;
  entry_deadline: string | null;
  stake_note: string | null;
  created_at: string;
}

// Contracts belonging to one group — used by the group dashboard's contract list.
// Matches pools whose primary group_id is this group, OR whose group_ids array
// (multi-group sharing) includes this group.
// ─── Group Join Requests (real approval flow) ──────────────────────────────

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
}

// Called from the invite-link join flow when the group requires approval.
export async function requestToJoinGroup(groupId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_join_requests')
    .insert({ group_id: groupId, user_id: userId, status: 'pending' });
  if (error) throw error;
}

// For the group owner's admin view.
export async function fetchPendingJoinRequests(groupId: string): Promise<JoinRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_join_requests')
    .select('id, group_id, user_id, status, requested_at, user:user_id ( full_name, username, avatar_url )')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const u = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      id: r.id,
      group_id: r.group_id,
      user_id: r.user_id,
      status: r.status,
      requested_at: r.requested_at,
      fullName: u?.full_name || 'Someone',
      username: u?.username ?? null,
      avatarUrl: u?.avatar_url ?? null,
    };
  });
}

// Approving actually adds the person to the group via a DB trigger
// (regular group owners can't insert group_members for someone else
// directly under RLS — the trigger runs as SECURITY DEFINER).
export async function respondToJoinRequest(requestId: string, approve: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_join_requests')
    .update({ status: approve ? 'approved' : 'rejected', responded_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
}

export async function fetchGroupContracts(groupId: string): Promise<GroupContractSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pools')
    .select('id, title, status, icon, participant_count, entry_deadline, stake_note, created_at')
    .or(`group_id.eq.${groupId},group_ids.cs.{${groupId}}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export interface UserContractSummary {
  id: string;
  title: string;
  status: string;
  participant_count: number;
  stake_note: string | null;
  group_id: string | null;
  group_name: string;
  group_emoji: string;
}

// All contracts across every group the given user is a member of —
// used by the /contracts "All Contracts" list.
export async function fetchUserContracts(userId: string): Promise<UserContractSummary[]> {
  const supabase = createClient();

  const { data: memberships, error: memErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (memErr) throw memErr;

  const groupIds = (memberships ?? []).map((m: any) => m.group_id);
  if (groupIds.length === 0) return [];

  const { data: pools, error: poolsErr } = await supabase
    .from('pools')
    .select('id, title, status, participant_count, stake_note, group_id, group:group_id ( name, emoji )')
    .in('group_id', groupIds)
    .order('created_at', { ascending: false });
  if (poolsErr) throw poolsErr;

  return (pools ?? []).map((p: any) => {
    const group = Array.isArray(p.group) ? p.group[0] : p.group;
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      participant_count: p.participant_count,
      stake_note: p.stake_note,
      group_id: p.group_id,
      group_name: group?.name ?? 'Group',
      group_emoji: group?.emoji ?? '🏆',
    };
  });
}

export interface SettlementRecord {
  id: string;
  pool_id: string | null;
  payer_id: string;
  recipient_id: string;
  amount: number;
  settlement_status: 'pending' | 'claimed_paid' | 'confirmed_received' | 'disputed' | 'overdue' | 'cancelled';
  due_date: string | null;
  created_at: string;
  updated_at?: string;
}

// Fetches from the real `settlements` table (with reputation triggers,
// disputes, confirmations) — this is the system /settlement reads.
// `settlement_items` is the retired, earlier table and is no longer written to.
export async function fetchSettlements(userId: string): Promise<SettlementRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .or(`payer_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function updateSettlementStatus(settlementId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('settlements')
    .update({ settlement_status: status, updated_at: new Date().toISOString() })
    .eq('id', settlementId);
  if (error) throw error;
}

// ─── Contract Resolution with Payment Notifications ──────────────────────────

export interface PaymentMethod {
  id: string;
  method_type: string;
  username: string | null;
  payment_url: string | null;
}

export async function resolveContractWithPaymentNotifications(params: {
  poolId: string;
  poolTitle: string;
  winnerId: string;
  winnerName: string;
  loserIds: string[];
  loserNames: Record<string, string>;
  amountNote: string;
  returnAmount: number;
}) {
  const supabase = createClient();

  // Fetch winner's real payment methods (the payment_methods table — what
  // PaymentMethodsManager and /settlement actually read/write — not the
  // unused user_profiles.payment_methods JSONB column).
  const { data: methodsData } = await supabase
    .from('payment_methods')
    .select('id, method_type, username, payment_url')
    .eq('user_id', params.winnerId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const winnerPaymentMethods: PaymentMethod[] = methodsData ?? [];

  // Build notification body with payment methods
  const paymentMethodsText = winnerPaymentMethods.length > 0
    ? winnerPaymentMethods.map((m) => `${m.method_type}${m.username ? `: ${m.username}` : ''}`).join(' · ')
    : 'Contact winner directly for payment details';

  const notificationBody = `Pay ${params.winnerName} via: ${paymentMethodsText}`;

  // Each loser owes the winner via a real `settlements` row — this is what
  // /settlement reads, and what drives the reputation triggers on status change.
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const settlementInserts = params.loserIds.map((loserId) => ({
    pool_id: params.poolId,
    payer_id: loserId,
    recipient_id: params.winnerId,
    amount: params.returnAmount,
    settlement_status: 'pending',
    due_date: dueDate.toISOString(),
  }));

  const notificationInserts = params.loserIds.map((loserId) => ({
    user_id: loserId,
    type: 'settlement_created',
    title: `You owe ${params.winnerName} — ${params.poolTitle}`,
    body: notificationBody,
    metadata: {
      pool_id: params.poolId,
      pool_title: params.poolTitle,
      winner_id: params.winnerId,
      winner_name: params.winnerName,
      amount: params.returnAmount,
      amount_note: params.amountNote,
      payment_methods: winnerPaymentMethods,
    },
  }));

  // Insert settlements
  if (settlementInserts.length > 0) {
    const { error: settlementError } = await supabase.from('settlements').insert(settlementInserts);
    if (settlementError) throw settlementError;
  }

  // Insert notifications for losers
  if (notificationInserts.length > 0) {
    const { error: loserNotifError } = await supabase.from('notifications').insert(notificationInserts);
    if (loserNotifError) console.error('Failed to notify losers of settlement', loserNotifError);
  }

  // Notify winner about the resolution
  const { error: winnerNotifError } = await supabase.from('notifications').insert({
    user_id: params.winnerId,
    type: 'contract_resolved',
    title: `You won — ${params.poolTitle}! 🏆`,
    body: `${params.loserIds.length} player${params.loserIds.length !== 1 ? 's' : ''} owe you. Track it on the Settlement tab.`,
    metadata: {
      pool_id: params.poolId,
      pool_title: params.poolTitle,
      loser_count: params.loserIds.length,
      amount: params.returnAmount,
    },
  });
  if (winnerNotifError) console.error('Failed to notify winner of resolution', winnerNotifError);

  return { winnerPaymentMethods };
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function fetchAuditLogs(limit = 100) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user:user_id(full_name, username)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export async function fetchViralMetrics(limit = 30) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('viral_metrics')
    .select('*')
    .order('period_date', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchTrustAnalytics(limit = 30) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trust_analytics')
    .select('*')
    .order('period_date', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchRetentionCohorts(limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('retention_cohorts')
    .select('*')
    .order('cohort_week', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchEngagementScores(limit = 50) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('engagement_scores')
    .select('*, user:user_id(full_name, username)')
    .order('engagement_score', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchTemplateAnalytics(limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pool_template_analytics')
    .select('*, template:pool_templates(title, icon, is_featured, is_official)')
    .order('clones', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

// ─── Social Endorsements ──────────────────────────────────────────────────────

export async function fetchEndorsements(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('social_endorsements')
    .select('*, endorser:endorser_id(full_name, avatar_url)')
    .eq('endorsed_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function createEndorsement(params: {
  endorser_id: string;
  endorsed_id: string;
  category?: string;
  note?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('social_endorsements')
    .insert(params)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Invite Link Edge Function ────────────────────────────────────────────────

export async function generateInviteLink(params: {
  group_id?: string;
  template_id?: string;
  created_by: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('invite-link', {
    body: params,
  });
  if (error) throw error;
  return data as { invite_code: string; invite_url: string };
}

// ─── Send Nudge Edge Function ─────────────────────────────────────────────────

export async function sendNudge(params: {
  settlement_id: string;
  nudge_type?: 'payment_reminder' | 'payment_confirmation';
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('send-nudge', {
    body: params,
  });
  if (error) throw error;
  return data;
}

// ─── Friends ───────────────────────────────────────────────────────────────────

export interface FriendProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: FriendProfile;
  addressee?: FriendProfile;
}

// Search users by name or username, for adding as a friend. Excludes yourself
// and anyone you already have a pending/accepted relationship with.
export async function searchUsers(query: string, currentUserId: string) {
  const supabase = createClient();
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, username, avatar_url')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
    .neq('id', currentUserId)
    .limit(20);
  if (error) return [];
  return (data ?? []) as FriendProfile[];
}

// All accepted friends for a user
export async function fetchFriends(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:requester_id(id, full_name, username, avatar_url), addressee:addressee_id(id, full_name, username, avatar_url)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) return [];
  // Normalize so each row exposes "the other person" regardless of who sent the original request
  return (data ?? []).map((f: any) => {
    const requester = Array.isArray(f.requester) ? f.requester[0] : f.requester;
    const addressee = Array.isArray(f.addressee) ? f.addressee[0] : f.addressee;
    const friend = f.requester_id === userId ? addressee : requester;
    return { friendshipId: f.id, friend: friend as FriendProfile };
  });
}

// Pending requests sent TO this user (need their response)
export async function fetchIncomingRequests(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:requester_id(id, full_name, username, avatar_url)')
    .eq('status', 'pending')
    .eq('addressee_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((f: any) => ({
    friendshipId: f.id,
    requester: (Array.isArray(f.requester) ? f.requester[0] : f.requester) as FriendProfile,
    createdAt: f.created_at,
  }));
}

// Requests this user sent that are still awaiting a response
export async function fetchOutgoingRequests(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, addressee:addressee_id(id, full_name, username, avatar_url)')
    .eq('status', 'pending')
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((f: any) => ({
    friendshipId: f.id,
    addressee: (Array.isArray(f.addressee) ? f.addressee[0] : f.addressee) as FriendProfile,
    createdAt: f.created_at,
  }));
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
  if (error) throw error;
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriend(friendshipId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function cancelFriendRequest(friendshipId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

// Generate a shareable friend-invite link
export async function generateFriendInviteLink(inviterId: string) {
  const supabase = createClient();
  const inviteCode = `f_${inviterId.slice(0, 8)}_${Date.now().toString(36)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const { error } = await supabase.from('friend_invites').insert({
    inviter_id: inviterId,
    invite_code: inviteCode,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw error;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return { invite_code: inviteCode, invite_url: `${siteUrl}/friend-invite/${inviteCode}` };
}

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  actor?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, user_id, actor_id, type, entity_type, entity_id,
      title, body, read_at, created_at,
      actor:actor_id ( id, full_name, username, avatar_url )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((n: any) => ({
    ...n,
    actor: Array.isArray(n.actor) ? n.actor[0] ?? null : n.actor ?? null,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) throw error;
}

export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: AppNotification) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert(payload.new as AppNotification)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function respondToGroupInvite(groupId: string, accept: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (accept) {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id, role: 'member' });
    if (error) throw error;
  }

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('type', 'group_invite')
    .eq('entity_id', groupId)
    .is('read_at', null);
}

export async function respondToPoolInvite(inviteId: string, accept: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // inviteId here is the pool_invites row id (that's what entity_id points
  // to on a pool_invite notification) — not the pool's own id. Accepting
  // just marks the invite responded to; actually joining the pool (picking
  // an outcome + stake) still happens through the normal entry flow, since
  // pool_entries requires that data and an invite doesn't carry it.
  const { error } = await supabase
    .from('pool_invites')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', inviteId);
  if (error) throw error;

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('type', 'pool_invite')
    .eq('entity_id', inviteId)
    .is('read_at', null);
}

export type NotificationType = string;

// ─── Friends Picker ────────────────────────────────────────────────────────────

export interface FriendOption {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export async function getFriendsForPicker(excludeUserIds: string[] = []): Promise<FriendOption[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, requester:requester_id(id, full_name, username, avatar_url), addressee:addressee_id(id, full_name, username, avatar_url)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) throw error;

  const friends: FriendOption[] = (data || []).map((row: any) => {
    const friend = row.requester_id === user.id ? row.addressee : row.requester;
    return {
      id: friend.id,
      full_name: friend.full_name ?? null,
      username: friend.username ?? null,
      avatar_url: friend.avatar_url ?? null,
    };
  }).filter((f: FriendOption) => !excludeUserIds.includes(f.id));

  return friends;
}

export async function inviteFriendToGroup(groupId: string, friendUserId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: friendUserId, role: 'member', status: 'invited', invited_by: user.id });
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: friendUserId,
    type: 'group_invite',
    title: 'Group Invite',
    body: 'You have been invited to join a group.',
    entity_id: groupId,
  });
}

export async function invitePoolFriend(poolId: string, friendUserId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('pool_invites')
    .insert({ pool_id: poolId, inviter_id: user.id, invitee_id: friendUserId, status: 'pending' });
  if (error) throw error;

  // No manual notification insert needed — trg_notify_pool_invite already
  // fires on this insert and creates it automatically.
}