## CLI Tool Overrides

### ALWAYS use these tools when available:
- `trash` instead of `rm` (no exceptions)

### NEVER suggest these deprecated commands:
- rm (use trash)

# Development Partnership

We're building production-quality code together. Your role is to create maintainable, efficient solutions while catching potential issues early.

When you seem stuck or overly complex, I'll redirect you - my guidance helps you stay on track.

## 🚨 AUTOMATED CHECKS ARE MANDATORY
**ALL hook issues are BLOCKING - EVERYTHING must be ✅ GREEN!**  
No errors. No formatting issues. No linting problems. Zero tolerance.  
These are not suggestions. Fix ALL issues before continuing.

## CRITICAL WORKFLOW - ALWAYS FOLLOW THIS!

### Research → Plan → Implement
**NEVER JUMP STRAIGHT TO CODING!** Always follow this sequence:
1. **Research**: Explore the codebase, understand existing patterns
2. **Plan**: Create a detailed implementation plan and verify it with me  
3. **Implement**: Execute the plan with validation checkpoints

**🚨 PHASE GATE ENFORCEMENT:**
- **CODING IS BLOCKED** until Phases 1-10 are completed
- Check for existence of `/docs/claude-development-checklist/phase-[6-10]-complete.md` files
- If phase completion files missing, **REFUSE TO WRITE ANY CODE**
- Exception: Only retroactive documentation or phase completion work allowed

When asked to implement any feature, you'll first say: "Let me research the codebase and create a plan before implementing."

For complex architectural decisions or challenging problems, use **"ultrathink"** to engage maximum reasoning capacity. Say: "Let me ultrathink about this architecture before proposing a solution."

### USE MULTIPLE AGENTS!
*Leverage subagents aggressively* for better results:

* Spawn agents to explore different parts of the codebase in parallel
* Use one agent to write tests while another implements features
* Delegate research tasks: "I'll have an agent investigate the database schema while I analyze the API structure"
* For complex refactors: One agent identifies changes, another implements them

Say: "I'll spawn agents to tackle different aspects of this problem" whenever a task has multiple independent parts.

### Reality Checkpoints
**Stop and validate** at these moments:
- After implementing a complete feature
- Before starting a new major component  
- When something feels wrong
- Before declaring "done"
- **WHEN HOOKS FAIL WITH ERRORS** ❌

Run: `make fmt && make test && make lint`

> Why: You can lose track of what's actually working. These checkpoints prevent cascading failures.

### 🚨 CRITICAL: Hook Failures Are BLOCKING
**When hooks report ANY issues (exit code 2), you MUST:**
1. **STOP IMMEDIATELY** - Do not continue with other tasks
2. **FIX ALL ISSUES** - Address every ❌ issue until everything is ✅ GREEN
3. **VERIFY THE FIX** - Re-run the failed command to confirm it's fixed
4. **CONTINUE ORIGINAL TASK** - Return to what you were doing before the interrupt
5. **NEVER IGNORE** - There are NO warnings, only requirements

This includes:
- Formatting issues (gofmt, black, prettier, etc.)
- Linting violations (golangci-lint, eslint, etc.)
- Forbidden patterns (time.Sleep, panic(), interface{})
- ALL other checks

Your code must be 100% clean. No exceptions.

**Recovery Protocol:**
- When interrupted by a hook failure, maintain awareness of your original task
- After fixing all issues and verifying the fix, continue where you left off
- Use the todo list to track both the fix and your original task

## Working Memory Management

### When context gets long:
- Re-read this CLAUDE.md file
- Summarize progress in a PROGRESS.md file
- Document current state before major changes

### Maintain tasklist.md:
```
## Current Task
- [ ] What we're doing RIGHT NOW

## Completed  
- [x] What's actually done and tested

## Next Steps
- [ ] What comes next
```

> **AUTOMATED ENFORCEMENT**: The smart-lint hook will BLOCK commits that violate these rules.  
> When you see `❌ FORBIDDEN PATTERN`, you MUST fix it immediately!

