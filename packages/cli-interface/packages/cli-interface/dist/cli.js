#!/usr/bin/env node

// commands/config/showConfig.ts
import { GetConfig, ConfigurableLogger } from "codestate-core";
async function showConfigCommand() {
  const logger2 = new ConfigurableLogger();
  const getConfig = new GetConfig();
  const result = await getConfig.execute();
  if (result.ok) {
    const config = result.value;
    logger2.plainLog("\n\u{1F4CB} Current Configuration:");
    logger2.plainLog("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    logger2.plainLog(`Editor: ${config.ide}`);
    logger2.plainLog(`Version: ${config.version}`);
    logger2.plainLog(`Encryption: ${config.encryption.enabled ? "Yes" : "No"}`);
    logger2.plainLog(`Storage Path: ${config.storagePath}`);
    logger2.plainLog(`Log Level: ${config.logger.level}`);
    logger2.plainLog(`Log Sinks: ${config.logger.sinks.join(", ")}`);
    if (config.experimental && Object.keys(config.experimental).length > 0) {
      logger2.plainLog("\n\u{1F52C} Experimental Features:");
      Object.entries(config.experimental).forEach(([key, value]) => {
        logger2.plainLog(`  ${key}: ${value ? "\u2705" : "\u274C"}`);
      });
    }
    if (config.extensions && Object.keys(config.extensions).length > 0) {
      logger2.plainLog("\n\u{1F50C} Extensions:");
      Object.keys(config.extensions).forEach((key) => {
        logger2.plainLog(`  ${key}`);
      });
    }
    logger2.plainLog("");
  } else {
    logger2.error("Failed to load config", { error: result.error });
  }
}

// tui/config/showConfigTui.ts
async function showConfigTui() {
  await showConfigCommand();
}

// utils/inquirer.ts
import originalInquirer from "inquirer";
import { ConfigurableLogger as ConfigurableLogger2 } from "codestate-core";
var inquirer = {
  ...originalInquirer,
  customPrompt: async function(questions) {
    try {
      return await originalInquirer.prompt(questions);
    } catch (error) {
      if (error.message?.includes("SIGINT") || error.message?.includes("force closed")) {
        const logger2 = new ConfigurableLogger2();
        logger2.plainLog("\n\u{1F44B} You have exited CodeState CLI");
        process.exit(0);
      }
      throw error;
    }
  }
};
var inquirer_default = inquirer;

// commands/config/updateConfig.ts
import { UpdateConfig, ConfigurableLogger as ConfigurableLogger3 } from "codestate-core";
async function updateConfigCommand(partial) {
  const logger2 = new ConfigurableLogger3();
  const updateConfig = new UpdateConfig();
  const result = await updateConfig.execute(partial);
  if (result.ok) {
    const config = result.value;
    logger2.log("Configuration updated successfully!");
    logger2.plainLog("\n\u{1F4CB} Current Configuration:");
    logger2.plainLog("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    logger2.plainLog(`Editor: ${config.ide}`);
    logger2.plainLog(`Version: ${config.version}`);
    logger2.plainLog(`Encryption: ${config.encryption.enabled ? "Yes" : "No"}`);
    logger2.plainLog(`Storage Path: ${config.storagePath}`);
    logger2.plainLog(`Log Level: ${config.logger.level}`);
    logger2.plainLog(`Log Sinks: ${config.logger.sinks.join(", ")}`);
    if (config.experimental && Object.keys(config.experimental).length > 0) {
      logger2.plainLog("\n\u{1F52C} Experimental Features:");
      Object.entries(config.experimental).forEach(([key, value]) => {
        logger2.plainLog(`  ${key}: ${value ? "\u2705" : "\u274C"}`);
      });
    }
    if (config.extensions && Object.keys(config.extensions).length > 0) {
      logger2.plainLog("\n\u{1F50C} Extensions:");
      Object.keys(config.extensions).forEach((key) => {
        logger2.plainLog(`  ${key}`);
      });
    }
    logger2.plainLog("");
  } else {
    logger2.error("Failed to update config", { error: result.error });
  }
}

// tui/config/updateConfigTui.ts
async function updateConfigTui() {
  const answers = await inquirer_default.customPrompt([
    { name: "ide", message: "Default IDE:", type: "list", choices: ["cursor", "vscode"] },
    { name: "encryption", message: "Enable encryption?", type: "confirm" }
  ]);
  let encryptionKey = void 0;
  if (answers.encryption) {
    const keyAnswer = await inquirer_default.customPrompt([
      { name: "encryptionKey", message: "Encryption key:", type: "password", mask: "*" }
    ]);
    encryptionKey = keyAnswer.encryptionKey;
  }
  const partial = {
    ide: answers.ide,
    encryption: { enabled: answers.encryption, encryptionKey }
  };
  await updateConfigCommand(partial);
}

// commands/config/resetConfig.ts
import { ResetConfig, ConfigurableLogger as ConfigurableLogger4 } from "codestate-core";
async function resetConfigCommand() {
  const logger2 = new ConfigurableLogger4();
  const resetConfig = new ResetConfig();
  const result = await resetConfig.execute();
  if (result.ok) {
    logger2.log("Config reset to defaults:", { config: result.value });
  } else {
    logger2.error("Failed to reset config", { error: result.error });
  }
}

// tui/config/resetConfigTui.ts
async function resetConfigTui() {
  const { confirm } = await inquirer_default.customPrompt([
    { name: "confirm", message: "Are you sure you want to reset config to defaults?", type: "confirm" }
  ]);
  if (confirm) {
    await resetConfigCommand();
  }
}

// commands/config/exportConfig.ts
import { ExportConfig, ConfigurableLogger as ConfigurableLogger5 } from "codestate-core";
async function exportConfigCommand() {
  const logger2 = new ConfigurableLogger5();
  const exportConfig = new ExportConfig();
  const result = await exportConfig.execute();
  if (result.ok) {
    logger2.log("Exported config:", { config: result.value });
  } else {
    logger2.error("Failed to export config", { error: result.error });
  }
}

// tui/config/exportConfigTui.ts
import { ConfigurableLogger as ConfigurableLogger6 } from "codestate-core";
import * as fs from "fs/promises";
async function exportConfigTui() {
  const logger2 = new ConfigurableLogger6();
  const { filePath } = await inquirer_default.customPrompt([
    { name: "filePath", message: "Export to file (leave blank to print to console):", type: "input" }
  ]);
  let output = "";
  const originalLog = logger2.log;
  logger2.log = (msg, meta) => {
    if (typeof msg === "string" && msg.startsWith("Exported config:")) {
      output = meta?.config || "";
    } else {
      originalLog(msg, meta);
    }
  };
  await exportConfigCommand();
  logger2.log = originalLog;
  if (filePath && output) {
    await fs.writeFile(filePath, output, "utf8");
    logger2.log(`Config exported to ${filePath}`);
  } else if (output) {
    logger2.plainLog(output);
  }
}

// commands/config/importConfig.ts
import { ImportConfig, ConfigurableLogger as ConfigurableLogger7 } from "codestate-core";
async function importConfigCommand(json) {
  const logger2 = new ConfigurableLogger7();
  const importConfig = new ImportConfig();
  const result = await importConfig.execute(json);
  if (result.ok) {
    logger2.log("Config imported:", { config: result.value });
  } else {
    logger2.error("Failed to import config", { error: result.error });
  }
}

// tui/config/importConfigTui.ts
import * as fs2 from "fs/promises";
async function importConfigTui() {
  const { importType } = await inquirer_default.customPrompt([
    { name: "importType", message: "Import from:", type: "list", choices: ["File", "Paste JSON"] }
  ]);
  let json = "";
  if (importType === "File") {
    const { filePath } = await inquirer_default.customPrompt([
      { name: "filePath", message: "Path to config file:", type: "input" }
    ]);
    json = await fs2.readFile(filePath, "utf8");
  } else {
    const { jsonString } = await inquirer_default.customPrompt([
      { name: "jsonString", message: "Paste config JSON:", type: "editor" }
    ]);
    json = jsonString;
  }
  await importConfigCommand(json);
}

// tui/config/cliHandler.ts
import { ConfigurableLogger as ConfigurableLogger8 } from "codestate-core";
async function handleConfigCommand(subcommand, options) {
  const logger2 = new ConfigurableLogger8();
  switch (subcommand) {
    case "show":
      await showConfigTui();
      break;
    case "edit":
      await updateConfigTui();
      break;
    case "reset":
      await resetConfigTui();
      break;
    case "export":
      await exportConfigTui();
      break;
    case "import":
      const fileIndex = options.indexOf("--file");
      if (fileIndex === -1 || fileIndex === options.length - 1) {
        logger2.error("Error: --file option is required for import command");
        logger2.plainLog("Usage: codestate config import --file <path>");
        process.exit(1);
      }
      const filePath = options[fileIndex + 1];
      await importConfigTui();
      break;
    default:
      logger2.error(`Error: Unknown config subcommand '${subcommand}'`);
      logger2.plainLog("Available config subcommands: show, edit, reset, export, import");
      process.exit(1);
  }
}

// commands/scripts/showScripts.ts
import { GetScripts, ConfigurableLogger as ConfigurableLogger9 } from "codestate-core";
async function showScriptsCommand() {
  const logger2 = new ConfigurableLogger9();
  const getScripts = new GetScripts();
  const result = await getScripts.execute();
  if (result.ok) {
    const scripts = result.value;
    if (scripts.length === 0) {
      logger2.plainLog("\n\u{1F4DD} No scripts found.");
      logger2.plainLog("Use `codestate scripts create` to add your first script.\n");
      return;
    }
    const scriptsByPath = /* @__PURE__ */ new Map();
    scripts.forEach((script) => {
      if (!scriptsByPath.has(script.rootPath)) {
        scriptsByPath.set(script.rootPath, []);
      }
      scriptsByPath.get(script.rootPath).push(script);
    });
    logger2.plainLog("\n\u{1F4DD} Scripts by Project Path:");
    logger2.plainLog("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    scriptsByPath.forEach((pathScripts, rootPath) => {
      logger2.plainLog(`
\u{1F4C1} ${rootPath} (${pathScripts.length} script${pathScripts.length > 1 ? "s" : ""})`);
      logger2.plainLog("\u2500".repeat(rootPath.length + 10));
      pathScripts.forEach((script) => {
        logger2.plainLog(`  \u2022 ${script.name} - ${script.script}`);
      });
    });
    logger2.plainLog("");
  } else {
    logger2.error("Failed to load scripts", { error: result.error });
  }
}

// tui/scripts/showScriptsTui.ts
async function showScriptsTui() {
  await showScriptsCommand();
}

// commands/scripts/createScript.ts
import { CreateScripts, ConfigurableLogger as ConfigurableLogger10 } from "codestate-core";
async function createScriptCommand(scripts) {
  const logger2 = new ConfigurableLogger10();
  const createScripts = new CreateScripts();
  const scriptsArray = Array.isArray(scripts) ? scripts : [scripts];
  const result = await createScripts.execute(scriptsArray);
  if (result.ok) {
    const scriptNames = scriptsArray.map((s) => s.name).join(", ");
    if (scriptsArray.length === 1) {
      logger2.log(`Script '${scriptNames}' created successfully`);
    } else {
      logger2.log(`Scripts created successfully: ${scriptNames}`);
    }
  } else {
    logger2.error("Failed to create scripts", { error: result.error, count: scriptsArray.length });
  }
}

// tui/scripts/createScriptTui.ts
async function createScriptTui() {
  await createScriptsInteractively();
}
async function createScriptsInteractively() {
  const scripts = [];
  let continueAdding = true;
  const currentPath = process.cwd();
  while (continueAdding) {
    const answers = await inquirer_default.customPrompt([
      {
        name: "name",
        message: `Script name (${scripts.length + 1}):`,
        type: "input",
        validate: (input) => input.trim() ? true : "Script name is required"
      },
      {
        name: "rootPath",
        message: `Root path (current: ${currentPath}):`,
        type: "input",
        default: currentPath,
        validate: (input) => input.trim() ? true : "Root path is required"
      },
      {
        name: "script",
        message: "Script command:",
        type: "input",
        validate: (input) => input.trim() ? true : "Script command is required"
      },
      {
        name: "addAnother",
        message: "Add another script?",
        type: "confirm",
        default: true
      }
    ]);
    scripts.push({
      name: answers.name.trim(),
      rootPath: answers.rootPath.trim(),
      script: answers.script.trim()
    });
    continueAdding = answers.addAnother;
  }
  if (scripts.length > 0) {
    await createScriptCommand(scripts);
  }
}

// commands/scripts/updateScript.ts
import { UpdateScript, ConfigurableLogger as ConfigurableLogger11 } from "codestate-core";
async function updateScriptCommand(name, rootPath, scriptUpdate) {
  const logger2 = new ConfigurableLogger11();
  const updateScript = new UpdateScript();
  const result = await updateScript.execute(name, rootPath, scriptUpdate);
  if (result.ok) {
    const updatedFields = Object.keys(scriptUpdate).join(", ");
    logger2.log(`Script '${name}' updated successfully (${updatedFields})`);
  } else {
    logger2.error(`Failed to update script '${name}'`, { error: result.error });
  }
}

// tui/scripts/updateScriptTui.ts
async function updateScriptTui() {
  const currentPath = process.cwd();
  const answers = await inquirer_default.customPrompt([
    {
      name: "name",
      message: "Script name to update:",
      type: "input",
      validate: (input) => input.trim() ? true : "Script name is required"
    },
    {
      name: "rootPath",
      message: `Root path (current: ${currentPath}):`,
      type: "input",
      default: currentPath,
      validate: (input) => input.trim() ? true : "Root path is required"
    },
    {
      name: "newName",
      message: "New script name (leave empty to keep current):",
      type: "input"
    },
    {
      name: "newScript",
      message: "New script command (leave empty to keep current):",
      type: "input"
    }
  ]);
  const scriptUpdate = {};
  if (answers.newName.trim()) {
    scriptUpdate.name = answers.newName.trim();
  }
  if (answers.newScript.trim()) {
    scriptUpdate.script = answers.newScript.trim();
  }
  await updateScriptCommand(answers.name.trim(), answers.rootPath.trim(), scriptUpdate);
}

// commands/scripts/deleteScript.ts
import { DeleteScript, ConfigurableLogger as ConfigurableLogger12 } from "codestate-core";
async function deleteScriptCommand(name, rootPath) {
  const logger2 = new ConfigurableLogger12();
  const deleteScript = new DeleteScript();
  const result = await deleteScript.execute(name, rootPath);
  if (result.ok) {
    logger2.log(`Script '${name}' deleted successfully`);
  } else {
    logger2.error(`Failed to delete script '${name}'`, { error: result.error });
  }
}

// tui/scripts/deleteScriptTui.ts
import { ConfigurableLogger as ConfigurableLogger13 } from "codestate-core";
async function deleteScriptTui() {
  const logger2 = new ConfigurableLogger13();
  const currentPath = process.cwd();
  const answers = await inquirer_default.customPrompt([
    {
      name: "name",
      message: "Script name to delete:",
      type: "input",
      validate: (input) => input.trim() ? true : "Script name is required"
    },
    {
      name: "rootPath",
      message: `Root path (current: ${currentPath}):`,
      type: "input",
      default: currentPath,
      validate: (input) => input.trim() ? true : "Root path is required"
    },
    {
      name: "confirm",
      message: "Are you sure you want to delete this script?",
      type: "confirm",
      default: false
    }
  ]);
  if (answers.confirm) {
    await deleteScriptCommand(answers.name.trim(), answers.rootPath.trim());
  } else {
    logger2.plainLog("Script deletion cancelled.");
  }
}

// commands/scripts/deleteScriptsByRootPath.ts
import { DeleteScriptsByRootPath, ConfigurableLogger as ConfigurableLogger14 } from "codestate-core";
async function deleteScriptsByRootPathCommand(rootPath) {
  const logger2 = new ConfigurableLogger14();
  const deleteScriptsByRootPath = new DeleteScriptsByRootPath();
  const result = await deleteScriptsByRootPath.execute(rootPath);
  if (result.ok) {
    logger2.log("Scripts deleted for root path successfully", { rootPath });
  } else {
    logger2.error("Failed to delete scripts for root path", { error: result.error, rootPath });
  }
}

// tui/scripts/deleteScriptsByRootPathTui.ts
import { ConfigurableLogger as ConfigurableLogger15 } from "codestate-core";
async function deleteScriptsByRootPathTui() {
  const logger2 = new ConfigurableLogger15();
  const currentPath = process.cwd();
  const answers = await inquirer_default.customPrompt([
    {
      name: "rootPath",
      message: `Root path to delete all scripts from (current: ${currentPath}):`,
      type: "input",
      default: currentPath,
      validate: (input) => input.trim() ? true : "Root path is required"
    },
    {
      name: "confirm",
      message: "Are you sure you want to delete ALL scripts for this root path?",
      type: "confirm",
      default: false
    }
  ]);
  if (answers.confirm) {
    await deleteScriptsByRootPathCommand(answers.rootPath.trim());
  } else {
    logger2.plainLog("Script deletion cancelled.");
  }
}

// commands/scripts/exportScripts.ts
import { ExportScripts, ConfigurableLogger as ConfigurableLogger16 } from "codestate-core";
async function exportScriptsCommand() {
  const logger2 = new ConfigurableLogger16();
  const exportScripts = new ExportScripts();
  const result = await exportScripts.execute();
  if (result.ok) {
    logger2.log("Scripts exported successfully:", { scripts: result.value });
  } else {
    logger2.error("Failed to export scripts", { error: result.error });
  }
}

// tui/scripts/exportScriptsTui.ts
async function exportScriptsTui() {
  await exportScriptsCommand();
}

// commands/scripts/importScripts.ts
import { ImportScripts, ConfigurableLogger as ConfigurableLogger17 } from "codestate-core";
async function importScriptsCommand(json) {
  const logger2 = new ConfigurableLogger17();
  const importScripts = new ImportScripts();
  const result = await importScripts.execute(json);
  if (result.ok) {
    logger2.log("Scripts imported successfully");
  } else {
    logger2.error("Failed to import scripts", { error: result.error });
  }
}

// tui/scripts/importScriptsTui.ts
import * as fs3 from "fs/promises";
async function importScriptsTui() {
  const { importType } = await inquirer_default.customPrompt([
    { name: "importType", message: "Import from:", type: "list", choices: ["File", "Paste JSON"] }
  ]);
  let json = "";
  if (importType === "File") {
    const { filePath } = await inquirer_default.customPrompt([
      { name: "filePath", message: "Path to scripts file:", type: "input" }
    ]);
    json = await fs3.readFile(filePath, "utf8");
  } else {
    const { jsonString } = await inquirer_default.customPrompt([
      { name: "jsonString", message: "Paste scripts JSON:", type: "editor" }
    ]);
    json = jsonString;
  }
  await importScriptsCommand(json);
}

// commands/scripts/showScriptsByRootPath.ts
import { GetScriptsByRootPath, ConfigurableLogger as ConfigurableLogger18 } from "codestate-core";
async function showScriptsByRootPathCommand(rootPath) {
  const logger2 = new ConfigurableLogger18();
  const getScriptsByRootPath = new GetScriptsByRootPath();
  const result = await getScriptsByRootPath.execute(rootPath);
  if (result.ok) {
    logger2.log(`Scripts for ${rootPath}:`, { scripts: result.value });
  } else {
    logger2.error("Failed to load scripts for root path", { error: result.error, rootPath });
  }
}

// tui/scripts/cliHandler.ts
import { ConfigurableLogger as ConfigurableLogger19 } from "codestate-core";
async function handleScriptCommand(subcommand, options) {
  const logger2 = new ConfigurableLogger19();
  switch (subcommand) {
    case "show":
      await showScriptsTui();
      break;
    case "show-by-path":
      if (options.length === 0) {
        logger2.error("Error: root path is required for show-by-path command");
        logger2.plainLog("Usage: codestate scripts show-by-path <root-path>");
        process.exit(1);
      }
      await showScriptsByRootPathCommand(options[0]);
      break;
    case "create":
      await createScriptTui();
      break;
    case "update":
      await updateScriptTui();
      break;
    case "delete":
      await deleteScriptTui();
      break;
    case "delete-by-path":
      await deleteScriptsByRootPathTui();
      break;
    case "export":
      await exportScriptsTui();
      break;
    case "import":
      await importScriptsTui();
      break;
    default:
      logger2.error(`Error: Unknown scripts subcommand '${subcommand}'`);
      logger2.plainLog("Available scripts subcommands: show, show-by-path, create, update, delete, delete-by-path, export, import");
      process.exit(1);
  }
}

// commands/session/saveSession.ts
import { SaveSession, ConfigurableLogger as ConfigurableLogger20, GitService, Terminal } from "codestate-core";

// commands/session/utils.ts
async function promptSessionDetails(defaults) {
  return inquirer_default.customPrompt([
    {
      type: "input",
      name: "sessionName",
      message: "Enter session name:",
      default: defaults?.name || "",
      validate: (input) => {
        if (!input.trim()) {
          return "Session name is required";
        }
        return true;
      }
    },
    {
      type: "input",
      name: "sessionNotes",
      message: "Enter session notes (optional):",
      default: defaults?.notes || ""
    },
    {
      type: "input",
      name: "sessionTags",
      message: "Enter session tags (comma-separated, optional):",
      default: defaults?.tags || ""
    }
  ]);
}
async function promptDirtyState(gitStatus, canStash) {
  const choices = [
    { name: "Commit changes", value: "commit" }
  ];
  if (canStash) {
    choices.push({ name: "Stash changes", value: "stash" });
  }
  choices.push({ name: "Cancel", value: "cancel" });
  return inquirer_default.customPrompt([
    {
      type: "list",
      name: "dirtyAction",
      message: "How would you like to handle these changes?",
      choices
    }
  ]);
}
async function getCurrentGitState(gitService, logger2) {
  const currentBranchResult = await gitService.getCurrentBranch();
  const currentCommitResult = await gitService.getCurrentCommit();
  const isDirtyResult = await gitService.getIsDirty();
  if (!currentBranchResult.ok || !currentCommitResult.ok || !isDirtyResult.ok) {
    logger2.error("Failed to get Git state", {
      branchError: currentBranchResult.ok ? void 0 : currentBranchResult.error,
      commitError: currentCommitResult.ok ? void 0 : currentCommitResult.error,
      isDirtyError: isDirtyResult.ok ? void 0 : isDirtyResult.error
    });
    return null;
  }
  return {
    branch: currentBranchResult.value,
    commit: currentCommitResult.value,
    isDirty: isDirtyResult.value,
    stashId: null
    // No stash ID for current state
  };
}
async function handleSessionSave({
  sessionDetails,
  projectRoot,
  git,
  saveSession,
  logger: logger2
}) {
  const result = await saveSession.execute({
    name: sessionDetails.sessionName,
    projectRoot,
    notes: sessionDetails.sessionNotes || "",
    tags: sessionDetails.sessionTags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
    files: [],
    git,
    extensions: {}
  });
  if (result.ok) {
    logger2.log(`\u2705 Session "${sessionDetails.sessionName}" saved successfully!`);
  } else {
    logger2.error("Failed to save session", { error: result.error });
  }
  return result;
}

// commands/session/saveSession.ts
async function saveSessionCommand() {
  const logger2 = new ConfigurableLogger20();
  const saveSession = new SaveSession();
  const gitService = new GitService();
  try {
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger2.warn("Current directory is not a Git repository.");
      const { continueWithoutGit } = await inquirer_default.customPrompt([
        {
          type: "confirm",
          name: "continueWithoutGit",
          message: "Do you want to continue without Git integration?",
          default: false
        }
      ]);
      if (!continueWithoutGit) {
        logger2.warn("Session save cancelled.");
        return;
      }
      const sessionDetails2 = await promptSessionDetails();
      const projectRoot2 = process.cwd();
      await handleSessionSave({
        sessionDetails: sessionDetails2,
        projectRoot: projectRoot2,
        git: {
          branch: "no-git",
          commit: "no-git",
          isDirty: false,
          stashId: null
        },
        saveSession,
        logger: logger2
      });
      return;
    }
    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger2.error("Failed to get Git status", { error: gitStatusResult.error });
      return;
    }
    const gitStatus = gitStatusResult.value;
    if (gitStatus.isDirty) {
      logger2.warn("\u26A0\uFE0F Repository has uncommitted changes:");
      gitStatus.dirtyFiles.forEach((file) => {
        logger2.plainLog(`  ${file.status}: ${file.path}`);
      });
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;
      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === "cancel") {
        logger2.warn("Session save cancelled.");
        return;
      }
      if (dirtyAction === "commit") {
        const configResult = await gitService.isGitConfigured();
        if (!configResult.ok) {
          logger2.error("Failed to check Git configuration", { error: configResult.error });
          logger2.warn("Session save cancelled.");
          return;
        }
        if (!configResult.value) {
          logger2.error("Git is not properly configured for commits.");
          logger2.warn("Please configure Git with your name and email:");
          logger2.warn('  git config --global user.name "Your Name"');
          logger2.warn('  git config --global user.email "your.email@example.com"');
          const { configureGit } = await inquirer_default.customPrompt([
            {
              type: "confirm",
              name: "configureGit",
              message: "Would you like to configure Git now?",
              default: false
            }
          ]);
          if (configureGit) {
            const { userName, userEmail } = await inquirer_default.customPrompt([
              {
                type: "input",
                name: "userName",
                message: "Enter your name for Git:",
                validate: (input) => {
                  if (!input.trim()) {
                    return "Name is required";
                  }
                  return true;
                }
              },
              {
                type: "input",
                name: "userEmail",
                message: "Enter your email for Git:",
                validate: (input) => {
                  if (!input.trim()) {
                    return "Email is required";
                  }
                  return true;
                }
              }
            ]);
            const terminal = new Terminal();
            await terminal.execute(`git config user.name "${userName}"`);
            await terminal.execute(`git config user.email "${userEmail}"`);
            logger2.log("Git configured successfully.");
          } else {
            logger2.warn("Session save cancelled.");
            return;
          }
        }
        const { commitMessage } = await inquirer_default.customPrompt([
          {
            type: "input",
            name: "commitMessage",
            message: "Enter commit message:",
            validate: (input) => {
              if (!input.trim()) {
                return "Commit message is required";
              }
              return true;
            }
          }
        ]);
        logger2.log(" Committing changes...");
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger2.error("Failed to commit changes", {
            error: commitResult.error,
            message: commitResult.error.message
          });
          logger2.warn("Git commit failed. This might be due to:");
          logger2.warn("  - No changes to commit");
          logger2.warn("  - Git configuration issues");
          logger2.warn("  - Repository permissions");
          logger2.warn('Consider using "stash" instead or check your git status.');
          const { retryAction } = await inquirer_default.customPrompt([
            {
              type: "list",
              name: "retryAction",
              message: "What would you like to do?",
              choices: [
                { name: "Try stashing instead", value: "stash" },
                { name: "Cancel session save", value: "cancel" }
              ]
            }
          ]);
          if (retryAction === "stash") {
            logger2.log("Attempting to stash changes...");
            const stashResult = await gitService.createStash("Session save stash");
            if (!stashResult.ok) {
              logger2.error("Failed to stash changes", { error: stashResult.error });
              logger2.warn("Session save cancelled.");
              return;
            }
            logger2.log("Changes stashed successfully.");
          } else {
            logger2.warn("Session save cancelled.");
            return;
          }
        } else {
          logger2.log(" Changes committed successfully.");
        }
      } else if (dirtyAction === "stash") {
        const stashResult = await gitService.createStash("Session save stash");
        if (!stashResult.ok) {
          logger2.error("Failed to stash changes", { error: stashResult.error });
          return;
        }
      }
    }
    const gitState = await getCurrentGitState(gitService, logger2);
    if (!gitState)
      return;
    const sessionDetails = await promptSessionDetails();
    const projectRoot = process.cwd();
    await handleSessionSave({
      sessionDetails,
      projectRoot,
      git: {
        ...gitState,
        isDirty: false,
        stashId: null
      },
      saveSession,
      logger: logger2
    });
  } catch (error) {
    logger2.error("Unexpected error during session save", { error });
  }
}

