# AI API Test Automation - Production Deployment Runbook

## Overview

This runbook provides comprehensive instructions for deploying and operating the AI API Test Automation QA review workflow system in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Security Configuration](#security-configuration)
- [Operational Procedures](#operational-procedures)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Container Runtime**: Docker 20.10+ or containerd 1.6+
- **Orchestration**: Kubernetes 1.25+ (for K8s deployment)
- **Database**: PostgreSQL 15+ (production) or SQLite 3.36+ (development)
- **Cache**: Redis 7.0+
- **Load Balancer**: Nginx 1.20+ or cloud load balancer

### Resource Requirements

**Development Environment:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD

**Production Environment (minimum):**
- CPU: 8 cores
- RAM: 16GB
- Storage: 100GB SSD
- Network: 1Gbps

**Production Environment (recommended):**
- CPU: 16 cores
- RAM: 32GB
- Storage: 500GB NVMe SSD
- Network: 10Gbps

### Access Requirements

- GitHub repository access for image pulls
- Cloud provider account (AWS/GCP/Azure) for managed services
- SSL certificates for HTTPS
- DNS management access
- Container registry access

## Environment Setup

### 1. Clone Repository and Setup Environment

```bash
# Clone the repository
git clone https://github.com/your-org/ai-api-test-automation.git
cd ai-api-test-automation

# Copy environment template
cp .env.example .env.prod
```

### 2. Configure Production Environment Variables

Edit `.env.prod` with production values:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@db-host:5432/ai_api_test_automation
REDIS_URL=redis://:SECURE_PASSWORD@redis-host:6379/0

# Security
JWT_SECRET=$(openssl rand -base64 32)
API_KEY=$(openssl rand -hex 32)
WEBHOOK_SIGNING_KEY=$(openssl rand -base64 32)

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
API_WORKERS=4

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PASSWORD=$(openssl rand -base64 32)
```

### 3. Generate SSL Certificates

Using Let's Encrypt with Certbot:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d api.your-domain.com
```

Or use cloud-managed certificates (AWS ACM, GCP Certificate Manager, etc.)

## Database Migration

### 1. Prepare PostgreSQL Database

```bash
# Install PostgreSQL
sudo apt update && sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE ai_api_test_automation;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ai_api_test_automation TO postgres;
ALTER DATABASE ai_api_test_automation OWNER TO postgres;
\\q
EOF
```

### 2. Migrate from SQLite (if applicable)

```bash
# Install migration dependencies
pip install asyncpg psycopg2-binary

# Run migration (dry run first)
python scripts/migrate_to_postgres.py --dry-run

# Execute actual migration
python scripts/migrate_to_postgres.py
```

### 3. Verify Migration

```bash
# Check table creation
psql -h localhost -U postgres -d ai_api_test_automation -c "\\dt"

# Verify data integrity
python -c "
import asyncio
from src.database.models import init_db
async def verify():
    await init_db()
    print('Database verification successful')
asyncio.run(verify())
"
```

## Docker Deployment

### 1. Build Production Image

```bash
# Build multi-platform image
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t ai-api-test-automation:latest .

# Tag for registry
docker tag ai-api-test-automation:latest ghcr.io/your-org/ai-api-test-automation:v1.0.0
docker push ghcr.io/your-org/ai-api-test-automation:v1.0.0
```

### 2. Deploy with Docker Compose

```bash
# Create production override
cp docker-compose.prod.yml docker-compose.override.yml

# Start services
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs app
```

### 3. Health Check Verification

```bash
# Check application health
curl -f http://localhost/health || echo "Health check failed"

# Check metrics endpoint
curl -f http://localhost/metrics || echo "Metrics endpoint failed"

# Verify database connectivity
docker-compose exec app python -c "
import asyncio
from src.database.models import init_db
asyncio.run(init_db())
print('Database connectivity verified')
"
```

## Kubernetes Deployment

### 1. Prepare Kubernetes Cluster

```bash
# Create namespace
kubectl create namespace ai-api-test-automation

# Apply base configurations
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/configmap.yaml
```

### 2. Configure Secrets

```bash
# Create secrets from environment file
kubectl create secret generic ai-api-secrets \
  --from-env-file=.env.prod \
  --namespace=ai-api-test-automation

# Create TLS secret
kubectl create secret tls ai-api-tls \
  --cert=/path/to/cert.pem \
  --key=/path/to/key.pem \
  --namespace=ai-api-test-automation

# Create registry secret
kubectl create secret docker-registry registry-credentials \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN \
  --namespace=ai-api-test-automation
```

### 3. Deploy Applications

```bash
# Deploy in order
kubectl apply -f k8s/base/rbac.yaml
kubectl apply -f k8s/base/pvc.yaml
kubectl apply -f k8s/base/postgres.yaml
kubectl apply -f k8s/base/redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=ai-api-postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=ai-api-redis --timeout=300s

# Deploy application
kubectl apply -f k8s/base/deployment.yaml
kubectl apply -f k8s/base/service.yaml
kubectl apply -f k8s/base/hpa.yaml
kubectl apply -f k8s/base/ingress.yaml
```

### 4. Verify Kubernetes Deployment

```bash
# Check pod status
kubectl get pods -n ai-api-test-automation

# Check services
kubectl get svc -n ai-api-test-automation

# Check ingress
kubectl get ingress -n ai-api-test-automation

# Check logs
kubectl logs -l app=ai-api-test-automation -n ai-api-test-automation --tail=100
```

## Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
# Using Docker Compose (includes Prometheus, Grafana, Alertmanager)
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Or deploy monitoring to Kubernetes
kubectl apply -f k8s/monitoring/
```

### 2. Configure Grafana Dashboards

1. Access Grafana: `http://your-domain:3000`
2. Login with admin credentials
3. Import dashboards from `docker/grafana/provisioning/dashboards/json/`
4. Configure alert channels (Slack, email, PagerDuty)

### 3. Set Up Alerting

```bash
# Configure Alertmanager
cp docker/prometheus/alertmanager.yml.example docker/prometheus/alertmanager.yml

# Edit notification channels
vim docker/prometheus/alertmanager.yml

# Restart Alertmanager
docker-compose restart alertmanager
```

## Security Configuration

### 1. Network Security

```bash
# Configure firewall (UFW example)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 9090  # Prometheus
sudo ufw enable
```

### 2. Database Security

```postgresql
-- Create read-only user for Grafana
CREATE USER grafana_reader WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';
GRANT CONNECT ON DATABASE ai_api_test_automation TO grafana_reader;
GRANT USAGE ON SCHEMA public TO grafana_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO grafana_reader;
```

### 3. SSL/TLS Configuration

```nginx
# Ensure strong SSL configuration in nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

## Operational Procedures

### Daily Operations

**Health Checks:**
```bash
# Automated health check script
#!/bin/bash
set -e

echo "Checking application health..."
curl -f http://localhost/health

echo "Checking database connectivity..."
docker-compose exec -T db pg_isready -U postgres

echo "Checking Redis connectivity..."
docker-compose exec -T redis redis-cli ping

echo "Checking disk space..."
df -h | grep -E "(/$|/var)" | awk '{print $5}' | sed 's/%//' | while read usage; do
  if [ $usage -gt 85 ]; then
    echo "WARNING: Disk usage is ${usage}%"
  fi
done

echo "Health checks completed successfully"
```

**Log Monitoring:**
```bash
# Check application logs for errors
docker-compose logs app --tail=1000 | grep -i error

# Check system logs
journalctl -u docker --since "1 hour ago" | grep -i error
```

### Backup Procedures

**Automated Backup:**
```bash
# Run backup script
./scripts/backup.sh all

# Verify backup
./scripts/backup.sh health-check

# Manual backup trigger
docker-compose exec backup /backup.sh postgres
```

**Backup Restoration:**
```bash
# Restore from backup
gunzip -c /backups/postgres_ai_api_test_automation_20240101_120000.sql.gz | \
  psql -h localhost -U postgres -d ai_api_test_automation
```

### Scaling Procedures

**Docker Compose Scaling:**
```bash
# Scale application containers
docker-compose up -d --scale app=3

# Verify scaling
docker-compose ps app
```

**Kubernetes Scaling:**
```bash
# Manual scaling
kubectl scale deployment ai-api-test-automation --replicas=5

# Check HPA status
kubectl get hpa ai-api-test-automation-hpa

# View scaling events
kubectl describe hpa ai-api-test-automation-hpa
```

### Security Procedures

**Certificate Renewal:**
```bash
# Renew Let's Encrypt certificates
sudo certbot renew --dry-run
sudo certbot renew

# Restart services to use new certificates
docker-compose restart nginx
```

**Security Scanning:**
```bash
# Scan container images
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ai-api-test-automation:latest

# Vulnerability assessment
docker run --rm -v $(pwd):/app clair-scanner:latest \
  ai-api-test-automation:latest
```

## Troubleshooting

### Common Issues

**Application Won't Start:**
```bash
# Check logs
docker-compose logs app

# Common fixes
docker-compose down && docker-compose up -d
docker system prune -f
```

**Database Connection Issues:**
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Check network connectivity
docker-compose exec app nc -zv db 5432

# Verify credentials
docker-compose exec app env | grep DATABASE_URL
```

**High Memory Usage:**
```bash
# Check container memory usage
docker stats --no-stream

# Check for memory leaks
docker-compose exec app python -c "
import psutil
process = psutil.Process()
print(f'Memory usage: {process.memory_info().rss / 1024 / 1024:.2f} MB')
"
```

**Performance Issues:**
```bash
# Check system resources
top -p $(docker-compose exec app pgrep -f uvicorn)
iostat -x 1 5

# Check database performance
docker-compose exec db psql -U postgres -d ai_api_test_automation -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
"
```

### Emergency Procedures

**Service Recovery:**
```bash
# Quick restart
docker-compose restart app

# Full recovery
docker-compose down
docker-compose pull
docker-compose up -d

# Check recovery
curl -f http://localhost/health
```

**Data Recovery:**
```bash
# Restore from latest backup
LATEST_BACKUP=$(ls -t /backups/postgres_*.sql.gz | head -1)
gunzip -c "$LATEST_BACKUP" | psql -h localhost -U postgres -d ai_api_test_automation
```

## Rollback Procedures

### Application Rollback

**Docker Deployment:**
```bash
# Rollback to previous image
docker-compose stop app
docker-compose pull  # If using :latest
docker-compose up -d app

# Or rollback to specific version
docker tag ai-api-test-automation:v1.0.0 ai-api-test-automation:latest
docker-compose up -d app
```

**Kubernetes Deployment:**
```bash
# Rollback deployment
kubectl rollout undo deployment/ai-api-test-automation

# Check rollout status
kubectl rollout status deployment/ai-api-test-automation

# Rollback to specific revision
kubectl rollout undo deployment/ai-api-test-automation --to-revision=2
```

### Database Rollback

**Migration Rollback:**
```bash
# Create rollback script
# This requires careful planning and testing
# Example for removing a column:
psql -h localhost -U postgres -d ai_api_test_automation << EOF
ALTER TABLE webhook_events DROP COLUMN IF EXISTS new_column;
EOF
```

### Configuration Rollback

**Revert Configuration:**
```bash
# Git-based configuration rollback
git checkout HEAD~1 -- k8s/
kubectl apply -f k8s/base/

# Or use backups
cp /backups/config_20240101_120000.tar.gz .
tar -xzf config_20240101_120000.tar.gz
```

## Contact Information

**Emergency Contacts:**
- On-call Engineer: [Phone/Email]
- DevOps Team Lead: [Phone/Email]
- Product Owner: [Email]

**Escalation Path:**
1. On-call Engineer (immediate response)
2. DevOps Team Lead (within 30 minutes)
3. Engineering Manager (within 1 hour)
4. CTO (for business-critical issues)

## Useful Commands Reference

```bash
# Quick status check
docker-compose ps && curl -s http://localhost/health

# View recent logs
docker-compose logs --tail=100 app

# Database backup
./scripts/backup.sh postgres

# Performance monitoring
docker stats --no-stream | grep ai-api

# Certificate check
openssl x509 -in /etc/ssl/certs/cert.pem -text -noout | grep "Not After"
```

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Next Review Date:** [Date + 3 months]