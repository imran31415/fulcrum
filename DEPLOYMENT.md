# Fulcrum Deployment Guide

This guide covers the automated deployment system for Fulcrum using the enhanced Makefile.

## Quick Start

### Full Deployment
```bash
make deploy
```
This command will:
1. Build multi-architecture Docker image (AMD64 + ARM64)
2. Push to DigitalOcean registry with multiple tags
3. Apply Kubernetes manifests using Kustomize
4. Wait for rollout completion
5. Show success message with URLs

### Fast Deployment (Development)
```bash
make deploy-fast
```
Uses existing build cache for faster iteration during development.

## Available Commands

### 🚀 Deployment Commands

| Command | Description |
|---------|-------------|
| `make deploy` | **Full deployment pipeline** - build, push, deploy |
| `make deploy-fast` | Fast deployment using existing build |
| `make docker-build` | Build multi-arch Docker image |
| `make docker-push` | Push Docker image to registry |
| `make docker-push-latest` | Push only latest tag (faster) |

### ⚙️ Kubernetes Management

| Command | Description |
|---------|-------------|
| `make k8s-apply` | Apply Kubernetes manifests |
| `make k8s-restart` | Restart deployment |
| `make k8s-rollback` | Rollback to previous version |
| `make k8s-status` | Show deployment status |
| `make k8s-context` | Show current kubectl context |

### 📊 Monitoring & Debugging

| Command | Description |
|---------|-------------|
| `make k8s-logs` | Show recent application logs |
| `make k8s-logs-follow` | Follow logs in real-time |
| `make k8s-shell` | Get shell access to running pod |

### 🧪 Testing

| Command | Description |
|---------|-------------|
| `make test-local-docker` | Build and test Docker locally |
| `make test-production` | Test production deployment |

### ℹ️ Information

| Command | Description |
|---------|-------------|
| `make deployment-info` | Show deployment configuration |
| `make help` | Show all available commands |

## Deployment Process Details

### Image Tagging Strategy

The deployment system creates three tags for each build:

1. **`latest`** - Always points to the most recent build
2. **`{git-commit}`** - Specific commit hash (e.g., `b133002`)
3. **`{branch}-{timestamp}`** - Branch and timestamp (e.g., `main-20250915-221923`)

### Multi-Architecture Support

All images are built for both:
- `linux/amd64` (Intel/AMD processors)
- `linux/arm64` (ARM processors, including Apple Silicon)

### Registry Configuration

- **Registry**: `registry.digitalocean.com/resourceloop`
- **Image Name**: `fulcrum`
- **Full Path**: `registry.digitalocean.com/resourceloop/fulcrum`

## Production URLs

- **Application**: https://fulcrum.scalebase.io
- **Health Check**: https://fulcrum.scalebase.io/health

## Prerequisites

### Required Tools
- Docker with buildx support
- kubectl configured for your cluster
- doctl (DigitalOcean CLI) authenticated

### One-Time Setup
```bash
# Create registry secret (if not exists)
make setup-k8s-secrets
```

## Common Workflows

### Development Iteration
```bash
# Make code changes
# ...

# Quick redeploy
make deploy-fast
```

### Production Release
```bash
# Ensure clean git state
git status

# Full deployment with new tags
make deploy

# Verify deployment
make test-production
make k8s-status
```

### Troubleshooting
```bash
# Check deployment status
make k8s-status

# View recent logs
make k8s-logs

# Follow logs in real-time
make k8s-logs-follow

# Get shell access for debugging
make k8s-shell

# Rollback if needed
make k8s-rollback
```

### Local Testing
```bash
# Test Docker build locally before deploying
make test-local-docker
```

## Configuration

### Environment Variables (in Makefile)

- `APP_NAME`: Application name (fulcrum)
- `REGISTRY`: Docker registry URL
- `NAMESPACE`: Kubernetes namespace (fulcrum)
- `KUSTOMIZE_DIR`: Path to Kubernetes manifests (k8)

### Kubernetes Configuration

The deployment uses Kustomize manifests in the `k8/` directory:

- `namespace.yaml` - Kubernetes namespace
- `deployment.yaml` - Application deployment
- `service.yaml` - Service configuration
- `ingress.yaml` - Ingress with TLS
- `configmap.yaml` - Environment variables
- `hpa.yaml` - Horizontal Pod Autoscaler
- `kustomization.yaml` - Kustomize configuration

## Security Notes

- Registry authentication handled by doctl
- Image pull secrets automatically managed
- TLS certificates managed by cert-manager
- Multi-stage builds minimize attack surface

## Performance Features

- **Docker layer caching** for faster builds
- **Multi-architecture images** for optimal performance
- **Horizontal Pod Autoscaling** (2-10 replicas)
- **Resource limits** and requests defined
- **Health checks** for reliability

## Support

For issues with deployment:

1. Check `make k8s-status` for pod status
2. Review logs with `make k8s-logs`
3. Verify cluster connection with `make k8s-context`
4. Test production health with `make test-production`