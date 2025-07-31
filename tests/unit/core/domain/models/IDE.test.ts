import { IDE } from '@codestate/core/domain/models/IDE';

describe('IDE Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid IDE with all properties', () => {
      const validIDE = {
        id: 'vscode',
        name: 'Visual Studio Code',
        version: '1.80.0',
        executable: '/usr/bin/code',
        isAvailable: true,
        supportedExtensions: ['.ts', '.js', '.json'],
        settings: {
          theme: 'dark',
          fontSize: 14,
          autoSave: true
        },
        openFiles: ['/file1.ts', '/file2.ts'],
        activeFile: '/file1.ts',
        workspace: '/workspace/project'
      };

      const ide = new IDE(validIDE);
      
      expect(ide.id).toBe('vscode');
      expect(ide.name).toBe('Visual Studio Code');
      expect(ide.version).toBe('1.80.0');
      expect(ide.executable).toBe('/usr/bin/code');
      expect(ide.isAvailable).toBe(true);
      expect(ide.supportedExtensions).toEqual(['.ts', '.js', '.json']);
      expect(ide.settings).toEqual({
        theme: 'dark',
        fontSize: 14,
        autoSave: true
      });
      expect(ide.openFiles).toEqual(['/file1.ts', '/file2.ts']);
      expect(ide.activeFile).toBe('/file1.ts');
      expect(ide.workspace).toBe('/workspace/project');
    });

    it('should create IDE with minimal properties', () => {
      const minimalIDE = {
        id: 'minimal-ide',
        name: 'Minimal IDE',
        isAvailable: false
      };

      const ide = new IDE(minimalIDE);
      
      expect(ide.id).toBe('minimal-ide');
      expect(ide.name).toBe('Minimal IDE');
      expect(ide.isAvailable).toBe(false);
      expect(ide.version).toBeUndefined();
      expect(ide.executable).toBeUndefined();
      expect(ide.supportedExtensions).toBeUndefined();
      expect(ide.settings).toBeUndefined();
      expect(ide.openFiles).toBeUndefined();
      expect(ide.activeFile).toBeUndefined();
      expect(ide.workspace).toBeUndefined();
    });

    it('should handle empty arrays for extensions and files', () => {
      const ide = new IDE({
        id: 'empty-arrays',
        name: 'Empty Arrays',
        isAvailable: true,
        supportedExtensions: [],
        openFiles: []
      });

      expect(ide.supportedExtensions).toEqual([]);
      expect(ide.openFiles).toEqual([]);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const ide = new IDE({
        id: null as any,
        name: null as any,
        version: null as any,
        executable: null as any,
        isAvailable: null as any,
        supportedExtensions: null as any,
        settings: null as any,
        openFiles: null as any,
        activeFile: null as any,
        workspace: null as any
      });

      expect(ide.id).toBeNull();
      expect(ide.name).toBeNull();
      expect(ide.version).toBeNull();
      expect(ide.executable).toBeNull();
      expect(ide.isAvailable).toBeNull();
      expect(ide.supportedExtensions).toBeNull();
      expect(ide.settings).toBeNull();
      expect(ide.openFiles).toBeNull();
      expect(ide.activeFile).toBeNull();
      expect(ide.workspace).toBeNull();
    });

    it('should handle undefined values', () => {
      const ide = new IDE({
        id: undefined,
        name: undefined,
        version: undefined,
        executable: undefined,
        isAvailable: undefined,
        supportedExtensions: undefined,
        settings: undefined,
        openFiles: undefined,
        activeFile: undefined,
        workspace: undefined
      });

      expect(ide.id).toBeUndefined();
      expect(ide.name).toBeUndefined();
      expect(ide.version).toBeUndefined();
      expect(ide.executable).toBeUndefined();
      expect(ide.isAvailable).toBeUndefined();
      expect(ide.supportedExtensions).toBeUndefined();
      expect(ide.settings).toBeUndefined();
      expect(ide.openFiles).toBeUndefined();
      expect(ide.activeFile).toBeUndefined();
      expect(ide.workspace).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const ide = new IDE({
        id: 123 as any,
        name: [] as any,
        version: {} as any,
        executable: true as any,
        isAvailable: 'not-a-boolean' as any,
        supportedExtensions: 'not-an-array' as any,
        settings: 'not-an-object' as any,
        openFiles: 456 as any,
        activeFile: [] as any,
        workspace: null as any
      });

      expect(ide.id).toBe(123);
      expect(ide.name).toEqual([]);
      expect(ide.version).toEqual({});
      expect(ide.executable).toBe(true);
      expect(ide.isAvailable).toBe('not-a-boolean');
      expect(ide.supportedExtensions).toBe('not-an-array');
      expect(ide.settings).toBe('not-an-object');
      expect(ide.openFiles).toBe(456);
      expect(ide.activeFile).toEqual([]);
      expect(ide.workspace).toBeNull();
    });

    it('should handle empty object', () => {
      const ide = new IDE({});
      
      expect(ide.id).toBeUndefined();
      expect(ide.name).toBeUndefined();
      expect(ide.isAvailable).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed extensions array', () => {
      const malformedExtensions = [
        null,
        undefined,
        123,
        {},
        [],
        'string-extension'
      ];

      const ide = new IDE({
        id: 'malformed',
        name: 'Malformed',
        isAvailable: true,
        supportedExtensions: malformedExtensions as any
      });

      expect(ide.supportedExtensions).toEqual(malformedExtensions);
    });

    it('should handle malformed settings object', () => {
      const malformedSettings = {
        theme: null,
        fontSize: 'not-a-number',
        autoSave: 'not-a-boolean'
      };

      const ide = new IDE({
        id: 'malformed-settings',
        name: 'Malformed Settings',
        isAvailable: true,
        settings: malformedSettings as any
      });

      expect(ide.settings).toEqual(malformedSettings);
    });

    it('should handle malformed openFiles array', () => {
      const malformedFiles = [
        null,
        undefined,
        123,
        {},
        [],
        'string-file'
      ];

      const ide = new IDE({
        id: 'malformed-files',
        name: 'Malformed Files',
        isAvailable: true,
        openFiles: malformedFiles as any
      });

      expect(ide.openFiles).toEqual(malformedFiles);
    });

    it('should handle circular references', () => {
      const circular: any = { id: 'circular', name: 'Circular' };
      circular.self = circular;

      const ide = new IDE(circular);
      
      expect(ide.id).toBe('circular');
      expect(ide.name).toBe('Circular');
      expect((ide as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const ide = new IDE({
        id: 'long-string',
        name: longString,
        executable: longString,
        workspace: longString
      });

      expect(ide.name).toBe(longString);
      expect(ide.executable).toBe(longString);
      expect(ide.workspace).toBe(longString);
    });

    it('should handle large extensions arrays', () => {
      const largeExtensions = Array.from({ length: 10000 }, (_, i) => `.ext-${i}`);
      const ide = new IDE({
        id: 'large-extensions',
        name: 'Large Extensions',
        isAvailable: true,
        supportedExtensions: largeExtensions
      });

      expect(ide.supportedExtensions).toEqual(largeExtensions);
    });

    it('should handle large openFiles arrays', () => {
      const largeFiles = Array.from({ length: 10000 }, (_, i) => `/file-${i}.ts`);
      const ide = new IDE({
        id: 'large-files',
        name: 'Large Files',
        isAvailable: true,
        openFiles: largeFiles
      });

      expect(ide.openFiles).toEqual(largeFiles);
    });

    it('should handle deeply nested objects', () => {
      const deeplyNested = (() => {
        const obj: any = {};
        let current = obj;
        for (let i = 0; i < 100; i++) {
          current.nested = {};
          current = current.nested;
        }
        return obj;
      })();

      const ide = new IDE({
        id: 'nested',
        name: 'Nested',
        isAvailable: true,
        extra: deeplyNested
      });

      expect((ide as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const ideWithTypos = {
        id: 'typos',
        nam: 'Test IDE', // should be 'name'
        verson: '1.0.0', // should be 'version'
        executble: '/usr/bin/code', // should be 'executable'
        isAvalable: true, // should be 'isAvailable'
        supportedExtnsions: ['.ts'], // should be 'supportedExtensions'
        settngs: { theme: 'dark' }, // should be 'settings'
        openFles: ['/file1.ts'], // should be 'openFiles'
        actveFile: '/file1.ts', // should be 'activeFile'
        wrkspace: '/workspace' // should be 'workspace'
      };

      const ide = new IDE(ideWithTypos as any);
      
      expect(ide.id).toBe('typos');
      expect((ide as any).nam).toBe('Test IDE');
      expect((ide as any).verson).toBe('1.0.0');
      expect((ide as any).executble).toBe('/usr/bin/code');
      expect((ide as any).isAvalable).toBe(true);
      expect((ide as any).supportedExtnsions).toEqual(['.ts']);
      expect((ide as any).settngs).toEqual({ theme: 'dark' });
      expect((ide as any).openFles).toEqual(['/file1.ts']);
      expect((ide as any).actveFile).toBe('/file1.ts');
      expect((ide as any).wrkspace).toBe('/workspace');
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        id: 123,
        name: [],
        version: {},
        executable: 456,
        isAvailable: 'true',
        supportedExtensions: 'single-extension',
        settings: 'not-an-object',
        openFiles: 789,
        activeFile: true,
        workspace: []
      };

      const ide = new IDE(wrongTypes as any);
      
      expect(ide.id).toBe(123);
      expect(ide.name).toEqual([]);
      expect(ide.version).toEqual({});
      expect(ide.executable).toBe(456);
      expect(ide.isAvailable).toBe('true');
      expect(ide.supportedExtensions).toBe('single-extension');
      expect(ide.settings).toBe('not-an-object');
      expect(ide.openFiles).toBe(789);
      expect(ide.activeFile).toBe(true);
      expect(ide.workspace).toEqual([]);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal in executable and workspace', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const ide = new IDE({
          id: 'path-traversal',
          name: 'Path Traversal',
          isAvailable: true,
          executable: path,
          workspace: path
        });

        expect(ide.executable).toBe(path);
        expect(ide.workspace).toBe(path);
      });
    });

    it('should handle null bytes in paths', () => {
      const nullByteString = 'file\x00name';
      const ide = new IDE({
        id: 'null-bytes',
        name: 'Null Bytes',
        isAvailable: true,
        executable: nullByteString,
        workspace: nullByteString,
        openFiles: [nullByteString]
      });

      expect(ide.executable).toBe(nullByteString);
      expect(ide.workspace).toBe(nullByteString);
      expect(ide.openFiles).toEqual([nullByteString]);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const ide = new IDE({
        id: 'unicode-control',
        name: unicodeControl,
        isAvailable: true,
        executable: unicodeControl,
        workspace: unicodeControl
      });

      expect(ide.name).toBe(unicodeControl);
      expect(ide.executable).toBe(unicodeControl);
      expect(ide.workspace).toBe(unicodeControl);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const ide = new IDE({
        id: 'script-injection',
        name: scriptInjection,
        isAvailable: true,
        executable: scriptInjection,
        workspace: scriptInjection
      });

      expect(ide.name).toBe(scriptInjection);
      expect(ide.executable).toBe(scriptInjection);
      expect(ide.workspace).toBe(scriptInjection);
    });

    it('should handle command injection in executable', () => {
      const maliciousExecutables = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'code && rm -rf /'
      ];

      maliciousExecutables.forEach(executable => {
        const ide = new IDE({
          id: 'malicious-executable',
          name: 'Malicious Executable',
          isAvailable: true,
          executable
        });

        expect(ide.executable).toBe(executable);
      });
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const ide = new IDE({
        id: 'test-json',
        name: 'Test JSON',
        isAvailable: true,
        supportedExtensions: ['.ts', '.js'],
        settings: {
          theme: 'dark',
          fontSize: 14
        }
      });

      const json = ide.toJSON();
      
      expect(json).toEqual({
        id: 'test-json',
        name: 'Test JSON',
        isAvailable: true,
        supportedExtensions: ['.ts', '.js'],
        settings: {
          theme: 'dark',
          fontSize: 14
        }
      });
    });

    it('should have validate method', () => {
      const ide = new IDE({
        id: 'test-validate',
        name: 'Test Validate',
        isAvailable: true
      });

      expect(typeof ide.validate).toBe('function');
    });

    it('should have clone method', () => {
      const ide = new IDE({
        id: 'test-clone',
        name: 'Test Clone',
        isAvailable: true,
        supportedExtensions: ['.ts', '.js'],
        settings: {
          theme: 'dark',
          fontSize: 14
        }
      });

      const cloned = ide.clone();
      
      expect(cloned).not.toBe(ide);
      expect(cloned.id).toBe(ide.id);
      expect(cloned.name).toBe(ide.name);
      expect(cloned.isAvailable).toBe(ide.isAvailable);
      expect(cloned.supportedExtensions).toEqual(ide.supportedExtensions);
      expect(cloned.settings).toEqual(ide.settings);
    });

    it('should have openFile method', () => {
      const ide = new IDE({
        id: 'test-open-file',
        name: 'Test Open File',
        isAvailable: true
      });

      expect(typeof ide.openFile).toBe('function');
    });

    it('should have openFiles method', () => {
      const ide = new IDE({
        id: 'test-open-files',
        name: 'Test Open Files',
        isAvailable: true
      });

      expect(typeof ide.openFiles).toBe('function');
    });

    it('should have getOpenFiles method', () => {
      const ide = new IDE({
        id: 'test-get-files',
        name: 'Test Get Files',
        isAvailable: true,
        openFiles: ['/file1.ts', '/file2.ts']
      });

      expect(typeof ide.getOpenFiles).toBe('function');
    });

    it('should have setActiveFile method', () => {
      const ide = new IDE({
        id: 'test-set-active',
        name: 'Test Set Active',
        isAvailable: true,
        openFiles: ['/file1.ts', '/file2.ts']
      });

      expect(typeof ide.setActiveFile).toBe('function');
    });

    it('should have updateSettings method', () => {
      const ide = new IDE({
        id: 'test-update-settings',
        name: 'Test Update Settings',
        isAvailable: true,
        settings: {
          theme: 'dark',
          fontSize: 14
        }
      });

      expect(typeof ide.updateSettings).toBe('function');
    });
  });
}); 