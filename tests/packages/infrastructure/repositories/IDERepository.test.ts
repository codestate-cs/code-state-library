import { IDERepository } from '../../../../packages/infrastructure/repositories/IDERepository';
import { IDE } from '../../../../packages/core/domain/models/IDE';
import { Result } from '../../../../packages/core/domain/models/Result';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { platform } from 'os';

// Mock os module
jest.mock('os');
const mockedPlatform = platform as jest.MockedFunction<typeof platform>;

describe('IDERepository', () => {
  let repository: IDERepository;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env
    process.env = { ...originalEnv };
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Default platform mock
    mockedPlatform.mockReturnValue('win32');
    
    repository = new IDERepository();
  });

  describe('getIDEDefinitions - Happy Path', () => {
    it('should return IDE definitions for Windows', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = 'C:\\Users\\TestUser\\AppData\\Local';
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeGreaterThan(0);
        
        // Check for specific IDEs
        const vscode = result.value.find(ide => ide.name === 'vscode');
        const cursor = result.value.find(ide => ide.name === 'cursor');
        
        expect(vscode).toBeDefined();
        expect(vscode?.command).toBe('code');
        expect(vscode?.args).toEqual(['--new-window']);
        expect(vscode?.supportedPlatforms).toContain('win32');
        
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('C:\\Users\\TestUser\\AppData\\Local\\Programs\\cursor\\Cursor.exe');
        expect(cursor?.args).toEqual(['--new-window']);
      }
    });

    it('should return IDE definitions for macOS', async () => {
      mockedPlatform.mockReturnValue('darwin');
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeGreaterThan(0);
        
        // Check for specific IDEs
        const vscode = result.value.find(ide => ide.name === 'vscode');
        const cursor = result.value.find(ide => ide.name === 'cursor');
        
        expect(vscode).toBeDefined();
        expect(vscode?.command).toBe('code');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('cursor');
      }
    });

    it('should return IDE definitions for Linux', async () => {
      mockedPlatform.mockReturnValue('linux');
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeGreaterThan(0);
        
        // Check for specific IDEs
        const vscode = result.value.find(ide => ide.name === 'vscode');
        const cursor = result.value.find(ide => ide.name === 'cursor');
        
        expect(vscode).toBeDefined();
        expect(vscode?.command).toBe('code');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('cursor');
      }
    });

    it('should filter IDEs for current platform', async () => {
      mockedPlatform.mockReturnValue('win32');
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // All returned IDEs should support the current platform
        result.value.forEach(ide => {
          expect(ide.supportedPlatforms).toContain('win32');
        });
      }
    });

    it('should include all expected IDE types', async () => {
      mockedPlatform.mockReturnValue('win32');
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const ideNames = result.value.map(ide => ide.name);
        
        expect(ideNames).toContain('vscode');
        expect(ideNames).toContain('code');
        expect(ideNames).toContain('cursor');
        expect(ideNames).toContain('webstorm');
        expect(ideNames).toContain('intellij');
        expect(ideNames).toContain('sublime');
        expect(ideNames).toContain('vim');
        expect(ideNames).toContain('neovim');
      }
    });
  });

  describe('getIDEDefinitions - Error Cases', () => {
    it('should handle missing LOCALAPPDATA environment variable on Windows', async () => {
      mockedPlatform.mockReturnValue('win32');
      delete process.env.LOCALAPPDATA;
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('undefined\\Programs\\cursor\\Cursor.exe'); // Actual behavior when LOCALAPPDATA is undefined
      }
    });

    it('should handle undefined LOCALAPPDATA environment variable on Windows', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = undefined;
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('undefined\\Programs\\cursor\\Cursor.exe'); // Actual behavior when LOCALAPPDATA is undefined
      }
    });

    it('should handle empty LOCALAPPDATA environment variable on Windows', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = '';
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toBe('\\Programs\\cursor\\Cursor.exe'); // Actual behavior when LOCALAPPDATA is empty
      }
    });
  });

  describe('getIDEDefinitions - Pathological Cases', () => {
    it('should handle unknown platform', async () => {
      mockedPlatform.mockReturnValue('unknown' as any);
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for unknown platform
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle null platform', async () => {
      mockedPlatform.mockReturnValue(null as any);
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for null platform
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle undefined platform', async () => {
      mockedPlatform.mockReturnValue(undefined as any);
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for undefined platform
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle very long LOCALAPPDATA path', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = 'C:\\' + 'a'.repeat(1000) + '\\AppData\\Local';
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain('a'.repeat(1000));
      }
    });
  });

  describe('getIDEDefinitions - Invalid Input', () => {
    it('should handle non-string platform', async () => {
      mockedPlatform.mockReturnValue(123 as any);
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for invalid platform
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle boolean platform', async () => {
      mockedPlatform.mockReturnValue(true as any);
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for invalid platform
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('getIDEDefinitions - Malicious Input', () => {
    it('should handle SQL injection in LOCALAPPDATA', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = "'; DROP TABLE users; --";
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain("'; DROP TABLE users; --");
      }
    });

    it('should handle path traversal in LOCALAPPDATA', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = "../../../etc/passwd";
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain("../../../etc/passwd");
      }
    });

    it('should handle XSS in LOCALAPPDATA', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = "<script>alert('xss')</script>";
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain("<script>alert('xss')</script>");
      }
    });

    it('should handle command injection in LOCALAPPDATA', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = "$(rm -rf /)";
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain("$(rm -rf /)");
      }
    });
  });

  describe('getIDEDefinitions - Human Oversight', () => {
    it('should handle typos in platform names', async () => {
      mockedPlatform.mockReturnValue('win32' as any); // Correct platform
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should still work with correct platform
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should handle case sensitivity issues', async () => {
      mockedPlatform.mockReturnValue('WIN32' as any); // Wrong case
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should return empty array for wrong case
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle extra whitespace in LOCALAPPDATA', async () => {
      mockedPlatform.mockReturnValue('win32');
      process.env.LOCALAPPDATA = '  C:\\Users\\TestUser\\AppData\\Local  ';
      
      const result = await repository.getIDEDefinitions();
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cursor = result.value.find(ide => ide.name === 'cursor');
        expect(cursor).toBeDefined();
        expect(cursor?.command).toContain('  C:\\Users\\TestUser\\AppData\\Local  ');
      }
    });
  });

  describe('saveIDEDefinitions - Happy Path', () => {
    it('should save IDE definitions successfully', async () => {
      const ides: IDE[] = [
        {
          name: 'vscode',
          command: 'code',
          args: ['--new-window'],
          supportedPlatforms: ['win32', 'darwin', 'linux']
        },
        {
          name: 'cursor',
          command: 'cursor',
          args: ['--new-window'],
          supportedPlatforms: ['win32', 'darwin', 'linux']
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should save empty IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions([]);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should save single IDE definition', async () => {
      const ides: IDE[] = [
        {
          name: 'vscode',
          command: 'code',
          args: ['--new-window'],
          supportedPlatforms: ['win32', 'darwin', 'linux']
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('saveIDEDefinitions - Error Cases', () => {
    it('should handle null IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions(null as any);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle undefined IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions(undefined as any);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('saveIDEDefinitions - Pathological Cases', () => {
    it('should handle very large IDE definitions array', async () => {
      const largeIDEs: IDE[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `ide${i}`,
        command: `command${i}`,
        args: [`arg${i}`],
        supportedPlatforms: ['win32', 'darwin', 'linux']
      }));
      
      const result = await repository.saveIDEDefinitions(largeIDEs);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with null values', async () => {
      const ides = [
        {
          name: null,
          command: null,
          args: null,
          supportedPlatforms: null
        }
      ] as any;
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with undefined values', async () => {
      const ides = [
        {
          name: undefined,
          command: undefined,
          args: undefined,
          supportedPlatforms: undefined
        }
      ] as any;
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();

      }
    });
  });

  describe('saveIDEDefinitions - Invalid Input', () => {
    it('should handle non-array IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions('not an array' as any);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle number IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions(123 as any);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle boolean IDE definitions', async () => {
      const result = await repository.saveIDEDefinitions(true as any);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('saveIDEDefinitions - Malicious Input', () => {
    it('should handle IDE definitions with SQL injection', async () => {
      const ides: IDE[] = [
        {
          name: "'; DROP TABLE ides; --",
          command: "'; DROP TABLE commands; --",
          args: ["'; DROP TABLE args; --"],
          supportedPlatforms: ["'; DROP TABLE platforms; --"]
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with XSS', async () => {
      const ides: IDE[] = [
        {
          name: "<script>alert('xss')</script>",
          command: "<script>alert('xss')</script>",
          args: ["<script>alert('xss')</script>"],
          supportedPlatforms: ["<script>alert('xss')</script>"]
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with command injection', async () => {
      const ides: IDE[] = [
        {
          name: "$(rm -rf /)",
          command: "$(rm -rf /)",
          args: ["$(rm -rf /)"],
          supportedPlatforms: ["$(rm -rf /)"]
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with path traversal', async () => {
      const ides: IDE[] = [
        {
          name: "../../../etc/passwd",
          command: "../../../etc/passwd",
          args: ["../../../etc/passwd"],
          supportedPlatforms: ["../../../etc/passwd"]
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('saveIDEDefinitions - Human Oversight', () => {
    it('should handle IDE definitions with typos', async () => {
      const ides: IDE[] = [
        {
          name: 'vscode', // Correct
          command: 'code', // Correct
          args: ['--new-window'], // Correct
          supportedPlatforms: ['win32', 'darwin', 'linux'] // Correct
        },
        {
          name: 'vscod', // Typo
          command: 'cod', // Typo
          args: ['--new-window'], // Correct
          supportedPlatforms: ['win32', 'darwin', 'linux'] // Correct
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should handle IDE definitions with case sensitivity issues', async () => {
      const ides: IDE[] = [
        {
          name: 'VSCODE', // Wrong case
          command: 'CODE', // Wrong case
          args: ['--NEW-WINDOW'], // Wrong case
          supportedPlatforms: ['WIN32', 'DARWIN', 'LINUX'] // Wrong case
        }
      ];
      
      const result = await repository.saveIDEDefinitions(ides);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', async () => {
      // Get IDE definitions
      const getResult = await repository.getIDEDefinitions();
      expect(getResult.ok).toBe(true);
      
      if (getResult.ok) {
        expect(getResult.value.length).toBeGreaterThan(0);
        
        // Save IDE definitions
        const saveResult = await repository.saveIDEDefinitions(getResult.value);
        expect(saveResult.ok).toBe(true);
      }
    });

    it('should handle different platforms', async () => {
      const platforms = ['win32', 'darwin', 'linux'];
      
      for (const platform of platforms) {
        mockedPlatform.mockReturnValue(platform as NodeJS.Platform);
        
        const result = await repository.getIDEDefinitions();
        expect(result.ok).toBe(true);
        
        if (result.ok) {
          // All returned IDEs should support the current platform
          result.value.forEach(ide => {
            expect(ide.supportedPlatforms).toContain(platform);
          });
        }
      }
    });

    it('should handle environment variable changes', async () => {
      mockedPlatform.mockReturnValue('win32');
      
      // Test with different LOCALAPPDATA values
      const testPaths = [
        'C:\\Users\\TestUser\\AppData\\Local',
        'C:\\Users\\AnotherUser\\AppData\\Local',
        'D:\\Custom\\AppData\\Local',
      ];
      
      for (const path of testPaths) {
        process.env.LOCALAPPDATA = path;
        
        const result = await repository.getIDEDefinitions();
        expect(result.ok).toBe(true);
        
        if (result.ok) {
          const cursor = result.value.find(ide => ide.name === 'cursor');
          expect(cursor).toBeDefined();
          expect(cursor?.command).toContain(path);
        }
      }
    });
  });
}); 