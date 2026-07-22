import type { Metadata } from 'next';
import { createServerSideClient } from '@/lib/supabase/client';
import MobileLayout from '@/components/MobileLayout';
import JoinGroupCard from './JoinGroupCard';

interface InvitePageProps {
  params: Promise<{ 'invite-code': string }>;
}

export async function generateMetadata(
  { params }: InvitePageProps
): Promise<Metadata> {
  const { 'invite-code': inviteCode } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const supabase = createServerSideClient();
    const { data: invite } = await supabase
      .from('group_invites')
      .select(`
        id,
        invite_code,
        status,
        created_at,
        group:group_id(
          id,
          name,
          emoji,
          description,
          member_count,
          active_pool_count
        )
      `)
      .eq('invite_code', inviteCode)
      .single();

    if (!invite) {
      return {
        title: 'PoolParty — Join a Group',
        description: 'Join a group on PoolParty and compete with friends.',
      };
    }

    const rawGroup = invite.group as any;
    const group = Array.isArray(rawGroup) ? rawGroup[0] : rawGroup;

    if (!group) {
      return {
        title: 'PoolParty — Join a Group',
        description: 'Join a group on PoolParty and compete with friends.',
      };
    }

    const memberText = group.member_count === 1 ? 'member' : 'members';
    const poolText = group.active_pool_count === 1 ? 'pool' : 'pools';
    const ogTitle = `Join ${group.name} ${group.emoji} — PoolParty`;
    const ogDescription = `${group.description || 'Join this group'} • ${group.member_count} ${memberText} • ${group.active_pool_count} active ${poolText}`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        url: `${baseUrl}/invite/${inviteCode}`,
        images: [
          {
            url: `${baseUrl}/api/og?type=invite&code=${inviteCode}&group=${encodeURIComponent(group.name)}&emoji=${group.emoji}&members=${group.member_count}`,
            width: 1200,
            height: 630,
            alt: `Join ${group.name} group on PoolParty`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [`${baseUrl}/api/og?type=invite&code=${inviteCode}&group=${encodeURIComponent(group.name)}&emoji=${group.emoji}&members=${group.member_count}`],
      },
    };
  } catch (error) {
    return {
      title: 'PoolParty — Join a Group',
      description: 'Join a group on PoolParty and compete with friends.',
    };
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { 'invite-code': inviteCode } = await params;
  const supabase = createServerSideClient();

  const { data: invite } = await supabase
    .from('group_invites')
    .select(`
      id,
      invite_code,
      status,
      expires_at,
      group:group_id(
        id,
        name,
        emoji,
        description,
        member_count
      )
    `)
    .eq('invite_code', inviteCode)
    .maybeSingle();

  const rawGroup = invite?.group as any;
  const group = Array.isArray(rawGroup) ? rawGroup[0] : rawGroup;

  const isExpired = invite?.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false;
  const inviteStatus = isExpired ? 'expired' : (invite?.status ?? null);

  return (
    <MobileLayout>
      <JoinGroupCard
        inviteCode={inviteCode}
        group={group ?? null}
        inviteStatus={inviteStatus}
      />
    </MobileLayout>
  );
}