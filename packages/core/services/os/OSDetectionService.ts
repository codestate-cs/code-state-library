import { platform } from 'os';
import { ILoggerService } from '../../domain/ports/ILoggerService';

export interface OSInfo {
  platform: string;
  isLinux: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  supportsTerminalTabs: boolean;
}

export interface IOSDetectionService {
  getOSInfo(): OSInfo;
  supportsTerminalTabs(): boolean;
}

export class OSDetectionService implements IOSDetectionService {
  constructor(private logger: ILoggerService) {}

  getOSInfo(): OSInfo {
    const currentPlatform = platform();
    
    const osInfo: OSInfo = {
      platform: currentPlatform,
      isLinux: currentPlatform === 'linux',
      isMacOS: currentPlatform === 'darwin',
      isWindows: currentPlatform === 'win32',
      supportsTerminalTabs: this.supportsTerminalTabs()
    };

    this.logger.debug('OS detection completed', { osInfo });
    return osInfo;
  }

  supportsTerminalTabs(): boolean {
    const currentPlatform = platform();
    
    // Only macOS reliably supports programmatic tab creation
    const supportsTabs = currentPlatform === 'darwin';
    
    this.logger.debug('Terminal tab support check', { 
      platform: currentPlatform, 
      supportsTabs 
    });
    
    return supportsTabs;
  }
}
