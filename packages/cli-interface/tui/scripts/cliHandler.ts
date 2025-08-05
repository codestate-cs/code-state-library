import { createScriptTui } from './createScriptTui';
import { showScriptsTui } from './showScriptsTui';
import { showScriptsByRootPathCommand } from '../../commands/scripts/showScriptsByRootPath';
import { updateScriptTui } from './updateScriptTui';
import { deleteScriptTui } from './deleteScriptTui';
import { deleteScriptsByRootPathTui } from './deleteScriptsByRootPathTui';
import { exportScriptsTui } from './exportScriptsTui';
import { importScriptsTui } from './importScriptsTui';
import { ConfigurableLogger } from '@codestate/core/api';

export async function handleScriptCommand(subcommand: string, options: string[]) {
  const logger = new ConfigurableLogger();
  
  switch (subcommand) {
    case 'show':
      await showScriptsTui();
      break;
    case 'show-by-path':
      if (options.length === 0) {
        logger.error('Error: root path is required for show-by-path command');
        logger.plainLog('Usage: codestate scripts show-by-path <root-path>');
        process.exit(1);
      }
      await showScriptsByRootPathCommand(options[0]);
      break;
    case 'create':
      await createScriptTui();
      break;
    case 'update':
      await updateScriptTui();
      break;
    case 'delete':
      await deleteScriptTui();
      break;
    case 'delete-by-path':
      await deleteScriptsByRootPathTui();
      break;
    case 'export':
      await exportScriptsTui();
      break;
    case 'import':
      await importScriptsTui();
      break;
    default:
      logger.error(`Error: Unknown scripts subcommand '${subcommand}'`);
      logger.plainLog('Available scripts subcommands: show, show-by-path, create, update, delete, delete-by-path, export, import');
      process.exit(1);
  }
} 