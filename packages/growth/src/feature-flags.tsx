import React, { createContext, useContext, ReactNode } from 'react';

export interface GrowthFlags {
  adsEnabled: boolean;
  founderBadgeActive: boolean;
  viralSharingEnabled: boolean;
}

const defaultFlags: GrowthFlags = {
  adsEnabled: false, // Desactivado por defecto para el Launch Beta
  founderBadgeActive: true,
  viralSharingEnabled: true,
};

const FeatureFlagsContext = createContext<GrowthFlags>(defaultFlags);

export const FeatureFlagsProvider = ({
  children,
  flags = defaultFlags,
}: {
  children: ReactNode;
  flags?: Partial<GrowthFlags>;
}) => {
  const mergedFlags = { ...defaultFlags, ...flags };
  return (
    <FeatureFlagsContext.Provider value={mergedFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): GrowthFlags => {
  return useContext(FeatureFlagsContext);
};