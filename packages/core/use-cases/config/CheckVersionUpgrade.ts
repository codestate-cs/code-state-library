import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Result } from '@codestate/core/domain/models/Result';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';
import { ResetAll } from './ResetAll';
import { ConfigurableLogger } from '@codestate/core';
import { getDefaultConfig } from './utils';

export interface VersionInfo {
  currentVersion: string;
  storedVersion: string;
  requiresReset: boolean;
  isUpgrade: boolean;
}

export class CheckVersionUpgrade {
  private configService: IConfigService;
  private logger: ConfigurableLogger;
  private readonly MINIMUM_RESET_VERSION = '1.4.5';
  private readonly CURRENT_VERSION = process.env.PACKAGE_VERSION || process.env.npm_package_version || '1.4.7';

  constructor(configService?: IConfigService) {
    this.configService = configService || new ConfigFacade();
    this.logger = new ConfigurableLogger();
  }

  async execute(): Promise<Result<VersionInfo>> {
    try {
      // Get current config
      const configResult = await this.configService.getConfig();
      if (!configResult.ok) {
        // No config exists, this is a fresh install
        return {
          ok: true,
          value: {
            currentVersion: this.CURRENT_VERSION,
            storedVersion: '0.0.0',
            requiresReset: false,
            isUpgrade: false
          }
        };
      }

      const config = configResult.value;
      const storedVersion = config.version || '0.0.0';
      
      // Check if this is an upgrade that requires reset
      const requiresReset = this.shouldRequireReset(storedVersion);
      const isUpgrade = this.isVersionUpgrade(storedVersion);

      const versionInfo: VersionInfo = {
        currentVersion: this.CURRENT_VERSION,
        storedVersion,
        requiresReset,
        isUpgrade
      };

      // If reset is required, perform it automatically
      if (requiresReset) {
        this.logger.plainLog(`🔄 Version upgrade detected: ${storedVersion} → ${this.CURRENT_VERSION}`);
        this.logger.plainLog("⚠️  This version requires a complete reset due to breaking changes.");
        this.logger.plainLog("🔄 Performing automatic reset...");
        
        const resetAll = new ResetAll();
        const resetResult = await resetAll.execute({ all: true });
        
        if (resetResult.ok) {
          this.logger.plainLog("✅ Automatic reset completed successfully!");
          
          // Update config with new version
          await this.configService.updateConfig({
            version: this.CURRENT_VERSION
          });
          
          this.logger.plainLog("✅ Configuration updated to new version!");
        } else {
          this.logger.error("❌ Automatic reset failed", { error: resetResult.error });
          return {
            ok: false,
            error: new Error(`Failed to perform automatic reset: ${resetResult.error}`)
          };
        }
      } else if (isUpgrade) {
        // Regular upgrade, just update version
        this.logger.plainLog(`🔄 Version upgrade detected: ${storedVersion} → ${this.CURRENT_VERSION}`);
        await this.configService.updateConfig({
          version: this.CURRENT_VERSION
        });
        this.logger.plainLog("✅ Configuration updated to new version!");
      }

      return { ok: true, value: versionInfo };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error during version check')
      };
    }
  }

  private shouldRequireReset(storedVersion: string): boolean {
    // Parse version strings and compare
    const stored = this.parseVersion(storedVersion);
    const minimum = this.parseVersion(this.MINIMUM_RESET_VERSION);
    
    // Only require reset if upgrading FROM 1.4.5 or below TO 1.4.6 or above
    // This means stored version must be <= 1.4.5
    return this.compareVersions(stored, minimum) <= 0;
  }

  private isVersionUpgrade(storedVersion: string): boolean {
    const stored = this.parseVersion(storedVersion);
    const current = this.parseVersion(this.CURRENT_VERSION);
    
    return this.compareVersions(stored, current) < 0;
  }

  private parseVersion(version: string): number[] {
    return version.split('.').map(part => parseInt(part, 10) || 0);
  }

  private compareVersions(version1: number[], version2: number[]): number {
    const maxLength = Math.max(version1.length, version2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1 = version1[i] || 0;
      const v2 = version2[i] || 0;
      
      if (v1 < v2) return -1;
      if (v1 > v2) return 1;
    }
    
    return 0;
  }
} 