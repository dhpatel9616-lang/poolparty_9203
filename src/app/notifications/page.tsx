'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Users, Trophy, Check, X } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  respondToGroupInvite,
  respondToPoolInvite,
  type AppNotification,
} from '@/lib/supabase/services';
import Icon from '@/components/ui/AppIcon';


function iconFor(type: AppNotification['type']) {
  if (type.startsWith('friend')) return UserPlus;
  if (type.startsWith('group')) return Users;
  return Trophy;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    markAllNotificationsRead().catch((err) => console.error(err));
  }, [load]);

  async function handleTap(n: AppNotification) {
    if (!n.read_at) {
      markNotificationRead(n.id).catch((err) => console.error(err));
    }
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      router.push('/friends-screen');
    } else if (n.type.startsWith('group')) {
      router.push('/groups-screen');
    } else if (n.type.startsWith('pool')) {
      router.push('/discover-pools');
    }
  }

  async function handleGroupInviteResponse(n: AppNotification, accept: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    if (!n.entity_id) return;
    setRespondingId(n.id);
    try {
      await respondToGroupInvite(n.entity_id, accept);
      await load();
    } catch (err) {
      console.error('Failed to respond to group invite', err);
    } finally {
      setRespondingId(null);
    }
  }

  async function handlePoolInviteResponse(n: AppNotification, accept: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    if (!n.entity_id) return;
    setRespondingId(n.id);
    try {
      await respondToPoolInvite(n.entity_id, accept);
      await load();
    } catch (err) {
      console.error('Failed to respond to pool invite', err);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <MobileLayout>
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={16} style={{ color: 'var(--foreground)' }} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-base font-semibold text-foreground">No notifications yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Friend requests and invites will show up here
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {notifications.map((n) => {
            const Icon = iconFor(n.type);
            const isPendingGroupInvite = n.type === 'group_invite';
            const isPendingPoolInvite = n.type === 'pool_invite';
            const isResponding = respondingId === n.id;

            return (
              <div
                key={n.id}
                onClick={() => handleTap(n)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                style={{ background: n.read_at ? 'transparent' : 'rgba(124,92,255,0.04)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <Icon size={15} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {n.body && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {n.body}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {timeAgo(n.created_at)}
                  </p>

                  {(isPendingGroupInvite || isPendingPoolInvite) && (
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={isResponding}
                        onClick={(e) =>
                          isPendingGroupInvite
                            ? handleGroupInviteResponse(n, true, e)
                            : handlePoolInviteResponse(n, true, e)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'var(--social)', color: '#fff' }}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        disabled={isResponding}
                        onClick={(e) =>
                          isPendingGroupInvite
                            ? handleGroupInviteResponse(n, false, e)
                            : handlePoolInviteResponse(n, false, e)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
                {!n.read_at && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ background: 'var(--social)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </MobileLayout>
  );
}
