import { Result, Success, Failure } from '@codestate/core/domain/models/Result';
import { describe, expect, it } from '@jest/globals';

describe('Result - Type Definitions', () => {
  // Happy path
  it('should define Success type correctly', () => {
    const success: Success<string> = {
      ok: true,
      value: 'test value',
    };
    
    expect(success.ok).toBe(true);
    expect(success.value).toBe('test value');
    expect(typeof success.value).toBe('string');
  });

  it('should define Failure type correctly', () => {
    const error = new Error('test error');
    const failure: Failure<Error> = {
      ok: false,
      error: error,
    };
    
    expect(failure.ok).toBe(false);
    expect(failure.error).toBe(error);
    expect(failure.error.message).toBe('test error');
  });

  it('should allow Result union type', () => {
    const successResult: Result<string, Error> = {
      ok: true,
      value: 'success',
    };
    
    const failureResult: Result<string, Error> = {
      ok: false,
      error: new Error('failure'),
    };
    
    expect(successResult.ok).toBe(true);
    expect(failureResult.ok).toBe(false);
  });

  // Error cases
  it('should handle different error types', () => {
    const stringError: Failure<string> = {
      ok: false,
      error: 'string error',
    };
    
    const numberError: Failure<number> = {
      ok: false,
      error: 404,
    };
    
    const objectError: Failure<{ code: number; message: string }> = {
      ok: false,
      error: { code: 500, message: 'server error' },
    };
    
    expect(stringError.error).toBe('string error');
    expect(numberError.error).toBe(404);
    expect(objectError.error.code).toBe(500);
    expect(objectError.error.message).toBe('server error');
  });

  // Pathological cases
  it('should handle empty values', () => {
    const emptySuccess: Success<string> = {
      ok: true,
      value: '',
    };
    
    const nullError: Failure<null> = {
      ok: false,
      error: null,
    };
    
    const undefinedError: Failure<undefined> = {
      ok: false,
      error: undefined,
    };
    
    expect(emptySuccess.value).toBe('');
    expect(nullError.error).toBeNull();
    expect(undefinedError.error).toBeUndefined();
  });

  it('should handle complex nested values', () => {
    const complexValue = {
      nested: {
        array: [1, 2, 3],
        object: { key: 'value' },
        null: null,
        undefined: undefined,
      },
    };
    
    const success: Success<typeof complexValue> = {
      ok: true,
      value: complexValue,
    };
    
    expect(success.value.nested.array).toEqual([1, 2, 3]);
    expect(success.value.nested.object.key).toBe('value');
    expect(success.value.nested.null).toBeNull();
    expect(success.value.nested.undefined).toBeUndefined();
  });

  // Invalid input
  it('should handle invalid boolean values', () => {
    // TypeScript prevents this at compile time, but we can test the concept
    const invalidSuccess = {
      ok: 'true' as any, // invalid boolean
      value: 'test',
    };
    
    expect(invalidSuccess.ok).toBe('true');
    expect(typeof invalidSuccess.ok).toBe('string');
  });

  it('should handle missing required fields', () => {
    // TypeScript prevents this at compile time, but we can test the concept
    const incompleteSuccess = {
      ok: true,
      // missing value field
    } as any;
    
    expect(incompleteSuccess.value).toBeUndefined();
  });

  // Malicious input
  it('should handle malicious values', () => {
    const maliciousValue = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
      toString: () => 'malicious',
    };
    
    const success: Success<typeof maliciousValue> = {
      ok: true,
      value: maliciousValue,
    };
    
    expect(success.value.__proto__.polluted).toBe(true);
    expect(success.value.constructor.prototype.polluted).toBe(true);
    expect(success.value.toString()).toBe('malicious');
  });

  it('should handle SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    const success: Success<string> = {
      ok: true,
      value: sqlInjection,
    };
    
    expect(success.value).toBe("'; DROP TABLE users; --");
  });

  it('should handle XSS attempts', () => {
    const xssAttempt = "<script>alert('xss')</script>";
    const success: Success<string> = {
      ok: true,
      value: xssAttempt,
    };
    
    expect(success.value).toBe("<script>alert('xss')</script>");
  });

  // Human oversight
  it('should handle typos in boolean values', () => {
    // TypeScript prevents this at compile time, but we can test the concept
    const typoSuccess = {
      ok: 'ture' as any, // typo
      value: 'test',
    };
    
    expect(typoSuccess.ok).toBe('ture');
  });

  it('should handle case sensitivity issues', () => {
    // TypeScript prevents this at compile time, but we can test the concept
    const caseIssue = {
      OK: true as any, // wrong case
      value: 'test',
    };
    
    expect(caseIssue.OK).toBe(true);
    expect(caseIssue.value).toBe('test');
  });
});

