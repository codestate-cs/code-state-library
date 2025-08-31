import inquirer from '../../utils/inquirer';
import { importSessionsCommand } from '../../commands/session/importSessions';
import { ConfigurableLogger, ImportSessionOptions } from '@codestate/core';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function importSessionsTui(): Promise<void> {
  const logger = new ConfigurableLogger();
  
  console.log('📥 Session Import Wizard\n');
  
  try {
    // Step 1: Choose input method
    const inputMethodAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'list',
        name: 'inputMethod',
        message: 'How would you like to import sessions?',
        choices: [
          { name: '📁 Select from Downloads folder', value: 'downloads' },
          { name: '📂 Custom file path', value: 'custom' },
          { name: '📋 Paste JSON content', value: 'paste' }
        ]
      }
    ]);

    let filePath: string = '';
    let fileContent: string = '';

    switch (inputMethodAnswer.inputMethod) {
      case 'downloads':
        filePath = await selectFromDownloads();
        break;
      case 'custom':
        filePath = await getCustomFilePath();
        break;
      case 'paste':
        const pasteAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'editor',
            name: 'jsonContent',
            message: 'Paste the JSON content:',
            validate: (input: string) => {
              try {
                JSON.parse(input);
                return true;
              } catch {
                return 'Invalid JSON content';
              }
            }
          }
        ]);
        fileContent = pasteAnswer.jsonContent;
        break;
    }

    if (!filePath && !fileContent) {
      logger.log('Import cancelled');
      return;
    }

    // Step 2: File preview (if we have a file path)
    if (filePath) {
      await previewFile(filePath);
    }

    // Step 3: Import options
    const importOptions = await getImportOptions();

    // Step 4: Import configuration preview
    console.log('\n📋 Import Configuration:');
    console.log(`   Input method: ${inputMethodAnswer.inputMethod}`);
    if (filePath) {
      console.log(`   File path: ${filePath}`);
    }
    console.log(`   Conflict resolution: ${importOptions.conflictResolution}`);
    console.log(`   Dry run: ${importOptions.dryRun ? 'Yes' : 'No'}`);

    // Step 5: Confirm import
    const confirmAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with import?',
        default: true
      }
    ]);

    if (!confirmAnswer.confirm) {
      logger.log('Import cancelled');
      return;
    }

    // Step 6: Execute import
    console.log('\n🚀 Executing import...\n');
    
    let result;
    if (filePath) {
      result = await importSessionsCommand(filePath, importOptions);
    } else {
      // For pasted content, create a temporary file
      const tempFile = await createTempFile(fileContent);
      try {
        result = await importSessionsCommand(tempFile, importOptions);
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    if (result.ok) {
      logger.log('Import completed successfully! 🎉');
      
      // If it was a dry run, offer to do the actual import
      if (importOptions.dryRun && result.value.created > 0) {
        const actualImportAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'confirm',
            name: 'actualImport',
            message: 'Dry run completed successfully. Would you like to perform the actual import?',
            default: true
          }
        ]);

        if (actualImportAnswer.actualImport) {
          importOptions.dryRun = false;
          console.log('\n🚀 Performing actual import...\n');
          
          if (filePath) {
            result = await importSessionsCommand(filePath, importOptions);
          } else {
            const tempFile = await createTempFile(fileContent);
            try {
              result = await importSessionsCommand(tempFile, importOptions);
            } finally {
              try {
                await fs.unlink(tempFile);
              } catch {
                // Ignore cleanup errors
              }
            }
          }

          if (result.ok) {
            logger.log('Actual import completed successfully! 🎉');
          } else {
            logger.error('Actual import failed');
          }
        }
      }
    } else {
      logger.error('Import failed');
    }

  } catch (error) {
    logger.error('Import wizard failed');
  }
}

async function selectFromDownloads(): Promise<string> {
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', 'Downloads', 'codestate-sessions');
  
  try {
    const files = await fs.readdir(downloadsPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('No JSON files found in Downloads/codestate-sessions folder.');
      return '';
    }

    const fileAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'list',
        name: 'selectedFile',
        message: 'Select a file to import:',
        choices: jsonFiles.map(file => ({
          name: file,
          value: path.join(downloadsPath, file)
        }))
      }
    ]);

    return fileAnswer.selectedFile;
  } catch (error) {
    console.log('Downloads folder not accessible or empty.');
    return '';
  }
}

async function getCustomFilePath(): Promise<string> {
  const pathAnswer = await (inquirer.customPrompt as any)([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the file path:',
      validate: async (input: string) => {
        try {
          await fs.access(input);
          return true;
        } catch {
          return 'File not found or not accessible';
        }
      }
    }
  ]);

  return pathAnswer.filePath;
}

async function previewFile(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log('\n📄 File Preview:');
    if (data.metadata) {
      console.log(`   Exported at: ${data.metadata.exportedAt}`);
      console.log(`   Sessions: ${data.metadata.totalSessions}`);
      console.log(`   Scripts bundled: ${data.metadata.totalScripts}`);
      console.log(`   Terminal collections bundled: ${data.metadata.totalTerminalCollections}`);
      console.log(`   Selection mode: ${data.metadata.selectionMode}`);
    }
    
    if (data.sessions && Array.isArray(data.sessions)) {
      console.log(`   Sessions found: ${data.sessions.length}`);
      data.sessions.slice(0, 3).forEach((session: any, index: number) => {
        const scriptsInfo = session.bundledScripts ? ` (${session.bundledScripts.length} scripts)` : '';
        const tcInfo = session.bundledTerminalCollections ? ` (${session.bundledTerminalCollections.length} terminal collections)` : '';
        console.log(`     ${index + 1}. ${session.name}${scriptsInfo}${tcInfo}`);
      });
      if (data.sessions.length > 3) {
        console.log(`     ... and ${data.sessions.length - 3} more`);
      }
    }
    console.log('');
  } catch (error) {
    console.log('Could not preview file content.');
  }
}

async function getImportOptions(): Promise<ImportSessionOptions> {
  const optionsAnswer = await (inquirer.customPrompt as any)([
    {
      type: 'list',
      name: 'conflictResolution',
      message: 'How should conflicts be resolved?',
      choices: [
        { name: '⏭️  Skip conflicting items', value: 'skip' },
        { name: '🔄 Rename conflicting items', value: 'rename' },
        { name: '⚠️  Overwrite conflicting items (not yet implemented)', value: 'overwrite' }
      ]
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Perform a dry run first? (preview what would be imported)',
      default: true
    }
  ]);

  return {
    conflictResolution: optionsAnswer.conflictResolution,
    dryRun: optionsAnswer.dryRun
  };
}

async function createTempFile(content: string): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-import-'));
  const tempFile = path.join(tempDir, 'import-content.json');
  await fs.writeFile(tempFile, content, 'utf8');
  return tempFile;
} 