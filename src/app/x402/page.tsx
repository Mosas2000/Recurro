'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const X402Client = dynamic(() => import('./X402Client'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#888' }}>Loading…</p>
    </div>
  ),
});

export default function X402Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Patch window.StacksProvider before @stacks/connect modules evaluate.
    // Wallet extensions (Leather, Xverse) may have defined it as
    // non-configurable, which causes a fatal TypeError when @stacks/connect
    // tries to redefine it.
    import('@/lib/stacks/patch-provider')
      .then(({ patchStacksProvider }) => {
        patchStacksProvider();
      })
      .catch(() => { })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <X402Client />
    </ErrorBoundary>
  );
}
