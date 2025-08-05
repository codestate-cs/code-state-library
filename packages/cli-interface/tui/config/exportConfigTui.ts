import inquirer from '@codestate/cli-interface/utils/inquirer';
import { exportConfigCommand } from '../../commands/config/exportConfig';
import { ConfigurableLogger } from '@codestate/core/api';
import * as fs from 'fs/promises';

export async function exportConfigTui() {
  const logger = new ConfigurableLogger();
  const { filePath } = await inquirer.customPrompt([
    { name: 'filePath', message: 'Export to file (leave blank to print to console):', type: 'input' }
  ]);
  let output = '';
  const originalLog = logger.log;
  // Intercept logger.log to capture output
  logger.log = (msg: string, meta?: Record<string, unknown>) => {
    if (typeof msg === 'string' && msg.startsWith('Exported config:')) {
      output = meta?.config as string || '';
    } else {
      originalLog(msg, meta);
    }
  };
  await exportConfigCommand();
  logger.log = originalLog;
  if (filePath && output) {
    await fs.writeFile(filePath, output, 'utf8');
    logger.log(`Config exported to ${filePath}`);
  } else if (output) {
    logger.plainLog(output);
  }
} 