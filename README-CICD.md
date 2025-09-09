# CI/CD Pipeline Documentation

## 🚀 Overview

This repository includes a comprehensive CI/CD pipeline built with GitHub Actions for automated testing, building, and deployment of the AI Finance Tracker application.

## 📋 Pipeline Components

### 1. **Continuous Integration (CI)**
- **File**: `.github/workflows/ci.yml`
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Features**:
  - Automated testing (unit, integration)
  - Code linting and formatting
  - Security vulnerability scanning
  - Docker image building and pushing
  - Multi-environment deployment

### 2. **Docker Build & Deploy**
- **File**: `.github/workflows/docker.yml`
- **Triggers**: Push to branches, tags
- **Features**:
  - Multi-architecture Docker builds (AMD64, ARM64)
  - Container registry publishing
  - Security scanning with Trivy
  - Automated deployment to staging/production

### 3. **Release Management**
- **File**: `.github/workflows/release.yml`
- **Triggers**: Git tags (v*)
- **Features**:
  - Automated release creation
  - Changelog generation
  - Docker image tagging
  - GitHub release publishing

### 4. **Dependency Management**
- **File**: `.github/dependabot.yml`
- **Features**:
  - Automated dependency updates
  - Security patch management
  - Weekly update schedule

## 🏗️ Infrastructure

### **Docker Configuration**
- **Server**: `server/Dockerfile` - Node.js production image
- **Client**: `client/Dockerfile` - Nginx static file server
- **Compose**: `docker-compose.yml` - Local development setup

### **Kubernetes Deployment**
- **Namespace**: `k8s/namespace.yaml`
- **Server**: `k8s/server-deployment.yaml`
- **Client**: `k8s/client-deployment.yaml`
- **Services**: `k8s/services.yaml`
- **Ingress**: `k8s/ingress.yaml`
- **Secrets**: `k8s/secrets.yaml`

## 🔧 Setup Instructions

### **1. Repository Secrets**
Configure the following secrets in your GitHub repository:

```bash
# Required Secrets
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
NORDIGEN_SECRET_ID=your_nordigen_id
NORDIGEN_SECRET_KEY=your_nordigen_key
NORDIGEN_ACCESS_TOKEN=your_access_token
OPENROUTER_API_KEY=your_openrouter_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_PRO_MONTHLY=your_monthly_price
STRIPE_PRICE_PRO_YEARLY=your_yearly_price
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

### **2. Environment Configuration**
- **Staging**: Automatically deploys from `develop` branch
- **Production**: Automatically deploys from `main` branch
- **Manual**: Use tags for manual releases

### **3. Container Registry**
Images are automatically pushed to GitHub Container Registry:
- `ghcr.io/your-username/ai-finance-tracker-server:latest`
- `ghcr.io/your-username/ai-finance-tracker-client:latest`

## 🚦 Workflow Triggers

### **CI Pipeline**
```yaml
# Triggers on:
- Push to main/develop branches
- Pull requests to main/develop
- Manual workflow dispatch
```

### **Docker Pipeline**
```yaml
# Triggers on:
- Push to any branch
- Git tags (v*)
- Pull requests
```

### **Release Pipeline**
```yaml
# Triggers on:
- Git tags (v*)
- Example: v1.0.0, v2.1.3
```

## 📊 Pipeline Stages

### **1. Test Stage**
- Install dependencies
- Run unit tests
- Run integration tests
- Code linting
- Security scanning

### **2. Build Stage**
- Build Docker images
- Push to container registry
- Multi-architecture support
- Image vulnerability scanning

### **3. Deploy Stage**
- **Staging**: Auto-deploy from `develop`
- **Production**: Auto-deploy from `main`
- **Manual**: Deploy from tags

### **4. Release Stage**
- Generate changelog
- Create GitHub release
- Tag Docker images
- Publish artifacts

## 🔒 Security Features

### **Vulnerability Scanning**
- **Trivy**: Container image scanning
- **CodeQL**: Code security analysis
- **Dependabot**: Dependency updates

### **Security Headers**
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### **Secrets Management**
- GitHub Secrets for sensitive data
- Kubernetes Secrets for runtime
- Encrypted environment variables

## 📈 Monitoring & Observability

### **Health Checks**
- **Server**: `/test` endpoint
- **Client**: HTTP health check
- **Kubernetes**: Liveness/Readiness probes

### **Logging**
- Structured logging
- Centralized log collection
- Error tracking and alerting

### **Metrics**
- Application performance metrics
- Infrastructure monitoring
- Business metrics tracking

## 🛠️ Local Development

### **Using Docker Compose**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Using Kubernetes**
```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods -n ai-finance-tracker

# View logs
kubectl logs -f deployment/ai-finance-server -n ai-finance-tracker
```

## 🚀 Deployment Strategies

### **Blue-Green Deployment**
- Zero-downtime deployments
- Instant rollback capability
- Traffic switching

### **Canary Deployment**
- Gradual traffic shifting
- A/B testing support
- Risk mitigation

### **Rolling Updates**
- Kubernetes native
- Controlled rollout
- Automatic rollback on failure

## 📝 Best Practices

### **Code Quality**
- Pre-commit hooks
- Code reviews required
- Automated testing
- Linting and formatting

### **Security**
- Regular dependency updates
- Vulnerability scanning
- Secrets rotation
- Access control

### **Performance**
- Resource limits
- Health checks
- Monitoring
- Optimization

## 🔧 Troubleshooting

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check logs
   gh run list
   gh run view <run-id>
   ```

2. **Deployment Issues**
   ```bash
   # Check pod status
   kubectl get pods -n ai-finance-tracker
   
   # Check logs
   kubectl logs -f deployment/ai-finance-server -n ai-finance-tracker
   ```

3. **Secret Issues**
   ```bash
   # Verify secrets
   kubectl get secrets -n ai-finance-tracker
   kubectl describe secret ai-finance-secrets -n ai-finance-tracker
   ```

### **Debug Commands**
```bash
# Check workflow runs
gh run list

# View specific run
gh run view <run-id>

# Check container logs
docker logs <container-name>

# Check Kubernetes events
kubectl get events -n ai-finance-tracker
```

## 📞 Support

For issues with the CI/CD pipeline:
1. Check the GitHub Actions logs
2. Review the troubleshooting section
3. Create an issue in the repository
4. Contact the development team

## 🔄 Maintenance

### **Regular Tasks**
- Update dependencies monthly
- Review security scans weekly
- Monitor pipeline performance
- Update documentation

### **Scheduled Maintenance**
- Container base image updates
- Security patch deployments
- Performance optimizations
- Documentation updates
