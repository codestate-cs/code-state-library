import { ConfigSchema, validateConfig } from '@codestate/core/domain/schemas/SchemaRegistry';
import { describe, expect, it } from '@jest/globals';

describe('ConfigSchema & validateConfig', () => {
  // Happy path
  it('should validate a correct config object', () => {
    const validConfig = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: { enabled: true, encryptionKey: 'secret' },
      storagePath: '/tmp/storage',
      logger: { level: 'LOG', sinks: ['console'] },
      experimental: { featureX: true },
      extensions: { ext1: { foo: 'bar' } },
    };
    expect(() => validateConfig(validConfig)).not.toThrow();
    expect(ConfigSchema.parse(validConfig)).toBeTruthy();
  });

  // Failure: missing required fields
  it('should fail if required fields are missing', () => {
    const invalidConfig = {
      ide: 'vscode',
      encryption: { enabled: true },
      storagePath: '/tmp/storage',
      logger: { level: 'LOG', sinks: ['console'] },
    };
    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  // Invalid input: wrong types
  it('should fail if types are incorrect', () => {
    const invalidConfig = {
      version: 123,
      ide: 456,
      encryption: { enabled: 'yes' },
      storagePath: 789,
      logger: { level: 'LOG', sinks: ['console'] },
    };
    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  // Pathological: empty strings, empty objects
  it('should fail for empty strings and empty objects', () => {
    const invalidConfig = {
      version: '',
      ide: '',
      encryption: {},
      storagePath: '',
      logger: {},
    };
    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present', () => {
    const validConfig = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: { enabled: true },
      storagePath: '/tmp/storage',
      logger: { level: 'LOG', sinks: ['console'] },
      extra: 'malicious',
    };
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  // Sanitization: extensions and experimental fields
  it('should allow extensions and experimental fields with any keys', () => {
    const validConfig = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: { enabled: false },
      storagePath: '/tmp/storage',
      logger: { level: 'LOG', sinks: ['console'] },
      experimental: { foo: true, bar: false },
      extensions: { plugin: { enabled: true } },
    };
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  // Human oversight: typos in keys
  it('should fail if a required key is misspelled', () => {
    const invalidConfig = {
      versoin: '1.0.0', // typo
      ide: 'vscode',
      encryption: { enabled: true },
      storagePath: '/tmp/storage',
      logger: { level: 'LOG', sinks: ['console'] },
    };
    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});
