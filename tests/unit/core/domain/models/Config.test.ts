import { Config } from '@codestate/core/domain/models/Config';

describe('Config Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid config with all properties', () => {
      const validConfig = {
        theme: 'dark',
        autoSave: true,
        gitIntegration: true,
        scriptsPath: '/scripts',
        sessionsPath: '/sessions'
      };

      const config = new Config(validConfig);
      
      expect(config.theme).toBe('dark');
      expect(config.autoSave).toBe(true);
      expect(config.gitIntegration).toBe(true);
      expect(config.scriptsPath).toBe('/scripts');
      expect(config.sessionsPath).toBe('/sessions');
    });

    it('should create config with minimal properties', () => {
      const minimalConfig = {
        theme: 'light'
      };

      const config = new Config(minimalConfig);
      
      expect(config.theme).toBe('light');
      expect(config.autoSave).toBeUndefined();
      expect(config.gitIntegration).toBeUndefined();
    });

    it('should handle different theme values', () => {
      const themes = ['light', 'dark', 'auto'];
      
      themes.forEach(theme => {
        const config = new Config({ theme });
        expect(config.theme).toBe(theme);
      });
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const config = new Config({
        theme: null as any,
        autoSave: null as any,
        gitIntegration: null as any
      });

      expect(config.theme).toBeNull();
      expect(config.autoSave).toBeNull();
      expect(config.gitIntegration).toBeNull();
    });

    it('should handle undefined values', () => {
      const config = new Config({
        theme: undefined,
        autoSave: undefined,
        gitIntegration: undefined
      });

      expect(config.theme).toBeUndefined();
      expect(config.autoSave).toBeUndefined();
      expect(config.gitIntegration).toBeUndefined();
    });

    it('should handle empty object', () => {
      const config = new Config({});
      
      expect(config.theme).toBeUndefined();
      expect(config.autoSave).toBeUndefined();
      expect(config.gitIntegration).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const config = new Config({
        theme: 123 as any,
        autoSave: 'not-a-boolean' as any,
        gitIntegration: [] as any,
        scriptsPath: 456 as any,
        sessionsPath: {} as any
      });

      expect(config.theme).toBe(123);
      expect(config.autoSave).toBe('not-a-boolean');
      expect(config.gitIntegration).toEqual([]);
      expect(config.scriptsPath).toBe(456);
      expect(config.sessionsPath).toEqual({});
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInput = {
        theme: { nested: 'object' },
        autoSave: [1, 2, 3],
        gitIntegration: new Date()
      };

      const config = new Config(malformedInput);
      
      expect(config.theme).toEqual({ nested: 'object' });
      expect(config.autoSave).toEqual([1, 2, 3]);
      expect(config.gitIntegration).toBeInstanceOf(Date);
    });

    it('should handle circular references', () => {
      const circular: any = { theme: 'dark' };
      circular.self = circular;

      const config = new Config(circular);
      
      expect(config.theme).toBe('dark');
      expect(config.self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const config = new Config({ theme: longString });
      
      expect(config.theme).toBe(longString);
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

      const config = new Config({ theme: 'dark', extra: deeplyNested });
      
      expect(config.theme).toBe('dark');
      expect((config as any).extra).toBe(deeplyNested);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => `item-${i}`);
      const config = new Config({ theme: 'dark', extra: largeArray });
      
      expect(config.theme).toBe('dark');
      expect((config as any).extra).toEqual(largeArray);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const configWithTypos = {
        them: 'dark', // should be 'theme'
        autoSve: true, // should be 'autoSave'
        gitIntegrtion: true // should be 'gitIntegration'
      };

      const config = new Config(configWithTypos as any);
      
      expect((config as any).them).toBe('dark');
      expect((config as any).autoSve).toBe(true);
      expect((config as any).gitIntegrtion).toBe(true);
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        theme: 123,
        autoSave: 'true',
        gitIntegration: 1
      };

      const config = new Config(wrongTypes as any);
      
      expect(config.theme).toBe(123);
      expect(config.autoSave).toBe('true');
      expect(config.gitIntegration).toBe(1);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal attempts', () => {
      const maliciousPaths = {
        scriptsPath: '../../../etc/passwd',
        sessionsPath: '..\\..\\..\\windows\\system32\\config'
      };

      const config = new Config(maliciousPaths);
      
      expect(config.scriptsPath).toBe('../../../etc/passwd');
      expect(config.sessionsPath).toBe('..\\..\\..\\windows\\system32\\config');
    });

    it('should handle null bytes', () => {
      const nullByteString = 'file\x00name';
      const config = new Config({ scriptsPath: nullByteString });
      
      expect(config.scriptsPath).toBe(nullByteString);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const config = new Config({ theme: unicodeControl });
      
      expect(config.theme).toBe(unicodeControl);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const config = new Config({ theme: scriptInjection });
      
      expect(config.theme).toBe(scriptInjection);
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const config = new Config({
        theme: 'dark',
        autoSave: true,
        gitIntegration: true
      });

      const json = config.toJSON();
      
      expect(json).toEqual({
        theme: 'dark',
        autoSave: true,
        gitIntegration: true
      });
    });

    it('should have validate method', () => {
      const config = new Config({ theme: 'dark' });
      
      expect(typeof config.validate).toBe('function');
    });

    it('should have clone method', () => {
      const config = new Config({
        theme: 'dark',
        autoSave: true
      });

      const cloned = config.clone();
      
      expect(cloned).not.toBe(config);
      expect(cloned.theme).toBe(config.theme);
      expect(cloned.autoSave).toBe(config.autoSave);
    });
  });
}); 