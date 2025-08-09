import { ConfigurableLogger, GetScripts } from "@codestate/core";

export async function showScriptsCommand() {
  const logger = new ConfigurableLogger();
  const getScripts = new GetScripts();
  const result = await getScripts.execute();
  if (result.ok) {
    const scripts = result.value;

    if (scripts.length === 0) {
      logger.plainLog("\n📝 No scripts found.");
      logger.plainLog(
        "Use `codestate scripts create` to add your first script.\n"
      );
      return;
    }

    // Group scripts by rootPath
    const scriptsByPath = new Map<string, typeof scripts>();
    scripts.forEach((script) => {
      if (!scriptsByPath.has(script.rootPath)) {
        scriptsByPath.set(script.rootPath, []);
      }
      scriptsByPath.get(script.rootPath)!.push(script);
    });

    logger.plainLog("\n📝 Scripts by Project Path:");
    logger.plainLog("───────────────────────────");

    scriptsByPath.forEach((pathScripts, rootPath) => {
      logger.plainLog(
        `\n📁 ${rootPath} (${pathScripts.length} script${
          pathScripts.length > 1 ? "s" : ""
        })`
      );
      logger.plainLog("─".repeat(rootPath.length + 10));

      pathScripts.forEach((script) => {
        logger.plainLog(`  • ${script.name} - ${script.script}`);
      });
    });

    logger.plainLog("");
  } else {
    logger.error("Failed to load scripts", { error: result.error });
  }
}
