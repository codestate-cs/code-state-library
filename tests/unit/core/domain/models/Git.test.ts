import { Git } from '@codestate/core/domain/models/Git';

describe('Git Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid git status with all properties', () => {
      const validGit = {
        branch: 'main',
        isDirty: false,
        dirtyFiles: ['/file1.ts', '/file2.ts'],
        stagedFiles: ['/file3.ts'],
        untrackedFiles: ['/file4.ts'],
        lastCommit: {
          hash: 'abc123',
          message: 'Initial commit',
          author: 'John Doe',
          date: new Date()
        },
        remotes: [
          {
            name: 'origin',
            url: 'https://github.com/user/repo.git',
            branch: 'main'
          }
        ]
      };

      const git = new Git(validGit);
      
      expect(git.branch).toBe('main');
      expect(git.isDirty).toBe(false);
      expect(git.dirtyFiles).toEqual(['/file1.ts', '/file2.ts']);
      expect(git.stagedFiles).toEqual(['/file3.ts']);
      expect(git.untrackedFiles).toEqual(['/file4.ts']);
      expect(git.lastCommit?.hash).toBe('abc123');
      expect(git.lastCommit?.message).toBe('Initial commit');
      expect(git.lastCommit?.author).toBe('John Doe');
      expect(git.lastCommit?.date).toBeInstanceOf(Date);
      expect(git.remotes).toHaveLength(1);
      expect(git.remotes?.[0].name).toBe('origin');
      expect(git.remotes?.[0].url).toBe('https://github.com/user/repo.git');
      expect(git.remotes?.[0].branch).toBe('main');
    });

    it('should create git status with minimal properties', () => {
      const minimalGit = {
        branch: 'main',
        isDirty: false
      };

      const git = new Git(minimalGit);
      
      expect(git.branch).toBe('main');
      expect(git.isDirty).toBe(false);
      expect(git.dirtyFiles).toBeUndefined();
      expect(git.stagedFiles).toBeUndefined();
      expect(git.untrackedFiles).toBeUndefined();
      expect(git.lastCommit).toBeUndefined();
      expect(git.remotes).toBeUndefined();
    });

    it('should handle empty arrays for file lists', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false,
        dirtyFiles: [],
        stagedFiles: [],
        untrackedFiles: []
      });

      expect(git.dirtyFiles).toEqual([]);
      expect(git.stagedFiles).toEqual([]);
      expect(git.untrackedFiles).toEqual([]);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const git = new Git({
        branch: null as any,
        isDirty: null as any,
        dirtyFiles: null as any,
        stagedFiles: null as any,
        untrackedFiles: null as any,
        lastCommit: null as any,
        remotes: null as any
      });

      expect(git.branch).toBeNull();
      expect(git.isDirty).toBeNull();
      expect(git.dirtyFiles).toBeNull();
      expect(git.stagedFiles).toBeNull();
      expect(git.untrackedFiles).toBeNull();
      expect(git.lastCommit).toBeNull();
      expect(git.remotes).toBeNull();
    });

    it('should handle undefined values', () => {
      const git = new Git({
        branch: undefined,
        isDirty: undefined,
        dirtyFiles: undefined,
        stagedFiles: undefined,
        untrackedFiles: undefined,
        lastCommit: undefined,
        remotes: undefined
      });

      expect(git.branch).toBeUndefined();
      expect(git.isDirty).toBeUndefined();
      expect(git.dirtyFiles).toBeUndefined();
      expect(git.stagedFiles).toBeUndefined();
      expect(git.untrackedFiles).toBeUndefined();
      expect(git.lastCommit).toBeUndefined();
      expect(git.remotes).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const git = new Git({
        branch: 123 as any,
        isDirty: 'not-a-boolean' as any,
        dirtyFiles: 'not-an-array' as any,
        stagedFiles: {} as any,
        untrackedFiles: true as any,
        lastCommit: [] as any,
        remotes: 'not-an-array' as any
      });

      expect(git.branch).toBe(123);
      expect(git.isDirty).toBe('not-a-boolean');
      expect(git.dirtyFiles).toBe('not-an-array');
      expect(git.stagedFiles).toEqual({});
      expect(git.untrackedFiles).toBe(true);
      expect(git.lastCommit).toEqual([]);
      expect(git.remotes).toBe('not-an-array');
    });

    it('should handle empty object', () => {
      const git = new Git({});
      
      expect(git.branch).toBeUndefined();
      expect(git.isDirty).toBeUndefined();
      expect(git.dirtyFiles).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed file arrays', () => {
      const malformedFiles = [
        null,
        undefined,
        123,
        {},
        [],
        'string-file'
      ];

      const git = new Git({
        branch: 'main',
        isDirty: false,
        dirtyFiles: malformedFiles as any
      });

      expect(git.dirtyFiles).toEqual(malformedFiles);
    });

    it('should handle malformed lastCommit object', () => {
      const malformedCommit = {
        hash: null,
        message: 123,
        author: [],
        date: 'not-a-date'
      };

      const git = new Git({
        branch: 'main',
        isDirty: false,
        lastCommit: malformedCommit as any
      });

      expect(git.lastCommit).toEqual(malformedCommit);
    });

    it('should handle malformed remotes array', () => {
      const malformedRemotes = [
        null,
        undefined,
        123,
        {},
        [],
        'string-remote'
      ];

      const git = new Git({
        branch: 'main',
        isDirty: false,
        remotes: malformedRemotes as any
      });

      expect(git.remotes).toEqual(malformedRemotes);
    });

    it('should handle circular references', () => {
      const circular: any = { branch: 'main', isDirty: false };
      circular.self = circular;

      const git = new Git(circular);
      
      expect(git.branch).toBe('main');
      expect(git.isDirty).toBe(false);
      expect((git as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const git = new Git({
        branch: longString,
        isDirty: false,
        dirtyFiles: [longString]
      });

      expect(git.branch).toBe(longString);
      expect(git.dirtyFiles).toEqual([longString]);
    });

    it('should handle large file arrays', () => {
      const largeFiles = Array.from({ length: 10000 }, (_, i) => `/file-${i}.ts`);
      const git = new Git({
        branch: 'main',
        isDirty: true,
        dirtyFiles: largeFiles
      });

      expect(git.dirtyFiles).toEqual(largeFiles);
    });

    it('should handle large remotes array', () => {
      const largeRemotes = Array.from({ length: 1000 }, (_, i) => ({
        name: `remote-${i}`,
        url: `https://github.com/user/repo-${i}.git`,
        branch: 'main'
      }));

      const git = new Git({
        branch: 'main',
        isDirty: false,
        remotes: largeRemotes
      });

      expect(git.remotes).toEqual(largeRemotes);
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

      const git = new Git({
        branch: 'main',
        isDirty: false,
        extra: deeplyNested
      });

      expect((git as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const gitWithTypos = {
        brnch: 'main', // should be 'branch'
        isDty: false, // should be 'isDirty'
        dtyFiles: ['/file1.ts'], // should be 'dirtyFiles'
        stgedFiles: ['/file2.ts'], // should be 'stagedFiles'
        untrckedFiles: ['/file3.ts'], // should be 'untrackedFiles'
        lstCommit: { hash: 'abc123' }, // should be 'lastCommit'
        rmotes: [{ name: 'origin' }] // should be 'remotes'
      };

      const git = new Git(gitWithTypos as any);
      
      expect((git as any).brnch).toBe('main');
      expect((git as any).isDty).toBe(false);
      expect((git as any).dtyFiles).toEqual(['/file1.ts']);
      expect((git as any).stgedFiles).toEqual(['/file2.ts']);
      expect((git as any).untrckedFiles).toEqual(['/file3.ts']);
      expect((git as any).lstCommit).toEqual({ hash: 'abc123' });
      expect((git as any).rmotes).toEqual([{ name: 'origin' }]);
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        branch: 123,
        isDirty: 'true',
        dirtyFiles: 'single-file',
        stagedFiles: 456,
        untrackedFiles: true,
        lastCommit: 'not-an-object',
        remotes: 'not-an-array'
      };

      const git = new Git(wrongTypes as any);
      
      expect(git.branch).toBe(123);
      expect(git.isDirty).toBe('true');
      expect(git.dirtyFiles).toBe('single-file');
      expect(git.stagedFiles).toBe(456);
      expect(git.untrackedFiles).toBe(true);
      expect(git.lastCommit).toBe('not-an-object');
      expect(git.remotes).toBe('not-an-array');
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
        const git = new Git({
          branch: 'main',
          isDirty: true,
          dirtyFiles: [path],
          stagedFiles: [path],
          untrackedFiles: [path]
        });

        expect(git.dirtyFiles).toEqual([path]);
        expect(git.stagedFiles).toEqual([path]);
        expect(git.untrackedFiles).toEqual([path]);
      });
    });

    it('should handle null bytes in file paths', () => {
      const nullByteString = 'file\x00name.ts';
      const git = new Git({
        branch: 'main',
        isDirty: true,
        dirtyFiles: [nullByteString],
        stagedFiles: [nullByteString],
        untrackedFiles: [nullByteString]
      });

      expect(git.dirtyFiles).toEqual([nullByteString]);
      expect(git.stagedFiles).toEqual([nullByteString]);
      expect(git.untrackedFiles).toEqual([nullByteString]);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const git = new Git({
        branch: unicodeControl,
        isDirty: false,
        dirtyFiles: [unicodeControl]
      });

      expect(git.branch).toBe(unicodeControl);
      expect(git.dirtyFiles).toEqual([unicodeControl]);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const git = new Git({
        branch: scriptInjection,
        isDirty: false,
        dirtyFiles: [scriptInjection]
      });

      expect(git.branch).toBe(scriptInjection);
      expect(git.dirtyFiles).toEqual([scriptInjection]);
    });

    it('should handle command injection in branch names', () => {
      const maliciousBranches = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'branch && rm -rf /'
      ];

      maliciousBranches.forEach(branch => {
        const git = new Git({
          branch,
          isDirty: false
        });

        expect(git.branch).toBe(branch);
      });
    });

    it('should handle malicious URLs in remotes', () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com'
      ];

      maliciousUrls.forEach(url => {
        const git = new Git({
          branch: 'main',
          isDirty: false,
          remotes: [{
            name: 'malicious',
            url,
            branch: 'main'
          }]
        });

        expect(git.remotes?.[0].url).toBe(url);
      });
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false,
        dirtyFiles: ['/file1.ts'],
        lastCommit: {
          hash: 'abc123',
          message: 'Initial commit',
          author: 'John Doe',
          date: new Date()
        }
      });

      const json = git.toJSON();
      
      expect(json).toEqual({
        branch: 'main',
        isDirty: false,
        dirtyFiles: ['/file1.ts'],
        lastCommit: {
          hash: 'abc123',
          message: 'Initial commit',
          author: 'John Doe',
          date: expect.any(Date)
        }
      });
    });

    it('should have validate method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false
      });

      expect(typeof git.validate).toBe('function');
    });

    it('should have clone method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false,
        dirtyFiles: ['/file1.ts'],
        lastCommit: {
          hash: 'abc123',
          message: 'Initial commit',
          author: 'John Doe',
          date: new Date()
        }
      });

      const cloned = git.clone();
      
      expect(cloned).not.toBe(git);
      expect(cloned.branch).toBe(git.branch);
      expect(cloned.isDirty).toBe(git.isDirty);
      expect(cloned.dirtyFiles).toEqual(git.dirtyFiles);
      expect(cloned.lastCommit).toEqual(git.lastCommit);
    });

    it('should have hasChanges method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: true,
        dirtyFiles: ['/file1.ts']
      });

      expect(typeof git.hasChanges).toBe('function');
    });

    it('should have getDirtyFiles method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: true,
        dirtyFiles: ['/file1.ts', '/file2.ts']
      });

      expect(typeof git.getDirtyFiles).toBe('function');
    });

    it('should have getStagedFiles method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false,
        stagedFiles: ['/file3.ts']
      });

      expect(typeof git.getStagedFiles).toBe('function');
    });

    it('should have getUntrackedFiles method', () => {
      const git = new Git({
        branch: 'main',
        isDirty: false,
        untrackedFiles: ['/file4.ts']
      });

      expect(typeof git.getUntrackedFiles).toBe('function');
    });
  });
}); 