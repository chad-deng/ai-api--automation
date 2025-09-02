#!/bin/bash
set -euo pipefail

# Database Backup Script for AI API Test Automation
# Supports both PostgreSQL and SQLite backups with retention management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# PostgreSQL backup function
backup_postgres() {
    local db_host="${POSTGRES_HOST:-db}"
    local db_port="${POSTGRES_PORT:-5432}"
    local db_name="${POSTGRES_DB:-ai_api_test_automation}"
    local db_user="${POSTGRES_USER:-postgres}"
    local backup_file="${BACKUP_DIR}/postgres_${db_name}_${TIMESTAMP}.sql.gz"
    
    log "Starting PostgreSQL backup..."
    
    # Create SQL dump and compress
    if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${db_host}" \
        -p "${db_port}" \
        -U "${db_user}" \
        -d "${db_name}" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        | gzip > "${backup_file}"; then
        
        log "PostgreSQL backup completed: ${backup_file}"
        
        # Calculate backup size
        local backup_size
        backup_size=$(du -h "${backup_file}" | cut -f1)
        log "Backup size: ${backup_size}"
        
        # Verify backup integrity
        if gunzip -t "${backup_file}"; then
            log "Backup integrity verified"
        else
            log "ERROR: Backup integrity check failed"
            return 1
        fi
    else
        log "ERROR: PostgreSQL backup failed"
        return 1
    fi
}

# SQLite backup function
backup_sqlite() {
    local db_file="${SQLITE_DB_PATH:-test_automation.db}"
    local backup_file="${BACKUP_DIR}/sqlite_${TIMESTAMP}.db.gz"
    
    if [[ ! -f "${db_file}" ]]; then
        log "SQLite database file not found: ${db_file}"
        return 1
    fi
    
    log "Starting SQLite backup..."
    
    # Create backup with vacuum and compress
    if sqlite3 "${db_file}" ".backup /dev/stdout" | gzip > "${backup_file}"; then
        log "SQLite backup completed: ${backup_file}"
        
        # Calculate backup size
        local backup_size
        backup_size=$(du -h "${backup_file}" | cut -f1)
        log "Backup size: ${backup_size}"
        
        # Verify backup integrity
        if gunzip -t "${backup_file}"; then
            log "Backup integrity verified"
        else
            log "ERROR: Backup integrity check failed"
            return 1
        fi
    else
        log "ERROR: SQLite backup failed"
        return 1
    fi
}

# Configuration files backup
backup_config() {
    local config_backup="${BACKUP_DIR}/config_${TIMESTAMP}.tar.gz"
    
    log "Backing up configuration files..."
    
    # Create tarball of configuration directories
    if tar -czf "${config_backup}" \
        -C / \
        app/src/config \
        app/docker/prometheus \
        app/docker/grafana \
        app/k8s 2>/dev/null; then
        log "Configuration backup completed: ${config_backup}"
    else
        log "WARNING: Configuration backup failed (files may not exist)"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' backup_file; do
        rm "${backup_file}"
        ((deleted_count++))
        log "Deleted old backup: $(basename "${backup_file}")"
    done < <(find "${BACKUP_DIR}" -name "*.gz" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
    
    if [[ ${deleted_count} -gt 0 ]]; then
        log "Cleaned up ${deleted_count} old backup files"
    else
        log "No old backup files to clean up"
    fi
}

# Upload backup to cloud storage (if configured)
upload_to_cloud() {
    local backup_file="$1"
    
    if [[ -n "${AWS_S3_BUCKET:-}" ]]; then
        log "Uploading backup to S3..."
        if aws s3 cp "${backup_file}" "s3://${AWS_S3_BUCKET}/backups/$(basename "${backup_file}")"; then
            log "Successfully uploaded to S3"
        else
            log "WARNING: S3 upload failed"
        fi
    fi
    
    if [[ -n "${GCS_BUCKET:-}" ]]; then
        log "Uploading backup to GCS..."
        if gsutil cp "${backup_file}" "gs://${GCS_BUCKET}/backups/$(basename "${backup_file}")"; then
            log "Successfully uploaded to GCS"
        else
            log "WARNING: GCS upload failed"
        fi
    fi
}

# Health check for backup process
health_check() {
    local latest_backup
    latest_backup=$(find "${BACKUP_DIR}" -name "*.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "${latest_backup}" ]]; then
        local backup_age
        backup_age=$(find "${latest_backup}" -mmin +${BACKUP_MAX_AGE_MINUTES:-1440} 2>/dev/null || true)
        
        if [[ -n "${backup_age}" ]]; then
            log "WARNING: Latest backup is older than ${BACKUP_MAX_AGE_MINUTES:-1440} minutes"
            return 1
        else
            log "Health check passed - recent backup found"
            return 0
        fi
    else
        log "ERROR: No backup files found"
        return 1
    fi
}

# Main backup function
main() {
    local backup_type="${1:-all}"
    local exit_code=0
    
    log "Starting backup process (type: ${backup_type})"
    
    case "${backup_type}" in
        "postgres")
            backup_postgres || exit_code=1
            ;;
        "sqlite")
            backup_sqlite || exit_code=1
            ;;
        "config")
            backup_config || exit_code=1
            ;;
        "health-check")
            health_check || exit_code=1
            ;;
        "all")
            # Try PostgreSQL first, fall back to SQLite
            if [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
                backup_postgres || exit_code=1
            else
                backup_sqlite || exit_code=1
            fi
            backup_config
            ;;
        *)
            log "ERROR: Invalid backup type: ${backup_type}"
            log "Usage: $0 [postgres|sqlite|config|health-check|all]"
            exit 1
            ;;
    esac
    
    # Upload to cloud if configured and backup succeeded
    if [[ ${exit_code} -eq 0 && "${backup_type}" != "health-check" ]]; then
        for backup_file in "${BACKUP_DIR}"/*_${TIMESTAMP}.*; do
            [[ -f "${backup_file}" ]] && upload_to_cloud "${backup_file}"
        done
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Final status
    if [[ ${exit_code} -eq 0 ]]; then
        log "Backup process completed successfully"
    else
        log "Backup process completed with errors"
    fi
    
    exit ${exit_code}
}

# Run main function with all arguments
main "$@"