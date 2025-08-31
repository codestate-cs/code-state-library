import { showScriptsCommand } from '../../commands/scripts/showScripts';

export async function showScriptsTui(rootPath?: string, lifecycleFilter?: string[]) {
  await showScriptsCommand(rootPath, lifecycleFilter);
} 