import { IIDEService } from '../../domain/ports/IIDEService';
import { IDEService } from './IDEService';
import { IDERepository } from '@codestate/infrastructure/repositories/IDERepository';
import { TerminalFacade } from '@codestate/infrastructure/services/Terminal/TerminalFacade';
import * as path from 'path';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';

export class IDEFacade implements IIDEService {
  private service: IDEService;

  constructor() {
    const repository = new IDERepository();
    const terminalService = new TerminalFacade();
    const logger =new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    this.service = new IDEService(repository, terminalService, logger);
  }

  async openIDE(ideName: string, projectRoot: string) {
    return this.service.openIDE(ideName, projectRoot);
  }

  async openFiles(request: any) {
    return this.service.openFiles(request);
  }

  async getAvailableIDEs() {
    return this.service.getAvailableIDEs();
  }

  async isIDEInstalled(ideName: string) {
    return this.service.isIDEInstalled(ideName);
  }
} 