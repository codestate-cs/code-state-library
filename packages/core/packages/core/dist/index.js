// domain/models/Result.ts
function isSuccess(result) {
  return result.ok === true;
}
function isFailure(result) {
  return result.ok === false;
}

// services/config/ConfigService.ts
var ConfigService = class {
  constructor(repository, logger) {
    this.repository = repository;
    this.logger = logger;
  }
  async getConfig() {
    this.logger.debug("ConfigService.getConfig called");
    const result = await this.repository.load();
    if (isFailure(result)) {
      this.logger.error("Failed to get config", { error: result.error });
    } else {
      this.logger.log("Config loaded", {});
    }
    return result;
  }
  async setConfig(config) {
    this.logger.debug("ConfigService.setConfig called");
    const result = await this.repository.save(config);
    if (isFailure(result)) {
      this.logger.error("Failed to save config", { error: result.error });
    } else {
      this.logger.log("Config saved", {});
    }
    return result;
  }
  async updateConfig(partial) {
    this.logger.debug("ConfigService.updateConfig called", { partial });
    const current = await this.repository.load();
    if (isFailure(current)) {
      this.logger.error("Failed to load config for update", { error: current.error });
      return current;
    }
    const merged = { ...current.value, ...partial };
    const saveResult = await this.repository.save(merged);
    if (isFailure(saveResult)) {
      this.logger.error("Failed to save updated config", { error: saveResult.error });
      return { ok: false, error: saveResult.error };
    }
    this.logger.log("Config updated", {});
    return { ok: true, value: merged };
  }
};

// domain/schemas/SchemaRegistry.ts
import { z } from "zod";
var LogLevelSchema = z.enum(["ERROR", "WARN", "LOG", "DEBUG"]);
var LoggerConfigSchema = z.object({
  level: LogLevelSchema,
  sinks: z.array(z.enum(["console", "file"])),
  filePath: z.string().optional()
});
var FileStorageConfigSchema = z.object({
  encryptionEnabled: z.boolean(),
  encryptionKey: z.string().optional(),
  dataDir: z.string()
});
var FeatureFlagsSchema = z.object({
  experimentalTui: z.boolean(),
  experimentalIde: z.boolean(),
  advancedSearch: z.boolean(),
  cloudSync: z.boolean()
});
var PluginEnvironmentSchema = z.enum(["cli", "tui", "ide"]);
var ErrorCodeSchema = z.enum([
  "UNKNOWN",
  "CONFIG_INVALID",
  "STORAGE_INVALID_PATH",
  "STORAGE_DECRYPTION_FAILED",
  "STORAGE_READ_FAILED",
  "STORAGE_WRITE_FAILED",
  "STORAGE_DELETE_FAILED",
  "ENCRYPTION_FAILED",
  "ENCRYPTION_INVALID_FORMAT",
  "SCRIPT_INVALID",
  "SCRIPT_DUPLICATE",
  "SCRIPT_NOT_FOUND",
  "SCRIPT_PATH_INVALID",
  "SCRIPT_MALICIOUS",
  "GIT_NOT_REPOSITORY",
  "GIT_COMMAND_FAILED",
  "GIT_STASH_NOT_FOUND",
  "GIT_STASH_CONFLICT",
  "TERMINAL_COMMAND_FAILED",
  "TERMINAL_TIMEOUT",
  "TERMINAL_COMMAND_NOT_FOUND"
]);
var EncryptionConfigSchema = z.object({
  enabled: z.boolean(),
  encryptionKey: z.string().optional()
});
var ConfigSchema = z.object({
  version: z.string(),
  ide: z.string(),
  encryption: EncryptionConfigSchema,
  storagePath: z.string(),
  logger: LoggerConfigSchema,
  experimental: z.record(z.string(), z.boolean()).optional(),
  extensions: z.record(z.string(), z.unknown()).optional()
});
var ScriptSchema = z.object({
  name: z.string().min(1, "Script name is required"),
  rootPath: z.string().min(1, "Root path is required"),
  script: z.string().min(1, "Script command is required")
});
var ScriptIndexEntrySchema = z.object({
  rootPath: z.string().min(1, "Root path is required"),
  referenceFile: z.string().min(1, "Reference file path is required")
});
var ScriptIndexSchema = z.object({
  entries: z.array(ScriptIndexEntrySchema)
});
var ScriptCollectionSchema = z.object({
  scripts: z.array(ScriptSchema)
});
var GitFileStatusSchema = z.enum(["modified", "added", "deleted", "untracked", "renamed", "copied", "updated"]);
var GitFileSchema = z.object({
  path: z.string(),
  status: GitFileStatusSchema,
  staged: z.boolean()
});
var GitStatusSchema = z.object({
  isDirty: z.boolean(),
  dirtyFiles: z.array(GitFileSchema),
  newFiles: z.array(GitFileSchema),
  modifiedFiles: z.array(GitFileSchema),
  deletedFiles: z.array(GitFileSchema),
  untrackedFiles: z.array(GitFileSchema)
});
var GitStashSchema = z.object({
  id: z.string(),
  name: z.string(),
  message: z.string(),
  timestamp: z.number(),
  branch: z.string()
});
var GitStashResultSchema = z.object({
  success: z.boolean(),
  stashId: z.string().optional(),
  error: z.string().optional()
});
var GitStashApplyResultSchema = z.object({
  success: z.boolean(),
  conflicts: z.array(z.string()).optional(),
  error: z.string().optional()
});
var TerminalCommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional()
});
var TerminalResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  duration: z.number(),
  error: z.string().optional()
});
var TerminalOptionsSchema = z.object({
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
  shell: z.string().optional()
});
var FileStateSchema = z.object({
  path: z.string(),
  cursor: z.object({ line: z.number(), column: z.number() }).optional(),
  scroll: z.object({ top: z.number(), left: z.number() }).optional(),
  isActive: z.boolean()
});
var GitStateSchema = z.object({
  branch: z.string(),
  commit: z.string(),
  isDirty: z.boolean(),
  stashId: z.string().nullable().optional()
});
var SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectRoot: z.string(),
  createdAt: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val),
  updatedAt: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  files: z.array(FileStateSchema),
  git: GitStateSchema,
  extensions: z.record(z.string(), z.unknown()).optional()
});
var SessionIndexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  projectRoot: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  referenceFile: z.string()
});
var SessionIndexSchema = z.object({
  version: z.string(),
  sessions: z.array(SessionIndexEntrySchema)
});
function validateFileStorageConfig(data) {
  return FileStorageConfigSchema.parse(data);
}
function validateConfig(data) {
  return ConfigSchema.parse(data);
}
function validateScript(data) {
  return ScriptSchema.parse(data);
}
function validateScriptIndex(data) {
  return ScriptIndexSchema.parse(data);
}
function validateScriptCollection(data) {
  return ScriptCollectionSchema.parse(data);
}
function validateSession(data) {
  return SessionSchema.parse(data);
}
function validateSessionIndex(data) {
  return SessionIndexSchema.parse(data);
}

// domain/types/ErrorTypes.ts
var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
  ErrorCode2["UNKNOWN"] = "UNKNOWN";
  ErrorCode2["CONFIG_INVALID"] = "CONFIG_INVALID";
  ErrorCode2["STORAGE_INVALID_PATH"] = "STORAGE_INVALID_PATH";
  ErrorCode2["STORAGE_DECRYPTION_FAILED"] = "STORAGE_DECRYPTION_FAILED";
  ErrorCode2["STORAGE_READ_FAILED"] = "STORAGE_READ_FAILED";
  ErrorCode2["STORAGE_WRITE_FAILED"] = "STORAGE_WRITE_FAILED";
  ErrorCode2["STORAGE_DELETE_FAILED"] = "STORAGE_DELETE_FAILED";
  ErrorCode2["ENCRYPTION_FAILED"] = "ENCRYPTION_FAILED";
  ErrorCode2["ENCRYPTION_INVALID_FORMAT"] = "ENCRYPTION_INVALID_FORMAT";
  ErrorCode2["SCRIPT_INVALID"] = "SCRIPT_INVALID";
  ErrorCode2["SCRIPT_DUPLICATE"] = "SCRIPT_DUPLICATE";
  ErrorCode2["SCRIPT_NOT_FOUND"] = "SCRIPT_NOT_FOUND";
  ErrorCode2["SCRIPT_PATH_INVALID"] = "SCRIPT_PATH_INVALID";
  ErrorCode2["SCRIPT_MALICIOUS"] = "SCRIPT_MALICIOUS";
  ErrorCode2["GIT_NOT_REPOSITORY"] = "GIT_NOT_REPOSITORY";
  ErrorCode2["GIT_COMMAND_FAILED"] = "GIT_COMMAND_FAILED";
  ErrorCode2["GIT_STASH_NOT_FOUND"] = "GIT_STASH_NOT_FOUND";
  ErrorCode2["GIT_STASH_CONFLICT"] = "GIT_STASH_CONFLICT";
  ErrorCode2["TERMINAL_COMMAND_FAILED"] = "TERMINAL_COMMAND_FAILED";
  ErrorCode2["TERMINAL_TIMEOUT"] = "TERMINAL_TIMEOUT";
  ErrorCode2["TERMINAL_COMMAND_NOT_FOUND"] = "TERMINAL_COMMAND_NOT_FOUND";
  return ErrorCode2;
})(ErrorCode || {});
var AppError = class extends Error {
  constructor(message, code = "UNKNOWN" /* UNKNOWN */, meta) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.meta = meta;
  }
};
var ConfigError = class extends AppError {
  constructor(message, meta) {
    super(message, "CONFIG_INVALID" /* CONFIG_INVALID */, meta);
    this.name = "ConfigError";
  }
};
var StorageError = class extends AppError {
  constructor(message, code = "STORAGE_READ_FAILED" /* STORAGE_READ_FAILED */, meta) {
    super(message, code, meta);
    this.name = "StorageError";
  }
};
var EncryptionError = class extends AppError {
  constructor(message, code = "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */, meta) {
    super(message, code, meta);
    this.name = "EncryptionError";
  }
};
var ScriptError = class extends AppError {
  constructor(message, code = "SCRIPT_INVALID" /* SCRIPT_INVALID */, meta) {
    super(message, code, meta);
    this.name = "ScriptError";
  }
};
var GitError = class extends AppError {
  constructor(message, code = "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */, meta) {
    super(message, code, meta);
    this.name = "GitError";
  }
};
var TerminalError = class extends AppError {
  constructor(message, code = "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */, meta) {
    super(message, code, meta);
    this.name = "TerminalError";
  }
};

