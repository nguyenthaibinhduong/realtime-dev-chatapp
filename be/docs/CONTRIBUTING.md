# DevChat - Contributing Guide

## 🤝 Welcome Contributors!

Thank you for your interest in contributing to DevChat! This guide will help you understand our development process, coding standards, and how to submit quality contributions.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Git Workflow](#git-workflow)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Code Review Guidelines](#code-review-guidelines)
9. [Issue Reporting](#issue-reporting)
10. [Community Guidelines](#community-guidelines)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 22+ installed
- **Docker** and **Docker Compose**
- **Git** for version control
- **VS Code** (recommended) with suggested extensions
- Basic knowledge of **TypeScript**, **NestJS**, and **PostgreSQL**

### First-Time Setup

1. **Fork the Repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/dev-chat.git
   cd dev-chat
   ```

2. **Add Upstream Remote**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/dev-chat.git
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Set Up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

5. **Start Development Environment**

   ```bash
   npm run db:start
   npm run migration:run
   npm run start:dev
   ```

6. **Verify Setup**
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs
   - Run tests: `npm test`

---

## 🛠️ Development Setup

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-jest",
    "humao.rest-client",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Environment Configuration

Create your `.env` file based on `.env.example`:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=dev_chat

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dev_chat

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Security
BCRYPT_ROUNDS=10
```

### Development Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode
npm run build              # Build production bundle
npm run start:prod         # Start production build

# Database
npm run db:start           # Start PostgreSQL + MongoDB + Redis
npm run db:stop            # Stop all databases
npm run db:clean           # Remove all containers and volumes
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Code Quality
npm run lint               # Lint TypeScript files
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting

# Utilities
npm run typecheck          # TypeScript type checking
npm run clean              # Clean build artifacts
```

---

## 📁 Project Structure

### Core Architecture

```
src/
├── common/                 # Shared utilities and cross-cutting concerns
│   ├── decorators/        # Custom decorators (@GetUser, @Roles, etc.)
│   ├── dto/               # Common DTOs (pagination, responses)
│   ├── filters/           # Exception filters for error handling
│   ├── guards/            # Authentication and authorization guards
│   ├── interceptors/      # Request/response interceptors
│   └── validators/        # Custom validation decorators
├── config/                # Configuration management
│   ├── database/          # Database connection configurations
│   ├── app.config.ts      # Application configuration factory
│   └── security.config.ts # Security and authentication settings
├── modules/               # Business domain modules
│   ├── auth/              # Authentication and authorization
│   ├── users/             # User management
│   ├── channels/          # Channel operations
│   ├── messages/          # Message handling
│   ├── search/            # Search functionality
│   └── webhooks/          # External integrations
├── shared/                # Shared modules (JWT, database, etc.)
└── main.ts                # Application entry point
```

### Module Structure Template

Each feature module should follow this structure:

```
modules/feature/
├── dto/                   # Data Transfer Objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── query-feature.dto.ts
├── entities/              # Database entities
│   └── feature.entity.ts
├── guards/                # Feature-specific guards (optional)
├── interceptors/          # Feature-specific interceptors (optional)
├── feature.controller.ts  # REST API controller
├── feature.gateway.ts     # WebSocket gateway (if needed)
├── feature.service.ts     # Business logic service
├── feature.module.ts      # Module definition
└── tests/                 # Feature-specific tests
    ├── feature.controller.spec.ts
    ├── feature.service.spec.ts
    └── feature.e2e-spec.ts
```

---

## 📝 Coding Standards

### TypeScript Guidelines

#### 1. Type Safety

```typescript
// ✅ Good - Explicit types
interface UserData {
  id: string;
  email: string;
  createdAt: Date;
}

async function getUser(id: string): Promise<UserData | null> {
  return this.repository.findOne({ where: { id } });
}

// ❌ Bad - Any types
async function getUser(id: any): Promise<any> {
  return this.repository.findOne({ where: { id } });
}
```

#### 2. Naming Conventions

```typescript
// ✅ Good naming
export class UserService {}           // PascalCase for classes
export interface CreateUserDto {}     // PascalCase for interfaces
const userRepository = ...;           // camelCase for variables
const MAX_LOGIN_ATTEMPTS = 5;         // UPPER_SNAKE_CASE for constants

// File naming
user.service.ts                       // kebab-case for files
create-user.dto.ts
user-auth.guard.ts
```

#### 3. Function Structure

```typescript
// ✅ Good - Clear, single responsibility
async createUser(createUserDto: CreateUserDto): Promise<User> {
  await this.validateUniqueEmail(createUserDto.email);
  const hashedPassword = await this.hashPassword(createUserDto.password);

  const user = this.repository.create({
    ...createUserDto,
    password: hashedPassword,
  });

  return this.repository.save(user);
}

// ❌ Bad - Too many responsibilities
async createUser(data: any): Promise<any> {
  // Email validation, password hashing, saving, logging, etc. all in one method
}
```

### NestJS Best Practices

#### 1. Controller Structure

```typescript
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  async findAll(@Query() query: FindUsersDto): Promise<PaginatedResponse<UserResponseDto>> {
    this.logger.log(`Finding users with query: ${JSON.stringify(query)}`);
    return this.usersService.findAll(query);
  }
}
```

#### 2. Service Implementation

```typescript
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: FindUsersDto): Promise<PaginatedResponse<User>> {
    const { page, limit, skip, search, role } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere('(user.username ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

#### 3. DTO Validation

```typescript
export class CreateUserDto {
  @ApiProperty({ description: 'User username', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({ description: 'User password', example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
```

### Error Handling

```typescript
// ✅ Good - Specific exceptions
async findUserById(id: string): Promise<User> {
  if (!isUUID(id)) {
    throw new BadRequestException('Invalid user ID format');
  }

  const user = await this.userRepository.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }

  if (!user.isActive) {
    throw new ForbiddenException('User account is deactivated');
  }

  return user;
}

// ❌ Bad - Generic errors
async findUserById(id: string): Promise<User> {
  try {
    return await this.userRepository.findOne({ where: { id } });
  } catch (error) {
    throw new Error('Something went wrong');
  }
}
```

### Database Best Practices

#### 1. Entity Definition

```typescript
@Entity('users')
@Index(['email'])
@Index(['username'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.author)
  messages: Message[];
}
```

#### 2. Repository Usage

```typescript
// ✅ Good - Using query builder for complex queries
async findActiveUsersByRole(role: UserRole): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .where('user.role = :role', { role })
    .andWhere('user.isActive = :isActive', { isActive: true })
    .orderBy('user.createdAt', 'DESC')
    .getMany();
}

// ✅ Good - Simple queries
async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: { email: email.toLowerCase() }
  });
}
```

---

## 🌊 Git Workflow

### Branch Naming Convention

```bash
# Feature branches
feature/user-authentication
feature/message-reactions
feature/channel-permissions

# Bug fixes
bugfix/login-error-handling
bugfix/message-pagination

# Hotfixes
hotfix/security-vulnerability
hotfix/critical-crash

# Chores/Maintenance
chore/update-dependencies
chore/improve-logging
chore/refactor-auth-service

# Documentation
docs/api-reference
docs/deployment-guide
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Examples
feat(auth): add two-factor authentication support

fix(messages): resolve pagination issue with large datasets

docs(api): update authentication endpoint documentation

refactor(users): extract validation logic to separate service

chore(deps): update NestJS to version 10.0.0

test(channels): add integration tests for channel creation

# Breaking changes
feat(api)!: change user authentication flow

BREAKING CHANGE: Authentication now requires 2FA for all users
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `perf`: Performance improvements
- `build`: Build system changes

### Development Workflow

```bash
# 1. Start from main branch
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/new-awesome-feature

# 3. Make changes and commit frequently
git add .
git commit -m "feat(feature): implement basic functionality"

# 4. Keep your branch updated
git fetch upstream
git rebase upstream/main

# 5. Push your branch
git push origin feature/new-awesome-feature

# 6. Create Pull Request on GitHub

# 7. After approval and merge, clean up
git checkout main
git pull upstream main
git branch -d feature/new-awesome-feature
git push origin --delete feature/new-awesome-feature
```

---

## 🧪 Testing Guidelines

### Test Structure

```
src/
├── modules/
│   └── users/
│       ├── tests/
│       │   ├── users.controller.spec.ts      # Unit tests
│       │   ├── users.service.spec.ts         # Unit tests
│       │   └── users.e2e-spec.ts            # Integration tests
│       ├── users.controller.ts
│       └── users.service.ts
└── test/                                      # E2E test setup
    ├── app.e2e-spec.ts
    ├── jest-e2e.json
    └── setup.ts
```

### Unit Testing

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Arrange
      const mockUsers = [
        { id: '1', username: 'user1', email: 'user1@example.com' },
        { id: '2', username: 'user2', email: 'user2@example.com' },
      ];
      const queryDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(
        () =>
          ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 2]),
          }) as any,
      );

      // Act
      const result = await service.findAll(queryDto);

      // Assert
      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Integration Testing

```typescript
// users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set up validation pipes, guards, etc.
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    // Login to get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return paginated users for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.meta).toHaveProperty('total');
          expect(response.body.meta).toHaveProperty('page');
        });
    });

    it('should return 401 for unauthenticated requests', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user with valid data', () => {
      const createUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDto)
        .expect(201)
        .expect((response) => {
          expect(response.body.user.username).toBe(createUserDto.username);
          expect(response.body.user.email).toBe(createUserDto.email);
          expect(response.body.user).not.toHaveProperty('password');
        });
    });

    it('should return validation errors for invalid data', () => {
      const invalidUserDto = {
        username: 'x', // Too short
        email: 'invalid-email', // Invalid format
        password: '123', // Too short
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUserDto)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toContain('validation failed');
          expect(response.body.details).toBeInstanceOf(Array);
        });
    });
  });
});
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- users.service.spec.ts

