import inquirer from '../../utils/inquirer';
import { exportSessionsCommand } from '../../commands/session/exportSessions';
import { ListSessions, ExportSessionOptions } from '@codestate/core';
import { ConfigurableLogger } from '@codestate/core';

export async function exportSessionsTui(): Promise<void> {
  const logger = new ConfigurableLogger();
  
  console.log('📤 Session Export Wizard\n');
  
  try {
    // Step 1: Choose export scope
    const scopeAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'list',
        name: 'exportScope',
        message: 'What would you like to export?',
        choices: [
          { name: '🌟 All sessions', value: 'all' },
          { name: '🏷️  Sessions by tags', value: 'tags' },
          { name: '🔍 Sessions by search term', value: 'search' },
          { name: '🆔 Select specific sessions', value: 'select' },
          { name: '🔍 Advanced filtering', value: 'advanced' }
        ]
      }
    ]);

    let exportOptions: ExportSessionOptions = {};

    switch (scopeAnswer.exportScope) {
      case 'all':
        exportOptions = { selectionMode: 'filter' };
        break;

      case 'tags':
        const tagsAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'input',
            name: 'tags',
            message: 'Enter tags to filter by (comma-separated):',
            validate: (input: string) => input.trim() ? true : 'Tags are required'
          }
        ]);
        exportOptions = { 
          selectionMode: 'filter',
          tags: tagsAnswer.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        };
        break;

      case 'search':
        const searchAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'input',
            name: 'search',
            message: 'Enter search term:',
            validate: (input: string) => input.trim() ? true : 'Search term is required'
          }
        ]);
        exportOptions = { 
          selectionMode: 'filter',
          search: searchAnswer.search.trim()
        };
        break;

      case 'select':
        // Show interactive session selection
        const selectedSessions = await showSessionSelection();
        if (selectedSessions.length === 0) {
          logger.log('No sessions selected. Export cancelled.');
          return;
        }
        exportOptions = { 
          selectionMode: 'ids',
          sessionIds: selectedSessions
        };
        break;

      case 'advanced':
        const advancedAnswer = await (inquirer.customPrompt as any)([
          {
            type: 'input',
            name: 'tags',
            message: 'Enter tags (optional, comma-separated, press Enter to skip):',
            default: ''
          },
          {
            type: 'input',
            name: 'search',
            message: 'Enter search term (optional, press Enter to skip):',
            default: ''
          }
        ]);
        
        exportOptions = { selectionMode: 'filter' };
        if (advancedAnswer.tags.trim()) {
          exportOptions.tags = advancedAnswer.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        }
        if (advancedAnswer.search.trim()) {
          exportOptions.search = advancedAnswer.search.trim();
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
    
    if (exportOptions.tags && exportOptions.tags.length > 0) {
      console.log(`   Tags: ${exportOptions.tags.join(', ')}`);
    }
    if (exportOptions.search) {
      console.log(`   Search: "${exportOptions.search}"`);
    }
    if (exportOptions.sessionIds) {
      console.log(`   Sessions selected: ${exportOptions.sessionIds.length}`);
    }
    if (exportOptions.filename) {
      console.log(`   Filename: ${exportOptions.filename}`);
    }

    // Step 4: Confirm export
    const confirmAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with export? (This will bundle all scripts and terminal collections within the sessions)',
        default: true
      }
    ]);

    if (!confirmAnswer.confirm) {
      logger.log('Export cancelled');
      return;
    }

    // Step 5: Execute export
    console.log('\n🚀 Executing export...\n');
    const result = await exportSessionsCommand(exportOptions);

    if (result.ok) {
      logger.log('Export completed successfully! 🎉');
    } else {
      logger.error('Export failed');
    }

  } catch (error) {
    logger.error('Export wizard failed');
  }
}

async function showSessionSelection(): Promise<string[]> {
  const logger = new ConfigurableLogger();
  
  try {
    // Get all available sessions
    const listSessions = new ListSessions();
    const sessionsResult = await listSessions.execute();
    
    if (!sessionsResult.ok) {
      logger.error('Failed to fetch sessions for selection');
      return [];
    }

    const sessions = sessionsResult.value;
    
    if (sessions.length === 0) {
      logger.log('No sessions found to select from.');
      return [];
    }

    // Create choices for inquirer
    const choices: any[] = [];
    
    sessions.forEach(session => {
      const tagsInfo = session.tags && session.tags.length > 0 
        ? ` [${session.tags.join(', ')}]` 
        : '';
      
      const projectInfo = session.projectRoot ? ` (${session.projectRoot})` : '';
      
      choices.push({
        name: `📁 ${session.name}${tagsInfo}${projectInfo}`,
        value: session.id,
        short: session.name
      });
    });

    // Show multi-select interface
    const selectionAnswer = await (inquirer.customPrompt as any)([
      {
        type: 'checkbox',
        name: 'selectedSessionIds',
        message: 'Select sessions to export (use spacebar to select/deselect, arrow keys to navigate):',
        choices: choices,
        pageSize: 15,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one session';
          }
          return true;
        }
      }
    ]);

    return selectionAnswer.selectedSessionIds || [];

  } catch (error) {
          logger.error('Failed to show session selection');
    return [];
  }
} 