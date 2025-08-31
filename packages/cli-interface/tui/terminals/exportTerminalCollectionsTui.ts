import inquirer from '../../utils/inquirer';
import { exportTerminalCollectionsCommand } from '../../commands/terminals/exportTerminalCollections';
import { GetTerminalCollections, ExportTerminalCollectionOptions } from '@codestate/core';
import { ConfigurableLogger } from '@codestate/core';

export async function exportTerminalCollectionsTui(): Promise<void> {
  const logger = new ConfigurableLogger();
  
  console.log('📤 Terminal Collection Export Wizard\n');
  
  try {
    // Step 1: Choose export scope
    const scopeAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'list',
        name: 'exportScope',
        message: 'What would you like to export?',
        choices: [
          { name: '🌟 All terminal collections', value: 'all' },
          { name: '📂 Terminal collections from specific project', value: 'project' },
          { name: '🆔 Select specific terminal collections', value: 'select' },
          { name: '🔄 Terminal collections by lifecycle', value: 'lifecycle' },
          { name: '🔍 Advanced filtering', value: 'advanced' }
        ]
      }
    ]);

    let exportOptions: ExportTerminalCollectionOptions = {};

    switch (scopeAnswer.exportScope) {
      case 'all':
        exportOptions = { selectionMode: 'filter' };
        break;

      case 'project':
        const projectAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'input',
            name: 'rootPath',
            message: 'Enter the project root path:',
            default: process.cwd(),
            validate: (input: string) => input.trim() ? true : 'Root path is required'
          }
        ]);
        exportOptions = { 
          selectionMode: 'filter',
          rootPath: projectAnswer.rootPath.trim()
        };
        break;

      case 'select':
        // Show interactive terminal collection selection
        const selectedTerminalCollections = await showTerminalCollectionSelection();
        if (selectedTerminalCollections.length === 0) {
          logger.log('No terminal collections selected. Export cancelled.');
          return;
        }
        exportOptions = { 
          selectionMode: 'ids',
          terminalCollectionIds: selectedTerminalCollections
        };
        break;

      case 'lifecycle':
        const lifecycleAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'list',
            name: 'lifecycle',
            message: 'Select lifecycle filter:',
            choices: [
              { name: '🚪 Open terminal collections', value: 'open' },
              { name: '🔄 Resume terminal collections', value: 'resume' },
              { name: '❌ None lifecycle', value: 'none' }
            ]
          }
        ]);
        exportOptions = { 
          selectionMode: 'filter',
          lifecycle: lifecycleAnswer.lifecycle
        };
        break;

      case 'advanced':
        const advancedAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'input',
            name: 'rootPath',
            message: 'Enter root path (optional, press Enter to skip):',
            default: ''
          },
          {
            type: 'list',
            name: 'lifecycle',
            message: 'Select lifecycle (optional, press Enter to skip):',
            choices: [
              { name: '🚪 Open terminal collections', value: 'open' },
              { name: '🔄 Resume terminal collections', value: 'resume' },
              { name: '❌ None lifecycle', value: 'none' },
              { name: '⏭️  Skip lifecycle filter', value: '' }
            ]
          }
        ]);
        
        exportOptions = { selectionMode: 'filter' };
        if (advancedAnswer.rootPath.trim()) {
          exportOptions.rootPath = advancedAnswer.rootPath.trim();
        }
        if (advancedAnswer.lifecycle) {
          exportOptions.lifecycle = advancedAnswer.lifecycle;
        }
        break;
    }

    // Step 2: Custom filename (optional)
    const filenameAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter custom filename (optional, press Enter for auto-generated):',
        default: ''
      }
    ]);

    if (filenameAnswer.filename.trim()) {
      exportOptions.filename = filenameAnswer.filename.trim();
    }

    // Step 3: Preview what will be exported
    console.log('\n📋 Export Preview:');
    console.log(`   Scope: ${scopeAnswer.exportScope}`);
    
    if (exportOptions.rootPath) {
      console.log(`   Root path: ${exportOptions.rootPath}`);
    }
    if (exportOptions.lifecycle) {
      console.log(`   Lifecycle: ${exportOptions.lifecycle}`);
    }
    if (exportOptions.terminalCollectionIds) {
      console.log(`   Terminal collections selected: ${exportOptions.terminalCollectionIds.length}`);
    }
    if (exportOptions.filename) {
      console.log(`   Filename: ${exportOptions.filename}`);
    }

    // Step 4: Confirm export
    const confirmAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with export? (This will bundle all scripts within the terminal collections)',
        default: true
      }
    ]);

    if (!confirmAnswer.confirm) {
      logger.log('Export cancelled');
      return;
    }

    // Step 5: Execute export
    console.log('\n🚀 Executing export...\n');
    const result = await exportTerminalCollectionsCommand(exportOptions);

    if (result.ok) {
      logger.log('Export completed successfully! 🎉');
    } else {
      logger.error('Export failed');
    }

  } catch (error) {
    logger.error('Export wizard failed');
  }
}

async function showTerminalCollectionSelection(): Promise<string[]> {
  const logger = new ConfigurableLogger();
  
  try {
    // Get all available terminal collections
    const getTerminalCollections = new GetTerminalCollections();
    const terminalCollectionsResult = await getTerminalCollections.execute();
    
    if (!terminalCollectionsResult.ok) {
      logger.error('Failed to fetch terminal collections for selection');
      return [];
    }

    const terminalCollections = terminalCollectionsResult.value;
    
    if (terminalCollections.length === 0) {
      logger.log('No terminal collections found to select from.');
      return [];
    }

    // Group terminal collections by root path for better organization
    const collectionsByPath = terminalCollections.reduce((acc, tc) => {
      const path = tc.rootPath;
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(tc);
      return acc;
    }, {} as Record<string, typeof terminalCollections>);

    // Create choices for inquirer
    const choices: any[] = [];
    
    Object.entries(collectionsByPath).forEach(([rootPath, pathCollections]) => {
      // Add a separator for each root path
      choices.push(new inquirer.Separator(`📁 ${rootPath}`));
      
      // Add terminal collections for this path
      pathCollections.forEach(tc => {
        const lifecycleInfo = tc.lifecycle && tc.lifecycle.length > 0 
          ? ` [${tc.lifecycle.join(', ')}]` 
          : '';
        
        choices.push({
          name: `  📜 ${tc.name}${lifecycleInfo}`,
          value: tc.id,
          short: tc.name
        });
      });
    });

    // Show multi-select interface
    const selectionAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'checkbox',
        name: 'selectedTerminalCollectionIds',
        message: 'Select terminal collections to export (use spacebar to select/deselect, arrow keys to navigate):',
        choices: choices,
        pageSize: 15,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one terminal collection';
          }
          return true;
        }
      }
    ]);

    return selectionAnswer.selectedTerminalCollectionIds || [];

  } catch (error) {
          logger.error('Failed to show terminal collection selection');
    return [];
  }
} 