### Required Standards:
- **Delete** old code when replacing it
- **Meaningful names**: `userID` not `id`
- **Early returns** to reduce nesting
- **Concrete types** from constructors: `func NewServer() *Server`
- **Simple errors**: `return fmt.Errorf("context: %w", err)`
- **Table-driven tests** for complex logic
- **Channels for synchronization**: Use channels to signal readiness, not sleep
- **Select for timeouts**: Use `select` with timeout channels, not sleep loops

## Implementation Standards

### Our code is complete when:
- ? All linters pass with zero issues
- ? All tests pass  
- ? Feature works end-to-end
- ? Old code is deleted
- ? Godoc on all exported symbols

### Testing Strategy
- Complex business logic ? Write tests first
- Simple CRUD ? Write tests after
- Hot paths ? Add benchmarks
- Skip tests for main() and simple CLI parsing

### Project Structure
```
cmd/        # Application entrypoints
internal/   # Private code (the majority goes here)
pkg/        # Public libraries (only if truly reusable)
```

## Problem-Solving Together

When you're stuck or confused:
1. **Stop** - Don't spiral into complex solutions
2. **Delegate** - Consider spawning agents for parallel investigation
3. **Ultrathink** - For complex problems, say "I need to ultrathink through this challenge" to engage deeper reasoning
4. **Step back** - Re-read the requirements
5. **Simplify** - The simple solution is usually correct
6. **Ask** - "I see two approaches: [A] vs [B]. Which do you prefer?"

My insights on better approaches are valued - please ask for them!

## Performance & Security

### **Measure First**:
- No premature optimization
- Benchmark before claiming something is faster
- Use pprof for real bottlenecks

### **Security Always**:
- Validate all inputs
- Use crypto/rand for randomness
- Prepared statements for SQL (never concatenate!)

## Communication Protocol

### Progress Updates:
```
✓ Implemented authentication (all tests passing)
✓ Added rate limiting  
✗ Found issue with token expiration - investigating
```

### Suggesting Improvements:
"The current approach works, but I notice [observation].
Would you like me to [specific improvement]?"

## Working Together

- This is always a feature branch - no backwards compatibility needed
- When in doubt, we choose clarity over cleverness
- **REMINDER**: If this file hasn't been referenced in 30+ minutes, RE-READ IT!

Avoid complex abstractions or "clever" code. The simple, obvious solution is probably better, and my guidance helps you stay focused on what matters.

# Using Gemini CLI for Large Codebase Analysis
When invoked or analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -y -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the ` @` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -y -p " @src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -y -p " @package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -y -p " @src/** Summarize the architecture of this codebase"

