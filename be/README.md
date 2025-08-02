# DevChat - Developer Team Communication Platform

A modern, real-time chat application built with NestJS, designed specifically for developer teams with advanced features like GitHub integration, code syntax highlighting, and project management tools.

## 🚀 Features

- **Real-time Messaging** - Instant messaging with WebSocket support
- **Channel Management** - Public and private channels with role-based permissions
- **User Authentication** - JWT-based auth with 2FA support
- **File Sharing** - Upload and share files with team members
- **GitHub Integration** - Automatic notifications from your repositories
- **Advanced Search** - Full-text search across messages and files
- **Voice & Video Calls** - Integrated communication tools
- **Message Reactions** - Express yourself with emoji reactions
- **Thread Conversations** - Organize discussions with threaded replies
- **Mobile Support** - Progressive Web App with mobile optimization

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript, Node.js 22
- **Database**: PostgreSQL 16, MongoDB 7, Redis 7
- **Real-time**: Socket.IO, WebSockets
- **Authentication**: JWT, Passport, 2FA (TOTP)
- **Search**: MongoDB Full-Text Search (Elasticsearch ready)
- **File Storage**: Local Storage (AWS S3 ready)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier
- **Security**: Helmet.js, bcrypt, rate limiting

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators, filters
├── config/           # Configuration management (DB, app, security)
├── modules/          # Feature modules (domain-driven design)
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── channels/     # Channel operations
│   ├── messages/     # Message handling
│   ├── search/       # Search functionality
│   └── github-integration/ # GitHub webhooks
├── shared/           # Shared modules (JWT, database)
└── main.ts           # Application entry point
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 22+
- **Docker** & **Docker Compose**
- **Git**

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/dev-chat.git
   cd dev-chat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the databases**

   ```bash
   npm run db:start
   ```

5. **Run database migrations**

   ```bash
   npm run migration:run
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

The application will be available at:

- **API**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode
npm run build              # Build for production

# Database
npm run db:start           # Start all databases
npm run db:stop            # Stop all databases
npm run db:clean           # Clean all data (DESTRUCTIVE)
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations

# Testing
npm run test               # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Test coverage

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

## � Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Complete development guide with architecture, testing, and best practices
- **[API Reference](docs/API_REFERENCE.md)** - Detailed API documentation with examples
- **[Database Setup](docs/DATABASE_SETUP.md)** - Database configuration and management
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Guidelines for contributing to the project
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Architecture Guide](docs/ARCHITECTURE_GUIDE.md)** - System architecture and design patterns

DevChat follows Domain-Driven Design (DDD) principles and implements multiple enterprise patterns:

- **Repository Pattern** - Data access abstraction
- **Service Layer Pattern** - Business logic separation
- **CQRS** - Command Query Responsibility Segregation ready
- **Event-Driven Architecture** - Domain events for loose coupling
- **Dependency Injection** - NestJS DI container
- **Strategy Pattern** - Authentication strategies
- **Decorator Pattern** - Custom decorators and guards

### Security Architecture

- **JWT Authentication** with refresh tokens
- **Two-Factor Authentication** (TOTP) with QR codes
- **Role-Based Access Control** (RBAC)
- **Rate Limiting** per endpoint
- **Input Validation** with class-validator
- **Password Hashing** with bcrypt (configurable rounds)
- **Security Headers** with Helmet.js
- **CORS Configuration** for cross-origin requests

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Specific test file
npm test -- auth.service.spec.ts
```

**Testing Strategy:**

- **Unit Tests** - Services, controllers, utilities
- **Integration Tests** - Database operations, API endpoints
- **E2E Tests** - Complete user workflows
- **Coverage Goals** - 80%+ coverage for all code paths

## 🚀 API Reference

### Authentication Endpoints

```bash
POST /auth/register        # User registration
POST /auth/login          # User login
POST /auth/refresh        # Refresh access token
POST /auth/logout         # User logout
POST /auth/2fa/generate   # Generate 2FA secret
POST /auth/2fa/verify     # Verify and enable 2FA
```

### User Management

```bash
GET  /users/profile       # Get current user profile
PATCH /users/profile      # Update user profile
PATCH /users/password     # Change password
GET  /users               # List users (admin)
GET  /users/:id           # Get user by ID
```

### Channel Operations

```bash
GET  /channels            # List accessible channels
POST /channels            # Create new channel
GET  /channels/:id        # Get channel details
PATCH /channels/:id       # Update channel
DELETE /channels/:id      # Delete channel
POST /channels/:id/join   # Join channel
POST /channels/:id/leave  # Leave channel
```

### Message Handling

```bash
GET  /messages/channel/:id # Get channel messages
POST /messages            # Send message
PATCH /messages/:id       # Edit message
DELETE /messages/:id      # Delete message
POST /messages/:id/reactions # Add reaction
POST /messages/upload     # Upload file
```

### WebSocket Events

```javascript
// Client emits
socket.emit('join_channel', { channelId });
socket.emit('send_message', { channelId, content, type });
socket.emit('typing_start', { channelId });

// Server emits
socket.on('new_message', (message) => {});
socket.on('user_joined', (data) => {});
socket.on('user_typing', (data) => {});
```

## 🐳 Deployment

### Docker Deployment

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration

Required environment variables for production:

```bash
NODE_ENV=production
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=secure-password
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_HOST=your-redis-host
MONGODB_URI=mongodb://your-mongo-uri
```

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed production setup.

