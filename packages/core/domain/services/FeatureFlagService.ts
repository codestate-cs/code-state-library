import { FeatureFlags, defaultFeatureFlags } from '../types/FeatureFlags';
import * as fs from 'fs';

export class FeatureFlagService {
  private flags: FeatureFlags;

  constructor(configPath?: string) {
    // 1. Load from config file if provided
    let fileFlags: Partial<FeatureFlags> = {};
    if (configPath && fs.existsSync(configPath)) {
      try {
        fileFlags = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {}
    }
    // 2. Load from environment variables (e.g., FEATURE_EXPERIMENTAL_TUI=false)
    const envFlags: Partial<FeatureFlags> = {};
    for (const key of Object.keys(defaultFeatureFlags)) {
      const envKey = 'FEATURE_' + key.replace(/([A-Z])/g, '_$1').toUpperCase();
      if (process.env[envKey] !== undefined) {
        envFlags[key as keyof FeatureFlags] = process.env[envKey] === 'true';
      }
    }
    // 3. Merge: env > file > default
    this.flags = { ...defaultFeatureFlags, ...fileFlags, ...envFlags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.flags[flag];
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }
} 