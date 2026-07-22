import { Suspense } from 'react';
import MobileLayout from '@/components/MobileLayout';
import ContractDetailView from './components/ContractDetailView';

export default function ContractDetailPage() {
  return (
    <MobileLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
          </div>
        }
      >
        <ContractDetailView />
      </Suspense>
    </MobileLayout>
  );
}