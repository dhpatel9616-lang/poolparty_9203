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
  // Increment follower_count
  await supabase.rpc('increment_creator_followers', { creator_id: creatorId }).catch(() => {});
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

export async function fetchSettlementItems(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settlement_items')
    .select('*')
    .or(`payer_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function updateSettlementStatus(itemId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('settlement_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) throw error;
}

// ─── Contract Resolution with Payment Notifications ──────────────────────────

export interface PaymentMethod {
  id: string;
  type: string;
  handle: string;
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

  // Fetch winner's payment methods
  const { data: winnerProfile } = await supabase
    .from('user_profiles')
    .select('payment_methods, full_name')
    .eq('id', params.winnerId)
    .single();

  const winnerPaymentMethods: PaymentMethod[] = winnerProfile?.payment_methods ?? [];

  // Build notification body with payment methods
  const paymentMethodsText = winnerPaymentMethods.length > 0
    ? winnerPaymentMethods.map((m) => `${m.type}: ${m.handle}`).join(' · ')
    : 'Contact winner directly for payment details';

  const notificationBody = `Pay ${params.winnerName} via: ${paymentMethodsText}`;

  // Create settlement items and notifications for each loser
  const settlementInserts = params.loserIds.map((loserId) => ({
    pool_id: params.poolId,
    pool_title: params.poolTitle,
    payer_id: loserId,
    payer_name: params.loserNames[loserId] ?? '',
    receiver_id: params.winnerId,
    receiver_name: params.winnerName,
    amount_note: params.amountNote,
    return_amount: params.returnAmount,
    status: 'unpaid',
    winner_payment_methods: winnerPaymentMethods,
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

  // Insert settlement items
  if (settlementInserts.length > 0) {
    await supabase.from('settlement_items').insert(settlementInserts);
  }

  // Insert notifications for losers
  if (notificationInserts.length > 0) {
    await supabase.from('notifications').insert(notificationInserts);
  }

  // Notify winner about the resolution
  await supabase.from('notifications').insert({
    user_id: params.winnerId,
    type: 'contract_resolved',
    title: `You won — ${params.poolTitle}! 🏆`,
    body: `${params.loserIds.length} player${params.loserIds.length !== 1 ? 's' : ''} owe you. Track payments in the Payments tab.`,
    metadata: {
      pool_id: params.poolId,
      pool_title: params.poolTitle,
      loser_count: params.loserIds.length,
      amount: params.returnAmount,
    },
  });

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
  to_user_id: string;
  from_user_id: string;
  pool_id?: string;
  message?: string;
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

export async function respondToPoolInvite(poolId: string, accept: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (accept) {
    const { error } = await supabase
      .from('pool_participants')
      .insert({ pool_id: poolId, user_id: user.id });
    if (error) throw error;
  }

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('type', 'pool_invite')
    .eq('entity_id', poolId)
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
    .from('pool_participants')
    .insert({ pool_id: poolId, user_id: friendUserId, status: 'invited', invited_by: user.id });
  if (error) throw error;

  await supabase.from('notifications').insert({
    user_id: friendUserId,
    type: 'pool_invite',
    title: 'Pool Invite',
    body: 'You have been invited to join a pool.',
    entity_id: poolId,
  });
}