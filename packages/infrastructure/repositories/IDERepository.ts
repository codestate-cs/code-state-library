import { IIDERepository } from '@codestate/core/domain/ports/IIDERepository';
import { IDE } from '@codestate/core/domain/models/IDE';
import { Result } from '@codestate/core/domain/models/Result';
import { platform } from 'os';

export class IDERepository implements IIDERepository {
  async getIDEDefinitions(): Promise<Result<IDE[]>> {
    const currentPlatform = platform();
    
    // Default IDE definitions
    const defaultIDEs: IDE[] = [
      {
        name: 'vscode',
        command: 'code',
        args: ['--new-window'],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'code',
        command: 'code',
        args: ['--new-window'],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'cursor',
        command: 'cursor',
        args: ['--new-window'],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'webstorm',
        command: 'webstorm',
        args: [],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'intellij',
        command: 'idea',
        args: [],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'sublime',
        command: 'subl',
        args: [],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'vim',
        command: 'vim',
        args: [],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      },
      {
        name: 'neovim',
        command: 'nvim',
        args: [],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      }
    ];

    // Filter IDEs for current platform
    const platformIDEs = defaultIDEs.filter(ide => 
      ide.supportedPlatforms.includes(currentPlatform)
    );

    return { ok: true, value: platformIDEs };
  }

  async saveIDEDefinitions(ides: IDE[]): Promise<Result<void>> {
    // For now, we use default definitions
    // In the future, this could save to a config file
    return { ok: true, value: undefined };
  }
} 