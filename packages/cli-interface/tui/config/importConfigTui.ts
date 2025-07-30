import inquirer from '@codestate/cli-interface/utils/inquirer';
import { importConfigCommand } from '../../commands/config/importConfig';
import * as fs from 'fs/promises';

export async function importConfigTui() {
  const { importType } = await inquirer.customPrompt([
    { name: 'importType', message: 'Import from:', type: 'list', choices: ['File', 'Paste JSON'] }
  ]);
  let json = '';
  if (importType === 'File') {
    const { filePath } = await inquirer.customPrompt([
      { name: 'filePath', message: 'Path to config file:', type: 'input' }
    ]);
    json = await fs.readFile(filePath, 'utf8');
  } else {
    const { jsonString } = await inquirer.customPrompt([
      { name: 'jsonString', message: 'Paste config JSON:', type: 'editor' }
    ]);
    json = jsonString;
  }
  await importConfigCommand(json);
} 