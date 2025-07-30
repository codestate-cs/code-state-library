// All feature flags for CodeState
export type FeatureFlags = {
  experimentalTui: boolean;
  experimentalIde: boolean;
  advancedSearch: boolean;
  cloudSync: boolean;
  // Add more flags as needed
};

export const defaultFeatureFlags: FeatureFlags = {
  experimentalTui: true,
  experimentalIde: false,
  advancedSearch: false,
  cloudSync: false,
}; 