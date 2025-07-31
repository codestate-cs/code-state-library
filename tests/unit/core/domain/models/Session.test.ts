import { Session } from '@codestate/core/domain/models/Session';

describe('Session Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid session with all properties', () => {
      const validSession = {
        id: 'test-session-1',
        name: 'Test Session',
        description: 'A test session',
        openFiles: ['/file1.ts', '/file2.ts'],
        activeFile: '/file1.ts',
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const session = new Session(validSession);
      
      expect(session.id).toBe('test-session-1');
      expect(session.name).toBe('Test Session');
      expect(session.description).toBe('A test session');
      expect(session.openFiles).toEqual(['/file1.ts', '/file2.ts']);
      expect(session.activeFile).toBe('/file1.ts');
      expect(session.gitStatus).toEqual({
        branch: 'main',
        isDirty: false,
        dirtyFiles: []
      });
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it('should create session with minimal properties', () => {
      const minimalSession = {
        id: 'minimal-session',
        name: 'Minimal Session',
        openFiles: ['/file1.ts']
      };

      const session = new Session(minimalSession);
      
      expect(session.id).toBe('minimal-session');
      expect(session.name).toBe('Minimal Session');
      expect(session.openFiles).toEqual(['/file1.ts']);
      expect(session.description).toBeUndefined();
      expect(session.activeFile).toBeUndefined();
      expect(session.gitStatus).toBeUndefined();
    });

    it('should handle empty arrays for openFiles and dirtyFiles', () => {
      const session = new Session({
        id: 'empty-arrays',
        name: 'Empty Arrays',
        openFiles: [],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      expect(session.openFiles).toEqual([]);
      expect(session.gitStatus?.dirtyFiles).toEqual([]);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const session = new Session({
        id: null as any,
        name: null as any,
        description: null as any,
        openFiles: null as any,
        activeFile: null as any,
        gitStatus: null as any
      });

      expect(session.id).toBeNull();
      expect(session.name).toBeNull();
      expect(session.description).toBeNull();
      expect(session.openFiles).toBeNull();
      expect(session.activeFile).toBeNull();
      expect(session.gitStatus).toBeNull();
    });

    it('should handle undefined values', () => {
      const session = new Session({
        id: undefined,
        name: undefined,
        description: undefined,
        openFiles: undefined,
        activeFile: undefined,
        gitStatus: undefined
      });

      expect(session.id).toBeUndefined();
      expect(session.name).toBeUndefined();
      expect(session.description).toBeUndefined();
      expect(session.openFiles).toBeUndefined();
      expect(session.activeFile).toBeUndefined();
      expect(session.gitStatus).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const session = new Session({
        id: 123 as any,
        name: [] as any,
        description: 456 as any,
        openFiles: 'not-an-array' as any,
        activeFile: {} as any,
        gitStatus: 'not-an-object' as any
      });

      expect(session.id).toBe(123);
      expect(session.name).toEqual([]);
      expect(session.description).toBe(456);
      expect(session.openFiles).toBe('not-an-array');
      expect(session.activeFile).toEqual({});
      expect(session.gitStatus).toBe('not-an-object');
    });

    it('should handle empty object', () => {
      const session = new Session({});
      
      expect(session.id).toBeUndefined();
      expect(session.name).toBeUndefined();
      expect(session.openFiles).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed openFiles array', () => {
      const malformedFiles = [
        null,
        undefined,
        123,
        {},
        [],
        'string-file'
      ];

      const session = new Session({
        id: 'malformed',
        name: 'Malformed',
        openFiles: malformedFiles as any
      });

      expect(session.openFiles).toEqual(malformedFiles);
    });

    it('should handle malformed gitStatus object', () => {
      const malformedGitStatus = {
        branch: null,
        isDirty: 'not-a-boolean',
        dirtyFiles: 'not-an-array'
      };

      const session = new Session({
        id: 'malformed-git',
        name: 'Malformed Git',
        openFiles: ['/file1.ts'],
        gitStatus: malformedGitStatus as any
      });

      expect(session.gitStatus).toEqual(malformedGitStatus);
    });

    it('should handle circular references', () => {
      const circular: any = { id: 'circular', name: 'Circular' };
      circular.self = circular;

      const session = new Session(circular);
      
      expect(session.id).toBe('circular');
      expect(session.name).toBe('Circular');
      expect((session as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const session = new Session({
        id: 'long-string',
        name: longString,
        openFiles: [longString],
        activeFile: longString
      });

      expect(session.name).toBe(longString);
      expect(session.openFiles).toEqual([longString]);
      expect(session.activeFile).toBe(longString);
    });

    it('should handle large openFiles arrays', () => {
      const largeFiles = Array.from({ length: 10000 }, (_, i) => `/file-${i}.ts`);
      const session = new Session({
        id: 'large-files',
        name: 'Large Files',
        openFiles: largeFiles
      });

      expect(session.openFiles).toEqual(largeFiles);
    });

    it('should handle large dirtyFiles arrays', () => {
      const largeDirtyFiles = Array.from({ length: 10000 }, (_, i) => `/dirty-${i}.ts`);
      const session = new Session({
        id: 'large-dirty',
        name: 'Large Dirty',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: true,
          dirtyFiles: largeDirtyFiles
        }
      });

      expect(session.gitStatus?.dirtyFiles).toEqual(largeDirtyFiles);
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

      const session = new Session({
        id: 'nested',
        name: 'Nested',
        openFiles: ['/file1.ts'],
        extra: deeplyNested
      });

      expect((session as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const sessionWithTypos = {
        id: 'typos',
        nam: 'Test Session', // should be 'name'
        descrption: 'A test session', // should be 'description'
        openFles: ['/file1.ts'], // should be 'openFiles'
        actveFile: '/file1.ts', // should be 'activeFile'
        gitSttus: { branch: 'main' } // should be 'gitStatus'
      };

      const session = new Session(sessionWithTypos as any);
      
      expect(session.id).toBe('typos');
      expect((session as any).nam).toBe('Test Session');
      expect((session as any).descrption).toBe('A test session');
      expect((session as any).openFles).toEqual(['/file1.ts']);
      expect((session as any).actveFile).toBe('/file1.ts');
      expect((session as any).gitSttus).toEqual({ branch: 'main' });
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        id: 123,
        name: [],
        description: 456,
        openFiles: 'single-file',
        activeFile: 789,
        gitStatus: 'not-an-object'
      };

      const session = new Session(wrongTypes as any);
      
      expect(session.id).toBe(123);
      expect(session.name).toEqual([]);
      expect(session.description).toBe(456);
      expect(session.openFiles).toBe('single-file');
      expect(session.activeFile).toBe(789);
      expect(session.gitStatus).toBe('not-an-object');
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal in file paths', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const session = new Session({
          id: 'path-traversal',
          name: 'Path Traversal',
          openFiles: [path],
          activeFile: path
        });

        expect(session.openFiles).toEqual([path]);
        expect(session.activeFile).toBe(path);
      });
    });

    it('should handle null bytes in file paths', () => {
      const nullByteString = 'file\x00name.ts';
      const session = new Session({
        id: 'null-bytes',
        name: 'Null Bytes',
        openFiles: [nullByteString],
        activeFile: nullByteString
      });

      expect(session.openFiles).toEqual([nullByteString]);
      expect(session.activeFile).toBe(nullByteString);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const session = new Session({
        id: 'unicode-control',
        name: unicodeControl,
        openFiles: [unicodeControl],
        description: unicodeControl
      });

      expect(session.name).toBe(unicodeControl);
      expect(session.openFiles).toEqual([unicodeControl]);
      expect(session.description).toBe(unicodeControl);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const session = new Session({
        id: 'script-injection',
        name: scriptInjection,
        description: scriptInjection,
        openFiles: [scriptInjection]
      });

      expect(session.name).toBe(scriptInjection);
      expect(session.description).toBe(scriptInjection);
      expect(session.openFiles).toEqual([scriptInjection]);
    });

    it('should handle command injection in git branch names', () => {
      const maliciousBranches = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'branch && rm -rf /'
      ];

      maliciousBranches.forEach(branch => {
        const session = new Session({
          id: 'malicious-branch',
          name: 'Malicious Branch',
          openFiles: ['/file1.ts'],
          gitStatus: {
            branch,
            isDirty: false,
            dirtyFiles: []
          }
        });

        expect(session.gitStatus?.branch).toBe(branch);
      });
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const session = new Session({
        id: 'test-json',
        name: 'Test JSON',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      const json = session.toJSON();
      
      expect(json).toEqual({
        id: 'test-json',
        name: 'Test JSON',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });
    });

    it('should have validate method', () => {
      const session = new Session({
        id: 'test-validate',
        name: 'Test Validate',
        openFiles: ['/file1.ts']
      });

      expect(typeof session.validate).toBe('function');
    });

    it('should have clone method', () => {
      const session = new Session({
        id: 'test-clone',
        name: 'Test Clone',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      const cloned = session.clone();
      
      expect(cloned).not.toBe(session);
      expect(cloned.id).toBe(session.id);
      expect(cloned.name).toBe(session.name);
      expect(cloned.openFiles).toEqual(session.openFiles);
      expect(cloned.gitStatus).toEqual(session.gitStatus);
    });

    it('should have addOpenFile method', () => {
      const session = new Session({
        id: 'test-add-file',
        name: 'Test Add File',
        openFiles: ['/file1.ts']
      });

      expect(typeof session.addOpenFile).toBe('function');
    });

    it('should have removeOpenFile method', () => {
      const session = new Session({
        id: 'test-remove-file',
        name: 'Test Remove File',
        openFiles: ['/file1.ts', '/file2.ts']
      });

      expect(typeof session.removeOpenFile).toBe('function');
    });

    it('should have setActiveFile method', () => {
      const session = new Session({
        id: 'test-set-active',
        name: 'Test Set Active',
        openFiles: ['/file1.ts', '/file2.ts']
      });

      expect(typeof session.setActiveFile).toBe('function');
    });

    it('should have updateGitStatus method', () => {
      const session = new Session({
        id: 'test-update-git',
        name: 'Test Update Git',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      expect(typeof session.updateGitStatus).toBe('function');
    });
  });
}); 