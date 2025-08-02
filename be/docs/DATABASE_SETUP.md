# Database Setup Guide

## Quick Start

### 1. Start Database Services

```bash
# Start core databases (PostgreSQL, MongoDB, Redis)
npm run db:start

# OR start with admin tools (pgAdmin, Mongo Express)
npm run db:start:admin
```

### 2. Verify Services

```bash
# Check status of all services
npm run db:status

# View logs
npm run db:logs
```

### 3. Access Admin Tools (if started with admin)

- **pgAdmin**: http://localhost:8080
  - Email: admin@admin.com
  - Password: admin
  - **Automatic PostgreSQL Connection**: "DevChat PostgreSQL" server pre-configured
- **Mongo Express**: http://localhost:8081
  - Username: admin
  - Password: password

## Available Commands

### Service Management

```bash
npm run db:start         # Start core databases
npm run db:start:admin   # Start with admin tools
npm run db:stop          # Stop all services
npm run db:restart       # Restart all services
npm run db:status        # Check service status
```

### Logs and Monitoring

```bash
npm run db:logs          # View all logs
npm run db:logs:postgres # View PostgreSQL logs only
npm run db:logs:mongodb  # View MongoDB logs only
npm run db:logs:redis    # View Redis logs only
```

### Backup and Maintenance

```bash
npm run db:backup        # Create database backups
npm run db:clean         # Remove all containers and volumes (DESTRUCTIVE)
```

## Connection Details

### PostgreSQL

- **Host**: localhost
- **Port**: 5432
- **Database**: dev_chat
- **Username**: postgres
- **Password**: password
- **URL**: `postgresql://postgres:password@localhost:5432/dev_chat`

### MongoDB

- **Host**: localhost
- **Port**: 27017
- **Database**: dev_chat
- **Username**: admin
- **Password**: password
- **URL**: `mongodb://admin:password@localhost:27017/dev_chat`

### Redis

- **Host**: localhost
- **Port**: 6379
- **Password**: redispassword
- **URL**: `redis://localhost:6379`

## Environment Variables

Update your `.env` file with these database configurations:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=dev_chat

# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/dev_chat

# Redis (if needed)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
```

## Troubleshooting

### Services Won't Start

1. Check if Docker is running: `docker info`
2. Check port conflicts: `netstat -an | findstr "5432\|27017\|6379"`
3. View detailed logs: `npm run db:logs`

### Database Connection Issues

1. Verify services are healthy: `npm run db:status`
2. Check environment variables in `.env`
3. Test connections:

   ```bash
   # Test PostgreSQL
   docker-compose exec postgres psql -U postgres -d dev_chat -c "SELECT 1;"

   # Test MongoDB
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

### Data Persistence

- Database data is stored in Docker volumes
- Volumes persist between container restarts
- Use `npm run db:clean` to remove all data (DESTRUCTIVE)

### Performance Optimization

- PostgreSQL and MongoDB containers include performance optimizations
- Indexes are automatically created via initialization scripts
- Monitor resource usage: `docker stats`

## pgAdmin Configuration

### Automatic Server Connection

pgAdmin is pre-configured with automatic PostgreSQL server connection:

1. **Start services**: `npm run db:start:admin`
2. **Access pgAdmin**: http://localhost:8080
3. **Login**: admin@admin.com / admin
4. **Server Available**: "DevChat PostgreSQL" appears automatically
5. **Connect**: Click the server (no password required)

### Configuration Details

The automatic configuration includes:

- **Server Name**: DevChat PostgreSQL
- **Host**: postgres (Docker container)
- **Port**: 5432
- **Database**: dev_chat
- **Username**: postgres
- **Connection**: Passwordless via pgpass file

### Additional Features

- **Read-only User**: `pgadmin_readonly` available for safe data viewing
- **Security**: Credentials managed via Docker secrets
- **Persistence**: Server configuration persists across container restarts

### Manual Server Addition (if needed)

If you need to add additional servers:

1. Right-click "Servers" → "Create" → "Server"
2. **General Tab**: Name your server
3. **Connection Tab**:
   - Host: postgres (for Docker) or localhost (for local)
   - Port: 5432
   - Database: dev_chat
   - Username: postgres or pgadmin_readonly
   - Password: password (for postgres user)

## Backup and Recovery

### Creating Backups

```bash
# Create timestamped backup
npm run db:backup
```

Backups are stored in `./backups/YYYY-MM-DD_HH-MM-SS/`:

- `postgres_backup.sql` - PostgreSQL database dump
- `mongodb_backup.tar.gz` - MongoDB database archive
- `metadata.json` - Backup information

### Restoring from Backup

```bash
# Restore PostgreSQL
docker-compose exec -T postgres psql -U postgres -d dev_chat < ./backups/[timestamp]/postgres_backup.sql

# Restore MongoDB
docker cp ./backups/[timestamp]/mongodb_backup.tar.gz $(docker-compose ps -q mongodb):/tmp/
docker-compose exec mongodb tar -xzf /tmp/mongodb_backup.tar.gz -C /tmp/
docker-compose exec mongodb mongorestore --host localhost --port 27017 --db dev_chat /tmp/dev_chat
```

## Production Considerations

For production deployment:

1. Use separate `docker-compose.prod.yml`
2. Configure proper secrets and passwords
3. Set up SSL/TLS for database connections
4. Configure automated backups
5. Monitor database performance and logs
6. Set up proper network security

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```