# Run e2e tests
npm run test:e2e

# Run e2e tests for specific module
npm run test:e2e -- --testNamePattern="Users"

# Debug tests
npm run test:debug

# Coverage thresholds (enforced in CI)
# Statements: 80%
# Branches: 80%
# Functions: 80%
# Lines: 80%
```

---

## 🔄 Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks locally**

   ```bash
   npm run lint
   npm run format:check
   npm run typecheck
   npm run test
   npm run test:e2e
   npm run build
   ```

3. **Update documentation if needed**
   - API changes → Update `docs/API_REFERENCE.md`
   - New features → Update `README.md`
   - Breaking changes → Update `CHANGELOG.md`

### PR Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Code is well-commented, particularly in hard-to-understand areas
- [ ] Corresponding documentation updated
- [ ] No new warnings or errors introduced
- [ ] Tests added/updated for new functionality
- [ ] Changes are backwards compatible (or marked as breaking)

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Additional Context

Add any other context about the pull request here.

## Related Issues

Fixes #(issue number)
Closes #(issue number)
```

### PR Review Checklist

**For Reviewers:**

- [ ] Code follows project conventions
- [ ] Logic is sound and efficient
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No sensitive data exposed
- [ ] Breaking changes documented

---

## 👀 Code Review Guidelines

