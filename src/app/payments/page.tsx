'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /payments has been retired in favor of /settlement, which is the more
// complete settlement system (two-sided confirmation, disputes, proof
// upload, reputation tracking) backed by the `settlements` table. This
// redirect exists so any old links, bookmarks, or cached routes still land
// somewhere useful instead of a 404 or a dead screen with no data.
export default function PaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settlement');
  }, [router]);

  return null;
}