describe('Result - Type Guards', () => {
  // Happy path
  it('should identify success results', () => {
    const success: Result<string, Error> = {
      ok: true,
      value: 'success',
    };
    
    expect(success.ok).toBe(true);
    expect('value' in success).toBe(true);
    expect('error' in success).toBe(false);
  });

  it('should identify failure results', () => {
    const failure: Result<string, Error> = {
      ok: false,
      error: new Error('failure'),
    };
    
    expect(failure.ok).toBe(false);
    expect('error' in failure).toBe(true);
    expect('value' in failure).toBe(false);
  });

  // Error cases
  it('should handle type guard with invalid data', () => {
    const invalidResult = {
      ok: 'maybe' as any,
      value: 'test',
      error: new Error('test'),
    };
    
    expect(invalidResult.ok).toBe('maybe');
    expect('value' in invalidResult).toBe(true);
    expect('error' in invalidResult).toBe(true);
  });

  // Pathological cases
  it('should handle type guard with null/undefined', () => {
    const nullResult = {
      ok: null as any,
      value: null,
    };
    
    const undefinedResult = {
      ok: undefined as any,
      value: undefined,
    };
    
    expect(nullResult.ok).toBeNull();
    expect(undefinedResult.ok).toBeUndefined();
  });

  // Malicious input
  it('should handle type guard with malicious properties', () => {
    const maliciousResult = {
      ok: true,
      value: 'test',
      hasOwnProperty: () => false, // malicious override
    };
    
    expect(maliciousResult.ok).toBe(true);
    expect(maliciousResult.hasOwnProperty()).toBe(false);
  });
});

describe('Result - Generic Type Constraints', () => {
  // Happy path
  it('should work with primitive types', () => {
    const stringResult: Result<string, Error> = {
      ok: true,
      value: 'string value',
    };
    
    const numberResult: Result<number, Error> = {
      ok: true,
      value: 42,
    };
    
    const booleanResult: Result<boolean, Error> = {
      ok: true,
      value: true,
    };
    
    expect(typeof stringResult.value).toBe('string');
    expect(typeof numberResult.value).toBe('number');
    expect(typeof booleanResult.value).toBe('boolean');
  });

  it('should work with complex types', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }
    
    const userResult: Result<User, Error> = {
      ok: true,
      value: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    };
    
    expect(userResult.value.id).toBe(1);
    expect(userResult.value.name).toBe('John Doe');
    expect(userResult.value.email).toBe('john@example.com');
  });

  // Error cases
  it('should work with different error types', () => {
    const stringErrorResult: Result<string, string> = {
      ok: false,
      error: 'string error',
    };
    
    const numberErrorResult: Result<string, number> = {
      ok: false,
      error: 404,
    };
    
    const objectErrorResult: Result<string, { code: number; message: string }> = {
      ok: false,
      error: { code: 500, message: 'server error' },
    };
    
    expect(typeof stringErrorResult.error).toBe('string');
    expect(typeof numberErrorResult.error).toBe('number');
    expect(typeof objectErrorResult.error).toBe('object');
  });

  // Pathological cases
  it('should work with union types', () => {
    type StringOrNumber = string | number;
    const unionResult: Result<StringOrNumber, Error> = {
      ok: true,
      value: 'string value',
    };
    
    const unionResult2: Result<StringOrNumber, Error> = {
      ok: true,
      value: 42,
    };
    
    expect(typeof unionResult.value).toBe('string');
    expect(typeof unionResult2.value).toBe('number');
  });

  it('should work with optional properties', () => {
    interface OptionalUser {
      id: number;
      name?: string;
      email?: string;
    }
    
    const optionalResult: Result<OptionalUser, Error> = {
      ok: true,
      value: {
        id: 1,
        // name and email are optional
      },
    };
    
    expect(optionalResult.value.id).toBe(1);
    expect(optionalResult.value.name).toBeUndefined();
    expect(optionalResult.value.email).toBeUndefined();
  });

  // Malicious input
  it('should work with malicious generic types', () => {
    interface MaliciousType {
      __proto__: { polluted: boolean };
      constructor: { prototype: { polluted: boolean } };
    }
    
    const maliciousResult: Result<MaliciousType, Error> = {
      ok: true,
      value: {
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
      },
    };
    
    expect(maliciousResult.value.__proto__.polluted).toBe(true);
    expect(maliciousResult.value.constructor.prototype.polluted).toBe(true);
  });
});

