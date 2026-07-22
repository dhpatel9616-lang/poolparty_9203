'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null };
}

interface ChatPanelProps {
  groupId?: string;
  poolId?: string;
}

function timeLabel(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatPanel({ groupId, poolId }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scopeColumn = groupId ? 'group_id' : 'pool_id';
  const scopeValue = groupId || poolId;

  const loadMessages = useCallback(async () => {
    if (!scopeValue) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, sender:sender_id(full_name, avatar_url)')
      .eq(scopeColumn, scopeValue)
      .order('created_at', { ascending: true })
      .limit(200);
    if (!error && data) {
      setMessages(
        data.map((m: any) => ({
          ...m,
          sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
        }))
      );
    }
    setLoading(false);
  }, [scopeColumn, scopeValue]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription for new messages in this scope
  useEffect(() => {
    if (!scopeValue) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages_${scopeColumn}_${scopeValue}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${scopeColumn}=eq.${scopeValue}`,
        },
        async (payload) => {
          const row = payload.new as any;
          // Fetch sender info for the new row since realtime payloads don't include joins
          const { data: senderData } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', row.sender_id)
            .maybeSingle();
          setMessages((prev) => [...prev, { ...row, sender: senderData }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scopeColumn, scopeValue]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !user?.id || !scopeValue) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from('messages').insert({
      [scopeColumn]: scopeValue,
      sender_id: user.id,
      content: text.trim(),
    });
    if (error) {
      toast.error('Failed to send message');
    } else {
      setText('');
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3">
        {loading ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>Loading chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No messages yet — say hi!</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-xs font-semibold mb-0.5 px-1" style={{ color: 'var(--muted-foreground)' }}>
                      {m.sender?.full_name || 'Unknown'}
                    </span>
                  )}
                  <div
                    className="rounded-2xl px-3.5 py-2 text-sm"
                    style={{
                      background: isMe ? 'var(--primary)' : 'var(--elevated)',
                      color: isMe ? '#fff' : 'var(--foreground)',
                    }}
                  >
                    {m.content}
                  </div>
                  <span className="text-xs mt-0.5 px-1" style={{ color: 'var(--muted-foreground)' }}>
                    {timeLabel(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex items-center gap-2 pt-2 mt-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: sending || !text.trim() ? 'var(--muted)' : 'var(--primary)', opacity: sending || !text.trim() ? 0.5 : 1 }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}
