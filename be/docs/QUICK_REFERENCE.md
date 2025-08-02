# DevChat - Quick Reference

## 🚀 Development Commands

### Database Management

```bash
# Start core databases only
npm run db:start

# Start with admin tools (pgAdmin + Mongo Express)
npm run db:start:admin

# Stop all services
npm run db:stop

# Check service status
npm run db:status

# View logs
npm run db:logs
npm run db:logs:postgres
npm run db:logs:mongodb
npm run db:logs:redis
```

### Application Development

```bash
# Development server
npm run start:dev

# Build application
npm run build

# Run tests
npm run test
npm run test:e2e

# Linting and formatting
npm run lint
npm run format
```

### Database Migrations

```bash
# Generate migration after entity changes
npm run migration:generate -- MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🔗 Quick Access URLs

### Development Environment

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:8080
  - Email: `admin@admin.com`
  - Password: `admin`
  - **Auto-configured server**: "DevChat PostgreSQL"
- **Mongo Express**: http://localhost:8081
  - Username: `admin`
  - Password: `password`

## 📊 Database Connections

### PostgreSQL

```
Host: localhost
Port: 5432
Database: dev_chat
Username: postgres
Password: password
URL: postgresql://postgres:password@localhost:5432/dev_chat
```

### MongoDB

```
Host: localhost
Port: 27017
Database: dev_chat
Username: admin
Password: password
URL: mongodb://admin:password@localhost:27017/dev_chat
```

### Redis

```
Host: localhost
Port: 6379
Password: redispassword
URL: redis://localhost:6379
```

## 🛠️ pgAdmin Features

### Automatic Configuration

- ✅ Server "DevChat PostgreSQL" auto-imported
- ✅ Passwordless connection via pgpass file
- ✅ Read-only user (`pgadmin_readonly`) available
- ✅ Configuration persists across container restarts

### Configuration Files

```
docker/pgadmin/
├── servers.json    # Server definitions
└── pgpass          # Authentication credentials
```

### Manual Connection (if needed)

1. Right-click "Servers" → "Create" → "Server"
2. **General**: Name = "Manual PostgreSQL"
3. **Connection**:
   - Host: `postgres` (Docker) or `localhost` (local)
   - Port: `5432`
   - Database: `dev_chat`
   - Username: `postgres` or `pgadmin_readonly`
   - Password: `password`

## 🔍 Common Development Tasks

### Entity Development

1. Create/modify entity in `src/modules/[module]/entities/`
2. Generate migration: `npm run migration:generate -- FeatureName`
3. Run migration: `npm run migration:run`
4. Test in pgAdmin: Check tables and relationships

### API Development

1. Create controller in `src/modules/[module]/`
2. Implement service methods
3. Add DTOs for validation
4. Test via Swagger UI: http://localhost:3000/api/docs

### Real-time Features

1. Create gateway in `src/modules/[module]/`
2. Implement WebSocket events
3. Test via Socket.IO client or browser console

### Authentication Testing

1. Register user via API
2. Login to get JWT token
3. Use token in Authorization header: `Bearer <token>`
4. Test protected endpoints

## 📝 Environment Variables

### Required for Development

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=dev_chat

MONGODB_URI=mongodb://admin:password@localhost:27017/dev_chat

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3000
```

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check if containers are running
npm run db:status

# Check PostgreSQL logs
npm run db:logs:postgres

# Test PostgreSQL connection
docker-compose exec postgres psql -U postgres -d dev_chat -c "SELECT 1;"
```

### pgAdmin Issues

```bash
# Restart pgAdmin container
docker-compose restart pgadmin

# Check pgAdmin logs
docker-compose logs pgadmin

# Access pgAdmin directly
docker-compose exec pgadmin /bin/bash
```

### Application Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run build

# Run with debug logging
npm run start:debug
```

### Port Conflicts

```bash
# Check what's using ports
netstat -an | findstr "3000\|5432\|27017\|6379\|5050\|8081"

# Kill processes on specific ports (Windows)
taskkill /F /PID <process_id>
```

## 📚 Documentation Links

- [Developer Guide](./DEVELOPER_GUIDE.md) - Comprehensive development documentation
- [Database Setup](./DATABASE_SETUP.md) - Detailed database configuration
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Architecture Guide](./ARCHITECTURE_GUIDE.md) - System design and patterns
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines
