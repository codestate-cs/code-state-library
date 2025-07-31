import { Result } from '@codestate/core/domain/models/Result';

describe('Result Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid success result', () => {
      const validResult = {
        success: true,
        data: { message: 'Operation completed successfully' },
        message: 'Success',
        timestamp: new Date(),
        duration: 150,
        metadata: {
          operation: 'test',
          version: '1.0.0'
        }
      };

      const result = new Result(validResult);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: 'Operation completed successfully' });
      expect(result.message).toBe('Success');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBe(150);
      expect(result.metadata).toEqual({
        operation: 'test',
        version: '1.0.0'
      });
    });

    it('should create a valid error result', () => {
      const errorResult = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input provided',
          details: { field: 'email', issue: 'required' }
        },
        message: 'Validation failed',
        timestamp: new Date(),
        duration: 50
      };

      const result = new Result(errorResult);
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
        details: { field: 'email', issue: 'required' }
      });
      expect(result.message).toBe('Validation failed');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBe(50);
    });

    it('should create result with minimal properties', () => {
      const minimalResult = {
        success: true,
        data: 'simple data'
      };

      const result = new Result(minimalResult);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('simple data');
      expect(result.message).toBeUndefined();
      expect(result.timestamp).toBeUndefined();
      expect(result.duration).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle empty objects and arrays', () => {
      const result = new Result({
        success: true,
        data: {},
        metadata: {},
        error: {}
      });

      expect(result.data).toEqual({});
      expect(result.metadata).toEqual({});
      expect(result.error).toEqual({});
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const result = new Result({
        success: null as any,
        data: null as any,
        error: null as any,
        message: null as any,
        timestamp: null as any,
        duration: null as any,
        metadata: null as any
      });

      expect(result.success).toBeNull();
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(result.message).toBeNull();
      expect(result.timestamp).toBeNull();
      expect(result.duration).toBeNull();
      expect(result.metadata).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = new Result({
        success: undefined,
        data: undefined,
        error: undefined,
        message: undefined,
        timestamp: undefined,
        duration: undefined,
        metadata: undefined
      });

      expect(result.success).toBeUndefined();
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.message).toBeUndefined();
      expect(result.timestamp).toBeUndefined();
      expect(result.duration).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const result = new Result({
        success: 'not-a-boolean' as any,
        data: 123 as any,
        error: 'not-an-object' as any,
        message: [] as any,
        timestamp: 'not-a-date' as any,
        duration: 'not-a-number' as any,
        metadata: 'not-an-object' as any
      });

      expect(result.success).toBe('not-a-boolean');
      expect(result.data).toBe(123);
      expect(result.error).toBe('not-an-object');
      expect(result.message).toEqual([]);
      expect(result.timestamp).toBe('not-a-date');
      expect(result.duration).toBe('not-a-number');
      expect(result.metadata).toBe('not-an-object');
    });

    it('should handle empty object', () => {
      const result = new Result({});
      
      expect(result.success).toBeUndefined();
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed error object', () => {
      const malformedError = {
        code: null,
        message: 123,
        details: 'not-an-object'
      };

      const result = new Result({
        success: false,
        error: malformedError as any
      });

      expect(result.error).toEqual(malformedError);
    });

    it('should handle malformed metadata object', () => {
      const malformedMetadata = {
        operation: null,
        version: 456,
        extra: 'not-a-string'
      };

      const result = new Result({
        success: true,
        data: 'test',
        metadata: malformedMetadata as any
      });

      expect(result.metadata).toEqual(malformedMetadata);
    });

    it('should handle circular references', () => {
      const circular: any = { success: true, data: 'test' };
      circular.self = circular;

      const result = new Result(circular);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test');
      expect((result as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const result = new Result({
        success: true,
        data: longString,
        message: longString
      });

      expect(result.data).toBe(longString);
      expect(result.message).toBe(longString);
    });

    it('should handle large metadata objects', () => {
      const largeMetadata = Array.from({ length: 1000 }, (_, i) => ({
        [`key_${i}`]: `value_${i}`
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const result = new Result({
        success: true,
        data: 'test',
        metadata: largeMetadata
      });

      expect(result.metadata).toEqual(largeMetadata);
    });

    it('should handle large error details', () => {
      const largeDetails = Array.from({ length: 1000 }, (_, i) => ({
        [`field_${i}`]: `error_${i}`
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const result = new Result({
        success: false,
        error: {
          code: 'LARGE_ERROR',
          message: 'Large error details',
          details: largeDetails
        }
      });

      expect(result.error?.details).toEqual(largeDetails);
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

      const result = new Result({
        success: true,
        data: 'test',
        extra: deeplyNested
      });

      expect((result as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const resultWithTypos = {
        succss: true, // should be 'success'
        dt: 'test data', // should be 'data'
        err: { code: 'ERROR' }, // should be 'error'
        msg: 'test message', // should be 'message'
        tmestamp: new Date(), // should be 'timestamp'
        duraton: 100, // should be 'duration'
        metdata: { key: 'value' } // should be 'metadata'
      };

      const result = new Result(resultWithTypos as any);
      
      expect((result as any).succss).toBe(true);
      expect((result as any).dt).toBe('test data');
      expect((result as any).err).toEqual({ code: 'ERROR' });
      expect((result as any).msg).toBe('test message');
      expect((result as any).tmestamp).toBeInstanceOf(Date);
      expect((result as any).duraton).toBe(100);
      expect((result as any).metdata).toEqual({ key: 'value' });
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        success: 'true',
        data: 123,
        error: 'not-an-object',
        message: [],
        timestamp: 'not-a-date',
        duration: 'not-a-number',
        metadata: 'not-an-object'
      };

      const result = new Result(wrongTypes as any);
      
      expect(result.success).toBe('true');
      expect(result.data).toBe(123);
      expect(result.error).toBe('not-an-object');
      expect(result.message).toEqual([]);
      expect(result.timestamp).toBe('not-a-date');
      expect(result.duration).toBe('not-a-number');
      expect(result.metadata).toBe('not-an-object');
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle script injection in messages', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const result = new Result({
        success: true,
        data: 'test',
        message: scriptInjection
      });

      expect(result.message).toBe(scriptInjection);
    });

    it('should handle null bytes in strings', () => {
      const nullByteString = 'file\x00name';
      const result = new Result({
        success: true,
        data: nullByteString,
        message: nullByteString
      });

      expect(result.data).toBe(nullByteString);
      expect(result.message).toBe(nullByteString);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const result = new Result({
        success: true,
        data: unicodeControl,
        message: unicodeControl
      });

      expect(result.data).toBe(unicodeControl);
      expect(result.message).toBe(unicodeControl);
    });

    it('should handle command injection in error messages', () => {
      const maliciousMessages = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'error && rm -rf /'
      ];

      maliciousMessages.forEach(message => {
        const result = new Result({
          success: false,
          error: {
            code: 'MALICIOUS_ERROR',
            message,
            details: {}
          }
        });

        expect(result.error?.message).toBe(message);
      });
    });

    it('should handle malicious metadata', () => {
      const maliciousMetadata = {
        operation: '<script>alert("xss")</script>',
        version: '$(rm -rf /)',
        extra: '`rm -rf /`'
      };

      const result = new Result({
        success: true,
        data: 'test',
        metadata: maliciousMetadata
      });

      expect(result.metadata).toEqual(maliciousMetadata);
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const result = new Result({
        success: true,
        data: { message: 'test' },
        message: 'Success',
        duration: 100,
        metadata: { operation: 'test' }
      });

      const json = result.toJSON();
      
      expect(json).toEqual({
        success: true,
        data: { message: 'test' },
        message: 'Success',
        duration: 100,
        metadata: { operation: 'test' }
      });
    });

    it('should have validate method', () => {
      const result = new Result({
        success: true,
        data: 'test'
      });

      expect(typeof result.validate).toBe('function');
    });

    it('should have clone method', () => {
      const result = new Result({
        success: true,
        data: { message: 'test' },
        message: 'Success',
        duration: 100,
        metadata: { operation: 'test' }
      });

      const cloned = result.clone();
      
      expect(cloned).not.toBe(result);
      expect(cloned.success).toBe(result.success);
      expect(cloned.data).toEqual(result.data);
      expect(cloned.message).toBe(result.message);
      expect(cloned.duration).toBe(result.duration);
      expect(cloned.metadata).toEqual(result.metadata);
    });

    it('should have isSuccess method', () => {
      const result = new Result({
        success: true,
        data: 'test'
      });

      expect(typeof result.isSuccess).toBe('function');
    });

    it('should have isError method', () => {
      const result = new Result({
        success: false,
        error: { code: 'ERROR', message: 'test' }
      });

      expect(typeof result.isError).toBe('function');
    });

    it('should have getData method', () => {
      const result = new Result({
        success: true,
        data: { message: 'test' }
      });

      expect(typeof result.getData).toBe('function');
    });

    it('should have getError method', () => {
      const result = new Result({
        success: false,
        error: { code: 'ERROR', message: 'test' }
      });

      expect(typeof result.getError).toBe('function');
    });

    it('should have getMessage method', () => {
      const result = new Result({
        success: true,
        data: 'test',
        message: 'Success'
      });

      expect(typeof result.getMessage).toBe('function');
    });

    it('should have getDuration method', () => {
      const result = new Result({
        success: true,
        data: 'test',
        duration: 150
      });

      expect(typeof result.getDuration).toBe('function');
    });
  });
}); 