describe('Result - Type Safety', () => {
  // Happy path
  it('should prevent accessing value on failure', () => {
    const failure: Result<string, Error> = {
      ok: false,
      error: new Error('failure'),
    };
    
    // TypeScript prevents this at compile time, but we can test the concept
    expect(failure.ok).toBe(false);
    expect('error' in failure).toBe(true);
    expect('value' in failure).toBe(false);
  });

  it('should prevent accessing error on success', () => {
    const success: Result<string, Error> = {
      ok: true,
      value: 'success',
    };
    
    // TypeScript prevents this at compile time, but we can test the concept
    expect(success.ok).toBe(true);
    expect('value' in success).toBe(true);
    expect('error' in success).toBe(false);
  });

  // Error cases
  it('should handle type assertions', () => {
    const result: Result<string, Error> = {
      ok: true,
      value: 'test',
    } as any;
    
    // TypeScript allows this, but it's unsafe
    expect(result.ok).toBe(true);
  });

  // Pathological cases
  it('should handle any type', () => {
    const anyResult: Result<any, any> = {
      ok: true,
      value: 'anything',
    };
    
    expect(anyResult.value).toBe('anything');
  });

  // Malicious input
  it('should handle type pollution attempts', () => {
    const pollutedResult = {
      ok: true,
      value: 'test',
      __proto__: { polluted: true },
    } as any;
    
    expect(pollutedResult.value).toBe('test');
    expect(pollutedResult.__proto__.polluted).toBe(true);
  });
});

describe('Result - Utility Functions', () => {
  // Happy path
  it('should create success result', () => {
    const createSuccess = <T>(value: T): Success<T> => ({
      ok: true,
      value,
    });
    
    const success = createSuccess('test');
    
    expect(success.ok).toBe(true);
    expect(success.value).toBe('test');
  });

  it('should create failure result', () => {
    const createFailure = <E>(error: E): Failure<E> => ({
      ok: false,
      error,
    });
    
    const failure = createFailure(new Error('test'));
    
    expect(failure.ok).toBe(false);
    expect(failure.error.message).toBe('test');
  });

  // Error cases
  it('should handle utility functions with invalid input', () => {
    const createSuccess = <T>(value: T): Success<T> => ({
      ok: true,
      value,
    });
    
    const success = createSuccess(null as any);
    
    expect(success.ok).toBe(true);
    expect(success.value).toBeNull();
  });

  // Pathological cases
  it('should handle utility functions with undefined', () => {
    const createFailure = <E>(error: E): Failure<E> => ({
      ok: false,
      error,
    });
    
    const failure = createFailure(undefined as any);
    
    expect(failure.ok).toBe(false);
    expect(failure.error).toBeUndefined();
  });

  // Malicious input
  it('should handle utility functions with malicious input', () => {
    const createSuccess = <T>(value: T): Success<T> => ({
      ok: true,
      value,
    });
    
    const maliciousValue = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const success = createSuccess(maliciousValue as any);
    
    expect(success.value.__proto__.polluted).toBe(true);
    expect(success.value.constructor.prototype.polluted).toBe(true);
  });
});

describe('Result - Edge Cases', () => {
  // Happy path
  it('should handle circular references', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;
    
    const success: Success<typeof circular> = {
      ok: true,
      value: circular,
    };
    
    expect(success.value.name).toBe('test');
    expect(success.value.self).toBe(circular);
  });

  it('should handle functions as values', () => {
    const func = () => 'test';
    const success: Success<typeof func> = {
      ok: true,
      value: func,
    };
    
    expect(typeof success.value).toBe('function');
    expect(success.value()).toBe('test');
  });

  // Error cases
  it('should handle symbols as values', () => {
    const symbol = Symbol('test');
    const success: Success<typeof symbol> = {
      ok: true,
      value: symbol,
    };
    
    expect(typeof success.value).toBe('symbol');
    expect(success.value.description).toBe('test');
  });

  // Pathological cases
  it('should handle NaN and Infinity', () => {
    const nanResult: Result<number, Error> = {
      ok: true,
      value: NaN,
    };
    
    const infinityResult: Result<number, Error> = {
      ok: true,
      value: Infinity,
    };
    
    expect(Number.isNaN(nanResult.value)).toBe(true);
    expect(Number.isFinite(infinityResult.value)).toBe(false);
  });

  // Malicious input
  it('should handle prototype pollution in values', () => {
    const pollutedValue = Object.create(null);
    pollutedValue.__proto__ = { polluted: true };
    
    const success: Success<typeof pollutedValue> = {
      ok: true,
      value: pollutedValue,
    };
    
    expect(success.value.__proto__.polluted).toBe(true);
  });
}); 