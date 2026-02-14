'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import {
  connectWallet,
  disconnectWallet,
  getWalletConnection,
} from '@/lib/stacks/wallet';
import { WalletConnection } from '@/types/wallet';

interface WalletConnectProps {
  /** Called after a successful connect or disconnect so parent can re-render */
  onConnectionChange?: (connection: WalletConnection | null) => void;
}

export function WalletConnect({ onConnectionChange }: WalletConnectProps) {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const existing = getWalletConnection();
    if (existing) {
      setConnection(existing);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const conn = await connectWallet();
      setConnection(conn);
      onConnectionChange?.(conn);
    } catch (err: any) {
      const msg =
        err?.message ??
        'Failed to connect wallet. Make sure Leather or Xverse is installed.';
      setError(msg);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [onConnectionChange]);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
    setConnection(null);
    onConnectionChange?.(null);
  }, [onConnectionChange]);

  const truncate = (addr: string) =>
    `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  if (connection?.connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-muted-foreground">
          {truncate(connection.address)}
        </span>
        <Button onClick={handleDisconnect} variant="outline" size="sm">
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
      {error && (
        <p className="text-xs text-red-500 max-w-[260px] text-right">{error}</p>
      )}
    </div>
  );
}
