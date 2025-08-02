# Developer Guide for DevChat Application

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [API Development](#api-development)
5. [Testing Guide](#testing-guide)
6. [WebSocket Implementation](#websocket-implementation)
7. [Security Implementation](#security-implementation)
8. [Database Management](#database-management)
9. [Code Style & Standards](#code-style--standards)
10. [Troubleshooting](#troubleshooting)
11. [Deployment Guide](#deployment-guide)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+
- **Docker** & **Docker Compose**
- **Git**
- **VS Code** (recommended)

### Initial Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd dev-chat
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configurations

# 3. Start databases
npm run db:start

# 4. Run database migrations
npm run migration:run

# 5. Start development server
npm run start:dev
```

### Verify Setup

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:8080 (if using db:start:admin) - Pre-configured with "DevChat PostgreSQL" server
- **Mongo Express**: http://localhost:8081 (if using db:start:admin)

---

## 🏗️ Project Architecture

### Folder Structure

```
src/
├── common/                 # Cross-cutting concerns
│   ├── decorators/        # Custom decorators (@GetUser, @Roles, @Public)
│   ├── guards/            # Authentication & authorization guards
│   ├── filters/           # Exception filters
│   ├── interceptors/      # Request/response interceptors
│   └── dto/               # Common DTOs (pagination, etc.)
├── config/                # Configuration management
│   ├── database/          # Database configurations
│   ├── app.config.ts      # App configuration factory
│   └── security.config.ts # Security settings
├── modules/               # Feature modules (Domain layer)
│   ├── auth/              # Authentication & Authorization
│   ├── users/             # User management
│   ├── channels/          # Channel management
│   ├── messages/          # Message handling
│   ├── search/            # Advanced search
│   └── github-integration/ # GitHub webhooks
├── shared/                # Shared modules (JWT, etc.)
├── app.module.ts          # Root application module
└── main.ts                # Application bootstrap
```

### Design Patterns Used

1. **Repository Pattern** - Data access through TypeORM/Mongoose
2. **Service Layer Pattern** - Business logic separation
3. **Dependency Injection** - NestJS DI container
4. **Strategy Pattern** - Authentication strategies
5. **Decorator Pattern** - Custom decorators
6. **Observer Pattern** - Event-driven Socket.IO
7. **Factory Pattern** - Configuration factories
8. **Guard Pattern** - Route protection
9. **Interceptor Pattern** - Cross-cutting concerns
10. **Filter Pattern** - Exception handling

### Module Dependencies

```
AppModule
├── ConfigModule (Global)
├── DatabaseModule (PostgreSQL)
├── MongooseModule (MongoDB)
├── SharedModule (Global)
├── CommonModule (Global)
├── AuthModule
│   └── UsersModule
├── UsersModule
├── ChannelsModule
├── MessagesModule
├── SearchModule
└── GitHubIntegrationModule
```

---

## 🔄 Development Workflow

### 1. Feature Development Process

```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Start databases if not running
npm run db:start

# 3. Start development server
npm run start:dev

# 4. Make changes and test
npm run test
npm run test:e2e

# 5. Check code quality
npm run lint
npm run format

# 6. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature-name
```

### 2. Creating a New Module

```bash
# Generate module using NestJS CLI
npx nest generate module modules/new-feature
npx nest generate service modules/new-feature
npx nest generate controller modules/new-feature

# Or use the complete generator
npx nest generate resource modules/new-feature
```

### 3. Module Structure Template

```typescript
// new-feature.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity]),
    // Other module imports
  ],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [NewFeatureService],
})
export class NewFeatureModule {}
```

### 4. Database Changes

```bash
# Generate migration after entity changes
npm run migration:generate -- CreateNewFeatureTable

# Run migrations
npm run migration:run

# Revert if needed
npm run migration:revert
```

### 5. Database Administration

#### pgAdmin (PostgreSQL)

pgAdmin is pre-configured with automatic server connection:

```bash
# Start with admin tools
npm run db:start:admin

# Access pgAdmin
# URL: http://localhost:8080
# Email: admin@admin.com
# Password: admin
```

**Features**:

- **Automatic Connection**: "DevChat PostgreSQL" server appears automatically
- **No Password Required**: Uses pgpass file for seamless authentication
- **Read-Only Access**: `pgadmin_readonly` user for safe data viewing
- **Query Tool**: Execute SQL queries and view execution plans
- **Schema Browser**: Explore database structure and relationships

#### Mongo Express (MongoDB)

```bash
# Access Mongo Express
# URL: http://localhost:8081
# Username: admin
# Password: password
```

**Features**:

- **Collection Management**: View and edit documents
- **Query Interface**: Execute MongoDB queries
- **Database Statistics**: Monitor collection sizes and indexes

---

## 🌐 API Development

### 1. Controller Structure

```typescript
@ApiTags('Feature Name')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('api-endpoint')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @ApiOperation({ summary: 'Action description' })
  @ApiResponse({ status: 200, description: 'Success', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles(UserRole.USER)
  @Get()
  async findAll(@Query() query: QueryDto): Promise<ResponseDto[]> {
    return this.featureService.findAll(query);
  }
}
```

### 2. Service Pattern

```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: QueryDto): Promise<Entity[]> {
    // Business logic here
    return this.repository.find(query);
  }
}
```

### 3. DTO Validation

```typescript
export class CreateDto {
  @ApiProperty({ description: 'Field description' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Optional field' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
```

### 4. Error Handling

```typescript
// In service
if (!entity) {
  throw new NotFoundException('Entity not found');
}

if (existingEntity) {
  throw new ConflictException('Entity already exists');
}

// Custom exceptions
export class CustomBusinessException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
```

### 5. Pagination Implementation

```typescript
// Query DTO
export class FindAllDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

// Service method
async findAll(query: FindAllDto) {
  const { page, limit, skip, search } = query;

  const queryBuilder = this.repository.createQueryBuilder('entity');

  if (search) {
    queryBuilder.where('entity.name ILIKE :search', { search: `%${search}%` });
  }

  const [items, total] = await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

---

## 🧪 Testing Guide

### 1. Unit Testing

```typescript
// feature.service.spec.ts
describe('FeatureService', () => {
  let service: FeatureService;
  let repository: Repository<Entity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    repository = module.get<Repository<Entity>>(getRepositoryToken(Entity));
  });

  describe('findAll', () => {
    it('should return array of entities', async () => {
      const entities = [{ id: '1', name: 'Test' }];
      jest.spyOn(repository, 'find').mockResolvedValue(entities);

      const result = await service.findAll({});

      expect(result).toEqual(entities);
      expect(repository.find).toHaveBeenCalled();
    });
  });
});
```

### 2. Integration Testing

```typescript
// feature.controller.spec.ts
describe('FeatureController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginResponse.body.access_token;
  });

  it('/feature (GET)', () => {
    return request(app.getHttpServer())
      .get('/feature')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });
});
```

### 3. Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific test file
npm run test -- feature.service.spec.ts
```

---

## 🔌 WebSocket Implementation

### 1. Gateway Structure

```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authService.validateSocketConnection(client);
      client.data.user = user;
      client.join(`user:${user.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup logic
  }

  @SubscribeMessage('join_channel')
  async handleJoinChannel(client: Socket, channelId: string) {
    const user = client.data.user;
    // Validate user can join channel
    client.join(`channel:${channelId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: SendMessageDto) {
    const user = client.data.user;
    const message = await this.messageService.create(payload, user);

    // Emit to channel
    this.server.to(`channel:${payload.channelId}`).emit('new_message', message);
  }
}
```

### 2. Socket Authentication

```typescript
// In auth service
async validateSocketConnection(client: Socket): Promise<User> {
  const token = client.handshake.auth.token ||
                client.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedException('No token provided');
  }

  const payload = await this.jwtService.verifyAsync(token);
  const user = await this.usersService.findOne(payload.sub);

  if (!user || !user.isActive) {
    throw new UnauthorizedException('Invalid user');
  }

  return user;
}
```

### 3. Client Connection Example

```typescript
// Frontend connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('access_token'),
  },
});

// Join channel
socket.emit('join_channel', 'channel-id');

// Send message
socket.emit('send_message', {
  channelId: 'channel-id',
  content: 'Hello world',
});

// Listen for messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

---

## 🔐 Security Implementation

### 1. Authentication Flow

```typescript
// 1. Registration
POST /auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}

// 2. Login
POST /auth/login
{
  "email": "john@example.com",
  "password": "securePassword123"
}

// Response
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": { ... }
}

// 3. Protected requests
Authorization: Bearer <access_token>
```

### 2. Role-Based Access Control

```typescript
// Define roles
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

// Use in controllers
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}

// Check roles programmatically
if (user.role === UserRole.ADMIN) {
  // Admin logic
}
```

### 3. 2FA Implementation

```typescript
// Generate 2FA secret
POST /auth/2fa/generate
Authorization: Bearer <token>

// Response
{
  "secret": "base32-secret",
  "qrCode": "data:image/png;base64,..."
}

// Verify and enable 2FA
POST /auth/2fa/verify
{
  "token": "123456" // from authenticator app
}

// Login with 2FA
POST /auth/login/2fa
{
  "email": "user@example.com",
  "password": "password",
  "token": "123456"
}
```

### 4. Input Validation

```typescript
// Always validate inputs
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;
}
```

---

## 🗄️ Database Management

### 1. Entity Design

```typescript
@Entity('table_name')
@Index(['field1', 'field2'])
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  uniqueField: string;

  @Column({ type: 'text', nullable: true })
  optionalField?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.entities)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => RelatedEntity, (related) => related.entity)
  relatedEntities: RelatedEntity[];
}
```

### 2. Repository Usage

```typescript
// In service
constructor(
  @InjectRepository(Entity)
  private readonly repository: Repository<Entity>,
) {}

// Basic operations
async findAll(): Promise<Entity[]> {
  return this.repository.find({
    relations: ['user'],
    order: { createdAt: 'DESC' },
  });
}

// Query builder for complex queries
async findWithFilters(filters: FilterDto): Promise<Entity[]> {
  const query = this.repository.createQueryBuilder('entity')
    .leftJoinAndSelect('entity.user', 'user');

  if (filters.search) {
    query.where('entity.name ILIKE :search', {
      search: `%${filters.search}%`
    });
  }

  if (filters.userId) {
    query.andWhere('entity.userId = :userId', {
      userId: filters.userId
    });
  }

  return query.getMany();
}
```

### 3. MongoDB with Mongoose

```typescript
// Schema definition
@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, index: true })
  channelId: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Create text index for search
MessageSchema.index({ content: 'text' });
```

---

## 📋 Code Style & Standards

### 1. Naming Conventions

```typescript
// Files: kebab-case
user.service.ts
auth.controller.ts
jwt-auth.guard.ts

// Classes: PascalCase
export class UserService {}
export class AuthController {}

// Variables/Methods: camelCase
const userName = 'john';
async getUserById(id: string) {}

// Constants: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;

// Interfaces: PascalCase with 'I' prefix (optional)
export interface IUserRepository {}
```

### 2. Code Organization

```typescript
// Import order
import { Module } from '@nestjs/common'; // Framework imports
import { TypeOrmModule } from '@nestjs/typeorm'; // Third-party imports

import { UserService } from './user.service'; // Local imports
import { User } from './entities/user.entity';

// Class order
export class UserController {
  // 1. Properties
  private readonly logger = new Logger(UserController.name);

  // 2. Constructor
  constructor(private readonly userService: UserService) {}

  // 3. Public methods (alphabetical)
  async create() {}
  async findAll() {}
  async findOne() {}
  async update() {}

  // 4. Private methods
  private validateInput() {}
}
```

### 3. Documentation Standards

````typescript
/**
 * Service responsible for user management operations
 *
 * @class UserService
 * @since 1.0.0
 */
@Injectable()
export class UserService {
  /**
   * Creates a new user in the system
   *
   * @param createUserDto - User creation data
   * @returns Promise<User> - Created user entity
   * @throws ConflictException - When user already exists
   *
   * @example
   * ```typescript
   * const user = await userService.create({
   *   username: 'john',
   *   email: 'john@example.com',
   *   password: 'password123'
   * });
   * ```
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Implementation
  }
}
````

### 4. Error Handling Best Practices

```typescript
// Service layer - throw meaningful errors
async findUserById(id: string): Promise<User> {
  try {
    const user = await this.repository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error; // Re-throw known errors
    }

    this.logger.error(`Failed to find user ${id}`, error.stack);
    throw new InternalServerErrorException('Failed to retrieve user');
  }
}

// Controller layer - let filters handle errors
@Get(':id')
async findOne(@Param('id') id: string): Promise<User> {
  return this.userService.findUserById(id); // Don't catch here
}
```

---

## 🔧 Troubleshooting

### 1. Common Issues

#### Database Connection Issues

```bash
# Check if databases are running
npm run db:status

# Restart databases
npm run db:restart

# Check logs
npm run db:logs

# Reset databases (DESTRUCTIVE)
npm run db:clean && npm run db:start
```

#### Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000
lsof -ti:3000  # macOS/Linux

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # macOS/Linux
```

#### TypeORM Entity Issues

```bash
# Generate and run migration
npm run migration:generate -- FixEntityIssue
npm run migration:run

# Check entity synchronization
# Set synchronize: true in development only
```

### 2. Debugging

#### Application Debugging

```bash
# Start with debug mode
npm run start:debug

# Debug tests
npm run test:debug

# Debug specific file
node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand specific-test.spec.ts
```

#### Database Debugging

```bash
# Enable query logging
# In database config: logging: true

# Check database connections
docker-compose exec postgres psql -U postgres -d dev_chat -c "SELECT * FROM pg_stat_activity;"

# MongoDB debugging
docker-compose exec mongodb mongosh --eval "db.adminCommand('listConnections')"
```

### 3. Performance Issues

#### Database Performance

```typescript
// Add indexes for frequently queried fields
@Index(['userId', 'createdAt'])
@Index(['status'])

// Use query builder for complex queries
const users = await this.repository
  .createQueryBuilder('user')
  .select(['user.id', 'user.username']) // Select only needed fields
  .where('user.isActive = :active', { active: true })
  .orderBy('user.createdAt', 'DESC')
  .limit(10)
  .getMany();

// Use pagination
const [users, total] = await this.repository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});
```

#### Memory Issues

```typescript
// Use streaming for large datasets
async *getAllUsers(): AsyncGenerator<User> {
  const stream = await this.repository
    .createQueryBuilder('user')
    .stream();

  for await (const user of stream) {
    yield user;
  }
}

// Cleanup resources
@OnModuleDestroy()
async onModuleDestroy() {
  await this.connectionPool.close();
}
```

---

## 🚀 Deployment Guide

### 1. Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
PORT=3000

# Database URLs (use connection pooling)
POSTGRES_HOST=prod-postgres-host
MONGODB_URI=mongodb://prod-mongo-cluster

# Secrets (use secure values)
JWT_SECRET=super-secure-production-secret
JWT_REFRESH_SECRET=super-secure-refresh-secret

# Security
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://yourdomain.com
```

### 2. Docker Production Build

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 3. Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Logging aggregation set up
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### 4. Health Checks

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Public()
  async check(): Promise<HealthStatus> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: this.configService.get('NODE_ENV'),
    };
  }

  @Get('detailed')
  @Public()
  async detailed(): Promise<DetailedHealthStatus> {
    // Check database connections, external services, etc.
    return {
      status: 'ok',
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        external_apis: await this.checkExternalAPIs(),
      },
    };
  }
}
```

---

## 📚 Additional Resources

### Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/)

### Tools & Extensions

- **VS Code Extensions:**
  - NestJS Files
  - TypeScript Importer
  - Jest Runner
  - Thunder Client (API testing)
  - Docker

### Useful Commands Reference

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Debug mode
npm run build              # Build for production

# Database
npm run db:start           # Start databases
npm run db:status          # Check status
npm run migration:run      # Run migrations
npm run migration:generate # Generate migration

# Testing
npm run test               # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report

# Code Quality
npm run lint               # Lint code
npm run format             # Format code

# Production
npm run start:prod         # Start production build
```

---

**Happy Coding! 🎉**

For questions or issues, please check the troubleshooting section or create an issue in the repository.