// commands/session/resumeSession.ts
import { ResumeSession, ConfigurableLogger as ConfigurableLogger21, GitService as GitService2, ListSessions, SaveSession as SaveSession2, UpdateSession, GetConfig as GetConfig2, OpenIDE, OpenFiles } from "codestate-core";
import { ApplyStash } from "codestate-core";
import { GetScriptsByRootPath as GetScriptsByRootPath2 } from "codestate-core";

// ../infrastructure/services/Terminal/TerminalService.ts
import { isFailure } from "codestate-core";
import { TerminalError, ErrorCode } from "codestate-core";
import { spawn } from "child_process";
import { platform } from "os";
var TerminalService = class {
  constructor(logger2) {
    this.logger = logger2;
  }
  async execute(command, options) {
    this.logger.debug("TerminalService.execute called", { command, options });
    const terminalCommand = {
      command,
      ...options
    };
    return this.executeCommand(terminalCommand);
  }
  async executeCommand(command) {
    this.logger.debug("TerminalService.executeCommand called", { command });
    const startTime = Date.now();
    try {
      if (!command.command || command.command.trim().length === 0) {
        return { ok: false, error: new TerminalError("Command cannot be empty", ErrorCode.TERMINAL_COMMAND_FAILED) };
      }
      const spawnOptions = {
        cwd: command.cwd || process.cwd(),
        env: { ...process.env, ...command.env },
        shell: this.getDefaultShell(),
        timeout: command.timeout || 3e4
        // 30 seconds default
      };
      const [cmd, args2] = this.parseCommand(command.command);
      const result = await this.spawnCommand(cmd, args2, spawnOptions);
      const duration = Date.now() - startTime;
      const terminalResult = {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration
      };
      this.logger.log("Command executed", {
        command: command.command,
        exitCode: result.exitCode,
        duration,
        success: terminalResult.success
      });
      return { ok: true, value: terminalResult };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Command execution failed", { command: command.command, error, duration });
      return {
        ok: false,
        error: new TerminalError(
          `Command execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        )
      };
    }
  }
  async executeBatch(commands) {
    this.logger.debug("TerminalService.executeBatch called", { count: commands.length });
    const results = [];
    for (const command of commands) {
      const result = await this.executeCommand(command);
      if (isFailure(result)) {
        this.logger.error("Batch execution failed", { command: command.command, error: result.error });
        return { ok: false, error: result.error };
      }
      results.push(result.value);
    }
    this.logger.log("Batch execution completed", { count: results.length });
    return { ok: true, value: results };
  }
  async spawnTerminal(command, options) {
    this.logger.debug("TerminalService.spawnTerminal called", { command, options });
    const terminalCommand = {
      command,
      ...options
    };
    return this.spawnTerminalCommand(terminalCommand);
  }
  async spawnTerminalCommand(command) {
    this.logger.debug("TerminalService.spawnTerminalCommand called", { command });
    try {
      if (!command.command || command.command.trim().length === 0) {
        return { ok: false, error: new TerminalError("Command cannot be empty", ErrorCode.TERMINAL_COMMAND_FAILED) };
      }
      const terminalCmd = this.getTerminalCommand();
      const shell = this.getDefaultShell();
      const spawnOptions = {
        cwd: command.cwd || process.cwd(),
        env: { ...process.env, ...command.env },
        detached: true,
        // Important: run in detached mode so it opens in a new window
        stdio: "ignore"
        // Ignore stdio to prevent hanging
      };
      const [cmd, args2] = this.parseCommand(command.command);
      const fullCommand = `${cmd} ${args2.join(" ")}`;
      const terminalArgs = this.getTerminalArgs(terminalCmd, shell, fullCommand, command.cwd);
      const child = spawn(terminalCmd, terminalArgs, spawnOptions);
      child.unref();
      this.logger.log("Terminal spawned successfully", {
        command: command.command,
        terminalCmd,
        terminalArgs
      });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error("Failed to spawn terminal", { command: command.command, error });
      return {
        ok: false,
        error: new TerminalError(
          `Failed to spawn terminal: ${error instanceof Error ? error.message : "Unknown error"}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        )
      };
    }
  }
  async isCommandAvailable(command) {
    this.logger.debug("TerminalService.isCommandAvailable called", { command });
    try {
      const osPlatform = platform();
      if (osPlatform === "win32") {
        if (command.includes("\\") && command.endsWith(".exe")) {
          const fs4 = await import("fs");
          const exists = fs4.existsSync(command);
          return { ok: true, value: exists };
        } else {
          const result = await this.executeCommand({
            command: `powershell -Command "Get-Command '${command}' -ErrorAction SilentlyContinue"`,
            timeout: 5e3
          });
          return { ok: true, value: result.ok && result.value.success && result.value.stdout.trim() !== "" };
        }
      } else {
        const result = await this.executeCommand({
          command: `which ${command}`,
          timeout: 5e3
        });
        return { ok: true, value: result.ok && result.value.success };
      }
    } catch (error) {
      this.logger.debug("Command availability check failed", { command, error });
      return { ok: true, value: false };
    }
  }
  async getShell() {
    this.logger.debug("TerminalService.getShell called");
    try {
      const shell = this.getDefaultShell();
      this.logger.log("Shell detected", { shell });
      return { ok: true, value: shell };
    } catch (error) {
      this.logger.error("Failed to get shell", { error });
      return { ok: false, error: new TerminalError("Failed to get shell", ErrorCode.TERMINAL_COMMAND_FAILED) };
    }
  }
  getDefaultShell() {
    const osPlatform = platform();
    switch (osPlatform) {
      case "win32":
        return process.env.COMSPEC || "cmd.exe";
      case "darwin":
        return process.env.SHELL || "/bin/zsh";
      default:
        return process.env.SHELL || "/bin/bash";
    }
  }
  getTerminalCommand() {
    const osPlatform = platform();
    if (osPlatform === "win32") {
      return "cmd.exe";
    } else if (osPlatform === "darwin") {
      return "open";
    } else {
      return "gnome-terminal";
    }
  }
  getTerminalArgs(terminalCmd, shell, command, cwd) {
    const args2 = [];
    if (terminalCmd === "cmd.exe") {
      args2.push("/c", "start", "cmd", "/k", command);
    } else if (terminalCmd === "open") {
      args2.push("-a", "Terminal", command);
    } else {
      args2.push("--", shell, "-c", command);
      if (cwd) {
        args2.unshift("--working-directory", cwd);
      }
    }
    return args2;
  }
  parseCommand(commandString) {
    const parts = commandString.match(/(?:[^\s"']+|"[^"]*"|'[^']*')/g) || [];
    const cmd = parts[0] || "";
    const args2 = parts.slice(1).map((arg) => {
      if (arg.startsWith('"') && arg.endsWith('"') || arg.startsWith("'") && arg.endsWith("'")) {
        return arg.slice(1, -1);
      }
      return arg;
    });
    return [cmd, args2];
  }
  spawnCommand(command, args2, options) {
    return new Promise((resolve, reject) => {
      const process2 = spawn(command, args2, options);
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        process2.kill("SIGTERM");
        reject(new TerminalError("Command timed out", ErrorCode.TERMINAL_TIMEOUT));
      }, options.timeout || 3e4);
      process2.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      process2.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      process2.on("close", (code) => {
        clearTimeout(timeout);
        resolve({
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      process2.on("error", (error) => {
        clearTimeout(timeout);
        reject(new TerminalError(`Process error: ${error.message}`, ErrorCode.TERMINAL_COMMAND_FAILED));
      });
      process2.on("exit", (code, signal) => {
        clearTimeout(timeout);
        if (signal) {
          reject(new TerminalError(`Process killed by signal: ${signal}`, ErrorCode.TERMINAL_COMMAND_FAILED));
        } else {
          resolve({
            exitCode: code || 0,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        }
      });
    });
  }
};

// ../infrastructure/services/FileLogger.ts
import { appendFileSync, mkdirSync } from "fs";
import * as path from "path";
var LOG_LEVEL_PRIORITY = {
  "ERROR": 0,
  "WARN": 1,
  "LOG": 2,
  "DEBUG": 3
};
var FileLogger = class {
  constructor(config) {
    if (!config.filePath)
      throw new Error("FileLogger requires filePath in LoggerConfig");
    this.level = config.level;
    this.filePath = config.filePath;
    this.ensureLogDirectory();
  }
  plainLog(message, meta) {
    const entry = {
      level: "plain",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message,
      ...meta ? { meta } : {}
    };
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", { encoding: "utf8" });
  }
  ensureLogDirectory() {
    const logDir = path.dirname(this.filePath);
    try {
      mkdirSync(logDir, { recursive: true });
    } catch (error) {
    }
  }
  shouldLog(messageLevel) {
    return LOG_LEVEL_PRIORITY[this.level] >= LOG_LEVEL_PRIORITY[messageLevel];
  }
  write(level, message, meta) {
    const entry = {
      level,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message,
      ...meta ? { meta } : {}
    };
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", { encoding: "utf8" });
  }
  log(message, meta) {
    if (!this.shouldLog("LOG"))
      return;
    this.write("log", message, meta);
  }
  error(message, meta) {
    if (!this.shouldLog("ERROR"))
      return;
    this.write("error", message, meta);
  }
  warn(message, meta) {
    if (!this.shouldLog("WARN"))
      return;
    this.write("warn", message, meta);
  }
  debug(message, meta) {
    if (!this.shouldLog("DEBUG"))
      return;
    this.write("debug", message, meta);
  }
};

// ../infrastructure/services/Terminal/TerminalFacade.ts
import * as path2 from "path";
var TerminalFacade = class {
  constructor(logger2) {
    const _logger = logger2 || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path2.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    });
    this.service = new TerminalService(_logger);
  }
  async execute(command, options) {
    return this.service.execute(command, options);
  }
  async executeCommand(command) {
    return this.service.executeCommand(command);
  }
  async executeBatch(commands) {
    return this.service.executeBatch(commands);
  }
  async spawnTerminal(command, options) {
    return this.service.spawnTerminal(command, options);
  }
  async spawnTerminalCommand(command) {
    return this.service.spawnTerminalCommand(command);
  }
  async isCommandAvailable(command) {
    return this.service.isCommandAvailable(command);
  }
  async getShell() {
    return this.service.getShell();
  }
};

// commands/session/resumeSession.ts
async function resumeSessionCommand(sessionIdOrName) {
  const logger2 = new ConfigurableLogger21();
  const resumeSession = new ResumeSession();
  const gitService = new GitService2();
  const listSessions = new ListSessions();
  const saveSession = new SaveSession2();
  const updateSession = new UpdateSession();
  const terminal = new TerminalFacade();
  try {
    let targetSession = sessionIdOrName;
    if (!targetSession) {
      const sessionsResult = await listSessions.execute();
      if (!sessionsResult.ok || sessionsResult.value.length === 0) {
        logger2.warn("No saved sessions found.");
        return;
      }
      const sessions = sessionsResult.value;
      const { selectedSession } = await inquirer_default.customPrompt([
        {
          type: "list",
          name: "selectedSession",
          message: "Select a session to resume:",
          choices: sessions.map((s) => ({ name: `${s.name} (${s.projectRoot})`, value: s.id }))
        }
      ]);
      targetSession = selectedSession || "";
    }
    if (!targetSession || !targetSession.trim()) {
      logger2.log("No session specified. Resume cancelled.");
      return;
    }
    const sessionResult = await resumeSession.execute(targetSession);
    if (!sessionResult.ok) {
      logger2.error("Failed to load session", { error: sessionResult.error });
      return;
    }
    const session = sessionResult.value;
    logger2.plainLog(`
\u{1F4CB} Resuming session: "${session.name}"`);
    const currentDir = process.cwd();
    if (currentDir !== session.projectRoot) {
      logger2.warn(`You are in ${currentDir}`);
      logger2.log(`Session was saved from ${session.projectRoot}`);
      const { changeDirectory } = await inquirer_default.customPrompt([
        {
          type: "confirm",
          name: "changeDirectory",
          message: "Do you want to change to the session directory?",
          default: true
        }
      ]);
      if (changeDirectory) {
        logger2.log(`Changing to ${session.projectRoot}...`);
        process.chdir(session.projectRoot);
      } else {
        logger2.log("Continuing in current directory...");
      }
    }
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger2.warn("Current directory is not a Git repository.");
      logger2.plainLog("Cannot restore Git state. Session resumed without Git integration.");
      return;
    }
    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger2.error("Failed to get Git status", { error: gitStatusResult.error });
      return;
    }
    const gitStatus = gitStatusResult.value;
    if (gitStatus.isDirty) {
      logger2.warn("Current repository has uncommitted changes:");
      gitStatus.dirtyFiles.forEach((file) => {
        logger2.plainLog(`  ${file.status}: ${file.path}`);
      });
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;
      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === "cancel") {
        logger2.warn("Session resume cancelled.");
        return;
      }
      if (dirtyAction === "save") {
        logger2.log("Saving current work as new session...");
        const sessionDetails = await promptSessionDetails();
        const gitState = await getCurrentGitState(gitService, logger2);
        if (!gitState)
          return;
        await handleSessionSave({
          sessionDetails,
          projectRoot: process.cwd(),
          git: {
            ...gitState,
            isDirty: false,
            stashId: null
          },
          saveSession,
          logger: logger2
        });
        logger2.log("Current work saved. Proceeding with resume...");
      } else if (dirtyAction === "discard") {
        await terminal.execute("git reset --hard");
        await terminal.execute("git clean -fd");
        logger2.log("Changes discarded. Proceeding with resume...");
      }
    }
    const currentBranchResult = await gitService.getCurrentBranch();
    if (currentBranchResult.ok && currentBranchResult.value !== session.git.branch) {
      await terminal.execute(`git checkout ${session.git.branch}`);
    }
    if (session.git.stashId) {
      logger2.log(`Applying stash ${session.git.stashId}...`);
      const applyStash = new ApplyStash();
      const stashResult = await applyStash.execute(session.git.stashId);
      if (stashResult.ok && stashResult.value.success) {
      } else {
        logger2.error("Failed to apply stash", {
          error: stashResult.ok ? stashResult.value.error : stashResult.error
        });
      }
    }
    const getScriptsByRootPath = new GetScriptsByRootPath2();
    const scriptsResult = await getScriptsByRootPath.execute(session.projectRoot);
    if (scriptsResult.ok && scriptsResult.value.length > 0) {
      for (const script of scriptsResult.value) {
        const spawnResult = await terminal.spawnTerminal(script.script, {
          cwd: session.projectRoot,
          timeout: 5e3
          // Short timeout for spawning
        });
        if (!spawnResult.ok) {
          logger2.error(`Failed to spawn terminal for script: ${script.name || script.script}`, {
            error: spawnResult.error
          });
        } else {
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      logger2.log("No scripts to execute.");
    }
    const getConfig = new GetConfig2();
    const configResult = await getConfig.execute();
    if (configResult.ok && configResult.value.ide) {
      const configuredIDE = configResult.value.ide;
      const openIDE = new OpenIDE();
      const ideResult = await openIDE.execute(configuredIDE, session.projectRoot);
      if (ideResult.ok) {
        logger2.log(`IDE '${configuredIDE}' opened successfully`);
        if (session.files && session.files.length > 0) {
          const openFiles = new OpenFiles();
          const filesResult = await openFiles.execute({
            ide: configuredIDE,
            projectRoot: session.projectRoot,
            files: session.files.map((file) => ({
              path: file.path,
              line: file.cursor?.line,
              column: file.cursor?.column,
              isActive: file.isActive
            }))
          });
          if (filesResult.ok) {
          } else {
            logger2.error("Failed to open files in IDE", { error: filesResult.error });
          }
        } else {
          logger2.log("No files to open from session");
        }
      } else {
        logger2.error(`Failed to open IDE '${configuredIDE}'`, { error: ideResult.error });
        logger2.warn("Continuing without IDE...");
      }
    } else {
    }
    logger2.log(`
\u2705 Session "${session.name}" resumed successfully!`);
    if (session.notes) {
      logger2.plainLog(`
\u{1F4DD} Notes: ${session.notes}`);
    }
    if (session.tags.length > 0) {
      logger2.log(`\u{1F3F7}\uFE0F  Tags: ${session.tags.join(", ")}`);
    }
  } catch (error) {
    logger2.error("Unexpected error during session resume", { error });
  }
}

// commands/session/updateSession.ts
import { UpdateSession as UpdateSession2, ConfigurableLogger as ConfigurableLogger22, GitService as GitService3 } from "codestate-core";
async function updateSessionCommand(sessionIdOrName) {
  const logger2 = new ConfigurableLogger22();
  const updateSession = new UpdateSession2();
  const gitService = new GitService3();
  const terminal = new TerminalFacade();
  try {
    let targetSession = sessionIdOrName;
    if (!targetSession) {
      const { UpdateSession: UpdateSession3 } = await import("codestate-core");
      const listSessions = new (await import("codestate-core")).ListSessions();
      const sessionsResult = await listSessions.execute();
      if (!sessionsResult.ok || sessionsResult.value.length === 0) {
        logger2.warn("No saved sessions found.");
        return;
      }
      const sessions = sessionsResult.value;
      const { selectedSession } = await inquirer_default.customPrompt([
        {
          type: "list",
          name: "selectedSession",
          message: "Select a session to update:",
          choices: sessions.map((s) => ({ name: `${s.name} (${s.projectRoot})`, value: s.id }))
        }
      ]);
      targetSession = selectedSession || "";
    }
    if (!targetSession || !targetSession.trim()) {
      logger2.log("No session specified. Update cancelled.");
      return;
    }
    const sessionResult = await updateSession.execute(targetSession, {});
    if (!sessionResult.ok) {
      logger2.error("Failed to load session", { error: sessionResult.error });
      return;
    }
    const session = sessionResult.value;
    logger2.plainLog(`
\u{1F4CB} Updating session: "${session.name}"`);
    logger2.log(`\u2705 Project: ${session.projectRoot}`);
    logger2.log(`\u2705 Branch: ${session.git.branch}`);
    logger2.log(`\u2705 Commit: ${session.git.commit}`);
    const currentDir = process.cwd();
    if (currentDir !== session.projectRoot) {
      logger2.warn(`You are in ${currentDir}`);
      logger2.log(`Session was saved from ${session.projectRoot}`);
      const { changeDirectory } = await inquirer_default.customPrompt([
        {
          type: "confirm",
          name: "changeDirectory",
          message: "Do you want to change to the session directory?",
          default: true
        }
      ]);
      if (changeDirectory) {
        logger2.log(`Changing to ${session.projectRoot}...`);
        process.chdir(session.projectRoot);
      } else {
        logger2.log("Continuing in current directory...");
      }
    }
    const isRepoResult = await gitService.isGitRepository();
    if (!isRepoResult.ok || !isRepoResult.value) {
      logger2.warn("Current directory is not a Git repository.");
      logger2.plainLog("Cannot update Git state. Session update cancelled.");
      return;
    }
    const gitStatusResult = await gitService.getStatus();
    if (!gitStatusResult.ok) {
      logger2.error("Failed to get Git status", { error: gitStatusResult.error });
      return;
    }
    const gitStatus = gitStatusResult.value;
    if (gitStatus.isDirty) {
      logger2.warn("\u26A0\uFE0F Current repository has uncommitted changes:");
      gitStatus.dirtyFiles.forEach((file) => {
        logger2.plainLog(`  ${file.status}: ${file.path}`);
      });
      const hasNewFiles = gitStatus.newFiles.length > 0;
      const hasDeletedFiles = gitStatus.deletedFiles.length > 0;
      const hasUntrackedFiles = gitStatus.untrackedFiles.length > 0;
      const canStash = !hasNewFiles && !hasDeletedFiles && !hasUntrackedFiles;
      const { dirtyAction } = await promptDirtyState(gitStatus, canStash);
      if (dirtyAction === "cancel") {
        logger2.warn("Session update cancelled.");
        return;
      }
      if (dirtyAction === "commit") {
        const { commitMessage } = await inquirer_default.customPrompt([
          {
            type: "input",
            name: "commitMessage",
            message: "Enter commit message:",
            validate: (input) => {
              if (!input.trim()) {
                return "Commit message is required";
              }
              return true;
            }
          }
        ]);
        logger2.log(" Committing changes...");
        const commitResult = await gitService.commitChanges(commitMessage);
        if (!commitResult.ok) {
          logger2.error("Failed to commit changes", { error: commitResult.error });
          logger2.warn("Session update cancelled.");
          return;
        }
        logger2.log(" Changes committed successfully");
      } else if (dirtyAction === "stash") {
        logger2.log("Stashing changes...");
        const stashResult = await gitService.createStash("Session update stash");
        if (!stashResult.ok || !stashResult.value.success) {
          logger2.error("Failed to stash changes", { error: stashResult.error });
          logger2.warn("Session update cancelled.");
          return;
        }
        logger2.log("Changes stashed successfully");
      }
    }
    const gitState = await getCurrentGitState(gitService, logger2);
    if (!gitState) {
      logger2.error("Failed to capture Git state");
      return;
    }
    const sessionDetails = await promptSessionDetails({
      name: session.name,
      // Session name is immutable
      notes: session.notes || "",
      tags: session.tags.join(", ")
      // Convert array to string for prompt
    });
    const updateResult = await updateSession.execute(targetSession, {
      notes: sessionDetails.sessionNotes,
      tags: sessionDetails.sessionTags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      git: gitState,
      files: [],
      // Empty array in CLI mode
      extensions: {}
    });
    if (!updateResult.ok) {
      logger2.error("Failed to update session", { error: updateResult.error });
      return;
    }
    const updatedSession = updateResult.value;
    logger2.log(`
\u2705 Session "${updatedSession.name}" updated successfully!`);
    if (updatedSession.notes) {
      logger2.plainLog(`
\u{1F4DD} Notes: ${updatedSession.notes}`);
    }
    if (updatedSession.tags.length > 0) {
      logger2.log(`\u{1F3F7}\uFE0F  Tags: ${updatedSession.tags.join(", ")}`);
    }
  } catch (error) {
    logger2.error("Unexpected error during session update", { error });
  }
}

// commands/session/listSessions.ts
import { ListSessions as ListSessions2, ConfigurableLogger as ConfigurableLogger23 } from "codestate-core";
async function listSessionsCommand() {
  const logger2 = new ConfigurableLogger23();
  const listSessions = new ListSessions2();
  try {
    logger2.log("\u{1F4CB} Available Sessions:");
    logger2.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    const result = await listSessions.execute();
    if (!result.ok) {
      logger2.error("Failed to list sessions", { error: result.error });
      return;
    }
    const sessions = result.value;
    if (sessions.length === 0) {
      logger2.log("No sessions found.");
      return;
    }
    const sessionsByProject = sessions.reduce((acc, session) => {
      const projectPath = session.projectRoot;
      if (!acc[projectPath]) {
        acc[projectPath] = [];
      }
      acc[projectPath].push(session);
      return acc;
    }, {});
    Object.entries(sessionsByProject).forEach(([projectPath, projectSessions]) => {
      logger2.log(`
\u{1F4C1} ${projectPath} (${projectSessions.length} session${projectSessions.length > 1 ? "s" : ""})`);
      logger2.log("\u2500".repeat(projectPath.length + 10));
      projectSessions.forEach((session) => {
        const tags = session.tags.length > 0 ? ` [${session.tags.join(", ")}]` : "";
        const notes = session.notes ? ` - ${session.notes}` : "";
        logger2.log(`  \u2022 ${session.name}${tags}${notes}`);
        logger2.log(`    ID: ${session.id} | Created: ${new Date(session.createdAt).toLocaleString()}`);
        if (session.git) {
          logger2.log(`    Git: ${session.git.branch} (${session.git.commit.substring(0, 8)})`);
        }
      });
    });
    logger2.log(`
Total: ${sessions.length} session${sessions.length > 1 ? "s" : ""}`);
  } catch (error) {
    logger2.error("Unexpected error while listing sessions", { error });
  }
}

// commands/session/deleteSession.ts
import { DeleteSession, ListSessions as ListSessions3, ConfigurableLogger as ConfigurableLogger24 } from "codestate-core";
async function deleteSessionCommand(sessionIdOrName) {
  const logger2 = new ConfigurableLogger24();
  const deleteSession = new DeleteSession();
  const listSessions = new ListSessions3();
  try {
    if (!sessionIdOrName) {
      logger2.log("\u{1F4CB} Available Sessions:");
      logger2.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
      const listResult = await listSessions.execute();
      if (!listResult.ok) {
        logger2.error("Failed to list sessions", { error: listResult.error });
        return;
      }
      const sessions = listResult.value;
      if (sessions.length === 0) {
        logger2.log("No sessions found to delete.");
        return;
      }
      const choices = sessions.map((session) => ({
        name: `${session.name} (${session.projectRoot}) - ${session.id}`,
        value: session.id
      }));
      const { selectedSessionId } = await inquirer_default.customPrompt([
        {
          type: "list",
          name: "selectedSessionId",
          message: "Select a session to delete:",
          choices
        }
      ]);
      sessionIdOrName = selectedSessionId;
    }
    const { confirm } = await inquirer_default.customPrompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete session "${sessionIdOrName}"?`,
        default: false
      }
    ]);
    if (!confirm) {
      logger2.log("Session deletion cancelled.");
      return;
    }
    const result = await deleteSession.execute(sessionIdOrName);
    if (result.ok) {
      logger2.log(`\u2705 Session "${sessionIdOrName}" deleted successfully!`);
    } else {
      logger2.error("Failed to delete session", { error: result.error });
    }
  } catch (error) {
    logger2.error("Unexpected error while deleting session", { error });
  }
}

// tui/session/cliHandler.ts
import { ConfigurableLogger as ConfigurableLogger25 } from "codestate-core";
async function handleSessionCommand(subcommand, options) {
  const logger2 = new ConfigurableLogger25();
  switch (subcommand) {
    case "save":
      await saveSessionCommand();
      break;
    case "resume":
      const sessionIdOrName = options[0];
      await resumeSessionCommand(sessionIdOrName);
      break;
    case "update":
      const updateSessionIdOrName = options[0];
      await updateSessionCommand(updateSessionIdOrName);
      break;
    case "list":
      await listSessionsCommand();
      break;
    case "delete":
      const deleteSessionIdOrName = options[0];
      await deleteSessionCommand(deleteSessionIdOrName);
      break;
    default:
      logger2.error(`Error: Unknown session subcommand '${subcommand}'`);
      logger2.plainLog("Available session commands: save, resume, update, list, delete");
      process.exit(1);
  }
}

// commands/index.ts
import { ConfigurableLogger as ConfigurableLogger26 } from "codestate-core";
async function handleCommand(command, subcommand, options) {
  const logger2 = new ConfigurableLogger26();
  switch (command) {
    case "config":
      await handleConfigCommand(subcommand, options);
      break;
    case "scripts":
      await handleScriptCommand(subcommand, options);
      break;
    case "session":
      await handleSessionCommand(subcommand, options);
      break;
    default:
      logger2.error(`Error: Unknown command '${command}'`);
      logger2.plainLog("Available commands: config, scripts, session, git");
      process.exit(1);
  }
}

// cli.ts
import { ConfigurableLogger as ConfigurableLogger27 } from "codestate-core";
var args = process.argv.slice(2);
var logger = new ConfigurableLogger27();
process.on("SIGINT", () => {
  logger.plainLog("\n\u{1F44B} You have exited CodeState CLI");
  process.exit(0);
});
function showHelp() {
  logger.plainLog(`
CodeState CLI - Configuration, Script, and Git Management

Usage: codestate <command> [options]

Commands:
  config show     Show current configuration
  config edit     Edit configuration interactively
  config reset    Reset configuration to defaults
  config export   Export configuration to file
  config import   Import configuration from file
  
  scripts show              Show all scripts
  scripts show-by-path      Show scripts for specific root path
  scripts create            Create scripts interactively
  scripts update            Update scripts interactively
  scripts delete            Delete scripts interactively
  scripts delete-by-path    Delete all scripts for a root path
  scripts export            Export scripts to JSON
  scripts import            Import scripts from JSON
  
  session save              Save current session
  session resume            Resume a saved session
  session update            Update a saved session

Examples:
  codestate config show
  codestate config edit
  codestate scripts show
  codestate scripts create
  codestate scripts show-by-path /home/user/project

Options:
  --help, -h      Show this help message
  --version, -v   Show version information
`);
}
function showVersion() {
  logger.plainLog("CodeState CLI v1.0.0");
}
async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return;
  }
  const [command, subcommand, ...options] = args;
  if (!command) {
    logger.error("Error: No command specified");
    showHelp();
    process.exit(1);
  }
  try {
    await handleCommand(command, subcommand, options);
  } catch (error) {
    logger.error("Error:", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}
main();
//# sourceMappingURL=cli.js.map