### As a Reviewer

#### What to Look For

1. **Functionality**
   - Does the code do what it's supposed to do?
   - Are edge cases handled properly?
   - Is error handling appropriate?

2. **Code Quality**
   - Is the code readable and maintainable?
   - Are functions and classes reasonably sized?
   - Are naming conventions followed?

3. **Performance**
   - Are there any obvious performance issues?
   - Are database queries optimized?
   - Is memory usage reasonable?

4. **Security**
   - Are inputs properly validated?
   - Are authentication/authorization checks in place?
   - Is sensitive data handled securely?

5. **Testing**
   - Are tests comprehensive?
   - Do tests actually test the intended functionality?
   - Is test coverage adequate?

#### How to Give Feedback

````markdown
# ✅ Good feedback examples

## Suggestion with explanation

Consider using a Map instead of an object here for better performance with frequent lookups:

```javascript
const userMap = new Map(users.map((user) => [user.id, user]));
```
````

## Question for clarification

Why do we need to call `validateUser` twice here? Could this be simplified?

## Positive reinforcement

Great use of the Repository pattern here! This makes the code much more testable.

## Request for documentation

Could you add a JSDoc comment explaining what this algorithm does? It's quite complex.

# ❌ Avoid these types of feedback

## Too vague

This is wrong.

