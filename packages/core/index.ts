// API entry point for external consumption (no CLI dependencies)
// Core domain models
export * from '@codestate/core/domain/models/Session';
export * from '@codestate/core/domain/models/Script';
export * from '@codestate/core/domain/models/TerminalCollection';
export * from '@codestate/core/domain/models/Config';
export * from '@codestate/core/domain/models/Result';

// Use cases
export * from '@codestate/core/use-cases/config';
export * from '@codestate/core/use-cases/scripts';
export * from '@codestate/core/use-cases/session';
export * from '@codestate/core/use-cases/git';
export * from '@codestate/core/use-cases/ide';
export * from '@codestate/core/use-cases/terminals';

// Error types and registry
export * from '@codestate/core/domain/types/ErrorTypes';
export * from '@codestate/core/domain/types/ErrorRegistry';

// Services (with aliases for cleaner API)
export { CLILoggerFacade as ConfigurableLogger } from '@codestate/infrastructure/services/CLILogger/CLILoggerFacade';
export { GitFacade as GitService } from '@codestate/core/services/git/GitFacade';
export { TerminalFacade as Terminal } from '@codestate/infrastructure/services/Terminal/TerminalFacade';
export { IDEFacade as IDEService } from '@codestate/core/services/ide/IDEFacade';
export { FileStorageFacade as FileStorage } from '@codestate/core/services/storage';
export { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';
export { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade'; 