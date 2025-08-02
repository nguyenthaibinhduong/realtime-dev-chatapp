#!/bin/bash

# Database management script for dev-chat application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to start databases
start_databases() {
    print_header "Starting Database Services"
    check_docker
    
    print_status "Starting PostgreSQL, MongoDB, and Redis..."
    docker-compose up -d postgres mongodb redis
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if docker-compose ps | grep -q "healthy"; then
        print_status "All database services are running and healthy!"
    else
        print_warning "Some services may still be starting up. Check status with: npm run db:status"
    fi
    
    print_status "Database URLs:"
    echo "  PostgreSQL: postgresql://postgres:password@localhost:5432/dev_chat"
    echo "  MongoDB: mongodb://admin:password@localhost:27017/dev_chat"
    echo "  Redis: redis://localhost:6379 (password: redispassword)"
}

# Function to start databases with admin tools
start_with_admin() {
    print_header "Starting Database Services with Admin Tools"
    check_docker
    
    print_status "Starting all services including admin tools..."
    docker-compose up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 15
    
    print_status "All services started! Access admin tools at:"
    echo "  pgAdmin: http://localhost:8080 (admin@devchat.local / password)"
    echo "  Mongo Express: http://localhost:8081 (admin / password)"
}

# Function to stop databases
stop_databases() {
    print_header "Stopping Database Services"
    check_docker
    
    print_status "Stopping all services..."
    docker-compose down
    
    print_status "All services stopped!"
}

# Function to restart databases
restart_databases() {
    print_header "Restarting Database Services"
    stop_databases
    sleep 2
    start_databases
}

# Function to show status
show_status() {
    print_header "Database Services Status"
    check_docker
    
    echo "Service Status:"
    docker-compose ps
    
    echo -e "\nContainer Health:"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}"
}

# Function to show logs
show_logs() {
    print_header "Database Services Logs"
    check_docker
    
    if [ -n "$1" ]; then
        print_status "Showing logs for $1..."
        docker-compose logs -f "$1"
    else
        print_status "Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Function to clean up (remove containers and volumes)
cleanup() {
    print_header "Cleaning Up Database Services"
    check_docker
    
    print_warning "This will remove all containers and volumes. All data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing containers and volumes..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to backup databases
backup() {
    print_header "Backing Up Databases"
    check_docker
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    print_status "Creating backup directory: $BACKUP_DIR"
    
    # Backup PostgreSQL
    print_status "Backing up PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U postgres dev_chat > "$BACKUP_DIR/postgres_backup.sql"
    
    # Backup MongoDB
    print_status "Backing up MongoDB..."
    docker-compose exec -T mongodb mongodump --host localhost --port 27017 --db dev_chat --out /tmp/backup
    docker-compose exec -T mongodb tar -czf /tmp/mongodb_backup.tar.gz -C /tmp/backup .
    docker cp $(docker-compose ps -q mongodb):/tmp/mongodb_backup.tar.gz "$BACKUP_DIR/"
    
    print_status "Backup completed! Files saved to: $BACKUP_DIR"
}

# Function to show help
show_help() {
    print_header "Database Management Script Help"
    echo "Usage: npm run db:<command>"
    echo ""
    echo "Available commands:"
    echo "  start       - Start database services (PostgreSQL, MongoDB, Redis)"
    echo "  start:admin - Start database services with admin tools"
    echo "  stop        - Stop all database services"
    echo "  restart     - Restart database services"
    echo "  status      - Show status of all services"
    echo "  logs [svc]  - Show logs for all services or specific service"
    echo "  backup      - Create backup of databases"
    echo "  cleanup     - Remove all containers and volumes (DESTRUCTIVE)"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  npm run db:start"
    echo "  npm run db:logs postgres"
    echo "  npm run db:backup"
}

# Main script logic
case "$1" in
    "start")
        start_databases
        ;;
    "start:admin")
        start_with_admin
        ;;
    "stop")
        stop_databases
        ;;
    "restart")
        restart_databases
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "backup")
        backup
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