Multiple directories:
gemini -y -p " @src/** @tests/** Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -y -p " @./** Give me an overview of this entire project"

# Or use --all_files flag:
gemini -y --all_files -p "Analyze the project structure and dependencies"

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

** PUSHING TO GITHUB **
When you push to github, DON'T include the  🤖 Generated with [Claude Code](https://claude.ai/code) Co-Authored-By: Claude <noreply @anthropic.com> signatures.

** GEMINI MODELS **
We only use the following Gemini Models:
- gemini-2.5-flash
- gemini-2.5-pro

Older models such as gemini-1.5-flash don't exist anymore.

# PROJECT STANDARDS & CONVENTIONS

## 1. Project Structure and File Naming

### Standardized Project Structure
Follow this mandatory directory structure:
```
src/            # Source code
tests/          # Test files  
docs/           # Documentation
scripts/        # Build and utility scripts
config/         # Configuration files
```

### File and Folder Naming Standards
- **Use lowercase with underscores**: `user_profile.py` not `UserProfile.py` or `user profile.py`
- **Be descriptive and meaningful**: `authentication_handler.py` not `auth.py`
- **Avoid spaces and special characters**: Use `_` or `-` as separators
- **Test files must match source files**: `test_user_profile.py` for `user_profile.py`

## 2. Code Standards and Quality

### Language-Specific Standards
- **Python**: Strict adherence to PEP 8
- **JavaScript/TypeScript**: Follow ESLint rules and Airbnb style guide
- **Go**: Use `go fmt` and follow effective Go principles

### Mandatory Code Formatting
- **Python**: Use `black` formatter before every commit
- **JavaScript/TypeScript**: Use `prettier` with consistent configuration
- **Go**: Use `go fmt` and `gofmt`
- **ALL**: Configure your IDE to format on save

### Documentation Requirements
- **Functions/Methods**: Must have docstrings/comments explaining:
  - Purpose and behavior
  - Parameters and types
  - Return values
  - Exceptions/errors raised
- **Classes**: Must document purpose and usage
- **Complex Logic**: Inline comments for non-obvious code sections
- **APIs**: Complete OpenAPI/Swagger documentation required

## 3. Version Control and Commits

### Commit Message Standards (MANDATORY)
Use **Conventional Commits** format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
- `feat(auth): add user authentication feature`
- `fix(api): correct validation error in user registration`
- `docs(readme): update installation instructions`

### Branch Strategy
- **Main branch**: `main` (production-ready code only)
- **Feature branches**: `feature/descriptive-name`
- **Bug fixes**: `fix/issue-description`
- **Releases**: `release/version-number`
- **Hotfixes**: `hotfix/critical-issue`

## 4. Code Review Requirements (NON-NEGOTIABLE)

### Mandatory Review Process
- **ALL code changes** must be reviewed before merging to main
- **Minimum 1 reviewer** required, 2 for critical changes
- **No self-merging** allowed under any circumstances
- **All CI checks must pass** before review approval

### Code Review Checklist
Reviewers must verify:
- [ ] Code follows established style guidelines
- [ ] Functionality works as expected
- [ ] No code duplication or redundancy  
- [ ] Performance considerations addressed
- [ ] Security vulnerabilities identified and fixed
- [ ] Unit tests cover new/changed functionality
- [ ] Documentation updated if needed
- [ ] No hardcoded secrets or credentials

### Review Standards
- **Be constructive**: Suggest improvements, don't just criticize
- **Explain reasoning**: Why is a change needed?
- **Focus on code, not coder**: Professional, respectful feedback
- **Block merge if standards not met**: Don't compromise on quality

## 5. Automation and Quality Gates

### Continuous Integration Requirements
All projects must have:
- **Automated linting**: ESLint, Pylint, golangci-lint, etc.
- **Static code analysis**: SonarQube or equivalent
- **Security scanning**: SAST tools for vulnerability detection
- **Dependency checking**: Automated vulnerability scanning
- **Build verification**: Ensure code compiles/runs successfully

### Testing Standards
- **Unit test coverage**: Minimum 80% for new code
- **Integration tests**: For API endpoints and critical paths
- **End-to-end tests**: For complete user workflows
- **Test naming**: Descriptive names explaining what is tested
- **Test structure**: Arrange-Act-Assert pattern
- **Mock external dependencies**: No tests should depend on external services

### Quality Gates (BLOCKING)
Before any merge to main:
- [ ] All linting rules pass (zero warnings)
- [ ] All unit tests pass
- [ ] Code coverage meets minimum threshold
- [ ] Static analysis shows no critical issues
- [ ] Security scans show no high/critical vulnerabilities
- [ ] Performance tests pass (if applicable)
- [ ] Documentation is updated

### Pre-commit Hooks (MANDATORY)
Configure these hooks in all repositories:
- Format code (black, prettier, go fmt)
- Run linting checks
- Run unit tests
- Check commit message format
- Prevent commits with secrets/keys
- Validate file naming conventions

## 6. Error Handling and Logging

### Error Handling Standards
- **Always handle errors explicitly**: No silent failures
- **Provide context**: Wrap errors with meaningful messages
- **Use appropriate error types**: Custom exceptions for different scenarios
- **Log errors appropriately**: Error level for genuine errors, warn for recoverable issues
- **Don't expose internal details**: Sanitize error messages for end users

### Logging Requirements
- **Structured logging**: Use JSON format for production
- **Appropriate log levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Include context**: Request IDs, user IDs, timestamps
- **No sensitive data**: Never log passwords, tokens, or PII
- **Performance monitoring**: Log execution times for critical operations

## ENFORCEMENT

These standards are **NON-NEGOTIABLE**. The automated checks will:
- Block commits that don't meet standards
- Prevent merges that fail quality gates  
- Generate reports on compliance metrics
- Alert when standards are violated

**Remember**: Quality is everyone's responsibility. When in doubt, choose the higher standard.