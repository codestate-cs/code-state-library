// Global test utilities
global.testUtils = {
  // Mock file system
  createMockFileSystem: () => ({
    readFile: jest.fn(),
    writeFile: jest.fn(),
    exists: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn()
  }),

  // Mock terminal
  createMockTerminal: () => ({
    execute: jest.fn(),
    executeSync: jest.fn(),
    isAvailable: jest.fn()
  }),

  // Mock git
  createMockGit: () => ({
    getStatus: jest.fn(),
    getCurrentBranch: jest.fn(),
    getDirtyFiles: jest.fn(),
    commit: jest.fn(),
    stash: jest.fn(),
    applyStash: jest.fn(),
    listStashes: jest.fn(),
    deleteStash: jest.fn()
  }),

  // Mock IDE
  createMockIDE: () => ({
    openFile: jest.fn(),
    openFiles: jest.fn(),
    getOpenFiles: jest.fn(),
    getAvailableIDEs: jest.fn()
  }),

  // Test data generators
  generateValidConfig: () => ({
    theme: 'dark',
    autoSave: true,
    gitIntegration: true,
    scriptsPath: '/scripts',
    sessionsPath: '/sessions'
  }),

  generateInvalidConfig: () => ({
    theme: 'invalid-theme',
    autoSave: 'not-a-boolean',
    gitIntegration: null,
    scriptsPath: '',
    sessionsPath: undefined
  }),

  generateValidScript: () => ({
    id: 'test-script-1',
    name: 'Test Script',
    description: 'A test script',
    commands: ['echo "hello"', 'ls -la'],
    tags: ['test', 'demo'],
    rootPath: '/test/path',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  generateInvalidScript: () => ({
    id: '',
    name: null,
    description: 123,
    commands: 'not-an-array',
    tags: 'not-an-array',
    rootPath: undefined,
    createdAt: 'not-a-date',
    updatedAt: {}
  }),

  generateValidSession: () => ({
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
  }),

  generateInvalidSession: () => ({
    id: null,
    name: 456,
    description: [],
    openFiles: 'not-an-array',
    activeFile: 789,
    gitStatus: 'not-an-object',
    createdAt: 'invalid-date',
    updatedAt: null
  }),

  // Pathological test data
  generatePathologicalData: () => ({
    extremelyLongString: 'a'.repeat(1000000),
    deeplyNestedObject: (() => {
      const obj: any = {};
      let current = obj;
      for (let i = 0; i < 1000; i++) {
        current.nested = {};
        current = current.nested;
      }
      return obj;
    })(),
    circularReference: (() => {
      const obj: any = { name: 'circular' };
      obj.self = obj;
      return obj;
    })(),
    largeArray: Array.from({ length: 100000 }, (_, i) => `item-${i}`)
  }),

  // Sanitization test data
  generateMaliciousInput: () => ({
    sqlInjection: "'; DROP TABLE users; --",
    pathTraversal: "../../../etc/passwd",
    xssScript: "<script>alert('xss')</script>",
    commandInjection: "echo 'hello' && rm -rf /",
    nullBytes: "file\x00name",
    unicodeControl: "\u0000\u0001\u0002\u0003"
  }),

  // Human oversight test data
  generateHumanOversightData: () => ({
    typos: {
      config: { them: 'dark' }, // should be 'theme'
      script: { nam: 'test' }, // should be 'name'
      session: { descrption: 'test' } // should be 'description'
    },
    wrongPaths: {
      absolutePath: 'C:\\Users\\User\\Desktop\\file.txt',
      relativePath: './../file.txt',
      networkPath: '\\\\server\\share\\file.txt',
      urlPath: 'https://example.com/file.txt'
    },
    wrongTypes: {
      stringAsNumber: '123',
      numberAsString: 123,
      booleanAsString: 'true',
      arrayAsString: '["item1", "item2"]',
      objectAsString: '{"key": "value"}'
    }
  })
};

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock process methods
process.exit = jest.fn() as any;
process.cwd = jest.fn(() => '/mock/cwd');

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 