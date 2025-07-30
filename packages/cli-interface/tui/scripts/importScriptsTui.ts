import inquirer from '@codestate/cli-interface/utils/inquirer';
import { importScriptsCommand } from '../../commands/scripts/importScripts';
import * as fs from 'fs/promises';

export async function importScriptsTui() {
  const { importType } = await inquirer.customPrompt([
    { name: 'importType', message: 'Import from:', type: 'list', choices: ['File', 'Paste JSON'] }
  ]);
  let json = '';
  if (importType === 'File') {
    const { filePath } = await inquirer.customPrompt([
      { name: 'filePath', message: 'Path to scripts file:', type: 'input' }
    ]);
    json = await fs.readFile(filePath, 'utf8');
  } else {
    const { jsonString } = await inquirer.customPrompt([
      { name: 'jsonString', message: 'Paste scripts JSON:', type: 'editor' }
    ]);
    json = jsonString;
  }
  await importScriptsCommand(json);
} 