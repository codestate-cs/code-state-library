import { OSInfo, OSDetectionService } from '../../services/os/OSDetectionService';
import { ILoggerService } from '../../domain/ports/ILoggerService';
import { Result } from '../../domain/models/Result';

export class GetOSInfo {
  private osDetectionService: OSDetectionService;
  
  constructor(logger?: ILoggerService) {
    // Create a simple logger if none provided
    const _logger = logger || {
      debug: () => {},
      log: () => {},
      error: () => {},
      warn: () => {},
      plainLog: () => {}
    };
    this.osDetectionService = new OSDetectionService(_logger);
  }
  
  async execute(): Promise<Result<OSInfo>> {
    try {
      const osInfo = this.osDetectionService.getOSInfo();
      return { ok: true, value: osInfo };
    } catch (error) {
      return { 
        ok: false, 
        error: error instanceof Error ? error : new Error('Failed to detect OS information')
      };
    }
  }
}