// ../infrastructure/repositories/ConfigRepository.ts
import * as fs from "fs/promises";
import * as path from "path";
var DEFAULT_CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "config.json");
var TEMP_SUFFIX = ".tmp";
var BACKUP_SUFFIX = ".bak";
function getDefaultConfig() {
  return {
    version: "1.0.0",
    ide: "vscode",
    encryption: { enabled: false },
    storagePath: path.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate"),
    logger: {
      level: "LOG",
      sinks: ["file"],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    },
    experimental: {},
    extensions: {}
  };
}
var ConfigRepository = class {
  constructor(logger, encryption, configPath = DEFAULT_CONFIG_PATH) {
    this.logger = logger;
    this.encryption = encryption;
    this.configPath = configPath;
  }
  async load() {
    try {
      await this.ensureDir();
      this.logger.debug("Attempting to load config", { path: this.configPath });
      const raw = await fs.readFile(this.configPath, { encoding: "utf8" });
      let data = raw;
      if (raw.startsWith("ENCRYPTED_v1")) {
        this.logger.log("Config file is encrypted. Attempting decryption.", { path: this.configPath });
        const key = "";
        const decrypted = await this.encryption.decrypt(raw, key);
        if (isFailure(decrypted)) {
          this.logger.error("Decryption failed", { error: decrypted.error });
          return { ok: false, error: decrypted.error };
        }
        data = decrypted.value;
      }
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (parseErr) {
        this.logger.error("Config file is corrupt (invalid JSON). Backing up and creating default.", { path: this.configPath });
        await this.backupCorruptConfig();
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      let config;
      try {
        config = validateConfig(parsed);
      } catch (validationErr) {
        this.logger.error("Config file is corrupt (schema validation failed). Backing up and creating default.", { path: this.configPath });
        await this.backupCorruptConfig();
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      this.logger.log("Config loaded successfully", { path: this.configPath, encrypted: raw.startsWith("ENCRYPTED_v1") });
      return { ok: true, value: config };
    } catch (err) {
      if (err.code === "ENOENT") {
        this.logger.warn("Config file not found. Creating default config.", { path: this.configPath });
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      this.logger.error("Failed to load config", { error: err.message, path: this.configPath });
      return { ok: false, error: new ConfigError(err.message) };
    }
  }
  async save(config) {
    try {
      await this.ensureDir();
      this.logger.debug("Attempting to save config", { path: this.configPath });
      const validated = validateConfig(config);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;
      if (config.encryption?.enabled && config.encryption.encryptionKey) {
        this.logger.log("Encrypting config before save", { path: this.configPath });
        const encResult = await this.encryption.encrypt(data, config.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error("Encryption failed", { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      const tempPath = this.configPath + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: "utf8", mode: 384 });
      this.logger.debug("Temp config file written", { tempPath });
      await fs.rename(this.configPath, this.configPath + BACKUP_SUFFIX).then(() => {
        this.logger.log("Config backup created", { backupPath: this.configPath + BACKUP_SUFFIX });
      }).catch(() => {
      });
      await fs.rename(tempPath, this.configPath);
      this.logger.log("Config saved successfully", { path: this.configPath, encrypted });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to save config", { error: err.message, path: this.configPath });
      return { ok: false, error: new ConfigError(err.message) };
    }
  }
  async ensureDir() {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true, mode: 448 }).then(() => {
      this.logger.debug("Ensured config directory exists", { dir });
    }).catch(() => {
    });
  }
  async backupCorruptConfig() {
    try {
      const backupPath = this.configPath + ".bak." + Date.now();
      await fs.rename(this.configPath, backupPath);
      this.logger.warn("Backed up corrupt config file", { backupPath });
    } catch (err) {
      this.logger.error("Failed to backup corrupt config file", { error: err.message });
    }
  }
};

// ../infrastructure/services/FileLogger.ts
import { appendFileSync, mkdirSync } from "fs";
import * as path2 from "path";
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
    const logDir = path2.dirname(this.filePath);
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

// ../infrastructure/services/BasicEncryption.ts
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "crypto";
var HEADER = "ENCRYPTED_v1";
var SALT_LENGTH = 16;
var IV_LENGTH = 12;
var KEY_LENGTH = 32;
var PBKDF2_ITER = 1e5;
var BasicEncryption = class {
  constructor(logger) {
    this.logger = logger;
  }
  async encrypt(data, key) {
    try {
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);
      const derivedKey = pbkdf2Sync(key, salt, PBKDF2_ITER, KEY_LENGTH, "sha512");
      const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
      const ciphertext = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
      const authTag = cipher.getAuthTag();
      this.logger.debug("Data encrypted", { algorithm: "AES-256-GCM", operation: "encrypt" });
      return {
        ok: true,
        value: [
          HEADER,
          iv.toString("base64"),
          salt.toString("base64"),
          ciphertext.toString("base64"),
          authTag.toString("base64")
        ].join(":")
      };
    } catch (err) {
      this.logger.error("Encryption failed", { error: err instanceof Error ? err.message : err, operation: "encrypt" });
      return { ok: false, error: new EncryptionError("Encryption failed", "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */, { originalError: err instanceof Error ? err.message : err, operation: "encrypt" }) };
    }
  }
  async decrypt(data, key) {
    try {
      const parts = data.split(":");
      if (parts[0] !== HEADER || parts.length !== 5) {
        this.logger.error("Invalid encrypted data format", { operation: "decrypt" });
        return { ok: false, error: new EncryptionError("Invalid encrypted data format", "ENCRYPTION_INVALID_FORMAT" /* ENCRYPTION_INVALID_FORMAT */, { operation: "decrypt" }) };
      }
      const [, ivB64, saltB64, ciphertextB64, authTagB64] = parts;
      const iv = Buffer.from(ivB64, "base64");
      const salt = Buffer.from(saltB64, "base64");
      const ciphertext = Buffer.from(ciphertextB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const derivedKey = pbkdf2Sync(key, salt, PBKDF2_ITER, KEY_LENGTH, "sha512");
      const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      this.logger.debug("Data decrypted", { algorithm: "AES-256-GCM", operation: "decrypt" });
      return { ok: true, value: plaintext.toString("utf8") };
    } catch (err) {
      this.logger.error("Decryption failed", { error: err instanceof Error ? err.message : err, operation: "decrypt" });
      return { ok: false, error: new EncryptionError("Decryption failed", "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */, { originalError: err instanceof Error ? err.message : err, operation: "decrypt" }) };
    }
  }
};

// services/config/ConfigFacade.ts
import * as path3 from "path";
var ConfigFacade = class {
  constructor(configPath, logger, encryption) {
    const _logger = logger || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path3.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const repository = new ConfigRepository(_logger, _encryption, configPath);
    this.service = new ConfigService(repository, _logger);
  }
  async getConfig(...args) {
    return this.service.getConfig(...args);
  }
  async setConfig(...args) {
    return this.service.setConfig(...args);
  }
  async updateConfig(...args) {
    return this.service.updateConfig(...args);
  }
};

// use-cases/config/GetConfig.ts
var GetConfig = class {
  constructor(configService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute() {
    return this.configService.getConfig();
  }
};

// use-cases/config/UpdateConfig.ts
var UpdateConfig = class {
  constructor(configService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(partial) {
    return this.configService.updateConfig(partial);
  }
};

// use-cases/config/ResetConfig.ts
import * as path4 from "path";
function getDefaultConfig2() {
  return {
    version: "1.0.0",
    ide: "vscode",
    encryption: { enabled: false },
    storagePath: path4.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate"),
    logger: {
      level: "LOG",
      sinks: ["file"],
      filePath: path4.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    },
    experimental: {},
    extensions: {}
  };
}
var ResetConfig = class {
  constructor(configService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute() {
    const result = await this.configService.setConfig(getDefaultConfig2());
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: getDefaultConfig2() };
  }
};

// use-cases/config/ExportConfig.ts
var ExportConfig = class {
  constructor(configService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute() {
    const result = await this.configService.getConfig();
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: JSON.stringify(result.value, null, 2) };
  }
};

// use-cases/config/ImportConfig.ts
var ImportConfig = class {
  constructor(configService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(json) {
    let parsed;
    try {
      parsed = validateConfig(JSON.parse(json));
    } catch (err) {
      return { ok: false, error: err };
    }
    const result = await this.configService.setConfig(parsed);
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: parsed };
  }
};

// services/scripts/ScriptService.ts
var ScriptService = class {
  constructor(repository, logger) {
    this.repository = repository;
    this.logger = logger;
  }
  async createScript(script) {
    this.logger.debug("ScriptService.createScript called", { script });
    const result = await this.repository.createScript(script);
    if (isFailure(result)) {
      this.logger.error("Failed to create script", { error: result.error, script });
    } else {
      this.logger.log("Script created successfully", { script });
    }
    return result;
  }
  async createScripts(scripts) {
    this.logger.debug("ScriptService.createScripts called", { count: scripts.length });
    const result = await this.repository.createScripts(scripts);
    if (isFailure(result)) {
      this.logger.error("Failed to create scripts", { error: result.error, count: scripts.length });
    } else {
      this.logger.log("Scripts created successfully", { count: scripts.length });
    }
    return result;
  }
  async getScriptsByRootPath(rootPath) {
    this.logger.debug("ScriptService.getScriptsByRootPath called", { rootPath });
    const result = await this.repository.getScriptsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error("Failed to get scripts by root path", { error: result.error, rootPath });
    } else {
      this.logger.log("Scripts retrieved by root path", { rootPath, count: result.value.length });
    }
    return result;
  }
  async getAllScripts() {
    this.logger.debug("ScriptService.getAllScripts called");
    const result = await this.repository.getAllScripts();
    if (isFailure(result)) {
      this.logger.error("Failed to get all scripts", { error: result.error });
    } else {
      this.logger.log("All scripts retrieved", { count: result.value.length });
    }
    return result;
  }
  async updateScript(name, rootPath, scriptUpdate) {
    this.logger.debug("ScriptService.updateScript called", { name, rootPath, scriptUpdate });
    const result = await this.repository.updateScript(name, rootPath, scriptUpdate);
    if (isFailure(result)) {
      this.logger.error("Failed to update script", { error: result.error, name, rootPath });
    } else {
      this.logger.log("Script updated successfully", { name, rootPath });
    }
    return result;
  }
  async updateScripts(updates) {
    this.logger.debug("ScriptService.updateScripts called", { count: updates.length });
    const result = await this.repository.updateScripts(updates);
    if (isFailure(result)) {
      this.logger.error("Failed to update scripts", { error: result.error, count: updates.length });
    } else {
      this.logger.log("Scripts updated successfully", { count: updates.length });
    }
    return result;
  }
  async deleteScript(name, rootPath) {
    this.logger.debug("ScriptService.deleteScript called", { name, rootPath });
    const result = await this.repository.deleteScript(name, rootPath);
    if (isFailure(result)) {
      this.logger.error("Failed to delete script", { error: result.error, name, rootPath });
    } else {
      this.logger.log("Script deleted successfully", { name, rootPath });
    }
    return result;
  }
  async deleteScripts(scripts) {
    this.logger.debug("ScriptService.deleteScripts called", { count: scripts.length });
    const result = await this.repository.deleteScripts(scripts);
    if (isFailure(result)) {
      this.logger.error("Failed to delete scripts", { error: result.error, count: scripts.length });
    } else {
      this.logger.log("Scripts deleted successfully", { count: scripts.length });
    }
    return result;
  }
  async deleteScriptsByRootPath(rootPath) {
    this.logger.debug("ScriptService.deleteScriptsByRootPath called", { rootPath });
    const result = await this.repository.deleteScriptsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error("Failed to delete scripts by root path", { error: result.error, rootPath });
    } else {
      this.logger.log("Scripts deleted by root path successfully", { rootPath });
    }
    return result;
  }
  async getScriptIndex() {
    this.logger.debug("ScriptService.getScriptIndex called");
    const result = await this.repository.loadScriptIndex();
    if (isFailure(result)) {
      this.logger.error("Failed to get script index", { error: result.error });
    } else {
      this.logger.log("Script index retrieved", { entryCount: result.value.entries.length });
    }
    return result;
  }
  async updateScriptIndex(index) {
    this.logger.debug("ScriptService.updateScriptIndex called");
    const result = await this.repository.saveScriptIndex(index);
    if (isFailure(result)) {
      this.logger.error("Failed to update script index", { error: result.error });
    } else {
      this.logger.log("Script index updated successfully");
    }
    return result;
  }
};

// ../infrastructure/repositories/ScriptRepository.ts
import * as fs2 from "fs/promises";
import * as path5 from "path";
var DEFAULT_SCRIPTS_DIR = path5.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "scripts");
var INDEX_FILE = "index.json";
var TEMP_SUFFIX2 = ".tmp";
var BACKUP_SUFFIX2 = ".bak";
var ScriptRepository = class {
  constructor(logger, encryption, configService, scriptsDir = DEFAULT_SCRIPTS_DIR) {
    this.logger = logger;
    this.encryption = encryption;
    this.configService = configService;
    this.scriptsDir = scriptsDir;
  }
  async createScript(script) {
    try {
      await this.ensureScriptsDir();
      const validatedScript = validateScript(script);
      if (!await this.pathExists(validatedScript.rootPath)) {
        this.logger.error("Root path does not exist", { rootPath: validatedScript.rootPath });
        return { ok: false, error: new ScriptError("Root path does not exist", "SCRIPT_PATH_INVALID" /* SCRIPT_PATH_INVALID */, { rootPath: validatedScript.rootPath }) };
      }
      const existingScripts = await this.getScriptsByRootPath(validatedScript.rootPath);
      if (existingScripts.ok) {
        const duplicate = existingScripts.value.find((s) => s.script === validatedScript.script);
        if (duplicate) {
          this.logger.error("Duplicate script command found", { script: validatedScript.script, rootPath: validatedScript.rootPath });
          return { ok: false, error: new ScriptError("Script command already exists", "SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */, { script: validatedScript.script, rootPath: validatedScript.rootPath }) };
        }
      }
      const collection = await this.getOrCreateScriptCollection(validatedScript.rootPath);
      if (isFailure(collection)) {
        return { ok: false, error: collection.error };
      }
      collection.value.scripts.push(validatedScript);
      const saveResult = await this.saveScriptCollection(validatedScript.rootPath, collection.value);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      await this.updateIndexForRootPath(validatedScript.rootPath);
      this.logger.log("Script created successfully", { name: validatedScript.name, rootPath: validatedScript.rootPath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to create script", { error: err.message, script });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async createScripts(scripts) {
    try {
      if (scripts.length === 0) {
        return { ok: true, value: void 0 };
      }
      this.logger.debug("Creating multiple scripts", { count: scripts.length });
      const scriptsByRootPath = /* @__PURE__ */ new Map();
      for (const script of scripts) {
        const validatedScript = validateScript(script);
        if (!await this.pathExists(validatedScript.rootPath)) {
          this.logger.error("Root path does not exist", { rootPath: validatedScript.rootPath });
          return { ok: false, error: new ScriptError("Root path does not exist", "SCRIPT_PATH_INVALID" /* SCRIPT_PATH_INVALID */, { rootPath: validatedScript.rootPath }) };
        }
        if (!scriptsByRootPath.has(validatedScript.rootPath)) {
          scriptsByRootPath.set(validatedScript.rootPath, []);
        }
        scriptsByRootPath.get(validatedScript.rootPath).push(validatedScript);
      }
      for (const [rootPath, rootScripts] of scriptsByRootPath) {
        const existingScripts = await this.getScriptsByRootPath(rootPath);
        const existingCollection = existingScripts.ok ? existingScripts.value : [];
        const allScripts = [...existingCollection, ...rootScripts];
        const scriptCommands = /* @__PURE__ */ new Set();
        const duplicates = [];
        for (const script of allScripts) {
          if (scriptCommands.has(script.script)) {
            duplicates.push(script.script);
          } else {
            scriptCommands.add(script.script);
          }
        }
        if (duplicates.length > 0) {
          this.logger.error("Duplicate script commands found", { duplicates, rootPath });
          return { ok: false, error: new ScriptError("Duplicate script commands found", "SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */, { duplicates, rootPath }) };
        }
        const collection = { scripts: allScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
        await this.updateIndexForRootPath(rootPath);
      }
      this.logger.log("Multiple scripts created successfully", { count: scripts.length });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to create multiple scripts", { error: err.message, count: scripts.length });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async getScriptsByRootPath(rootPath) {
    try {
      const collection = await this.loadScriptCollection(rootPath);
      if (isFailure(collection)) {
        return { ok: true, value: [] };
      }
      return { ok: true, value: collection.value.scripts };
    } catch (err) {
      this.logger.error("Failed to get scripts by root path", { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async getAllScripts() {
    try {
      const index = await this.loadScriptIndex();
      if (isFailure(index)) {
        return { ok: true, value: [] };
      }
      const allScripts = [];
      for (const entry of index.value.entries) {
        const scripts = await this.getScriptsByRootPath(entry.rootPath);
        if (scripts.ok) {
          allScripts.push(...scripts.value);
        }
      }
      return { ok: true, value: allScripts };
    } catch (err) {
      this.logger.error("Failed to get all scripts", { error: err.message });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async updateScript(name, rootPath, scriptUpdate) {
    try {
      const scripts = await this.getScriptsByRootPath(rootPath);
      if (isFailure(scripts)) {
        return { ok: false, error: scripts.error };
      }
      const scriptIndex = scripts.value.findIndex((s) => s.name === name);
      if (scriptIndex === -1) {
        this.logger.error("Script not found", { name, rootPath });
        return { ok: false, error: new ScriptError("Script not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { name, rootPath }) };
      }
      const updatedScript = { ...scripts.value[scriptIndex], ...scriptUpdate };
      const validatedScript = validateScript(updatedScript);
      const duplicate = scripts.value.find((s) => s.script === validatedScript.script && s.name !== name);
      if (duplicate) {
        this.logger.error("Duplicate script command found", { script: validatedScript.script, rootPath });
        return { ok: false, error: new ScriptError("Script command already exists", "SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */, { script: validatedScript.script, rootPath }) };
      }
      scripts.value[scriptIndex] = validatedScript;
      const collection = { scripts: scripts.value };
      const saveResult = await this.saveScriptCollection(rootPath, collection);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      this.logger.log("Script updated successfully", { name, rootPath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to update script", { error: err.message, name, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async updateScripts(updates) {
    try {
      if (updates.length === 0) {
        return { ok: true, value: void 0 };
      }
      this.logger.debug("Updating multiple scripts", { count: updates.length });
      const updatesByRootPath = /* @__PURE__ */ new Map();
      for (const update of updates) {
        if (!updatesByRootPath.has(update.rootPath)) {
          updatesByRootPath.set(update.rootPath, []);
        }
        updatesByRootPath.get(update.rootPath).push({ name: update.name, script: update.script });
      }
      for (const [rootPath, rootUpdates] of updatesByRootPath) {
        const scripts = await this.getScriptsByRootPath(rootPath);
        if (isFailure(scripts)) {
          return { ok: false, error: scripts.error };
        }
        const updatedScripts = [...scripts.value];
        const updatedNames = /* @__PURE__ */ new Set();
        for (const update of rootUpdates) {
          const scriptIndex = updatedScripts.findIndex((s) => s.name === update.name);
          if (scriptIndex === -1) {
            this.logger.error("Script not found for update", { name: update.name, rootPath });
            return { ok: false, error: new ScriptError("Script not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { name: update.name, rootPath }) };
          }
          const updatedScript = { ...updatedScripts[scriptIndex], ...update.script };
          const validatedScript = validateScript(updatedScript);
          updatedScripts[scriptIndex] = validatedScript;
          updatedNames.add(update.name);
        }
        const scriptCommands = /* @__PURE__ */ new Set();
        const duplicates = [];
        for (const script of updatedScripts) {
          if (scriptCommands.has(script.script)) {
            if (!updatedNames.has(script.name)) {
              duplicates.push(script.script);
            }
          } else {
            scriptCommands.add(script.script);
          }
        }
        if (duplicates.length > 0) {
          this.logger.error("Duplicate script commands found after updates", { duplicates, rootPath });
          return { ok: false, error: new ScriptError("Duplicate script commands found", "SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */, { duplicates, rootPath }) };
        }
        const collection = { scripts: updatedScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
      }
      this.logger.log("Multiple scripts updated successfully", { count: updates.length });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to update multiple scripts", { error: err.message, count: updates.length });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async deleteScript(name, rootPath) {
    try {
      const scripts = await this.getScriptsByRootPath(rootPath);
      if (isFailure(scripts)) {
        return { ok: false, error: scripts.error };
      }
      const scriptIndex = scripts.value.findIndex((s) => s.name === name);
      if (scriptIndex === -1) {
        this.logger.error("Script not found", { name, rootPath });
        return { ok: false, error: new ScriptError("Script not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { name, rootPath }) };
      }
      scripts.value.splice(scriptIndex, 1);
      const collection = { scripts: scripts.value };
      const saveResult = await this.saveScriptCollection(rootPath, collection);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      this.logger.log("Script deleted successfully", { name, rootPath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to delete script", { error: err.message, name, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async deleteScripts(scripts) {
    try {
      if (scripts.length === 0) {
        return { ok: true, value: void 0 };
      }
      this.logger.debug("Deleting multiple scripts", { count: scripts.length });
      const deletionsByRootPath = /* @__PURE__ */ new Map();
      for (const script of scripts) {
        if (!deletionsByRootPath.has(script.rootPath)) {
          deletionsByRootPath.set(script.rootPath, []);
        }
        deletionsByRootPath.get(script.rootPath).push(script.name);
      }
      for (const [rootPath, scriptNames] of deletionsByRootPath) {
        const existingScripts = await this.getScriptsByRootPath(rootPath);
        if (isFailure(existingScripts)) {
          return { ok: false, error: existingScripts.error };
        }
        const remainingScripts = existingScripts.value.filter((script) => !scriptNames.includes(script.name));
        const foundNames = existingScripts.value.filter((script) => scriptNames.includes(script.name)).map((s) => s.name);
        const missingNames = scriptNames.filter((name) => !foundNames.includes(name));
        if (missingNames.length > 0) {
          this.logger.error("Some scripts not found for deletion", { missingNames, rootPath });
          return { ok: false, error: new ScriptError("Some scripts not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { missingNames, rootPath }) };
        }
        const collection = { scripts: remainingScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
      }
      this.logger.log("Multiple scripts deleted successfully", { count: scripts.length });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to delete multiple scripts", { error: err.message, count: scripts.length });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async deleteScriptsByRootPath(rootPath) {
    try {
      const referenceFile = await this.getReferenceFilePath(rootPath);
      if (referenceFile) {
        await fs2.unlink(referenceFile).catch(() => {
        });
      }
      await this.removeFromIndex(rootPath);
      this.logger.log("Scripts deleted for root path", { rootPath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to delete scripts by root path", { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async loadScriptIndex() {
    try {
      await this.ensureScriptsDir();
      const indexPath = path5.join(this.scriptsDir, INDEX_FILE);
      try {
        const raw = await fs2.readFile(indexPath, { encoding: "utf8" });
        let data = raw;
        if (raw.startsWith("ENCRYPTED_v1")) {
          const config = await this.configService.getConfig();
          if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
            const decrypted = await this.encryption.decrypt(raw, config.value.encryption.encryptionKey);
            if (isFailure(decrypted)) {
              this.logger.error("Failed to decrypt script index", { error: decrypted.error });
              return { ok: false, error: decrypted.error };
            }
            data = decrypted.value;
          }
        }
        const parsed = JSON.parse(data);
        const index = validateScriptIndex(parsed);
        this.logger.debug("Script index loaded", { indexPath });
        return { ok: true, value: index };
      } catch (err) {
        if (err.code === "ENOENT") {
          const defaultIndex = { entries: [] };
          await this.saveScriptIndex(defaultIndex);
          return { ok: true, value: defaultIndex };
        }
        throw err;
      }
    } catch (err) {
      this.logger.error("Failed to load script index", { error: err.message });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async saveScriptIndex(index) {
    try {
      await this.ensureScriptsDir();
      const indexPath = path5.join(this.scriptsDir, INDEX_FILE);
      const validated = validateScriptIndex(index);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;
      const config = await this.configService.getConfig();
      if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
        const encResult = await this.encryption.encrypt(data, config.value.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error("Failed to encrypt script index", { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      const tempPath = indexPath + TEMP_SUFFIX2;
      await fs2.writeFile(tempPath, data, { encoding: "utf8", mode: 384 });
      await fs2.rename(indexPath, indexPath + BACKUP_SUFFIX2).catch(() => {
      });
      await fs2.rename(tempPath, indexPath);
      this.logger.log("Script index saved", { indexPath, encrypted });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to save script index", { error: err.message });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  // Private helper methods
  async ensureScriptsDir() {
    await fs2.mkdir(this.scriptsDir, { recursive: true, mode: 448 });
  }
  async pathExists(pathToCheck) {
    try {
      await fs2.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }
  async getOrCreateScriptCollection(rootPath) {
    const collection = await this.loadScriptCollection(rootPath);
    if (collection.ok) {
      return collection;
    }
    return { ok: true, value: { scripts: [] } };
  }
  async loadScriptCollection(rootPath) {
    try {
      const referenceFile = await this.getReferenceFilePath(rootPath);
      if (!referenceFile) {
        return { ok: false, error: new ScriptError("Reference file not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { rootPath }) };
      }
      const raw = await fs2.readFile(referenceFile, { encoding: "utf8" });
      let data = raw;
      if (raw.startsWith("ENCRYPTED_v1")) {
        const config = await this.configService.getConfig();
        if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
          const decrypted = await this.encryption.decrypt(raw, config.value.encryption.encryptionKey);
          if (isFailure(decrypted)) {
            this.logger.error("Failed to decrypt script collection", { error: decrypted.error });
            return { ok: false, error: decrypted.error };
          }
          data = decrypted.value;
        }
      }
      const parsed = JSON.parse(data);
      const collection = validateScriptCollection(parsed);
      return { ok: true, value: collection };
    } catch (err) {
      if (err.code === "ENOENT") {
        return { ok: false, error: new ScriptError("Script collection not found", "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */, { rootPath }) };
      }
      this.logger.error("Failed to load script collection", { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async saveScriptCollection(rootPath, collection) {
    try {
      const validated = validateScriptCollection(collection);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;
      const config = await this.configService.getConfig();
      if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
        const encResult = await this.encryption.encrypt(data, config.value.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error("Failed to encrypt script collection", { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      const referenceFile = await this.getOrCreateReferenceFilePath(rootPath);
      const tempPath = referenceFile + TEMP_SUFFIX2;
      await fs2.writeFile(tempPath, data, { encoding: "utf8", mode: 384 });
      await fs2.rename(referenceFile, referenceFile + BACKUP_SUFFIX2).catch(() => {
      });
      await fs2.rename(tempPath, referenceFile);
      this.logger.debug("Script collection saved", { referenceFile, encrypted });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("Failed to save script collection", { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, "SCRIPT_INVALID" /* SCRIPT_INVALID */, { originalError: err.message }) };
    }
  }
  async getReferenceFilePath(rootPath) {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return null;
    }
    const entry = index.value.entries.find((e) => e.rootPath === rootPath);
    return entry ? path5.join(this.scriptsDir, entry.referenceFile) : null;
  }
  async getOrCreateReferenceFilePath(rootPath) {
    const existingPath = await this.getReferenceFilePath(rootPath);
    if (existingPath) {
      return existingPath;
    }
    const fileName = `${Buffer.from(rootPath).toString("base64").replace(/[^a-zA-Z0-9]/g, "")}.json`;
    return path5.join(this.scriptsDir, fileName);
  }
  async updateIndexForRootPath(rootPath) {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }
    const referenceFile = await this.getOrCreateReferenceFilePath(rootPath);
    const relativePath = path5.relative(this.scriptsDir, referenceFile);
    const existingIndex = index.value.entries.findIndex((e) => e.rootPath === rootPath);
    if (existingIndex >= 0) {
      index.value.entries[existingIndex].referenceFile = relativePath;
    } else {
      index.value.entries.push({ rootPath, referenceFile: relativePath });
    }
    await this.saveScriptIndex(index.value);
  }
  async removeFromIndex(rootPath) {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }
    index.value.entries = index.value.entries.filter((e) => e.rootPath !== rootPath);
    await this.saveScriptIndex(index.value);
  }
};

// services/scripts/ScriptFacade.ts
import * as path6 from "path";
var ScriptFacade = class {
  constructor(scriptsDir, logger, encryption, configService) {
    const _logger = logger || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path6.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const _configService = configService || new ConfigFacade();
    const repository = new ScriptRepository(_logger, _encryption, _configService, scriptsDir);
    this.service = new ScriptService(repository, _logger);
  }
  async createScript(...args) {
    return this.service.createScript(...args);
  }
  async createScripts(...args) {
    return this.service.createScripts(...args);
  }
  async getScriptsByRootPath(...args) {
    return this.service.getScriptsByRootPath(...args);
  }
  async getAllScripts(...args) {
    return this.service.getAllScripts(...args);
  }
  async updateScript(...args) {
    return this.service.updateScript(...args);
  }
  async updateScripts(...args) {
    return this.service.updateScripts(...args);
  }
  async deleteScript(...args) {
    return this.service.deleteScript(...args);
  }
  async deleteScripts(...args) {
    return this.service.deleteScripts(...args);
  }
  async deleteScriptsByRootPath(...args) {
    return this.service.deleteScriptsByRootPath(...args);
  }
  async getScriptIndex(...args) {
    return this.service.getScriptIndex(...args);
  }
  async updateScriptIndex(...args) {
    return this.service.updateScriptIndex(...args);
  }
};

// use-cases/scripts/CreateScript.ts
var CreateScript = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(script) {
    return this.scriptService.createScript(script);
  }
};

// use-cases/scripts/CreateScripts.ts
var CreateScripts = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(scripts) {
    return this.scriptService.createScripts(scripts);
  }
};

// use-cases/scripts/GetScripts.ts
var GetScripts = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute() {
    return this.scriptService.getAllScripts();
  }
};

// use-cases/scripts/GetScriptsByRootPath.ts
var GetScriptsByRootPath = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(rootPath) {
    return this.scriptService.getScriptsByRootPath(rootPath);
  }
};

// use-cases/scripts/UpdateScript.ts
var UpdateScript = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(name, rootPath, scriptUpdate) {
    return this.scriptService.updateScript(name, rootPath, scriptUpdate);
  }
};

// use-cases/scripts/DeleteScript.ts
var DeleteScript = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(name, rootPath) {
    return this.scriptService.deleteScript(name, rootPath);
  }
};

// use-cases/scripts/DeleteScriptsByRootPath.ts
var DeleteScriptsByRootPath = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(rootPath) {
    return this.scriptService.deleteScriptsByRootPath(rootPath);
  }
};

// use-cases/scripts/ExportScripts.ts
var ExportScripts = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute() {
    const result = await this.scriptService.getAllScripts();
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: JSON.stringify(result.value, null, 2) };
  }
};

// use-cases/scripts/ImportScripts.ts
var ImportScripts = class {
  constructor(scriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  async execute(json) {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        return { ok: false, error: new Error("Invalid format: expected array of scripts") };
      }
      const scripts = [];
      for (const item of parsed) {
        try {
          const validatedScript = validateScript(item);
          scripts.push(validatedScript);
        } catch (validationError) {
          return { ok: false, error: new Error(`Invalid script format: ${validationError}`) };
        }
      }
      return this.scriptService.createScripts(scripts);
    } catch (parseError) {
      return { ok: false, error: new Error(`Invalid JSON: ${parseError}`) };
    }
  }
};

// services/session/SessionService.ts
var SessionService = class {
  constructor(repository) {
    this.repository = repository;
  }
  async saveSession(input) {
    const session = {
      id: input.id || `session-${Date.now()}`,
      name: input.name,
      projectRoot: input.projectRoot,
      createdAt: input.createdAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      tags: input.tags || [],
      notes: input.notes,
      files: input.files || [],
      git: input.git,
      extensions: input.extensions
    };
    const result = await this.repository.save(session);
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: session };
  }
  async updateSession(idOrName, input) {
    const loadResult = await this.repository.load(idOrName);
    if (isFailure(loadResult))
      return { ok: false, error: loadResult.error };
    const oldSession = loadResult.value;
    const updated = {
      ...oldSession,
      updatedAt: /* @__PURE__ */ new Date(),
      notes: input.notes ?? oldSession.notes,
      tags: input.tags ?? oldSession.tags,
      files: input.files ?? oldSession.files,
      git: input.git ?? oldSession.git,
      extensions: input.extensions ?? oldSession.extensions
    };
    const result = await this.repository.save(updated);
    if (isFailure(result))
      return { ok: false, error: result.error };
    return { ok: true, value: updated };
  }
  async resumeSession(idOrName) {
    return this.repository.load(idOrName);
  }
  async listSessions(filter) {
    const result = await this.repository.list();
    if (isFailure(result))
      return { ok: false, error: result.error };
    let sessions = result.value;
    if (filter?.tags) {
      sessions = sessions.filter((s) => filter.tags.every((tag) => s.tags.includes(tag)));
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      sessions = sessions.filter((s) => s.name.toLowerCase().includes(term) || s.notes?.toLowerCase().includes(term));
    }
    return { ok: true, value: sessions };
  }
  async deleteSession(idOrName) {
    return this.repository.delete(idOrName);
  }
  exportSession(idOrName, outputPath) {
    throw new Error("Method not implemented.");
  }
  importSession(filePath) {
    throw new Error("Method not implemented.");
  }
};

// ../infrastructure/repositories/SessionRepository.ts
var SESSION_INDEX_PATH = "sessions/index.json";
var SESSION_FILE_PREFIX = "sessions/session-";
var SESSION_FILE_SUFFIX = ".json";
var SESSION_INDEX_VERSION = "1.0.0";
var SessionRepository = class {
  constructor(logger, storage) {
    this.logger = logger;
    this.storage = storage;
  }
  getSessionFileName(id) {
    return `${SESSION_FILE_PREFIX}${id}${SESSION_FILE_SUFFIX}`;
  }
  async load(idOrName) {
    this.logger.debug(`Loading session: ${idOrName}`);
    const indexResult = await this.getIndex();
    if (isFailure(indexResult))
      return indexResult;
    const entry = indexResult.value.sessions.find((s) => s.id === idOrName || s.name === idOrName);
    if (!entry) {
      return { ok: false, error: new StorageError("Session not found", void 0, { idOrName }) };
    }
    const fileResult = await this.storage.read(entry.referenceFile);
    if (isFailure(fileResult))
      return fileResult;
    try {
      const validatedSession = validateSession(JSON.parse(fileResult.value));
      const session = {
        ...validatedSession,
        createdAt: validatedSession.createdAt || /* @__PURE__ */ new Date(),
        updatedAt: validatedSession.updatedAt || /* @__PURE__ */ new Date()
      };
      return { ok: true, value: session };
    } catch (error) {
      this.logger.error("Session validation failed", { error });
      return { ok: false, error: new StorageError("Session validation failed", void 0, { error }) };
    }
  }
  async save(session) {
    this.logger.debug(`Saving session: ${session.id}`);
    try {
      validateSession(session);
    } catch (error) {
      this.logger.error("Session validation failed", { error });
      return { ok: false, error: new StorageError("Session validation failed", void 0, { error }) };
    }
    const fileName = this.getSessionFileName(session.id);
    const writeResult = await this.storage.write(fileName, JSON.stringify(session));
    if (isFailure(writeResult))
      return writeResult;
    const indexResult = await this.getIndex();
    let index;
    if (isFailure(indexResult)) {
      index = { version: SESSION_INDEX_VERSION, sessions: [] };
    } else {
      index = indexResult.value;
    }
    index.sessions = index.sessions.filter((s) => s.id !== session.id);
    const entry = {
      id: session.id,
      name: session.name,
      projectRoot: session.projectRoot,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      tags: session.tags,
      notes: session.notes,
      referenceFile: fileName
    };
    index.sessions.push(entry);
    const indexWrite = await this.storage.write(SESSION_INDEX_PATH, JSON.stringify(index));
    if (isFailure(indexWrite))
      return indexWrite;
    return { ok: true, value: void 0 };
  }
  async delete(idOrName) {
    this.logger.debug(`Deleting session: ${idOrName}`);
    const indexResult = await this.getIndex();
    if (isFailure(indexResult))
      return indexResult;
    const index = indexResult.value;
    const entry = index.sessions.find((s) => s.id === idOrName || s.name === idOrName);
    if (!entry) {
      return { ok: false, error: new StorageError("Session not found", void 0, { idOrName }) };
    }
    const delResult = await this.storage.delete(entry.referenceFile);
    if (isFailure(delResult))
      return delResult;
    index.sessions = index.sessions.filter((s) => s.id !== entry.id);
    const indexWrite = await this.storage.write(SESSION_INDEX_PATH, JSON.stringify(index));
    if (isFailure(indexWrite))
      return indexWrite;
    return { ok: true, value: void 0 };
  }
  async list() {
    this.logger.debug("Listing all sessions");
    const indexResult = await this.getIndex();
    if (isFailure(indexResult))
      return indexResult;
    return { ok: true, value: indexResult.value.sessions };
  }
  async getIndex() {
    const readResult = await this.storage.read(SESSION_INDEX_PATH);
    if (isFailure(readResult)) {
      if (readResult.error.code === "STORAGE_READ_FAILED") {
        const emptyIndex = { version: SESSION_INDEX_VERSION, sessions: [] };
        return { ok: true, value: emptyIndex };
      }
      return { ok: false, error: readResult.error };
    }
    try {
      const index = validateSessionIndex(JSON.parse(readResult.value));
      return { ok: true, value: index };
    } catch (error) {
      this.logger.error("Session index validation failed", { error });
      return { ok: false, error: new StorageError("Session index validation failed", void 0, { error }) };
    }
  }
};

// ../infrastructure/services/FileStorage.ts
import { promises as fs3, constants as fsConstants } from "fs";
import * as path7 from "path";
var FileStorage = class {
  constructor(logger, encryption, config) {
    this.logger = logger;
    this.encryption = encryption;
    this.config = validateFileStorageConfig(config);
  }
  resolvePath(relPath) {
    const fullPath = path7.resolve(this.config.dataDir, relPath);
    if (!fullPath.startsWith(path7.resolve(this.config.dataDir))) {
      throw new StorageError("Invalid file path", "STORAGE_INVALID_PATH" /* STORAGE_INVALID_PATH */, { relPath });
    }
    return fullPath;
  }
  async read(relPath) {
    const filePath = this.resolvePath(relPath);
    try {
      const data = await fs3.readFile(filePath, "utf8");
      this.logger.debug("File read", { filePath });
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        const decrypted = await this.encryption.decrypt(data, this.config.encryptionKey);
        if (isFailure(decrypted)) {
          this.logger.error("Decryption failed during read", { filePath });
          return { ok: false, error: new StorageError("Decryption failed", "STORAGE_DECRYPTION_FAILED" /* STORAGE_DECRYPTION_FAILED */, { filePath }) };
        }
        return { ok: true, value: decrypted.value };
      }
      return { ok: true, value: data };
    } catch (err) {
      this.logger.error("File read failed", { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError("File read failed", "STORAGE_READ_FAILED" /* STORAGE_READ_FAILED */, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }
  async write(relPath, data) {
    const filePath = this.resolvePath(relPath);
    const dir = path7.dirname(filePath);
    try {
      await fs3.mkdir(dir, { recursive: true, mode: 448 });
      let toWrite = data;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        const encrypted = await this.encryption.encrypt(data, this.config.encryptionKey);
        if (isFailure(encrypted)) {
          this.logger.error("Encryption failed during write", { filePath });
          return { ok: false, error: new StorageError("Encryption failed", "STORAGE_WRITE_FAILED" /* STORAGE_WRITE_FAILED */, { filePath }) };
        }
        toWrite = encrypted.value;
      }
      const tmpPath = filePath + ".tmp";
      await fs3.writeFile(tmpPath, toWrite, { mode: 384 });
      const handle = await fs3.open(tmpPath, "r+");
      await handle.sync();
      await handle.close();
      try {
        await fs3.access(filePath, fsConstants.F_OK);
        await fs3.copyFile(filePath, filePath + ".bak");
      } catch {
      }
      await fs3.rename(tmpPath, filePath);
      this.logger.debug("File written atomically", { filePath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("File write failed", { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError("File write failed", "STORAGE_WRITE_FAILED" /* STORAGE_WRITE_FAILED */, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }
  async exists(relPath) {
    const filePath = this.resolvePath(relPath);
    try {
      await fs3.access(filePath, fsConstants.F_OK);
      this.logger.debug("File exists", { filePath });
      return { ok: true, value: true };
    } catch {
      return { ok: true, value: false };
    }
  }
  async delete(relPath) {
    const filePath = this.resolvePath(relPath);
    try {
      try {
        await fs3.copyFile(filePath, filePath + ".bak");
      } catch {
      }
      await fs3.unlink(filePath);
      this.logger.debug("File deleted", { filePath });
      return { ok: true, value: void 0 };
    } catch (err) {
      this.logger.error("File delete failed", { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError("File delete failed", "STORAGE_DELETE_FAILED" /* STORAGE_DELETE_FAILED */, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }
};

// services/session/SessionFacade.ts
import * as path8 from "path";
var SessionFacade = class {
  constructor(sessionsDir, logger, encryption) {
    const _logger = logger || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path8.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "session.log")
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const fileStorageConfig = {
      encryptionEnabled: false,
      dataDir: sessionsDir || path8.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate")
    };
    const storage = new FileStorage(_logger, _encryption, fileStorageConfig);
    const repository = new SessionRepository(_logger, storage);
    this.service = new SessionService(repository);
  }
  async saveSession(...args) {
    return this.service.saveSession(...args);
  }
  async updateSession(...args) {
    return this.service.updateSession(...args);
  }
  async resumeSession(...args) {
    return this.service.resumeSession(...args);
  }
  async listSessions(...args) {
    return this.service.listSessions(...args);
  }
  async deleteSession(...args) {
    return this.service.deleteSession(...args);
  }
  async exportSession(...args) {
    return this.service.exportSession(...args);
  }
  async importSession(...args) {
    return this.service.importSession(...args);
  }
};

// use-cases/session/SaveSession.ts
var SaveSession = class {
  constructor(sessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  async execute(input) {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = /* @__PURE__ */ new Date();
    return this.sessionService.saveSession({
      id: sessionId,
      name: input.name,
      projectRoot: input.projectRoot,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      tags: input.tags || [],
      files: input.files || [],
      git: input.git,
      extensions: input.extensions
    });
  }
};

// use-cases/session/UpdateSession.ts
var UpdateSession = class {
  constructor(sessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  async execute(idOrName, input) {
    return this.sessionService.updateSession(idOrName, input);
  }
};

// use-cases/session/ResumeSession.ts
var ResumeSession = class {
  constructor(sessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  async execute(idOrName) {
    return this.sessionService.resumeSession(idOrName);
  }
};

// use-cases/session/ListSessions.ts
var ListSessions = class {
  constructor(sessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  async execute(filter) {
    return this.sessionService.listSessions(filter);
  }
};

// use-cases/session/DeleteSession.ts
var DeleteSession = class {
  constructor(sessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  async execute(idOrName) {
    return this.sessionService.deleteSession(idOrName);
  }
};

// services/git/GitService.ts
import { platform } from "os";
var GitService = class {
  constructor(terminalService, logger, repositoryPath) {
    this.terminalService = terminalService;
    this.logger = logger;
    this.repositoryPath = repositoryPath;
  }
  async getIsDirty() {
    this.logger.debug("GitService.getIsDirty called");
    try {
      const statusResult = await this.getStatus();
      if (isFailure(statusResult)) {
        return statusResult;
      }
      return { ok: true, value: statusResult.value.isDirty };
    } catch (error) {
      this.logger.error("Failed to check if repository is dirty", { error });
      return { ok: false, error: new GitError("Failed to check repository status", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async getDirtyData() {
    this.logger.debug("GitService.getDirtyData called");
    return this.getStatus();
  }
  async getStatus() {
    this.logger.debug("GitService.getStatus called");
    try {
      const isRepoResult = await this.isGitRepository();
      if (isFailure(isRepoResult) || !isRepoResult.value) {
        return { ok: false, error: new GitError("Not a git repository", "GIT_NOT_REPOSITORY" /* GIT_NOT_REPOSITORY */) };
      }
      const statusResult = await this.terminalService.execute("git status --porcelain", {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(statusResult)) {
        this.logger.error("Failed to get git status", { error: statusResult.error });
        return { ok: false, error: new GitError("Failed to get git status", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const files = this.parseGitStatus(statusResult.value.stdout);
      const isDirty = files.some(
        (file) => file.status !== "untracked" /* UNTRACKED */ || file.staged
      );
      const gitStatus = {
        isDirty,
        dirtyFiles: files.filter((file) => file.staged),
        newFiles: files.filter((file) => file.status === "added" /* ADDED */),
        modifiedFiles: files.filter((file) => file.status === "modified" /* MODIFIED */),
        deletedFiles: files.filter((file) => file.status === "deleted" /* DELETED */),
        untrackedFiles: files.filter((file) => file.status === "untracked" /* UNTRACKED */)
      };
      this.logger.log("Git status retrieved", { isDirty, fileCount: files.length });
      return { ok: true, value: gitStatus };
    } catch (error) {
      this.logger.error("Failed to get git status", { error });
      return { ok: false, error: new GitError("Failed to get git status", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async createStash(message) {
    this.logger.debug("GitService.createStash called", { message });
    try {
      const timestamp = Date.now();
      const stashName = `codestate-stash-${timestamp}`;
      const stashMessage = message || `CodeState stash created at ${new Date(timestamp).toISOString()}`;
      const stashResult = await this.terminalService.execute(`git stash push -m "${stashMessage}"`, {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(stashResult)) {
        this.logger.error("Failed to create stash", { error: stashResult.error });
        return {
          ok: true,
          value: {
            success: false,
            error: "Failed to create stash"
          }
        };
      }
      const listResult = await this.listStashes();
      if (isFailure(listResult)) {
        return {
          ok: true,
          value: {
            success: false,
            error: "Failed to list stashes after creation"
          }
        };
      }
      const newStash = listResult.value.find(
        (stash) => stash.name.includes(`codestate-stash-${timestamp}`) || stash.message === stashMessage
      );
      if (!newStash) {
        return {
          ok: true,
          value: {
            success: false,
            error: "Stash created but could not be found in list"
          }
        };
      }
      this.logger.log("Stash created successfully", { stashId: newStash.id, stashName: newStash.name });
      return {
        ok: true,
        value: {
          success: true,
          stashId: newStash.id
        }
      };
    } catch (error) {
      this.logger.error("Failed to create stash", { error });
      return {
        ok: true,
        value: {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create stash"
        }
      };
    }
  }
  async applyStash(stashName) {
    this.logger.debug("GitService.applyStash called", { stashName });
    try {
      const applyResult = await this.terminalService.execute(`git stash apply "${stashName}"`, {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(applyResult)) {
        this.logger.error("Failed to apply stash", { error: applyResult.error, stashName });
        return {
          ok: true,
          value: {
            success: false,
            error: "Failed to apply stash"
          }
        };
      }
      const statusResult = await this.getStatus();
      const conflicts = [];
      if (isSuccess(statusResult)) {
        const status = statusResult.value;
        conflicts.push(
          ...status.modifiedFiles.filter((file) => file.path.includes("<<<<<<<") || file.path.includes("=======") || file.path.includes(">>>>>>>")).map((file) => file.path)
        );
      }
      this.logger.log("Stash applied successfully", { stashName, conflicts: conflicts.length });
      return {
        ok: true,
        value: {
          success: true,
          conflicts: conflicts.length > 0 ? conflicts : void 0
        }
      };
    } catch (error) {
      this.logger.error("Failed to apply stash", { error, stashName });
      return {
        ok: true,
        value: {
          success: false,
          error: error instanceof Error ? error.message : "Failed to apply stash"
        }
      };
    }
  }
  async listStashes() {
    this.logger.debug("GitService.listStashes called");
    try {
      const listResult = await this.terminalService.execute('git stash list --format="%H|%gd|%s|%ct"', {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(listResult)) {
        this.logger.error("Failed to list stashes", { error: listResult.error });
        return { ok: false, error: new GitError("Failed to list stashes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const stashes = [];
      const lines = listResult.value.stdout.trim().split("\n").filter((line) => line.length > 0);
      for (const line of lines) {
        const [hash, ref, message, timestamp] = line.split("|");
        if (hash && ref && message && timestamp) {
          stashes.push({
            id: hash,
            name: ref,
            message: message.trim(),
            timestamp: parseInt(timestamp, 10) * 1e3,
            // Convert to milliseconds
            branch: "unknown"
            // Git doesn't provide branch info in stash list
          });
        }
      }
      this.logger.log("Stashes listed successfully", { count: stashes.length });
      return { ok: true, value: stashes };
    } catch (error) {
      this.logger.error("Failed to list stashes", { error });
      return { ok: false, error: new GitError("Failed to list stashes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async deleteStash(stashName) {
    this.logger.debug("GitService.deleteStash called", { stashName });
    try {
      const deleteResult = await this.terminalService.execute(`git stash drop "${stashName}"`, {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(deleteResult)) {
        this.logger.error("Failed to delete stash", { error: deleteResult.error, stashName });
        return { ok: false, error: new GitError("Failed to delete stash", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      this.logger.log("Stash deleted successfully", { stashName });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error("Failed to delete stash", { error, stashName });
      return { ok: false, error: new GitError("Failed to delete stash", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async isGitRepository() {
    this.logger.debug("GitService.isGitRepository called");
    try {
      const result = await this.terminalService.execute("git rev-parse --git-dir", {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      return { ok: true, value: isSuccess(result) && result.value.exitCode === 0 };
    } catch (error) {
      this.logger.error("Failed to check if directory is git repository", { error });
      return { ok: false, error: new GitError("Failed to check git repository", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async getCurrentBranch() {
    this.logger.debug("GitService.getCurrentBranch called");
    try {
      const result = await this.terminalService.execute("git branch --show-current", {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      if (isFailure(result)) {
        this.logger.error("Failed to get current branch", { error: result.error });
        return { ok: false, error: new GitError("Failed to get current branch", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (isFailure(result) || result.value.exitCode !== 0) {
        this.logger.error("Failed to get current branch", { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError("Failed to get current branch", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const branch = result.value.stdout.trim();
      this.logger.log("Current branch retrieved", { branch });
      return { ok: true, value: branch };
    } catch (error) {
      this.logger.error("Failed to get current branch", { error });
      return { ok: false, error: new GitError("Failed to get current branch", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async getCurrentCommit() {
    this.logger.debug("GitService.getCurrentCommit called");
    try {
      const result = await this.terminalService.execute("git rev-parse HEAD", {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      if (isFailure(result)) {
        this.logger.error("Failed to get current commit", { error: result.error });
        return { ok: false, error: new GitError("Failed to get current commit", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (isFailure(result) || result.value.exitCode !== 0) {
        this.logger.error("Failed to get current commit", { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError("Failed to get current commit", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const commit = result.value.stdout.trim();
      this.logger.log("Current commit retrieved", { commit });
      return { ok: true, value: commit };
    } catch (error) {
      this.logger.error("Failed to get current commit", { error });
      return { ok: false, error: new GitError("Failed to get current commit", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async commitChanges(message) {
    this.logger.debug("GitService.commitChanges called", { message });
    let tempFile;
    try {
      const configResult = await this.isGitConfigured();
      if (isFailure(configResult)) {
        this.logger.error("Failed to check git configuration", { error: configResult.error });
        return { ok: false, error: new GitError("Failed to check git configuration", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (!configResult.value) {
        this.logger.error("Git is not properly configured. Please set user.name and user.email");
        return { ok: false, error: new GitError("Git is not properly configured. Please set user.name and user.email", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const statusResult = await this.getStatus();
      if (isFailure(statusResult)) {
        this.logger.error("Failed to get git status before commit", { error: statusResult.error });
        return { ok: false, error: new GitError("Failed to get git status before commit", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const status = statusResult.value;
      if (!status.isDirty) {
        this.logger.warn("No changes to commit");
        return { ok: true, value: true };
      }
      const addResult = await this.terminalService.execute("git add .", {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      if (isFailure(addResult)) {
        this.logger.error("Failed to add changes", { error: addResult.error });
        return { ok: false, error: new GitError("Failed to add changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (isFailure(addResult) || addResult.value.exitCode !== 0) {
        this.logger.error("Failed to add changes", { exitCode: addResult.value.exitCode, stderr: addResult.value.stderr });
        return { ok: false, error: new GitError("Failed to add changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const stagedStatusResult = await this.terminalService.execute("git diff --cached --name-only", {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      if (isFailure(stagedStatusResult)) {
        this.logger.error("Failed to check staged changes", { error: stagedStatusResult.error });
        return { ok: false, error: new GitError("Failed to check staged changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const stagedFiles = stagedStatusResult.value.stdout.trim().split("\n").filter((line) => line.length > 0);
      if (stagedFiles.length === 0) {
        this.logger.warn("No changes staged for commit");
        return { ok: true, value: true };
      }
      tempFile = `temp_commit_msg_${Date.now()}.txt`;
      this.logger.debug("Writing commit message to temp file", { tempFile, message });
      const writeMsgResult = await this.terminalService.execute(`echo "${message.replace(/"/g, '\\"')}" > ${tempFile}`, {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      if (isFailure(writeMsgResult) || writeMsgResult.value.exitCode !== 0) {
        this.logger.error("Failed to write commit message to temp file", {
          error: isSuccess(writeMsgResult) ? void 0 : writeMsgResult.error,
          exitCode: isSuccess(writeMsgResult) ? writeMsgResult.value.exitCode : void 0,
          stderr: isSuccess(writeMsgResult) ? writeMsgResult.value.stderr : void 0
        });
        await this.cleanupTempFile(tempFile);
        return { ok: false, error: new GitError("Failed to write commit message", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      this.logger.debug("Commit message written to temp file", { tempFile });
      const commitResult = await this.terminalService.execute(`git commit -F ${tempFile}`, {
        cwd: this.repositoryPath,
        timeout: 3e4
      });
      this.logger.debug("Git commit command executed", {
        exitCode: isSuccess(commitResult) ? commitResult.value.exitCode : void 0,
        stdout: isSuccess(commitResult) ? commitResult.value.stdout : void 0,
        stderr: isSuccess(commitResult) ? commitResult.value.stderr : void 0
      });
      await this.cleanupTempFile(tempFile);
      if (isFailure(commitResult)) {
        this.logger.error("Failed to commit changes", { error: commitResult.error });
        return { ok: false, error: new GitError("Failed to commit changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (isFailure(commitResult) || commitResult.value.exitCode !== 0) {
        this.logger.error("Failed to commit changes", {
          exitCode: commitResult.value.exitCode,
          stderr: commitResult.value.stderr,
          stdout: commitResult.value.stdout
        });
        return { ok: false, error: new GitError("Failed to commit changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      this.logger.log("Changes committed successfully", { message });
      return { ok: true, value: true };
    } catch (error) {
      if (tempFile) {
        await this.cleanupTempFile(tempFile);
      }
      this.logger.error("Failed to commit changes", { error });
      return { ok: false, error: new GitError("Failed to commit changes", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async getRepositoryRoot() {
    this.logger.debug("GitService.getRepositoryRoot called");
    try {
      const result = await this.terminalService.execute("git rev-parse --show-toplevel", {
        cwd: this.repositoryPath,
        timeout: 1e4
      });
      if (isFailure(result)) {
        this.logger.error("Failed to get repository root", { error: result.error });
        return { ok: false, error: new GitError("Failed to get repository root", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      if (isFailure(result) || result.value.exitCode !== 0) {
        this.logger.error("Failed to get repository root", { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError("Failed to get repository root", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
      }
      const root = result.value.stdout.trim();
      this.logger.log("Repository root retrieved", { root });
      return { ok: true, value: root };
    } catch (error) {
      this.logger.error("Failed to get repository root", { error });
      return { ok: false, error: new GitError("Failed to get repository root", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  async isGitConfigured() {
    this.logger.debug("GitService.isGitConfigured called");
    try {
      const nameResult = await this.terminalService.execute("git config user.name", {
        cwd: this.repositoryPath,
        timeout: 5e3
      });
      const emailResult = await this.terminalService.execute("git config user.email", {
        cwd: this.repositoryPath,
        timeout: 5e3
      });
      const hasName = isSuccess(nameResult) && nameResult.value.exitCode === 0 && nameResult.value.stdout.trim().length > 0;
      const hasEmail = isSuccess(emailResult) && emailResult.value.exitCode === 0 && emailResult.value.stdout.trim().length > 0;
      const isConfigured = hasName && hasEmail;
      this.logger.log("Git configuration check", { hasName, hasEmail, isConfigured });
      return { ok: true, value: isConfigured };
    } catch (error) {
      this.logger.error("Failed to check git configuration", { error });
      return { ok: false, error: new GitError("Failed to check git configuration", "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */) };
    }
  }
  parseGitStatus(statusOutput) {
    const files = [];
    const lines = statusOutput.trim().split("\n").filter((line) => line.length > 0);
    for (const line of lines) {
      if (line.length < 3)
        continue;
      const status = line.substring(0, 2);
      const path12 = line.substring(3);
      let fileStatus;
      let staged = false;
      switch (status) {
        case "M ":
          fileStatus = "modified" /* MODIFIED */;
          staged = false;
          break;
        case "A ":
          fileStatus = "added" /* ADDED */;
          staged = false;
          break;
        case "D ":
          fileStatus = "deleted" /* DELETED */;
          staged = false;
          break;
        case "R ":
          fileStatus = "renamed" /* RENAMED */;
          staged = false;
          break;
        case "C ":
          fileStatus = "copied" /* COPIED */;
          staged = false;
          break;
        case "??":
          fileStatus = "untracked" /* UNTRACKED */;
          staged = false;
          break;
        default:
          if (status.length === 1) {
            switch (status) {
              case "M":
                fileStatus = "modified" /* MODIFIED */;
                staged = true;
                break;
              case "A":
                fileStatus = "added" /* ADDED */;
                staged = true;
                break;
              case "D":
                fileStatus = "deleted" /* DELETED */;
                staged = true;
                break;
              case "R":
                fileStatus = "renamed" /* RENAMED */;
                staged = true;
                break;
              case "C":
                fileStatus = "copied" /* COPIED */;
                staged = true;
                break;
              default:
                fileStatus = "modified" /* MODIFIED */;
                staged = true;
                break;
            }
          } else {
            fileStatus = "modified" /* MODIFIED */;
            staged = false;
          }
          break;
      }
      files.push({
        path: path12,
        status: fileStatus,
        staged
      });
    }
    return files;
  }
  async cleanupTempFile(tempFile) {
    try {
      const currentPlatform = platform();
      let deleteCommand;
      if (currentPlatform === "win32") {
        deleteCommand = `del /f /q "${tempFile}"`;
      } else {
        deleteCommand = `rm -f "${tempFile}"`;
      }
      this.logger.debug("Attempting to clean up temp file", { tempFile, deleteCommand, platform: currentPlatform });
      const result = await this.terminalService.execute(deleteCommand, {
        cwd: this.repositoryPath,
        timeout: 5e3
      });
      if (isSuccess(result) && result.value.exitCode === 0) {
        this.logger.debug("Temp file cleaned up successfully", { tempFile });
      } else {
        this.logger.warn("Temp file cleanup may have failed", {
          tempFile,
          exitCode: isSuccess(result) ? result.value.exitCode : void 0,
          stderr: isSuccess(result) ? result.value.stderr : void 0,
          stdout: isSuccess(result) ? result.value.stdout : void 0
        });
      }
    } catch (error) {
      this.logger.error("Failed to clean up temp file", { tempFile, error });
    }
  }
};

// ../infrastructure/services/Terminal/TerminalService.ts
import { spawn } from "child_process";
import { platform as platform2 } from "os";
var TerminalService = class {
  constructor(logger) {
    this.logger = logger;
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
        return { ok: false, error: new TerminalError("Command cannot be empty", "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */) };
      }
      const spawnOptions = {
        cwd: command.cwd || process.cwd(),
        env: { ...process.env, ...command.env },
        shell: this.getDefaultShell(),
        timeout: command.timeout || 3e4
        // 30 seconds default
      };
      const [cmd, args] = this.parseCommand(command.command);
      const result = await this.spawnCommand(cmd, args, spawnOptions);
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
          "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */
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
        return { ok: false, error: new TerminalError("Command cannot be empty", "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */) };
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
      const [cmd, args] = this.parseCommand(command.command);
      const fullCommand = `${cmd} ${args.join(" ")}`;
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
          "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */
        )
      };
    }
  }
  async isCommandAvailable(command) {
    this.logger.debug("TerminalService.isCommandAvailable called", { command });
    try {
      const osPlatform = platform2();
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
      return { ok: false, error: new TerminalError("Failed to get shell", "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */) };
    }
  }
  getDefaultShell() {
    const osPlatform = platform2();
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
    const osPlatform = platform2();
    if (osPlatform === "win32") {
      return "cmd.exe";
    } else if (osPlatform === "darwin") {
      return "open";
    } else {
      return "gnome-terminal";
    }
  }
  getTerminalArgs(terminalCmd, shell, command, cwd) {
    const args = [];
    if (terminalCmd === "cmd.exe") {
      args.push("/c", "start", "cmd", "/k", command);
    } else if (terminalCmd === "open") {
      args.push("-a", "Terminal", command);
    } else {
      args.push("--", shell, "-c", command);
      if (cwd) {
        args.unshift("--working-directory", cwd);
      }
    }
    return args;
  }
  parseCommand(commandString) {
    const parts = commandString.match(/(?:[^\s"']+|"[^"]*"|'[^']*')/g) || [];
    const cmd = parts[0] || "";
    const args = parts.slice(1).map((arg) => {
      if (arg.startsWith('"') && arg.endsWith('"') || arg.startsWith("'") && arg.endsWith("'")) {
        return arg.slice(1, -1);
      }
      return arg;
    });
    return [cmd, args];
  }
  spawnCommand(command, args, options) {
    return new Promise((resolve2, reject) => {
      const process2 = spawn(command, args, options);
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        process2.kill("SIGTERM");
        reject(new TerminalError("Command timed out", "TERMINAL_TIMEOUT" /* TERMINAL_TIMEOUT */));
      }, options.timeout || 3e4);
      process2.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      process2.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      process2.on("close", (code) => {
        clearTimeout(timeout);
        resolve2({
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      process2.on("error", (error) => {
        clearTimeout(timeout);
        reject(new TerminalError(`Process error: ${error.message}`, "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */));
      });
      process2.on("exit", (code, signal) => {
        clearTimeout(timeout);
        if (signal) {
          reject(new TerminalError(`Process killed by signal: ${signal}`, "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */));
        } else {
          resolve2({
            exitCode: code || 0,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        }
      });
    });
  }
};

// services/git/GitFacade.ts
import * as path9 from "path";
var GitFacade = class {
  constructor(repositoryPath, logger, terminalService) {
    const _logger = logger || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path9.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    });
    const _terminalService = terminalService || new TerminalService(_logger);
    this.service = new GitService(_terminalService, _logger, repositoryPath);
  }
  async getCurrentCommit(...args) {
    return this.service.getCurrentCommit(...args);
  }
  async isGitConfigured(...args) {
    return this.service.isGitConfigured(...args);
  }
  async commitChanges(...args) {
    return this.service.commitChanges(...args);
  }
  async getIsDirty(...args) {
    return this.service.getIsDirty(...args);
  }
  async getDirtyData(...args) {
    return this.service.getDirtyData(...args);
  }
  async getStatus(...args) {
    return this.service.getStatus(...args);
  }
  async createStash(...args) {
    return this.service.createStash(...args);
  }
  async applyStash(...args) {
    return this.service.applyStash(...args);
  }
  async listStashes(...args) {
    return this.service.listStashes(...args);
  }
  async deleteStash(...args) {
    return this.service.deleteStash(...args);
  }
  async isGitRepository(...args) {
    return this.service.isGitRepository(...args);
  }
  async getCurrentBranch(...args) {
    return this.service.getCurrentBranch(...args);
  }
  async getRepositoryRoot(...args) {
    return this.service.getRepositoryRoot(...args);
  }
};

// use-cases/git/GetGitStatus.ts
var GetGitStatus = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute() {
    return this.gitService.getStatus();
  }
};

// use-cases/git/GetIsDirty.ts
var GetIsDirty = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute() {
    return this.gitService.getIsDirty();
  }
};

// use-cases/git/GetDirtyData.ts
var GetDirtyData = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute() {
    return this.gitService.getDirtyData();
  }
};

// use-cases/git/CreateStash.ts
var CreateStash = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute(message) {
    return this.gitService.createStash(message);
  }
};

// use-cases/git/ApplyStash.ts
var ApplyStash = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute(stashName) {
    return this.gitService.applyStash(stashName);
  }
};

// use-cases/git/ListStashes.ts
var ListStashes = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute() {
    return this.gitService.listStashes();
  }
};

// use-cases/git/DeleteStash.ts
var DeleteStash = class {
  constructor(gitService, repositoryPath) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  async execute(stashName) {
    return this.gitService.deleteStash(stashName);
  }
};

// use-cases/git/GetCurrentCommit.ts
var GetCurrentCommit = class {
  constructor(gitService) {
    this.gitService = gitService || new GitFacade();
  }
  async execute() {
    return this.gitService.getCurrentCommit();
  }
};

// use-cases/git/CommitChanges.ts
var CommitChanges = class {
  constructor(gitService) {
    this.gitService = gitService || new GitFacade();
  }
  async execute(message) {
    return this.gitService.commitChanges(message);
  }
};

// services/ide/IDEService.ts
import { platform as platform3 } from "os";
var IDEService = class {
  constructor(repository, terminalService, logger) {
    this.repository = repository;
    this.terminalService = terminalService;
    this.logger = logger;
  }
  async openIDE(ideName, projectRoot) {
    this.logger.debug("IDEService.openIDE called", { ideName, projectRoot });
    try {
      const isInstalledResult = await this.isIDEInstalled(ideName);
      if (!isInstalledResult.ok || !isInstalledResult.value) {
        this.logger.error("IDE is not installed", { ideName });
        return { ok: false, error: new Error(`IDE '${ideName}' is not installed`) };
      }
      const idesResult = await this.getAvailableIDEs();
      if (isFailure(idesResult)) {
        this.logger.error("Failed to get IDE definitions", { error: idesResult.error });
        return { ok: false, error: idesResult.error };
      }
      const ide = idesResult.value.find((i) => i.name === ideName);
      if (!ide) {
        this.logger.error("IDE definition not found", { ideName });
        return { ok: false, error: new Error(`IDE definition for '${ideName}' not found`) };
      }
      const currentPlatform = platform3();
      if (!ide.supportedPlatforms.includes(currentPlatform)) {
        this.logger.error("IDE not supported on current platform", { ideName, currentPlatform });
        return { ok: false, error: new Error(`IDE '${ideName}' is not supported on ${currentPlatform}`) };
      }
      const args = [...ide.args, projectRoot];
      const command = `${ide.command} ${args.join(" ")}`;
      const result = await this.terminalService.spawnTerminal(command, {
        cwd: projectRoot,
        timeout: 1e4
      });
      if (isFailure(result)) {
        this.logger.error("Failed to open IDE", { error: result.error, ideName, command });
        return { ok: false, error: result.error };
      }
      this.logger.log("IDE opened successfully", { ideName, projectRoot });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error("Failed to open IDE", { error, ideName, projectRoot });
      return { ok: false, error: error instanceof Error ? error : new Error("Failed to open IDE") };
    }
  }
  async openFiles(request) {
    this.logger.debug("IDEService.openFiles called", { request });
    try {
      const isInstalledResult = await this.isIDEInstalled(request.ide);
      if (!isInstalledResult.ok || !isInstalledResult.value) {
        this.logger.error("IDE is not installed", { ide: request.ide });
        return { ok: false, error: new Error(`IDE '${request.ide}' is not installed`) };
      }
      const idesResult = await this.getAvailableIDEs();
      if (isFailure(idesResult)) {
        this.logger.error("Failed to get IDE definitions", { error: idesResult.error });
        return { ok: false, error: idesResult.error };
      }
      const ide = idesResult.value.find((i) => i.name === request.ide);
      if (!ide) {
        this.logger.error("IDE definition not found", { ide: request.ide });
        return { ok: false, error: new Error(`IDE definition for '${request.ide}' not found`) };
      }
      const fileArgs = request.files.map((file) => {
        let fileArg = file.path;
        if (file.line && file.column) {
          fileArg += `:${file.line}:${file.column}`;
        } else if (file.line) {
          fileArg += `:${file.line}`;
        }
        return fileArg;
      });
      const args = [...ide.args, request.projectRoot, ...fileArgs];
      const command = `${ide.command} ${args.join(" ")}`;
      const result = await this.terminalService.spawnTerminal(command, {
        cwd: request.projectRoot,
        timeout: 1e4
      });
      if (isFailure(result)) {
        this.logger.error("Failed to open files", { error: result.error, request, command });
        return { ok: false, error: result.error };
      }
      this.logger.log("Files opened successfully", { request });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error("Failed to open files", { error, request });
      return { ok: false, error: error instanceof Error ? error : new Error("Failed to open files") };
    }
  }
  async getAvailableIDEs() {
    this.logger.debug("IDEService.getAvailableIDEs called");
    try {
      const result = await this.repository.getIDEDefinitions();
      if (isFailure(result)) {
        this.logger.error("Failed to get IDE definitions", { error: result.error });
        return { ok: false, error: result.error };
      }
      this.logger.log("IDE definitions retrieved", { count: result.value.length });
      return { ok: true, value: result.value };
    } catch (error) {
      this.logger.error("Failed to get available IDEs", { error });
      return { ok: false, error: error instanceof Error ? error : new Error("Failed to get available IDEs") };
    }
  }
  async isIDEInstalled(ideName) {
    this.logger.debug("IDEService.isIDEInstalled called", { ideName });
    try {
      const idesResult = await this.getAvailableIDEs();
      if (isFailure(idesResult)) {
        return { ok: false, error: idesResult.error };
      }
      const ide = idesResult.value.find((i) => i.name === ideName);
      if (!ide) {
        return { ok: true, value: false };
      }
      const result = await this.terminalService.isCommandAvailable(ide.command);
      if (isFailure(result)) {
        this.logger.error("Failed to check IDE availability", { error: result.error, ideName });
        return { ok: false, error: result.error };
      }
      this.logger.log("IDE installation check completed", { ideName, isInstalled: result.value });
      return { ok: true, value: result.value };
    } catch (error) {
      this.logger.error("Failed to check IDE installation", { error, ideName });
      return { ok: false, error: error instanceof Error ? error : new Error("Failed to check IDE installation") };
    }
  }
};

// ../infrastructure/repositories/IDERepository.ts
import { platform as platform4 } from "os";
var IDERepository = class {
  async getIDEDefinitions() {
    const currentPlatform = platform4();
    const localAppData = process.env.LOCALAPPDATA;
    const defaultIDEs = [
      {
        name: "vscode",
        command: "code",
        args: ["--new-window"],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "code",
        command: "code",
        args: ["--new-window"],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "cursor",
        command: currentPlatform === "win32" ? `${localAppData}\\Programs\\cursor\\Cursor.exe` : "cursor",
        args: ["--new-window"],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "webstorm",
        command: "webstorm",
        args: [],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "intellij",
        command: "idea",
        args: [],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "sublime",
        command: "subl",
        args: [],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "vim",
        command: "vim",
        args: [],
        supportedPlatforms: ["win32", "darwin", "linux"]
      },
      {
        name: "neovim",
        command: "nvim",
        args: [],
        supportedPlatforms: ["win32", "darwin", "linux"]
      }
    ];
    const platformIDEs = defaultIDEs.filter(
      (ide) => ide.supportedPlatforms.includes(currentPlatform)
    );
    return { ok: true, value: platformIDEs };
  }
  async saveIDEDefinitions(ides) {
    return { ok: true, value: void 0 };
  }
};

// ../infrastructure/services/Terminal/TerminalFacade.ts
import * as path10 from "path";
var TerminalFacade = class {
  constructor(logger) {
    const _logger = logger || new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path10.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
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

// services/ide/IDEFacade.ts
import * as path11 from "path";
var IDEFacade = class {
  constructor() {
    const repository = new IDERepository();
    const terminalService = new TerminalFacade();
    const logger = new FileLogger({
      level: "LOG",
      sinks: ["file"],
      filePath: path11.join(process.env.HOME || process.env.USERPROFILE || ".", ".codestate", "logs", "codestate.log")
    });
    this.service = new IDEService(repository, terminalService, logger);
  }
  async openIDE(ideName, projectRoot) {
    return this.service.openIDE(ideName, projectRoot);
  }
  async openFiles(request) {
    return this.service.openFiles(request);
  }
  async getAvailableIDEs() {
    return this.service.getAvailableIDEs();
  }
  async isIDEInstalled(ideName) {
    return this.service.isIDEInstalled(ideName);
  }
};

// use-cases/ide/OpenIDE.ts
var OpenIDE = class {
  constructor(ideService) {
    this.ideService = ideService || new IDEFacade();
  }
  async execute(ideName, projectRoot) {
    return this.ideService.openIDE(ideName, projectRoot);
  }
};

// use-cases/ide/OpenFiles.ts
var OpenFiles = class {
  constructor(ideService) {
    this.ideService = ideService || new IDEFacade();
  }
  async execute(request) {
    return this.ideService.openFiles(request);
  }
};

// use-cases/ide/GetAvailableIDEs.ts
var GetAvailableIDEs = class {
  constructor(ideService) {
    this.ideService = ideService || new IDEFacade();
  }
  async execute() {
    return this.ideService.getAvailableIDEs();
  }
};

// domain/types/ErrorRegistry.ts
var ErrorRegistry = {
  ["UNKNOWN" /* UNKNOWN */]: {
    code: "UNKNOWN" /* UNKNOWN */,
    userMessage: "An unknown error occurred.",
    exitCode: 1
  },
  ["CONFIG_INVALID" /* CONFIG_INVALID */]: {
    code: "CONFIG_INVALID" /* CONFIG_INVALID */,
    userMessage: "Configuration is invalid.",
    exitCode: 2
  },
  ["STORAGE_INVALID_PATH" /* STORAGE_INVALID_PATH */]: {
    code: "STORAGE_INVALID_PATH" /* STORAGE_INVALID_PATH */,
    userMessage: "Invalid file path.",
    exitCode: 3
  },
  ["STORAGE_DECRYPTION_FAILED" /* STORAGE_DECRYPTION_FAILED */]: {
    code: "STORAGE_DECRYPTION_FAILED" /* STORAGE_DECRYPTION_FAILED */,
    userMessage: "Decryption failed during storage operation.",
    exitCode: 4
  },
  ["STORAGE_READ_FAILED" /* STORAGE_READ_FAILED */]: {
    code: "STORAGE_READ_FAILED" /* STORAGE_READ_FAILED */,
    userMessage: "File read failed.",
    exitCode: 5
  },
  ["STORAGE_WRITE_FAILED" /* STORAGE_WRITE_FAILED */]: {
    code: "STORAGE_WRITE_FAILED" /* STORAGE_WRITE_FAILED */,
    userMessage: "File write failed.",
    exitCode: 6
  },
  ["STORAGE_DELETE_FAILED" /* STORAGE_DELETE_FAILED */]: {
    code: "STORAGE_DELETE_FAILED" /* STORAGE_DELETE_FAILED */,
    userMessage: "File delete failed.",
    exitCode: 7
  },
  ["ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */]: {
    code: "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
    userMessage: "Encryption failed.",
    exitCode: 8
  },
  ["ENCRYPTION_INVALID_FORMAT" /* ENCRYPTION_INVALID_FORMAT */]: {
    code: "ENCRYPTION_INVALID_FORMAT" /* ENCRYPTION_INVALID_FORMAT */,
    userMessage: "Invalid encrypted data format.",
    exitCode: 9
  },
  ["SCRIPT_INVALID" /* SCRIPT_INVALID */]: {
    code: "SCRIPT_INVALID" /* SCRIPT_INVALID */,
    userMessage: "Script is invalid.",
    exitCode: 10
  },
  ["SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */]: {
    code: "SCRIPT_DUPLICATE" /* SCRIPT_DUPLICATE */,
    userMessage: "Script already exists.",
    exitCode: 11
  },
  ["SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */]: {
    code: "SCRIPT_NOT_FOUND" /* SCRIPT_NOT_FOUND */,
    userMessage: "Script not found.",
    exitCode: 12
  },
  ["SCRIPT_PATH_INVALID" /* SCRIPT_PATH_INVALID */]: {
    code: "SCRIPT_PATH_INVALID" /* SCRIPT_PATH_INVALID */,
    userMessage: "Script path is invalid.",
    exitCode: 13
  },
  ["SCRIPT_MALICIOUS" /* SCRIPT_MALICIOUS */]: {
    code: "SCRIPT_MALICIOUS" /* SCRIPT_MALICIOUS */,
    userMessage: "Script contains malicious content.",
    exitCode: 14
  },
  ["GIT_NOT_REPOSITORY" /* GIT_NOT_REPOSITORY */]: {
    code: "GIT_NOT_REPOSITORY" /* GIT_NOT_REPOSITORY */,
    userMessage: "Not a git repository.",
    exitCode: 15
  },
  ["GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */]: {
    code: "GIT_COMMAND_FAILED" /* GIT_COMMAND_FAILED */,
    userMessage: "Git command failed.",
    exitCode: 16
  },
  ["GIT_STASH_NOT_FOUND" /* GIT_STASH_NOT_FOUND */]: {
    code: "GIT_STASH_NOT_FOUND" /* GIT_STASH_NOT_FOUND */,
    userMessage: "Git stash not found.",
    exitCode: 17
  },
  ["GIT_STASH_CONFLICT" /* GIT_STASH_CONFLICT */]: {
    code: "GIT_STASH_CONFLICT" /* GIT_STASH_CONFLICT */,
    userMessage: "Git stash apply resulted in conflicts.",
    exitCode: 18
  },
  ["TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */]: {
    code: "TERMINAL_COMMAND_FAILED" /* TERMINAL_COMMAND_FAILED */,
    userMessage: "Terminal command failed.",
    exitCode: 19
  },
  ["TERMINAL_TIMEOUT" /* TERMINAL_TIMEOUT */]: {
    code: "TERMINAL_TIMEOUT" /* TERMINAL_TIMEOUT */,
    userMessage: "Terminal command timed out.",
    exitCode: 20
  },
  ["TERMINAL_COMMAND_NOT_FOUND" /* TERMINAL_COMMAND_NOT_FOUND */]: {
    code: "TERMINAL_COMMAND_NOT_FOUND" /* TERMINAL_COMMAND_NOT_FOUND */,
    userMessage: "Terminal command not found.",
    exitCode: 21
  }
};
function getUserMessageForErrorCode(code) {
  return ErrorRegistry[code]?.userMessage || ErrorRegistry["UNKNOWN" /* UNKNOWN */].userMessage;
}
function getExitCodeForErrorCode(code) {
  return ErrorRegistry[code]?.exitCode || ErrorRegistry["UNKNOWN" /* UNKNOWN */].exitCode;
}

// ../infrastructure/services/CLILogger/CLILogger.ts
var CLILogger = class {
  plainLog(message, meta) {
    console.log(message);
    if (meta && Object.keys(meta).length > 0) {
      console.log(meta);
    }
  }
  log(message, meta) {
    console.log(`\u2705 ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.log(meta);
    }
  }
  error(message, meta) {
    console.error(`\u274C ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.error(meta);
    }
  }
  warn(message, meta) {
    console.warn(`\u26A0\uFE0F ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.error(meta);
    }
  }
  debug(message, meta) {
  }
};

// ../infrastructure/services/CLILogger/CLILoggerFacade.ts
var CLILoggerFacade = class {
  constructor() {
    this.logger = new CLILogger();
  }
  log(message, meta) {
    this.logger.log(message, meta);
  }
  error(message, meta) {
    this.logger.error(message, meta);
  }
  warn(message, meta) {
    this.logger.warn(message, meta);
  }
  plainLog(message, meta) {
    this.logger.plainLog(message, meta);
  }
  // Note: warn and debug methods are intentionally not exposed
  // to keep CLI output clean and user-friendly
};
export {
  AppError,
  ApplyStash,
  CommitChanges,
  ConfigError,
  CLILoggerFacade as ConfigurableLogger,
  CreateScript,
  CreateScripts,
  CreateStash,
  DeleteScript,
  DeleteScriptsByRootPath,
  DeleteSession,
  DeleteStash,
  EncryptionError,
  ErrorCode,
  ErrorRegistry,
  ExportConfig,
  ExportScripts,
  GetAvailableIDEs,
  GetConfig,
  GetCurrentCommit,
  GetDirtyData,
  GetGitStatus,
  GetIsDirty,
  GetScripts,
  GetScriptsByRootPath,
  GitError,
  GitFacade as GitService,
  IDEFacade as IDEService,
  ImportConfig,
  ImportScripts,
  ListSessions,
  ListStashes,
  OpenFiles,
  OpenIDE,
  ResetConfig,
  ResumeSession,
  SaveSession,
  ScriptError,
  StorageError,
  TerminalFacade as Terminal,
  TerminalError,
  UpdateConfig,
  UpdateScript,
  UpdateSession,
  getExitCodeForErrorCode,
  getUserMessageForErrorCode,
  isFailure,
  isSuccess
};
//# sourceMappingURL=index.js.map
