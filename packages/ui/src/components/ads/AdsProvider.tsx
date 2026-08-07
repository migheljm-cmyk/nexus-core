// packages/ui/src/components/ads/AdsProvider.tsx
import React, { createContext, useContext } from 'react';

interface AdsContextProps {
  enabled: boolean;
  provider: string;
}

const AdsContext = createContext<AdsContextProps>({ enabled: false, provider: 'none' });

export const NexusAdsProvider: React.FC<{ enabled: boolean; provider: string; children: React.ReactNode }> = ({
  enabled,
  provider,
  children,
}) => (
  <AdsContext.Provider value={{ enabled, provider }}>
    {children}
  </AdsContext.Provider>
);

export const useAds = () => useContext(AdsContext);

// Componentes desacoplados
export const AdBanner: React.FC<{ slotId?: string }> = ({ slotId }) => {
  const { enabled } = useAds();
  if (!enabled) return null;
  return (
    <div className="w-full h-16 bg-white/5 border border-dashed border-white/20 rounded flex items-center justify-center text-xs text-slate-400 my-4">
      [Ad Space: Banner - {slotId || 'Default'}]
    </div>
  );
};