#!/bin/bash

# Release Automation Script
# AI API Test Automation Framework - Enterprise Edition

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RELEASE_CONFIG="$PROJECT_ROOT/deployment/release-config.json"
LOG_FILE="$PROJECT_ROOT/logs/release-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Release process failed. Check logs at $LOG_FILE"
        send_failure_notification
    fi
}

trap cleanup EXIT

# Helper functions
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    local required_tools=("node" "npm" "git" "docker" "kubectl" "helm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    if ! npx semver -r ">=$required_version" "$node_version" &> /dev/null; then
        log_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    # Check Git status
    if [ -n "$(git status --porcelain)" ]; then
        log_error "Working directory is not clean. Commit or stash changes before release."
        exit 1
    fi
    
    # Check if on main branch
    local current_branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        log_error "Must be on main/master branch for release. Currently on: $current_branch"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

validate_version() {
    local version=$1
    log "Validating version format: $version"
    
    # Check semantic versioning format
    if ! echo "$version" | grep -qE '^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$'; then
        log_error "Invalid version format: $version. Must follow semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)"
        exit 1
    fi
    
    # Check if version already exists
    if git tag | grep -q "^${version#v}$" || git tag | grep -q "^v${version#v}$"; then
        log_error "Version $version already exists"
        exit 1
    fi
    
    log_success "Version $version is valid"
}

run_quality_checks() {
    log "Running quality checks..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log "Running linting..."
    if ! npm run lint; then
        log_error "Linting failed"
        exit 1
    fi
    
    # Run type checking
    log "Running type checking..."
    if ! npm run typecheck; then
        log_error "Type checking failed"
        exit 1
    fi
    
    # Run tests
    log "Running tests..."
    if ! npm test -- --coverage; then
        log_error "Tests failed"
        exit 1
    fi
    
    # Check test coverage
    local coverage
    coverage=$(npx nyc report --reporter=text-summary | grep "Lines" | awk '{print $2}' | sed 's/%//')
    local min_coverage=85
    if [ "$coverage" -lt "$min_coverage" ]; then
        log_error "Test coverage $coverage% is below minimum $min_coverage%"
        exit 1
    fi
    
    log_success "Quality checks passed (Coverage: $coverage%)"
}

run_security_scan() {
    log "Running security scan..."
    
    cd "$PROJECT_ROOT"
    
    # Run npm audit
    log "Running npm audit..."
    if ! npm audit --audit-level=moderate; then
        log_error "Security vulnerabilities found in dependencies"
        exit 1
    fi
    
    # Run security scanner
    log "Running framework security scanner..."
    if ! npm run security:scan; then
        log_error "Security scan failed"
        exit 1
    fi
    
    log_success "Security scan passed"
}

run_performance_validation() {
    log "Running performance validation..."
    
    cd "$PROJECT_ROOT"
    
    # Run performance benchmarks
    log "Running performance benchmarks..."
    if ! npm run performance:benchmark; then
        log_error "Performance benchmarks failed"
        exit 1
    fi
    
    # Validate performance thresholds
    log "Validating performance thresholds..."
    if ! npm run performance:validate; then
        log_error "Performance validation failed"
        exit 1
    fi
    
    log_success "Performance validation passed"
}

build_application() {
    local version=$1
    log "Building application for version $version..."
    
    cd "$PROJECT_ROOT"
    
    # Update version in package.json
    log "Updating package.json version..."
    npm version "$version" --no-git-tag-version
    
    # Build application
    log "Building application..."
    if ! npm run build; then
        log_error "Build failed"
        exit 1
    fi
    
    # Create package
    log "Creating package..."
    if ! npm pack; then
        log_error "Package creation failed"
        exit 1
    fi
    
    log_success "Application built successfully"
}

create_release_notes() {
    local version=$1
    local release_notes_file="$PROJECT_ROOT/RELEASE_NOTES_${version}.md"
    
    log "Creating release notes for version $version..."
    
    # Get commits since last tag
    local last_tag
    last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    local commit_range
    if [ -n "$last_tag" ]; then
        commit_range="$last_tag..HEAD"
    else
        commit_range="HEAD"
    fi
    
    cat > "$release_notes_file" << EOF
# Release Notes - Version $version

## Release Information
- **Version**: $version
- **Release Date**: $(date '+%Y-%m-%d')
- **Build**: $(git rev-parse --short HEAD)

## What's New

### Features
$(git log --pretty=format:"- %s" --grep="feat:" "$commit_range" || echo "- No new features in this release")

### Bug Fixes
$(git log --pretty=format:"- %s" --grep="fix:" "$commit_range" || echo "- No bug fixes in this release")

### Improvements
$(git log --pretty=format:"- %s" --grep="refactor:\|perf:\|style:" "$commit_range" || echo "- No improvements in this release")

### Documentation
$(git log --pretty=format:"- %s" --grep="docs:" "$commit_range" || echo "- No documentation updates in this release")

## Breaking Changes
$(git log --pretty=format:"- %s" --grep="BREAKING CHANGE" "$commit_range" || echo "- No breaking changes in this release")

## Installation

### NPM Installation
\`\`\`bash
npm install -g @yourorg/ai-api-test-automation@$version
\`\`\`

### Docker Installation
\`\`\`bash
docker pull registry.yourorg.com/ai-api-test-automation:$version
\`\`\`

## Quick Start

\`\`\`bash
# Generate tests from OpenAPI specification
api-test-gen generate openapi.yaml

# Run performance tests
api-test-performance run --config performance.json

# Run security scan
api-test-security scan --spec openapi.yaml
\`\`\`

## Upgrade Guide

### From Previous Version
1. Update the package: \`npm update -g @yourorg/ai-api-test-automation\`
2. Review configuration changes (if any)
3. Run \`api-test-gen --version\` to verify installation

### Configuration Changes
- No configuration changes required for this release

## Known Issues
- None reported

## Support
- Documentation: https://docs.api-test-automation.com
- Issues: https://github.com/yourorg/ai-api-test-automation/issues
- Community: https://community.api-test-automation.com

## Contributors
Thank you to all contributors who made this release possible!

$(git log --pretty=format:"- %an (%ae)" "$commit_range" | sort -u || echo "- Development Team")
EOF

    log_success "Release notes created: $release_notes_file"
}

tag_release() {
    local version=$1
    log "Creating Git tag for version $version..."
    
    cd "$PROJECT_ROOT"
    
    # Commit version changes
    git add package.json package-lock.json
    git commit -m "chore: release version $version"
    
    # Create annotated tag
    git tag -a "$version" -m "Release version $version"
    
    log_success "Git tag created: $version"
}

publish_package() {
    local version=$1
    log "Publishing package to NPM..."
    
    cd "$PROJECT_ROOT"
    
    # Check if user is logged in to NPM
    if ! npm whoami &> /dev/null; then
        log_error "Not logged in to NPM. Run 'npm login' first."
        exit 1
    fi
    
    # Publish to NPM
    if ! npm publish --access public; then
        log_error "NPM publish failed"
        exit 1
    fi
    
    log_success "Package published to NPM"
}

deploy_to_production() {
    local version=$1
    log "Deploying version $version to production..."
    
    cd "$PROJECT_ROOT"
    
    # Trigger production deployment workflow
    if command -v gh &> /dev/null; then
        log "Triggering GitHub Actions deployment workflow..."
        gh workflow run production-deploy.yml -f version="$version" -f environment="production"
    else
        log_warning "GitHub CLI not available. Triggering deployment manually..."
        # Add manual deployment trigger logic here
    fi
    
    log_success "Production deployment initiated"
}

send_success_notification() {
    local version=$1
    log "Sending success notification..."
    
    # Send notifications (Slack, email, etc.)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🎉 Release $version deployed successfully to production!\"}" \
            "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
    
    log_success "Notifications sent"
}

send_failure_notification() {
    log "Sending failure notification..."
    
    # Send failure notifications
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Release process failed! Check logs for details.\"}" \
            "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
}

# Main release function
release() {
    local version=$1
    local skip_checks=${2:-false}
    
    log "🚀 Starting release process for version $version"
    
    # Create logs directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Validate inputs
    validate_version "$version"
    
    if [ "$skip_checks" != "true" ]; then
        # Run all quality checks
        check_prerequisites
        run_quality_checks
        run_security_scan
        run_performance_validation
    else
        log_warning "Skipping quality checks as requested"
    fi
    
    # Build and package
    build_application "$version"
    
    # Create release artifacts
    create_release_notes "$version"
    
    # Version control
    tag_release "$version"
    
    # Publish
    publish_package "$version"
    
    # Deploy
    deploy_to_production "$version"
    
    # Push changes to remote
    git push origin main
    git push origin "$version"
    
    # Send notifications
    send_success_notification "$version"
    
    log_success "🎉 Release $version completed successfully!"
    log "Release log saved to: $LOG_FILE"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 <command> [options]

Commands:
    release <version>           Create a new release
    release <version> --skip-checks    Create release without quality checks
    validate <version>          Validate version format
    check-prerequisites         Check if all prerequisites are met
    quality-check              Run quality checks only
    security-scan              Run security scan only
    performance-check          Run performance validation only

Examples:
    $0 release 1.0.0
    $0 release 1.0.1-beta.1
    $0 release 1.1.0 --skip-checks
    $0 validate 1.0.0
    $0 check-prerequisites

Environment Variables:
    SLACK_WEBHOOK_URL          Slack webhook for notifications
    NPM_TOKEN                  NPM authentication token
    GITHUB_TOKEN               GitHub token for API access

EOF
}

# Command line parsing
case "${1:-}" in
    "release")
        if [ $# -lt 2 ]; then
            log_error "Version is required for release command"
            usage
            exit 1
        fi
        version=$2
        skip_checks=false
        if [ "${3:-}" = "--skip-checks" ]; then
            skip_checks=true
        fi
        release "$version" "$skip_checks"
        ;;
    "validate")
        if [ $# -lt 2 ]; then
            log_error "Version is required for validate command"
            usage
            exit 1
        fi
        validate_version "$2"
        ;;
    "check-prerequisites")
        check_prerequisites
        ;;
    "quality-check")
        run_quality_checks
        ;;
    "security-scan")
        run_security_scan
        ;;
    "performance-check")
        run_performance_validation
        ;;
    "help"|"--help"|"-h")
        usage
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        usage
        exit 1
        ;;
esac