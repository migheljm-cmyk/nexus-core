'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SyncProps {
  investigationId: string;
}

export function InvestigationRealtimeSync({ investigationId }: SyncProps) {
  const router = useRouter();

  useEffect(() => {
    if (!investigationId) return;

    const channel = supabase
      .channel(`realtime_evidence_${investigationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evidence_vault',
          filter: `investigation_id=eq.${investigationId}`,
        },
        (payload) => {
          console.log('[REALTIME OSINT] Evento recibido en vivo:', payload);
          // Forzar la reobtención de datos en el Server Component
          window.dispatchEvent(new Event('focus'));
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME STATUS]:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [investigationId, router]);

  return null;
}