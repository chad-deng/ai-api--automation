# AI API Test Automation Project

## 🚀 5-Part Structured Project Definition

### 1. 背景 (Background)
An enterprise-grade API test automation system that solves the critical problem of manual API testing workflows consuming 70-80% of development cycles. Manual test creation from OpenAPI specifications leads to delayed releases, inconsistent test coverage, and poor API quality in production systems. This project follows the Hybrid v2.1 development methodology combining enterprise-level rigor with modern visual testing capabilities.

**Problem Impact**: Teams spend $50-100K annually per team on repetitive test creation, with 60% of API-related bugs reaching production due to inadequate testing coverage.

### 2. 描述 (Description)
**Core Mission**: Automate API testing workflow by parsing OpenAPI specs and generating high-quality, maintainable test suites with TDD practices, integrated CI/CD pipelines, and comprehensive reporting.

**Key Features**:
- OpenAPI specification parsing and validation
- Automated test case generation (Jest, Mocha, Vitest)
- Advanced scenario testing with edge cases
- Enterprise authentication support
- CI/CD pipeline integration
- Performance monitoring and reporting
- Visual testing integration (Percy/Applitools)

### 3. 平台 (Platform)
- **Runtime**: Node.js with TypeScript
- **Testing Frameworks**: Jest, Mocha, Vitest
- **API Specs**: OpenAPI 3.x
- **CI/CD**: GitHub Actions, Jenkins
- **Visual Testing**: Percy, Applitools
- **Design Integration**: Figma tokens
- **Monitoring**: OpenTelemetry, custom metrics

### 4. 视觉风格 (Visual Style)
- **CLI Interface**: Clean, minimalist terminal UI
- **Reports**: Professional HTML/PDF reports with charts
- **Dashboard**: Modern web-based monitoring interface
- **Documentation**: Technical documentation with code examples

### 5. 组件 (Components)
- **Core Parser**: OpenAPI specification analysis
- **Test Generator**: Multi-framework test suite generation
- **Auth Manager**: Enterprise authentication handling
- **CI/CD Integrator**: Pipeline automation
- **Report Generator**: Comprehensive test reporting
- **Performance Monitor**: API performance tracking
- **Visual Test Engine**: UI regression testing

---

## 🛠️ Development Commands

### Core Development
```bash
npm install                    # Install dependencies
npm run build                  # Build TypeScript project
npm run dev                    # Development mode with watch
npm test                       # Run all tests
npm run test:watch             # Run tests in watch mode
npm run lint                   # ESLint code analysis
npm run typecheck             # TypeScript type checking
```

### Test Generation
```bash
npm run generate              # Generate tests from OpenAPI spec
npm run generate:jest         # Generate Jest-specific tests
npm run generate:mocha        # Generate Mocha-specific tests
npm run generate:vitest       # Generate Vitest-specific tests
```

### Quality Assurance
```bash
npm run test:coverage         # Test coverage report
npm run test:integration      # Integration tests
npm run test:e2e             # End-to-end tests
npm run security:scan        # Security vulnerability scan
```

---

## 📁 Project Structure

```
ai-api-test-automation/
├── src/                      # Source code
│   ├── auth/                 # Authentication modules
│   ├── cicd/                 # CI/CD integrations
│   ├── config/               # Configuration management
│   ├── error/                # Error handling
│   ├── generator/            # Test generation engine
│   ├── parser/               # OpenAPI parser
│   ├── reporting/            # Report generation
│   ├── security/             # Security scanning
│   ├── validation/           # Code quality validation
│   └── types.ts              # Type definitions
├── tests/                    # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── generated/            # Generated test files
├── docs/                     # Documentation
│   └── claude-development-checklist/  # Development methodology
├── scripts/                  # Build and utility scripts
├── coverage/                 # Test coverage reports
└── dist/                     # Compiled output
```

---

## 🚦 Important Development Rules

### File Management Rules
- **NEVER** use `rm` command for file deletion
- **ALWAYS** use `trash` command instead: `trash filename`
- Confirm before deleting multiple files or directories

### Git Auto-Commit Rules
- **Auto-commit** at the end of each phase/sprint/milestone
- Use **Conventional Commit** format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for testing
  - `refactor:` for code refactoring
  - `chore:` for maintenance tasks

### Quality Gates
- Maintain **>90% test coverage**
- All tests must pass before phase completion
- TypeScript strict mode compliance
- ESLint zero warnings policy
- Security scan approval required

### TDD Process
1. **Red**: Write failing test first
2. **Green**: Implement minimum code to pass
3. **Refactor**: Clean up code while keeping tests green

---

## 🔧 AI Assistant Guidelines

### When Working on This Project:
1. **Follow the 15-phase development methodology** from `/docs/claude-development-checklist/`
2. **Use TodoWrite tool** to track progress through each phase
3. **Maintain enterprise-level quality standards**
4. **Implement TDD practices** for all new code
5. **Update CLAUDE.md** as project evolves

### Code Standards:
- TypeScript strict mode
- Comprehensive JSDoc comments
- Error handling with custom error types
- Async/await patterns over Promises
- Functional programming patterns where appropriate

### Testing Requirements:
- Unit tests for all core functions
- Integration tests for API interactions
- End-to-end tests for complete workflows
- Visual regression tests for UI components
- Performance tests for critical paths

---

**Last Updated**: 2025-08-21  
**Development Phase**: Phase 1 - Project Initialization  
**Methodology**: Hybrid v2.1 (Enterprise Rigor + Visual Testing Innovation)