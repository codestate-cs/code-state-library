import { updateConfigTui } from './updateConfigTui';
import { importConfigTui } from './importConfigTui';
import { showConfigTui } from './showConfigTui';
import { resetConfigTui } from './resetConfigTui';
import { exportConfigTui } from './exportConfigTui';

export async function handleConfigCommand(subcommand: string, options: string[]) {
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
        console.error('Error: --file option is required for import command');
        console.log('Usage: codestate config import --file <path>');
        process.exit(1);
      }
      const filePath = options[fileIndex + 1];
      // Use the TUI version for file handling
      await importConfigTui();
      break;
    default:
      console.error(`Error: Unknown config subcommand '${subcommand}'`);
      console.log('Available config subcommands: show, edit, reset, export, import');
      process.exit(1);
  }
} 