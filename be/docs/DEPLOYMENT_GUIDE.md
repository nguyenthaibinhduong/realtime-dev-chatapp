# DevChat - Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Database Setup](#database-setup)
6. [Security Configuration](#security-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Scaling Considerations](#scaling-considerations)
10. [Troubleshooting](#troubleshooting)

---

## 🌐 Overview

This guide covers deploying DevChat to production environments, including cloud platforms, containerization, and best practices for security and scalability.

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Application   │    │    Database     │
│    (Nginx)      │◄──►│    (NestJS)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Caching)     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │    MongoDB      │
                       │   (Messages)    │
                       └─────────────────┘
```

### Deployment Options

1. **Docker Compose** - Local/Development
2. **Cloud Platforms** - AWS, Azure, GCP
3. **Container Orchestration** - Kubernetes, Docker Swarm
4. **Platform as a Service** - Heroku, Railway, Render

---

## 🔧 Environment Setup

### Production Environment Variables

Create a comprehensive `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Domain Configuration
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# Database Configuration
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=super-secure-password
POSTGRES_DATABASE=dev_chat_prod
POSTGRES_SSL=true
POSTGRES_CONNECTION_POOL_SIZE=20
POSTGRES_CONNECTION_TIMEOUT=60000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dev_chat_prod
MONGODB_CONNECTION_POOL_SIZE=10

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-secure-password
REDIS_DB=0
REDIS_CONNECTION_POOL_SIZE=10

# JWT Configuration
JWT_SECRET=super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super-secure-refresh-secret-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://your-domain.com,https://app.your-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx
UPLOAD_DESTINATION=uploads
AWS_S3_BUCKET=your-s3-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Email Configuration (for notifications)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@your-domain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/devchat/app.log

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000

# WebSocket Configuration
WEBSOCKET_CORS_ORIGINS=https://your-domain.com
WEBSOCKET_MAX_CONNECTIONS=1000
```

### Environment Validation

Create `src/config/env.validation.ts`:

```typescript
import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value))
  PORT: number;

  @IsString()
  POSTGRES_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  POSTGRES_PORT: number;

  @IsString()
  POSTGRES_USERNAME: string;

  @IsString()
  POSTGRES_PASSWORD: string;

  @IsString()
  POSTGRES_DATABASE: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  POSTGRES_SSL?: boolean;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  REDIS_PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;
}
```

---

## 🐳 Docker Deployment

### Multi-stage Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY .env.example ./

# Build application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S devchat -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=devchat:nodejs /app/dist ./dist
COPY --from=builder --chown=devchat:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=devchat:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /var/log/devchat && \
    chown devchat:nodejs /var/log/devchat

# Switch to non-root user
USER devchat

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Main Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: devchat-app
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
      - mongodb
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/var/log/devchat
    networks:
      - devchat-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  # Load Balancer
  nginx:
    image: nginx:alpine
    container_name: devchat-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
    depends_on:
      - app
    networks:
      - devchat-network

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: devchat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DATABASE}
      POSTGRES_USER: ${POSTGRES_USERNAME}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    ports:
      - '5432:5432'
    networks:
      - devchat-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USERNAME} -d ${POSTGRES_DATABASE}']
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: devchat-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    networks:
      - devchat-network
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB
  mongodb:
    image: mongo:7
    container_name: devchat-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/init:/docker-entrypoint-initdb.d
    ports:
      - '27017:27017'
    networks:
      - devchat-network
    healthcheck:
      test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  mongodb_data:

networks:
  devchat-network:
    driver: bridge
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream backend
    upstream devchat_backend {
        server app:3000;
        keepalive 32;
    }

    # HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com api.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main API server
    server {
        listen 443 ssl http2;
        server_name api.your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API endpoints
        location / {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://devchat_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://devchat_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads/ {
            alias /var/www/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://devchat_backend;
        }

        # Rate limit login endpoint
        location /auth/login {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://devchat_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Deploy Commands

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Backup volumes
docker run --rm -v devchat_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

---

## ☁️ Cloud Deployment

### AWS Deployment with ECS

#### Task Definition

```json
{
  "family": "devchat-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/devchat-task-role",
  "containerDefinitions": [
    {
      "name": "devchat-app",
      "image": "YOUR_ECR_REPO/devchat:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "POSTGRES_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:devchat-db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:devchat-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devchat",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### CloudFormation Template

```yaml
# infrastructure/cloudformation.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DevChat Application Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-devchat-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-devchat-igw'

  # Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24

  # RDS PostgreSQL
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for DevChat database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-devchat-db'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '16.1'
      AllocatedStorage: '20'
      StorageType: gp2
      DBName: devchat
      MasterUsername: postgres
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProduction, true, false]
      StorageEncrypted: true
      DeletionProtection: !If [IsProduction, true, false]

  # ElastiCache Redis
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for DevChat Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheClusterName: !Sub '${Environment}-devchat-redis'
      Engine: redis
      CacheNodeType: cache.t3.micro
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${Environment}-devchat-cluster'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-devchat-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: !Sub '${Environment}-devchat-service'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: !If [IsProduction, 2, 1]
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ApplicationSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          AssignPublicIp: DISABLED
      LoadBalancers:
        - ContainerName: devchat-app
          ContainerPort: 3000
          TargetGroupArn: !Ref ALBTargetGroup

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-devchat-alb-dns'
```

### Kubernetes Deployment

#### Namespace and ConfigMap

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: devchat
---
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: devchat-config
  namespace: devchat
data:
  NODE_ENV: 'production'
  PORT: '3000'
  API_PREFIX: 'api'
  POSTGRES_HOST: 'postgres-service'
  POSTGRES_PORT: '5432'
  REDIS_HOST: 'redis-service'
  REDIS_PORT: '6379'
```

#### Secrets

```yaml
# k8s/secrets.yml
apiVersion: v1
kind: Secret
metadata:
  name: devchat-secrets
  namespace: devchat
type: Opaque
data:
  POSTGRES_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>
  JWT_REFRESH_SECRET: <base64-encoded-refresh-secret>
```

#### Deployment

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devchat-app
  namespace: devchat
  labels:
    app: devchat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devchat
  template:
    metadata:
      labels:
        app: devchat
    spec:
      containers:
        - name: devchat
          image: your-registry/devchat:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: devchat-config
            - secretRef:
                name: devchat-secrets
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: devchat-service
  namespace: devchat
spec:
  selector:
    app: devchat
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: devchat-ingress
  namespace: devchat
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  tls:
    - hosts:
        - api.your-domain.com
      secretName: devchat-tls
  rules:
    - host: api.your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: devchat-service
                port:
                  number: 80
```

---

## 🗄️ Database Setup

### Production PostgreSQL Configuration

```sql
-- Create production database
CREATE DATABASE dev_chat_prod;
CREATE USER devchat_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dev_chat_prod TO devchat_user;

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Security settings
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Restart required for some settings
SELECT pg_reload_conf();
```

### MongoDB Production Setup

```javascript
// MongoDB production configuration
use dev_chat_prod;

// Create indexes for performance
db.messages.createIndex({ "channelId": 1, "createdAt": -1 });
db.messages.createIndex({ "authorId": 1 });
db.messages.createIndex({ "content": "text" });
db.messages.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Create user
db.createUser({
  user: "devchat_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "dev_chat_prod" }
  ]
});

// Enable authentication
// Add to mongod.conf:
// security:
//   authorization: enabled
```

### Redis Production Configuration

```bash
# redis.conf
bind 127.0.0.1
port 6379
requirepass secure_redis_password

# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# PostgreSQL backup
export PGPASSWORD="$POSTGRES_PASSWORD"
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE > backup-$(date +%Y%m%d-%H%M%S).sql

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out=mongodb-backup-$(date +%Y%m%d-%H%M%S)

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d-%H%M%S).sql s3://your-backup-bucket/postgres/
aws s3 sync mongodb-backup-$(date +%Y%m%d-%H%M%S) s3://your-backup-bucket/mongodb/

# Cleanup old backups (keep last 7 days)
find . -name "backup-*.sql" -mtime +7 -delete
find . -name "mongodb-backup-*" -mtime +7 -exec rm -rf {} \;
```

---

## �️ Database Administration

### Production Database Administration

For production environments, database administration tools should be carefully configured with proper security measures.

#### pgAdmin Configuration

**Development**: pgAdmin is pre-configured with automatic PostgreSQL connection:

- Uses Docker container with mounted configuration files
- Server definition automatically imported via `servers.json`
- Passwordless authentication through `pgpass` file

**Production Setup**:

```yaml
# docker-compose.prod.yml - pgAdmin for production
version: '3.8'
services:
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@yourcompany.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
      PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION: 'True'
      PGADMIN_CONFIG_LOGIN_BANNER: 'Production Database Administration'
      PGADMIN_CONFIG_CONSOLE_LOG_LEVEL: 40
    volumes:
      - pgadmin_data:/var/lib/pgadmin
      - ./docker/pgadmin/servers.prod.json:/pgadmin4/servers.json:ro
      - ./docker/pgadmin/pgpass.prod:/pgadmin4/pgpass:ro
    ports:
      - '127.0.0.1:8080:80' # Only localhost access
    networks:
      - database_network
    restart: unless-stopped

volumes:
  pgadmin_data:
```

**Production Security**:

```json
// docker/pgadmin/servers.prod.json
{
  "Servers": {
    "1": {
      "Name": "Production PostgreSQL",
      "Group": "Production",
      "Host": "postgres-prod.internal",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "pgadmin_readonly",
      "SSLMode": "require",
      "SSLCert": "/certs/client-cert.pem",
      "SSLKey": "/certs/client-key.pem",
      "SSLRootCert": "/certs/ca-cert.pem"
    }
  }
}
```

#### Database Access Control

**Read-Only Access**:

```sql
-- Create read-only user for monitoring/reporting
CREATE USER monitoring_user WITH PASSWORD 'secure_monitoring_password';
GRANT CONNECT ON DATABASE dev_chat_prod TO monitoring_user;
GRANT USAGE ON SCHEMA public TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring_user;
```

**Administrative Access**:

```sql
-- Limited admin user for maintenance
CREATE USER db_admin WITH PASSWORD 'secure_admin_password';
GRANT monitoring_user TO db_admin;
GRANT CREATE ON DATABASE dev_chat_prod TO db_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO db_admin;
```

#### MongoDB Administration

**Production Mongo Express** (if needed):

```yaml
services:
  mongo-express:
    image: mongo-express:latest
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGODB_USERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGODB_PASSWORD}
      ME_CONFIG_MONGODB_URL: ${MONGODB_URI}
      ME_CONFIG_BASICAUTH_USERNAME: ${MONGO_EXPRESS_USER}
      ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
      ME_CONFIG_SITE_BASEURL: /mongo-admin/
    ports:
      - '127.0.0.1:8081:8081'
    networks:
      - database_network
```

#### Security Best Practices

1. **Network Isolation**:
   - Use private networks for database communication
   - Restrict admin tool access to specific IPs/VPN
   - Enable SSL/TLS for all connections

2. **Authentication**:
   - Use strong passwords and rotate regularly
   - Implement role-based access control
   - Enable audit logging

3. **Monitoring**:
   - Monitor admin tool access logs
   - Set up alerts for suspicious activities
   - Regular security audits

---

## �🔒 Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificate with Let's Encrypt
certbot certonly --nginx -d api.your-domain.com -d your-domain.com

# Auto-renewal crontab
0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Headers

```typescript
// src/main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'ws:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(3000);
}
```

### Rate Limiting

```typescript
// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    return req.ips.length ? req.ips[0] : req.ip;
  }

  protected generateKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    return `${tracker}-${route}`;
  }
}
```

### Environment Security

```bash
# Use secrets management
# AWS Secrets Manager
aws secretsmanager create-secret --name "devchat/production/database" --secret-string '{"password":"secure_db_password"}'

# Azure Key Vault
az keyvault secret set --vault-name "devchat-vault" --name "database-password" --value "secure_db_password"

# Google Secret Manager
gcloud secrets create database-password --data-file=password.txt
```

---

## 📊 Monitoring & Logging

### Application Monitoring

```typescript
// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        this.logger.log(`${method} ${url} ${statusCode} - ${userAgent} ${ip} - ${duration}ms`);
      }),
    );
  }
}
```

### Structured Logging

```typescript
// src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
    defaultMeta: { service: 'devchat' },
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
      new transports.File({
        filename: '/var/log/devchat/error.log',
        level: 'error',
      }),
      new transports.File({
        filename: '/var/log/devchat/combined.log',
      }),
    ],
  });

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### Health Checks

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('detailed')
  @Public()
  async detailed() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}
```

### Prometheus Metrics

```typescript
// src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly activeConnections = new Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections',
  });

  constructor() {
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.activeConnections);
  }

  incrementHttpRequests(method: string, route: string, status: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
  }

  observeHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  getMetrics() {
    return register.metrics();
  }
}
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run typecheck

      - name: Run unit tests
        run: npm run test:cov
        env:
          POSTGRES_HOST: localhost
          POSTGRES_PORT: 5432
          POSTGRES_USERNAME: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DATABASE: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Run e2e tests
        run: npm run test:e2e
        env:
          POSTGRES_HOST: localhost
          POSTGRES_PORT: 5432
          POSTGRES_USERNAME: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DATABASE: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment commands here
          # Examples:
          # - Deploy to AWS ECS
          # - Deploy to Kubernetes
          # - Deploy to cloud provider
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}

echo "Deploying DevChat to $ENVIRONMENT with image tag $IMAGE_TAG"

# Update environment variables
kubectl create configmap devchat-config \
  --from-env-file=.env.$ENVIRONMENT \
  --dry-run=client -o yaml | kubectl apply -f -

# Update deployment with new image
kubectl set image deployment/devchat-app \
  devchat=ghcr.io/your-org/devchat:$IMAGE_TAG \
  --namespace=devchat

# Wait for rollout to complete
kubectl rollout status deployment/devchat-app --namespace=devchat

# Run database migrations
kubectl exec -it deployment/devchat-app --namespace=devchat -- npm run migration:run

echo "Deployment completed successfully!"
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# k8s/hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devchat-hpa
  namespace: devchat
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devchat-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Load Balancing

```typescript
// For WebSocket clustering
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Redis adapter for WebSocket clustering
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3000);
}
```

### Database Optimization

```sql
-- Read replicas configuration
-- PostgreSQL streaming replication
-- Add to postgresql.conf on primary:
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 8

-- Connection pooling with PgBouncer
-- pgbouncer.ini
[databases]
devchat = host=postgres-primary port=5432 dbname=devchat

[pgbouncer]
listen_port = 6432
pool_mode = session
max_client_conn = 1000
default_pool_size = 25
```

### Caching Strategy

```typescript
// Redis caching service
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Container Startup Issues

```bash
# Check container logs
docker logs devchat-app

# Check container resource usage
docker stats devchat-app

# Access container shell
docker exec -it devchat-app sh
```

#### 2. Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h $POSTGRES_HOST -U $POSTGRES_USERNAME -d $POSTGRES_DATABASE -c "SELECT version();"

# Check MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

#### 3. Memory Issues

```bash
# Monitor memory usage
docker stats --no-stream

# Check for memory leaks
node --inspect=0.0.0.0:9229 dist/main.js

# Heap dump analysis
kill -USR2 <node_pid>
```

#### 4. Performance Issues

```sql
-- PostgreSQL slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database locks
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### Emergency Procedures

#### Rollback Deployment

```bash
# Kubernetes rollback
kubectl rollout undo deployment/devchat-app --namespace=devchat

# Docker Compose rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale app=0
# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Recovery

```bash
# PostgreSQL point-in-time recovery
pg_basebackup -h backup-server -D /var/lib/postgresql/data -U postgres -W

# MongoDB restore
mongorestore --uri="$MONGODB_URI" /path/to/backup
```

### Monitoring Commands

```bash
# Application health
curl -f http://localhost:3000/health

# Resource usage
kubectl top pods --namespace=devchat

# Check logs
kubectl logs -f deployment/devchat-app --namespace=devchat

# Database performance
kubectl exec -it postgres-pod -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/clients-guide/)
- [NestJS Production Checklist](https://docs.nestjs.com/faq/serverless)

---

**Successfully deployed! 🎉**

Your DevChat application is now running in production. Monitor the health endpoints and logs to ensure everything is working correctly.
