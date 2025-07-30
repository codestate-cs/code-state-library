import { IIDEService } from '../../domain/ports/IIDEService';
import { IIDERepository } from '../../domain/ports/IIDERepository';
import { ITerminalService } from '../../domain/ports/ITerminalService';
import { ILoggerService } from '../../domain/ports/ILoggerService';
import { IDE, FileOpenRequest } from '../../domain/models/IDE';
import { Result } from '../../domain/models/Result';
import { platform } from 'os';

export class IDEService implements IIDEService {
  constructor(
    private repository: IIDERepository,
    private terminalService: ITerminalService,
    private logger: ILoggerService
  ) {}

  async openIDE(ideName: string, projectRoot: string): Promise<Result<boolean>> {
    this.logger.debug('IDEService.openIDE called', { ideName, projectRoot });
    
    try {
      // Check if IDE is installed
      const isInstalledResult = await this.isIDEInstalled(ideName);
      if (!isInstalledResult.ok || !isInstalledResult.value) {
        this.logger.error('IDE is not installed', { ideName });
        return { ok: false, error: new Error(`IDE '${ideName}' is not installed`) };
      }

      // Get IDE definition
      const idesResult = await this.getAvailableIDEs();
      if (!idesResult.ok) {
        this.logger.error('Failed to get IDE definitions', { error: idesResult.error });
        return { ok: false, error: idesResult.error };
      }

      const ide = idesResult.value.find(i => i.name === ideName);
      if (!ide) {
        this.logger.error('IDE definition not found', { ideName });
        return { ok: false, error: new Error(`IDE definition for '${ideName}' not found`) };
      }

      // Check platform compatibility
      const currentPlatform = platform();
      if (!ide.supportedPlatforms.includes(currentPlatform)) {
        this.logger.error('IDE not supported on current platform', { ideName, currentPlatform });
        return { ok: false, error: new Error(`IDE '${ideName}' is not supported on ${currentPlatform}`) };
      }

      // Build command with project root
      const args = [...ide.args, projectRoot];
      const command = `${ide.command} ${args.join(' ')}`;

      // Execute IDE command
      const result = await this.terminalService.spawnTerminal(command, {
        cwd: projectRoot,
        timeout: 10000
      });

      if (!result.ok) {
        this.logger.error('Failed to open IDE', { error: result.error, ideName, command });
        return { ok: false, error: result.error };
      }

      this.logger.log('IDE opened successfully', { ideName, projectRoot });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to open IDE', { error, ideName, projectRoot });
      return { ok: false, error: error instanceof Error ? error : new Error('Failed to open IDE') };
    }
  }

  async openFiles(request: FileOpenRequest): Promise<Result<boolean>> {
    this.logger.debug('IDEService.openFiles called', { request });
    
    try {
      // Check if IDE is installed
      const isInstalledResult = await this.isIDEInstalled(request.ide);
      if (!isInstalledResult.ok || !isInstalledResult.value) {
        this.logger.error('IDE is not installed', { ide: request.ide });
        return { ok: false, error: new Error(`IDE '${request.ide}' is not installed`) };
      }

      // Get IDE definition
      const idesResult = await this.getAvailableIDEs();
      if (!idesResult.ok) {
        this.logger.error('Failed to get IDE definitions', { error: idesResult.error });
        return { ok: false, error: idesResult.error };
      }

      const ide = idesResult.value.find(i => i.name === request.ide);
      if (!ide) {
        this.logger.error('IDE definition not found', { ide: request.ide });
        return { ok: false, error: new Error(`IDE definition for '${request.ide}' not found`) };
      }

      // Build file opening command
      const fileArgs = request.files.map(file => {
        let fileArg = file.path;
        if (file.line && file.column) {
          fileArg += `:${file.line}:${file.column}`;
        } else if (file.line) {
          fileArg += `:${file.line}`;
        }
        return fileArg;
      });

      const args = [...ide.args, request.projectRoot, ...fileArgs];
      const command = `${ide.command} ${args.join(' ')}`;

      // Execute file opening command
      const result = await this.terminalService.spawnTerminal(command, {
        cwd: request.projectRoot,
        timeout: 10000
      });

      if (!result.ok) {
        this.logger.error('Failed to open files', { error: result.error, request, command });
        return { ok: false, error: result.error };
      }

      this.logger.log('Files opened successfully', { request });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to open files', { error, request });
      return { ok: false, error: error instanceof Error ? error : new Error('Failed to open files') };
    }
  }

  async getAvailableIDEs(): Promise<Result<IDE[]>> {
    this.logger.debug('IDEService.getAvailableIDEs called');
    
    try {
      const result = await this.repository.getIDEDefinitions();
      if (!result.ok) {
        this.logger.error('Failed to get IDE definitions', { error: result.error });
        return { ok: false, error: result.error };
      }

      this.logger.log('IDE definitions retrieved', { count: result.value.length });
      return { ok: true, value: result.value };
    } catch (error) {
      this.logger.error('Failed to get available IDEs', { error });
      return { ok: false, error: error instanceof Error ? error : new Error('Failed to get available IDEs') };
    }
  }

  async isIDEInstalled(ideName: string): Promise<Result<boolean>> {
    this.logger.debug('IDEService.isIDEInstalled called', { ideName });
    
    try {
      // Get IDE definition
      const idesResult = await this.getAvailableIDEs();
      if (!idesResult.ok) {
        return { ok: false, error: idesResult.error };
      }

      const ide = idesResult.value.find(i => i.name === ideName);
      if (!ide) {
        return { ok: true, value: false };
      }

      // Check if command is available
      const result = await this.terminalService.isCommandAvailable(ide.command);
      if (!result.ok) {
        this.logger.error('Failed to check IDE availability', { error: result.error, ideName });
        return { ok: false, error: result.error };
      }

      this.logger.log('IDE installation check completed', { ideName, isInstalled: result.value });
      return { ok: true, value: result.value };
    } catch (error) {
      this.logger.error('Failed to check IDE installation', { error, ideName });
      return { ok: false, error: error instanceof Error ? error : new Error('Failed to check IDE installation') };
    }
  }
} 