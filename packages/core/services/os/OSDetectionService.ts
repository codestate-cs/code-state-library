import { platform } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ILoggerService } from '../../domain/ports/ILoggerService';

const execAsync = promisify(exec);

export interface OSInfo {
  platform: string;
  isLinux: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  supportsTerminalTabs: boolean;
}

export interface IOSDetectionService {
  getOSInfo(): Promise<OSInfo>;
  supportsTerminalTabs(): Promise<boolean>;
  isWindowsTerminalAvailable(): Promise<boolean>;
}

export class OSDetectionService implements IOSDetectionService {
  constructor(private logger: ILoggerService) {}

  async getOSInfo(): Promise<OSInfo> {
    const currentPlatform = platform();
    const supportsTabs = await this.supportsTerminalTabs();
    
    const osInfo: OSInfo = {
      platform: currentPlatform,
      isLinux: currentPlatform === 'linux',
      isMacOS: currentPlatform === 'darwin',
      isWindows: currentPlatform === 'win32',
      supportsTerminalTabs: supportsTabs
    };

    this.logger.debug('OS detection completed', { osInfo });
    return osInfo;
  }

  async supportsTerminalTabs(): Promise<boolean> {
    const currentPlatform = platform();
    
    if (currentPlatform === 'darwin') {
      // macOS reliably supports programmatic tab creation
      this.logger.debug('Terminal tab support check', { 
        platform: currentPlatform, 
        supportsTabs: true,
        reason: 'macOS native support'
      });
      return true;
    }
    
    if (currentPlatform === 'win32') {
      // Check if Windows Terminal (wt) is available
      const wtAvailable = await this.isWindowsTerminalAvailable();
      this.logger.debug('Terminal tab support check', { 
        platform: currentPlatform, 
        supportsTabs: wtAvailable,
        reason: wtAvailable ? 'Windows Terminal (wt) available' : 'Windows Terminal (wt) not available'
      });
      return wtAvailable;
    }
    
    // Linux and other platforms don't reliably support programmatic tab creation
    this.logger.debug('Terminal tab support check', { 
      platform: currentPlatform, 
      supportsTabs: false,
      reason: 'Platform does not support programmatic tab creation'
    });
    return false;
  }

  async isWindowsTerminalAvailable(): Promise<boolean> {
    try {
      // Check if 'wt' command is available
      await execAsync('wt --version');
      this.logger.debug('Windows Terminal (wt) is available');
      return true;
    } catch (error) {
      this.logger.debug('Windows Terminal (wt) is not available', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}