## Personal preference without justification

I don't like this approach.

## Nitpicking without value

You have an extra space here.

````

### As a PR Author

#### Responding to Feedback

1. **Be Open and Grateful**
   - Thank reviewers for their time
   - Ask questions if feedback is unclear
   - Don't take feedback personally

2. **Address All Comments**
   - Fix issues or explain why you disagree
   - Mark conversations as resolved when addressed
   - Don't leave comments hanging

3. **Update Your PR**
   - Make requested changes
   - Add tests if requested
   - Update documentation

4. **Communicate Changes**
   ```markdown
   @reviewer Thanks for the feedback! I've addressed the comments:

   - Fixed the validation logic in `userService.ts`
   - Added unit tests for the edge case you mentioned
   - Updated the API documentation

   Please take another look when you have a chance.
````

---

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**

- OS: [e.g. Windows 11, macOS 12.0, Ubuntu 20.04]
- Node.js version: [e.g. 22.0.0]
- NPM version: [e.g. 8.19.0]
- Browser [if applicable]: [e.g. Chrome 118, Firefox 119]

**Additional Context**
Add any other context about the problem here.

**Logs**
Include relevant logs or error messages:
```

Error log here

```

```

### Feature Requests

```markdown
**Feature Description**
A clear and concise description of what you want to happen.

**Problem Statement**
What problem does this feature solve? Who would benefit from it?

**Proposed Solution**
Describe the solution you'd like to see implemented.

**Alternatives Considered**
Describe any alternative solutions or features you've considered.

**Additional Context**
Add any other context, mockups, or examples about the feature request here.

**Implementation Notes**
If you have ideas about how this could be implemented, include them here.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested
- `wontfix` - This will not be worked on
- `duplicate` - This issue or pull request already exists
- `priority:high` - High priority issue
- `priority:medium` - Medium priority issue
- `priority:low` - Low priority issue

---

## 🤝 Community Guidelines

### Code of Conduct

1. **Be Respectful**
   - Treat everyone with respect
   - Be considerate of different viewpoints
   - Use inclusive language

2. **Be Collaborative**
   - Help others learn and grow
   - Share knowledge generously
   - Give constructive feedback

3. **Be Patient**
   - Remember that everyone has different experience levels
   - Take time to explain concepts clearly
   - Be understanding of mistakes

4. **Be Professional**
   - Keep discussions on-topic
   - Avoid personal attacks
   - Focus on the code, not the person

### Getting Help

1. **Documentation First**
   - Check the README, API docs, and guides
   - Search existing issues and discussions

2. **Ask Questions**
   - Create a discussion for general questions
   - Create an issue for potential bugs
   - Be specific about your problem

3. **Community Channels**
   - GitHub Discussions for general questions
   - GitHub Issues for bugs and features
   - Code review for implementation feedback

### Recognition

We appreciate all contributions! Contributors will be:

- Listed in the README contributors section
- Mentioned in release notes for significant contributions
- Given appropriate credit in commit messages and PR descriptions

### Becoming a Maintainer

Regular contributors who demonstrate:

- High-quality code contributions
- Helpful code reviews
- Active community participation
- Understanding of project goals

May be invited to become project maintainers with additional responsibilities:

- Reviewing and merging PRs
- Triaging issues
- Helping define project direction
- Mentoring new contributors

---

## 📚 Additional Resources

### Learning Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Tools and Extensions

- [VS Code NestJS Snippets](https://marketplace.visualstudio.com/items?itemName=ashinzekene.nestjs)
- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) - API testing
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Git integration

### Project-Specific Docs

- [Developer Guide](./DEVELOPER_GUIDE.md) - Comprehensive development guide
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Database Setup](./DATABASE_SETUP.md) - Database configuration guide

---

**Thank you for contributing to DevChat! 🎉**

Your contributions help make this project better for everyone. If you have any questions or need clarification on anything in this guide, please don't hesitate to ask in GitHub Discussions or create an issue.

Happy coding! 🚀
