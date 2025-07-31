declare global {
  var testUtils: {
    createMockFileSystem: () => any;
    createMockTerminal: () => any;
    createMockGit: () => any;
    createMockIDE: () => any;
    generateValidConfig: () => any;
    generateInvalidConfig: () => any;
    generateValidScript: () => any;
    generateInvalidScript: () => any;
    generateValidSession: () => any;
    generateInvalidSession: () => any;
    generatePathologicalData: () => any;
    generateMaliciousInput: () => any;
    generateHumanOversightData: () => any;
  };
}

export {}; 