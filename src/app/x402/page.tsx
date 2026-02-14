'use client';

import dynamic from 'next/dynamic';

const X402Client = dynamic(() => import('./X402Client'), {
  ssr: false,
});

export default function X402Page() {
  return <X402Client />;
}