## 🔐 Security Features

- **Authentication**: JWT with refresh tokens, 2FA support
- **Authorization**: Role-based permissions, channel-level access
- **Input Validation**: DTO validation with class-validator
- **Rate Limiting**: Configurable per endpoint
- **Password Security**: bcrypt hashing with salt rounds
- **Security Headers**: Comprehensive HTTP security headers
- **Session Management**: Redis-backed session storage
- **CORS**: Configurable cross-origin resource sharing

## ⚡ Performance

- **Database Optimization**: Connection pooling, optimized queries, indexes
- **Caching Strategy**: Multi-level caching with Redis and in-memory
- **Real-time Optimization**: Efficient WebSocket connection management
- **File Upload**: Streaming uploads with size limits
- **Pagination**: Cursor-based pagination for large datasets
- **Query Optimization**: Repository pattern with QueryBuilder

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for:

- Development setup and workflow
- Coding standards and conventions
- Testing requirements
- Pull request process
- Code review guidelines

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🗺️ Roadmap

### Phase 1 - Core Features ✅

- [x] User authentication and authorization
- [x] Real-time messaging with WebSocket
- [x] Channel management
- [x] File upload and sharing
- [x] Message reactions and threading

### Phase 2 - Advanced Features 🚧

- [ ] Voice and video calling integration
- [ ] Advanced search with Elasticsearch
- [ ] Mobile application (React Native)
- [ ] Screen sharing capabilities
- [ ] Message translation

### Phase 3 - Enterprise Features 📋

- [ ] Advanced moderation tools
- [ ] Custom emoji and reactions
- [ ] Analytics and reporting
- [ ] Single Sign-On (SSO) integration
- [ ] Audit logging and compliance

### Phase 4 - AI & Automation 🤖

- [ ] AI-powered code suggestions
- [ ] Smart notifications and summaries
- [ ] Automated moderation
- [ ] Chatbot integration
- [ ] Voice transcription

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you need help or have questions:

1. **Documentation** - Check our comprehensive [docs](docs/)
2. **Issues** - Search [existing issues](https://github.com/yourusername/dev-chat/issues)
3. **Discussions** - Join [GitHub Discussions](https://github.com/yourusername/dev-chat/discussions)
4. **New Issue** - [Create an issue](https://github.com/yourusername/dev-chat/issues/new) for bugs or feature requests

## 👥 Contributors

Thanks to all contributors who have helped make DevChat better! See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full list.

## 🙏 Acknowledgments

- **NestJS** - For the amazing framework
- **Socket.IO** - For real-time communication
- **TypeORM** - For elegant database operations
- **All Contributors** - For their valuable contributions

---

**Built with ❤️ for the developer community**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/dev-chat?style=social)](https://github.com/yourusername/dev-chat/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/dev-chat?style=social)](https://github.com/yourusername/dev-chat/network)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/dev-chat)](https://github.com/yourusername/dev-chat/issues)
[![GitHub license](https://img.shields.io/github/license/yourusername/dev-chat)](https://github.com/yourusername/dev-chat/blob/main/LICENSE)

## 🔧 Setup Instructions

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- MongoDB 7+
- npm or yarn

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd dev-chat
   npm install
   ```

2. **Start development databases:**

   ```bash
   docker-compose up -d
   ```

3. **Environment configuration:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**

   ```bash
   npm run migration:run
   ```

5. **Start development server:**
   ```bash
   npm run start:dev
   ```

### Available Scripts

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode

# Building
npm run build              # Build for production
npm run start:prod         # Start production build

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration
```

## 📊 Database Schema

### PostgreSQL (Structured Data)

- **users** - User accounts and profiles
- **channels** - Chat channels
- **channel_members** - Channel membership relationships

### MongoDB (Flexible Data)

- **messages** - Chat messages with full-text search
- **search_index** - Optimized search data

## 🔐 Security Features

1. **Authentication & Authorization:**
   - JWT with refresh tokens
   - Two-Factor Authentication (TOTP)
   - Role-based access control (RBAC)
   - Password hashing with bcrypt

2. **Security Headers:**
   - Helmet.js for security headers
   - CORS configuration
   - Content Security Policy (CSP)

3. **Input Validation:**
   - class-validator for DTO validation
   - SQL injection prevention
   - XSS protection

4. **Rate Limiting:**
   - Configurable rate limiting
   - DDoS protection

## 🌐 API Documentation

Once the server is running, visit:

- **Swagger UI:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api/docs-json

## 🔗 Real-time Features

- **WebSocket Gateway** for real-time messaging
- **Event-driven architecture** for scalability
- **Room-based communication** for channels
- **Typing indicators** and **presence status**

## 🧪 Testing Strategy

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Module interaction testing
3. **E2E Tests** - Full application flow testing
4. **Test Coverage** - Minimum 80% coverage target

## 📈 Performance Optimizations

1. **Database Indexing** - Optimized queries
2. **Connection Pooling** - Efficient database connections
3. **Caching Strategy** - Redis for session management
4. **Pagination** - Memory-efficient data loading
5. **Lazy Loading** - On-demand module loading

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables
- [ ] Enable SSL/TLS
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring (Health checks)
- [ ] Configure logging aggregation
- [ ] Database backups
- [ ] Security headers verification

### Docker Production

```bash
# Build production image
docker build -t dev-chat:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using NestJS and modern architectural patterns**
