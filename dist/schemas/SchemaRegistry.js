import { z } from 'zod';
// Core schemas for configuration and validation
export const LogLevelSchema = z.enum(['ERROR', 'WARN', 'LOG', 'DEBUG']);
export const LoggerConfigSchema = z.object({
    level: LogLevelSchema,
    sinks: z.array(z.enum(['console', 'file'])),
    filePath: z.string().optional(),
});
export const FileStorageConfigSchema = z.object({
    encryptionEnabled: z.boolean(),
    encryptionKey: z.string().optional(),
    dataDir: z.string(),
});
export const FeatureFlagsSchema = z.object({
    experimentalTui: z.boolean(),
    experimentalIde: z.boolean(),
    advancedSearch: z.boolean(),
    cloudSync: z.boolean(),
});
export const PluginEnvironmentSchema = z.enum(['cli', 'tui', 'ide']);
export const ErrorCodeSchema = z.enum([
    'UNKNOWN',
    'CONFIG_INVALID',
    'STORAGE_INVALID_PATH',
    'STORAGE_DECRYPTION_FAILED',
    'STORAGE_READ_FAILED',
    'STORAGE_WRITE_FAILED',
    'STORAGE_DELETE_FAILED',
    'ENCRYPTION_FAILED',
    'ENCRYPTION_INVALID_FORMAT',
]);
export const EncryptionConfigSchema = z.object({
    enabled: z.boolean(),
    encryptionKey: z.string().optional(),
});
export const ConfigSchema = z.object({
    version: z.string(),
    ide: z.string(),
    encryption: EncryptionConfigSchema,
    storagePath: z.string(),
    logger: LoggerConfigSchema,
    experimental: z.record(z.string(), z.boolean()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
});
// Schema registry for easy access and validation
export const SchemaRegistry = {
    LogLevel: LogLevelSchema,
    LoggerConfig: LoggerConfigSchema,
    FileStorageConfig: FileStorageConfigSchema,
    FeatureFlags: FeatureFlagsSchema,
    PluginEnvironment: PluginEnvironmentSchema,
    ErrorCode: ErrorCodeSchema,
    Config: ConfigSchema,
};
// Validation helpers
export function validateLoggerConfig(data) {
    return LoggerConfigSchema.parse(data);
}
export function validateFileStorageConfig(data) {
    return FileStorageConfigSchema.parse(data);
}
export function validateFeatureFlags(data) {
    return FeatureFlagsSchema.parse(data);
}
export function validateConfig(data) {
    return ConfigSchema.parse(data);
}
