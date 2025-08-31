import inquirer from '../../utils/inquirer';
import { importScriptsCommand } from '../../commands/scripts/importScripts';
import { ConfigurableLogger, ImportOptions } from '@codestate/core';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function importScriptsTui(): Promise<void> {
  const logger = new ConfigurableLogger();
  
  console.log('📥 Script Import Wizard\n');
  
  try {
    // Step 1: Choose input method
    const inputMethodAnswer = await inquirer.customPrompt([
      {
        type: 'list',
        name: 'inputMethod',
        message: 'How would you like to provide the scripts file?',
        choices: [
          { name: '📁 Select from Downloads folder', value: 'downloads' },
          { name: '📂 Enter custom file path', value: 'custom' },
          { name: '📋 Paste file content', value: 'paste' }
        ]
      }
    ]);

    let filePath: string = '';
    let fileContent: string = '';

    switch (inputMethodAnswer.inputMethod) {
      case 'downloads':
        const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', 'Downloads', 'codestate-scripts');
        
        try {
          const files = await fs.readdir(downloadsPath);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          if (jsonFiles.length === 0) {
            logger.error('No JSON files found in Downloads/codestate-scripts folder');
            return;
          }
          
          const fileAnswer = await inquirer.customPrompt([
            {
              type: 'list',
              name: 'selectedFile',
              message: 'Select a file to import:',
              choices: jsonFiles.map(file => ({
                name: `${file} (${path.join(downloadsPath, file)})`,
                value: path.join(downloadsPath, file)
              }))
            }
          ]);
          
          filePath = fileAnswer.selectedFile;
        } catch (error) {
          logger.error('Could not access Downloads folder');
          return;
        }
        break;

      case 'custom':
        const customPathAnswer = await inquirer.customPrompt([
          {
            type: 'input',
            name: 'customPath',
            message: 'Enter the full path to the scripts file:',
            validate: async (input: string) => {
              try {
                await fs.access(input.trim());
                return true;
              } catch {
                return 'File not found or not accessible';
              }
            }
          }
        ]);
        filePath = customPathAnswer.customPath.trim();
        break;

      case 'paste':
        const pasteAnswer = await inquirer.customPrompt([
          {
            type: 'editor',
            name: 'pastedContent',
            message: 'Paste the JSON content (will open in editor):',
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
        
        fileContent = pasteAnswer.pastedContent;
        
        // Create a temporary file for the pasted content
        const tempDir = path.join(process.cwd(), '.temp');
        await fs.mkdir(tempDir, { recursive: true });
        filePath = path.join(tempDir, `pasted-scripts-${Date.now()}.json`);
        await fs.writeFile(filePath, fileContent, 'utf8');
        break;
    }

    if (!filePath && !fileContent) {
      logger.error('No file selected or content provided');
      return;
    }

    // Step 2: Preview file content
    if (filePath) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);
        
        console.log('\n📋 File Preview:');
        console.log(`   📁 File: ${path.basename(filePath)}`);
        console.log(`   📊 Scripts found: ${parsed.scripts?.length || parsed.entries?.length || 'Unknown'}`);
        
        if (parsed.metadata) {
          console.log(`   🕒 Exported at: ${parsed.metadata.exportedAt}`);
          if (parsed.metadata.filters) {
            console.log(`   🔍 Filters: ${JSON.stringify(parsed.metadata.filters)}`);
          }
        }
        
        // Show first few scripts
        const scripts = parsed.scripts || parsed.entries || [];
        if (scripts.length > 0) {
          console.log('\n   📜 Sample scripts:');
          scripts.slice(0, 3).forEach((script: any, index: number) => {
            console.log(`      ${index + 1}. ${script.name || script.id} (${script.rootPath || 'Unknown path'})`);
          });
          if (scripts.length > 3) {
            console.log(`      ... and ${scripts.length - 3} more`);
          }
        }
      } catch (error) {
        logger.error('Could not read or parse file');
        return;
      }
    }

    // Step 3: Configure import options
    const importOptionsAnswer = await inquirer.customPrompt([
      {
        type: 'list',
        name: 'conflictResolution',
        message: 'How should conflicts be handled?',
        choices: [
          { name: '⏭️  Skip conflicting scripts', value: 'skip' },
          { name: '🔄 Rename conflicting scripts', value: 'rename' },
          { name: '⚠️  Overwrite conflicting scripts (not yet implemented)', value: 'overwrite' }
        ]
      },
      {
        type: 'confirm',
        name: 'dryRun',
        message: 'Run in dry-run mode first? (preview without making changes)',
        default: true
      }
    ]);

    const importOptions: ImportOptions = {
      conflictResolution: importOptionsAnswer.conflictResolution,
      dryRun: importOptionsAnswer.dryRun
    };

    // Step 4: Confirm import
    console.log('\n📋 Import Configuration:');
    console.log(`   📁 File: ${filePath || 'Pasted content'}`);
    console.log(`   🔄 Conflict resolution: ${importOptions.conflictResolution}`);
    console.log(`   🧪 Dry run: ${importOptions.dryRun ? 'Yes' : 'No'}`);

    const confirmAnswer = await inquirer.customPrompt([
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

    // Step 5: Execute import
    console.log('\n🚀 Executing import...\n');
    const result = await importScriptsCommand(filePath, importOptions);

    if (result.ok) {
      logger.log('Import completed successfully! 🎉');
      
      // If this was a dry run and successful, ask if user wants to do the real import
      if (importOptions.dryRun && result.value.created > 0) {
        const realImportAnswer = await inquirer.customPrompt([
          {
            type: 'confirm',
            name: 'realImport',
            message: 'Dry run successful! Would you like to perform the actual import?',
            default: true
          }
        ]);

        if (realImportAnswer.realImport) {
          console.log('\n🚀 Performing actual import...\n');
          const realResult = await importScriptsCommand(filePath, { ...importOptions, dryRun: false });
          
          if (realResult.ok) {
            logger.log('Actual import completed successfully! 🎉');
          } else {
            logger.error('Actual import failed');
          }
        }
      }
    } else {
      logger.error('Import failed');
    }

    // Clean up temporary file if created
    if (inputMethodAnswer.inputMethod === 'paste' && filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

  } catch (error) {
    logger.error('Import wizard failed');
  }
} 