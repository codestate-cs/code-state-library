# CodeState Architecture Quick Reference

## 🚀 **Quick Start Template**

### **For New Module: `[ModuleName]`**

1. **CLI Command**: `codestate [module] [action]`
2. **File Structure**: Follow the template in `ARCHITECTURE_FLOW.md`
3. **Flow**: CLI → Commands → CLI API → Use Cases → Services → Repository → File System

## 📁 **Required Files for New Module**

```
packages/cli-api/
└── main.ts                              # Export use cases and services

packages/cli-interface/
├── commands/[module]/
│   ├── index.ts
│   ├── show[Module].ts
│   ├── create[Module].ts
│   ├── update[Module].ts
│   └── delete[Module].ts
├── tui/[module]/
│   ├── index.ts
│   ├── cliHandler.ts
│   ├── show[Module]Tui.ts
│   ├── create[Module]Tui.ts
│   ├── update[Module]Tui.ts
│   └── delete[Module]Tui.ts

packages/core/
├── domain/
│   ├── models/[Module].ts
│   ├── ports/I[Module]Service.ts
│   └── schemas/SchemaRegistry.ts (add schemas)
├── services/[module]/
│   ├── [Module]Service.ts
│   └── [Module]Facade.ts
└── use-cases/[module]/
    ├── index.ts
    ├── Get[Module].ts
    ├── Create[Module].ts
    ├── Update[Module].ts
    └── Delete[Module].ts

packages/infrastructure/
├── repositories/[Module]Repository.ts
└── services/ (if needed)
```

## 🔧 **Implementation Steps**

1. **Create Domain Models** (`core/domain/models/[Module].ts`)
2. **Define Interfaces** (`core/domain/ports/I[Module]Service.ts`)
3. **Add Schemas** (`core/domain/schemas/SchemaRegistry.ts`)
4. **Implement Repository** (`infrastructure/repositories/[Module]Repository.ts`)
5. **Create Services** (`core/services/[module]/`)
6. **Build Use Cases** (`core/use-cases/[module]/`)
7. **Export Use Cases** (`cli-api/main.ts`)
8. **Add Commands** (`cli-interface/commands/[module]/`)
9. **Create TUI** (`cli-interface/tui/[module]/`)
10. **Update Router** (`cli-interface/commands/index.ts`)

## 🎯 **Key Patterns**

### **CLI API Pattern**
```typescript
// cli-api/main.ts
export { Get[Module] } from '@codestate/core/use-cases/[module]/Get[Module]';
export { Create[Module] } from '@codestate/core/use-cases/[module]/Create[Module]';
export { Update[Module] } from '@codestate/core/use-cases/[module]/Update[Module]';
export { Delete[Module] } from '@codestate/core/use-cases/[module]/Delete[Module]';
export { ConfigurableLoggerFacade as ConfigurableLogger } from '@codestate/infrastructure/services/ConfigurableLogger/ConfigurableLoggerFacade';
export * from '@codestate/core/use-cases/[module]';
```

### **Command Pattern**
```typescript
// commands/[module]/show[Module].ts
import { Get[Module], ConfigurableLogger } from '@codestate/cli-api/main';

export async function show[Module]Command() {
  const logger = new ConfigurableLogger();
  const get[Module] = new Get[Module]();
  const result = await get[Module].execute();
  if (result.ok) {
    logger.log('Current [module]:', { [module]: result.value });
  } else {
    logger.error('Failed to load [module]', { error: result.error });
  }
}
```

### **Use Case Pattern**
```typescript
// use-cases/[module]/Get[Module].ts
export class Get[Module] {
  constructor(private [module]Service?: I[Module]Service) {}
  async execute(): Promise<Result<[Module]>> {
    return this.[module]Service.get[Module]();
  }
}
```

### **Repository Pattern**
```typescript
// repositories/[Module]Repository.ts
export class [Module]Repository implements I[Module]Repository {
  async load(): Promise<Result<[Module]>> {
    // Load with validation, encryption, atomic writes
  }
  async save([module]: [Module]): Promise<Result<void>> {
    // Save with validation, encryption, atomic writes
  }
}
```

## 🛡️ **Security Checklist**

- [ ] **Validation**: Zod schema at every layer
- [ ] **Encryption**: AES-256-GCM for sensitive data
- [ ] **Atomic Writes**: Temp files + rename
- [ ] **Backup**: `.bak` files before changes
- [ ] **Error Handling**: Structured errors with codes
- [ ] **Logging**: Comprehensive audit trail
- [ ] **Permissions**: Secure file permissions (0600)

## 📊 **Testing Strategy**

- **Unit Tests**: Each layer independently
- **Integration Tests**: End-to-end flows
- **Property Tests**: For critical logic
- **Security Tests**: Input validation, encryption

## 🔄 **Flow Validation**

Test the complete flow:
```bash
# Test CLI
npm run cli -- [module] show
npm run cli -- [module] create
npm run cli -- [module] update
npm run cli -- [module] delete

# Test error handling
npm run cli -- [module] invalid
npm run cli -- invalid
```

## 📚 **Reference Documents**

- **Full Architecture**: `docs/ARCHITECTURE_FLOW.md`
- **File Storage**: `docs/FILE_STORAGE_STRATEGY.md`
- **Implementation**: `docs/IMPLEMENTATION.md`
- **Product Spec**: `docs/PRODUCT.md`

---

**Remember**: Follow the established patterns, maintain separation of concerns, and ensure comprehensive testing! 🚀 