import inquirer from '@codestate/cli-interface/utils/inquirer';
import { exportConfigCommand } from '../../commands/config/exportConfig';
import * as fs from 'fs/promises';

export async function exportConfigTui() {
  const { filePath } = await inquirer.customPrompt([
    { name: 'filePath', message: 'Export to file (leave blank to print to console):', type: 'input' }
  ]);
  let output = '';
  const logger = { log: console.log, error: console.error };
  const originalLog = console.log;
  // Intercept logger.log to capture output
  console.log = (msg: any, meta?: any) => {
    if (typeof msg === 'string' && msg.startsWith('Exported config:')) {
      output = meta?.config || '';
    } else {
      originalLog(msg, meta);
    }
  };
  await exportConfigCommand();
  console.log = originalLog;
  if (filePath && output) {
    await fs.writeFile(filePath, output, 'utf8');
    logger.log(`Config exported to ${filePath}`);
  } else if (output) {
    logger.log(output);
  }
} 