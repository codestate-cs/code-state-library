import { updateConfigTui } from './updateConfigTui';
import { importConfigTui } from './importConfigTui';
import { showConfigTui } from './showConfigTui';
import { resetConfigTui } from './resetConfigTui';
import { exportConfigTui } from './exportConfigTui';
import { ConfigurableLogger } from '@codestate/core/api';

export async function handleConfigCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();
  
  switch (subcommand) {
    case 'show':
      await showConfigTui();
      break;
    case 'edit':
      // Use the TUI version for interactive editing
      await updateConfigTui();
      break;
    case 'reset':
      await resetConfigTui();
      break;
    case 'export':
      await exportConfigTui();
      break;
    case 'import':
      // Check if file path is provided
      const fileIndex = options.indexOf('--file');
      if (fileIndex === -1 || fileIndex === options.length - 1) {
        logger.error('Error: --file option is required for import command');
        logger.plainLog('Usage: codestate config import --file <path>');
        process.exit(1);
      }
      const filePath = options[fileIndex + 1];
      // Use the TUI version for file handling
      await importConfigTui();
      break;
    default:
      logger.error(`Error: Unknown config subcommand '${subcommand}'`);
      logger.plainLog('Available config subcommands: show, edit, reset, export, import');
      process.exit(1);
  }
} 