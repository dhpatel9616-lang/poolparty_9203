import type { Metadata } from 'next';
import { createServerSideClient } from '@/lib/supabase/client';
import MobileLayout from '@/components/MobileLayout';

interface PoolSharePageProps {
  params: Promise<{ 'pool-id': string }>;
}

export async function generateMetadata(
  { params }: PoolSharePageProps
): Promise<Metadata> {
  const { 'pool-id': poolId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const supabase = createServerSideClient();
    const { data: pool } = await supabase
      .from('pools')
      .select('id, title, description, pool_type, participant_count, status, created_at')
      .eq('id', poolId)
      .single();

    if (!pool) {
      return {
        title: 'PoolParty — Join a Pool',
        description: 'Join a prediction pool on PoolParty and compete with friends.',
      };
    }

    const participantText = pool.participant_count === 1 ? 'player' : 'players';
    const ogTitle = `${pool.title} — PoolParty`;
    const ogDescription = `Join ${pool.participant_count} ${participantText} in this ${pool.pool_type} pool. Predict outcomes and build your reputation.`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        url: `${baseUrl}/share/${poolId}`,
        images: [
          {
            url: `${baseUrl}/api/og?type=pool&id=${poolId}&title=${encodeURIComponent(pool.title)}&players=${pool.participant_count}`,
            width: 1200,
            height: 630,
            alt: `${pool.title} pool preview`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [`${baseUrl}/api/og?type=pool&id=${poolId}&title=${encodeURIComponent(pool.title)}&players=${pool.participant_count}`],
      },
    };
  } catch (error) {
    return {
      title: 'PoolParty — Join a Pool',
      description: 'Join a prediction pool on PoolParty and compete with friends.',
    };
  }
}

export default function PoolSharePage() {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Pool Share</h1>
          <p className="text-sm text-muted-foreground">Redirecting to pool...</p>
        </div>
      </div>
    </MobileLayout>
  );
}