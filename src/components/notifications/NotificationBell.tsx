'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUnreadNotificationCount, subscribeToNotifications } from '@/lib/supabase/services';

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to load notification count', err);
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        unsubscribe = subscribeToNotifications(data.user.id, () => {
          setUnreadCount((c) => c + 1);
        });
      }
    }

    init();
    return () => unsubscribe?.();
  }, []);

  return (
    <button
      onClick={() => router.push('/notifications')}
      className="relative w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      aria-label="Notifications"
    >
      <Bell size={16} style={{ color: 'var(--foreground)' }} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: 'var(--social)', color: '#fff' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
