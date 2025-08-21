# ApiFox Webhook Test Automation Project

## 🚀 5-Part Structured Project Definition

### 1. 背景 (Background)
An ApiFox-integrated webhook automation system that solves the critical problem of manual API test design and implementation. When developers create or update API documents in ApiFox, QA teams currently must manually design and implement API tests one by one, which is time-consuming and creates bottlenecks in the development workflow. This project follows the Hybrid v2.1 development methodology combining enterprise-level rigor with modern visual testing capabilities.

**Problem Impact**: QA teams spend significant time manually creating API tests for each endpoint in ApiFox, delaying testing cycles and creating maintenance overhead.

### 2. 描述 (Description)  
**Core Mission**: Automate API test generation and execution through ApiFox webhook integration. When API documents are created/updated in ApiFox, a webhook triggers a local server script that automatically generates comprehensive pytest test suites, including CRUD operations, edge cases, error scenarios, and performance tests, which QA can then review and customize.

**Key Features**:
- ApiFox webhook integration for real-time API document changes
- Automated pytest test suite generation (CRUD, edge cases, error scenarios, performance)
- Python-based local server for webhook processing
- Comprehensive test coverage with QA review workflow
- ApiFox API specification parsing and validation
- Test generation for all API operations and data models
- Performance testing integration with pytest-benchmark

### 3. 平台 (Platform)
- **Runtime**: Python 3.9+ 
- **Testing Framework**: pytest with plugins (pytest-asyncio, pytest-benchmark, pytest-html)
- **API Integration**: ApiFox webhook API
- **Web Server**: FastAPI/Flask for webhook endpoint
- **API Specs**: ApiFox API documentation format
- **Local Environment**: Local server deployment
- **Performance Testing**: pytest-benchmark, locust integration

### 4. 视觉风格 (Visual Style)
- **CLI Interface**: Python-based command line tools with rich console output
- **Test Reports**: pytest-html generated reports with detailed test results
- **Webhook Logs**: Structured logging with timestamp and status tracking
- **QA Review Interface**: Clear test file organization for easy review and customization

### 5. 组件 (Components)
- **Webhook Server**: FastAPI/Flask server to receive ApiFox webhooks
- **ApiFox Parser**: Parse API documentation from ApiFox webhook payload
- **Pytest Generator**: Generate comprehensive test suites with CRUD, edge cases, performance tests
- **Test Template Engine**: Customizable pytest templates for different API patterns
- **QA Review System**: Organized file structure for QA test review and customization
- **Test Execution Engine**: Automated pytest runner with reporting
- **Configuration Manager**: Manage ApiFox integration settings and test parameters

---

## 🛠️ Development Commands

### Core Development
```bash
pip install -r requirements.txt   # Install Python dependencies
python -m pytest                  # Run all tests
python -m pytest --watch          # Run tests in watch mode
python -m black .                  # Code formatting
python -m flake8 .                # Code linting
python -m mypy .                   # Type checking
```

### Webhook Server
```bash
python webhook_server.py          # Start webhook server locally
python webhook_server.py --port 8080  # Start on specific port
python -m uvicorn webhook_server:app --reload  # FastAPI development mode
```

### Test Generation
```bash
python generate_tests.py          # Generate pytest tests from ApiFox
python generate_tests.py --api-spec path/to/spec.json  # Generate from specific spec
python generate_tests.py --output tests/generated/     # Specify output directory
```

### Quality Assurance
```bash
python -m pytest --cov=src        # Test coverage report
python -m pytest tests/integration/  # Integration tests
python -m pytest --benchmark-only    # Performance tests only
python -m pytest --html=report.html  # Generate HTML test report
```

---

## 📁 Project Structure

```
apifox-webhook-test-automation/
├── src/                      # Source code
│   ├── webhook/              # Webhook server and handlers
│   ├── parsers/              # ApiFox API specification parsers
│   ├── generators/           # Pytest test generators
│   ├── templates/            # Test template engines
│   ├── config/               # Configuration management
│   ├── utils/                # Utility functions
│   └── __init__.py           # Package initialization
├── tests/                    # Test suites
│   ├── unit/                 # Unit tests for the automation system
│   ├── integration/          # Integration tests
│   └── generated/            # Auto-generated pytest files from ApiFox
├── docs/                     # Documentation
│   └── claude-development-checklist/  # Development methodology
├── scripts/                  # Utility scripts
├── requirements.txt          # Python dependencies
├── pytest.ini               # Pytest configuration
├── .env.example              # Environment variables template
└── webhook_server.py         # Main webhook server entry point
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
- Python 3.9+ with type hints (mypy compliance)
- PEP 8 style guide with Black formatter
- Comprehensive docstrings (Google/NumPy style)
- Exception handling with custom error types
- Async/await patterns for webhook handling

### Testing Requirements:
- Unit tests for all core functions (pytest)
- Integration tests for ApiFox webhook flow
- End-to-end tests for complete automation workflow
- Performance tests using pytest-benchmark
- Generated test validation and QA review processes

---

**Last Updated**: 2025-08-21  
**Development Phase**: Phase 1 - Project Initialization  
**Methodology**: Hybrid v2.1 (Enterprise Rigor + Visual Testing Innovation)