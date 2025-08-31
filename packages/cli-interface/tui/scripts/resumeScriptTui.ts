import { resumeScriptCommand } from "../../commands/scripts/resumeScript";

export async function resumeScriptTui(showItemsFromRootPath: boolean, lifecycleFilter?: string[]) {
  // Convert boolean flag to root path logic
  const rootPath = showItemsFromRootPath ? process.cwd() : undefined;
  await resumeScriptCommand(undefined, rootPath, lifecycleFilter);
}
