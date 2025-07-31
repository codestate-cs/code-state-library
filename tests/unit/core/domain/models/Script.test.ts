import { Script } from '@codestate/core/domain/models/Script';

describe('Script Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid script with all properties', () => {
      const validScript = {
        id: 'test-script-1',
        name: 'Test Script',
        description: 'A test script',
        commands: ['echo "hello"', 'ls -la'],
        tags: ['test', 'demo'],
        rootPath: '/test/path',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const script = new Script(validScript);
      
      expect(script.id).toBe('test-script-1');
      expect(script.name).toBe('Test Script');
      expect(script.description).toBe('A test script');
      expect(script.commands).toEqual(['echo "hello"', 'ls -la']);
      expect(script.tags).toEqual(['test', 'demo']);
      expect(script.rootPath).toBe('/test/path');
      expect(script.createdAt).toBeInstanceOf(Date);
      expect(script.updatedAt).toBeInstanceOf(Date);
    });

    it('should create script with minimal properties', () => {
      const minimalScript = {
        id: 'minimal-script',
        name: 'Minimal Script',
        commands: ['echo "hello"']
      };

      const script = new Script(minimalScript);
      
      expect(script.id).toBe('minimal-script');
      expect(script.name).toBe('Minimal Script');
      expect(script.commands).toEqual(['echo "hello"']);
      expect(script.description).toBeUndefined();
      expect(script.tags).toBeUndefined();
    });

    it('should handle empty arrays for commands and tags', () => {
      const script = new Script({
        id: 'empty-arrays',
        name: 'Empty Arrays',
        commands: [],
        tags: []
      });

      expect(script.commands).toEqual([]);
      expect(script.tags).toEqual([]);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const script = new Script({
        id: null as any,
        name: null as any,
        description: null as any,
        commands: null as any,
        tags: null as any,
        rootPath: null as any
      });

      expect(script.id).toBeNull();
      expect(script.name).toBeNull();
      expect(script.description).toBeNull();
      expect(script.commands).toBeNull();
      expect(script.tags).toBeNull();
      expect(script.rootPath).toBeNull();
    });

    it('should handle undefined values', () => {
      const script = new Script({
        id: undefined,
        name: undefined,
        description: undefined,
        commands: undefined,
        tags: undefined,
        rootPath: undefined
      });

      expect(script.id).toBeUndefined();
      expect(script.name).toBeUndefined();
      expect(script.description).toBeUndefined();
      expect(script.commands).toBeUndefined();
      expect(script.tags).toBeUndefined();
      expect(script.rootPath).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const script = new Script({
        id: 123 as any,
        name: [] as any,
        description: 456 as any,
        commands: 'not-an-array' as any,
        tags: {} as any,
        rootPath: true as any
      });

      expect(script.id).toBe(123);
      expect(script.name).toEqual([]);
      expect(script.description).toBe(456);
      expect(script.commands).toBe('not-an-array');
      expect(script.tags).toEqual({});
      expect(script.rootPath).toBe(true);
    });

    it('should handle empty object', () => {
      const script = new Script({});
      
      expect(script.id).toBeUndefined();
      expect(script.name).toBeUndefined();
      expect(script.commands).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed commands array', () => {
      const malformedCommands = [
        null,
        undefined,
        123,
        {},
        [],
        'string-command'
      ];

      const script = new Script({
        id: 'malformed',
        name: 'Malformed',
        commands: malformedCommands as any
      });

      expect(script.commands).toEqual(malformedCommands);
    });

    it('should handle malformed tags array', () => {
      const malformedTags = [
        null,
        undefined,
        123,
        {},
        [],
        true
      ];

      const script = new Script({
        id: 'malformed-tags',
        name: 'Malformed Tags',
        commands: ['echo "test"'],
        tags: malformedTags as any
      });

      expect(script.tags).toEqual(malformedTags);
    });

    it('should handle circular references', () => {
      const circular: any = { id: 'circular', name: 'Circular' };
      circular.self = circular;

      const script = new Script(circular);
      
      expect(script.id).toBe('circular');
      expect(script.name).toBe('Circular');
      expect((script as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const script = new Script({
        id: 'long-string',
        name: longString,
        commands: [longString]
      });

      expect(script.name).toBe(longString);
      expect(script.commands).toEqual([longString]);
    });

    it('should handle large command arrays', () => {
      const largeCommands = Array.from({ length: 10000 }, (_, i) => `command-${i}`);
      const script = new Script({
        id: 'large-commands',
        name: 'Large Commands',
        commands: largeCommands
      });

      expect(script.commands).toEqual(largeCommands);
    });

    it('should handle large tag arrays', () => {
      const largeTags = Array.from({ length: 10000 }, (_, i) => `tag-${i}`);
      const script = new Script({
        id: 'large-tags',
        name: 'Large Tags',
        commands: ['echo "test"'],
        tags: largeTags
      });

      expect(script.tags).toEqual(largeTags);
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

      const script = new Script({
        id: 'nested',
        name: 'Nested',
        commands: ['echo "test"'],
        extra: deeplyNested
      });

      expect((script as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const scriptWithTypos = {
        id: 'typos',
        nam: 'Test Script', // should be 'name'
        descrption: 'A test script', // should be 'description'
        cmmands: ['echo "hello"'], // should be 'commands'
        tgs: ['test'], // should be 'tags'
        rotPath: '/test/path' // should be 'rootPath'
      };

      const script = new Script(scriptWithTypos as any);
      
      expect(script.id).toBe('typos');
      expect((script as any).nam).toBe('Test Script');
      expect((script as any).descrption).toBe('A test script');
      expect((script as any).cmmands).toEqual(['echo "hello"']);
      expect((script as any).tgs).toEqual(['test']);
      expect((script as any).rotPath).toBe('/test/path');
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        id: 123,
        name: [],
        description: 456,
        commands: 'single-command',
        tags: 'single-tag',
        rootPath: true
      };

      const script = new Script(wrongTypes as any);
      
      expect(script.id).toBe(123);
      expect(script.name).toEqual([]);
      expect(script.description).toBe(456);
      expect(script.commands).toBe('single-command');
      expect(script.tags).toBe('single-tag');
      expect(script.rootPath).toBe(true);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle command injection attempts', () => {
      const maliciousCommands = [
        'rm -rf /',
        'echo "hello" && rm -rf /',
        '; DROP TABLE users;',
        '$(rm -rf /)',
        '`rm -rf /`'
      ];

      const script = new Script({
        id: 'malicious',
        name: 'Malicious',
        commands: maliciousCommands
      });

      expect(script.commands).toEqual(maliciousCommands);
    });

    it('should handle path traversal in rootPath', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const script = new Script({
          id: 'path-traversal',
          name: 'Path Traversal',
          commands: ['echo "test"'],
          rootPath: path
        });

        expect(script.rootPath).toBe(path);
      });
    });

    it('should handle null bytes', () => {
      const nullByteString = 'file\x00name';
      const script = new Script({
        id: 'null-bytes',
        name: nullByteString,
        commands: [nullByteString],
        rootPath: nullByteString
      });

      expect(script.name).toBe(nullByteString);
      expect(script.commands).toEqual([nullByteString]);
      expect(script.rootPath).toBe(nullByteString);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const script = new Script({
        id: 'unicode-control',
        name: unicodeControl,
        commands: [unicodeControl],
        description: unicodeControl
      });

      expect(script.name).toBe(unicodeControl);
      expect(script.commands).toEqual([unicodeControl]);
      expect(script.description).toBe(unicodeControl);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const script = new Script({
        id: 'script-injection',
        name: scriptInjection,
        description: scriptInjection,
        commands: [scriptInjection]
      });

      expect(script.name).toBe(scriptInjection);
      expect(script.description).toBe(scriptInjection);
      expect(script.commands).toEqual([scriptInjection]);
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const script = new Script({
        id: 'test-json',
        name: 'Test JSON',
        commands: ['echo "test"'],
        tags: ['test']
      });

      const json = script.toJSON();
      
      expect(json).toEqual({
        id: 'test-json',
        name: 'Test JSON',
        commands: ['echo "test"'],
        tags: ['test']
      });
    });

    it('should have validate method', () => {
      const script = new Script({
        id: 'test-validate',
        name: 'Test Validate',
        commands: ['echo "test"']
      });

      expect(typeof script.validate).toBe('function');
    });

    it('should have clone method', () => {
      const script = new Script({
        id: 'test-clone',
        name: 'Test Clone',
        commands: ['echo "test"'],
        tags: ['test']
      });

      const cloned = script.clone();
      
      expect(cloned).not.toBe(script);
      expect(cloned.id).toBe(script.id);
      expect(cloned.name).toBe(script.name);
      expect(cloned.commands).toEqual(script.commands);
      expect(cloned.tags).toEqual(script.tags);
    });

    it('should have execute method', () => {
      const script = new Script({
        id: 'test-execute',
        name: 'Test Execute',
        commands: ['echo "hello"', 'ls -la']
      });

      expect(typeof script.execute).toBe('function');
    });

    it('should have addCommand method', () => {
      const script = new Script({
        id: 'test-add-command',
        name: 'Test Add Command',
        commands: ['echo "hello"']
      });

      expect(typeof script.addCommand).toBe('function');
    });

    it('should have removeCommand method', () => {
      const script = new Script({
        id: 'test-remove-command',
        name: 'Test Remove Command',
        commands: ['echo "hello"', 'ls -la']
      });

      expect(typeof script.removeCommand).toBe('function');
    });
  });
}); 