import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Session } from '@codestate/core/domain/models/Session';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';
import { OpenIDE } from '@codestate/core/use-cases/ide/OpenIDE';
import { OpenFiles } from '@codestate/core/use-cases/ide/OpenFiles';
import { ExecuteTerminalCollection } from '@codestate/core/use-cases/terminals/ExecuteTerminalCollection';
import { ResumeScript } from '@codestate/core/use-cases/scripts/ResumeScript';
import { GetConfig } from '@codestate/core/use-cases/config/GetConfig';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { ConfigurableLogger } from '@codestate/core/infrastructure/services/ConfigurableLogger/ConfigurableLogger';

export class ResumeSession {
  private sessionService: ISessionService;
  private logger: ILoggerService;
  
  constructor(sessionService?: ISessionService, logger?: ILoggerService) {
    this.sessionService = sessionService || new SessionFacade();
    this.logger = logger || new ConfigurableLogger({
      level: 'LOG',
      sinks: ['console']
    });
  }
  
  async execute(idOrName: string): Promise<Result<Session>> {
    // Load session
    const sessionResult = await this.sessionService.resumeSession(idOrName);
    if (!sessionResult.ok) {
      return sessionResult;
    }

    const session = sessionResult.value;
    this.logger.plainLog(`\n📋 Resuming session: "${session.name}"`);

    // 1. Open IDE and files
    const getConfig = new GetConfig();
    const configResult = await getConfig.execute();
    if (configResult.ok && configResult.value.ide) {
      const configuredIDE = configResult.value.ide;

      // Open IDE with project
      const openIDE = new OpenIDE();
      const ideResult = await openIDE.execute(
        configuredIDE,
        session.projectRoot
      );

      if (ideResult.ok) {
        this.logger.log(`IDE '${configuredIDE}' opened successfully`);

        // Open files if session has files (Sort by position)
        if (session.files && session.files.length > 0) {
          const openFiles = new OpenFiles();
          
          // Sort files by position if available, otherwise keep original order
          const sortedFiles = [...session.files].sort((a, b) => {
            const posA = (a as any).position ?? Number.MAX_SAFE_INTEGER;
            const posB = (b as any).position ?? Number.MAX_SAFE_INTEGER;
            return posA - posB;
          });

          const filesResult = await openFiles.execute({
            ide: configuredIDE,
            projectRoot: session.projectRoot,
            files: sortedFiles.map((file) => ({
              path: file.path,
              line: file.cursor?.line,
              column: file.cursor?.column,
              isActive: file.isActive,
            })),
          });

          if (filesResult.ok) {
            this.logger.plainLog(`Opened ${sortedFiles.length} files in correct order`);
          } else {
            this.logger.error("Failed to open files in IDE");
          }
        } else {
          this.logger.warn("No files to open from session");
        }
      } else {
        this.logger.error(`Failed to open IDE '${configuredIDE}'`);
        this.logger.warn("Continuing without IDE...");
      }
    } else {
      this.logger.warn("No IDE configured. Files will not be opened automatically.");
    }

    // 2. Execute terminal collections if any
    if (session.terminalCollections && session.terminalCollections.length > 0) {
      this.logger.plainLog(`\n🚀 Executing ${session.terminalCollections.length} terminal collection(s):`);

      for (const collectionId of session.terminalCollections) {
        try {
          const executeTerminalCollection = new ExecuteTerminalCollection();
          const executeResult = await executeTerminalCollection.execute(collectionId);
          
          if (executeResult.ok) {
            this.logger.plainLog(`Terminal collection executed successfully`);
          } else {
            this.logger.error(`Failed to execute terminal collection`);
          }
        } catch (error) {
          this.logger.error(`Error executing terminal collection`);
        }
      }
    } else {
      this.logger.plainLog("No terminal collections to execute.");
    }

    // 3. Execute individual scripts if any
    if (session.scripts && session.scripts.length > 0) {
      this.logger.plainLog(`\n📜 Executing ${session.scripts.length} individual script(s):`);
      
      for (const scriptName of session.scripts) {
        try {
          const resumeScript = new ResumeScript();
          const executeResult = await resumeScript.execute(scriptName);
          
          if (executeResult.ok) {
            this.logger.plainLog(`Script executed successfully`);
          } else {
            this.logger.error(`Failed to execute script`);
          }
        } catch (error) {
          this.logger.error(`Error executing script`);
        }
      }
    } else {
      this.logger.plainLog("No individual scripts to execute.");
    }

    this.logger.log(`Session "${session.name}" resumed successfully!`);
    if (session.notes) {
      this.logger.plainLog(`\n📝 Notes: ${session.notes}`);
    }
    if (session.tags.length > 0) {
      this.logger.plainLog(`🏷️  Tags: ${session.tags.join(", ")}`);
    }

    return { ok: true, value: session };
  }
} 