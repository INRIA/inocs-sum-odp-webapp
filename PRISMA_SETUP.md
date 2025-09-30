# Prisma DB Integration Setup

This project now includes a complete Backend-for-Frontend (BFF) layer with Prisma ORM integration following clean architecture and SOLID principles.

## 🏗️ Architecture Overview

```
src/bff/
├── db/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema with Users & Roles
│   ├── client.ts                  # Prisma client singleton
│   └── index.ts                   # DB bootstrap functions
├── types/
│   └── index.ts                   # TypeScript interfaces
├── repositories/
│   ├── user.repository.ts         # User data access layer
│   ├── role.repository.ts         # Role data access layer
│   └── index.ts                   # Repository exports
├── services/
│   ├── user.service.ts            # User business logic layer
│   └── index.ts                   # Service exports
└── index.ts                       # Main BFF exports
```

## 🚀 Quick Start

### 1. Database Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with your MySQL database URL:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Push Schema to Database

```bash
npm run db:push
```

### 4. Run the Development Server

```bash
npm run dev
```

## 📊 Database Schema

### Users Table
- `id` (number, primary key)
- `email` (string, unique)
- `name` (string)
- `password` (string)
- `phone` (string, optional)
- `picture` (string, optional)
- `role_id` (number, foreign key)
- `status` (enum: signup, active, disabled)
- `created_at` (datetime)

### Roles Table
- `id` (number, primary key)
- `name` (string)
- `description` (string)

### Relationships
- User `belongsTo` Role (via `role_id`)
- Role `hasMany` Users

## 🔌 API Endpoints

### GET /api/v1/users
- Get all users or filter by criteria
- Query params: `id`, `status`, `role_id`

### POST /api/v1/users
- Create new user
- Required: `email`, `name`, `password`, `role_id`

### PUT /api/v1/users
- Update existing user
- Required: `id` in request body

See [API.md](./API.md) for detailed endpoint documentation.

## 🛠️ Available Scripts

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Build project
npm run build

# Start development server
npm run dev
```

## 🏛️ Architecture Principles

### Clean Architecture
- **Repository Layer**: Handles data access and database queries
- **Service Layer**: Contains business logic and validation
- **API Layer**: HTTP request/response handling

### SOLID Principles Applied
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Easily extendable without modification
- **Liskov Substitution**: Repository interfaces can be swapped
- **Interface Segregation**: Focused, specific interfaces
- **Dependency Inversion**: Services depend on abstractions

### Key Features
- ✅ Strongly typed Prisma client
- ✅ Testable repository pattern
- ✅ Business logic separation
- ✅ Role relationships populated
- ✅ Input validation
- ✅ Error handling
- ✅ Type safety throughout

## 🔧 Customization

### Adding New Entities
1. Update `schema.prisma` with new model
2. Run `npm run db:generate` and `npm run db:push`
3. Create repository in `src/bff/repositories/`
4. Create service in `src/bff/services/`
5. Add API routes in `src/pages/api/v1/`

### Authentication (TODO)
In production, consider adding:
- JWT authentication
- Password hashing with bcrypt
- Role-based authorization
- Rate limiting
- Input sanitization

## 🚨 Important Notes

- **Development Only**: Current password handling is not secure
- **Database Required**: You need a MySQL database to run the API endpoints
- **SSR Mode**: Project is configured for server-side rendering
- **Node.js Adapter**: Using @astrojs/node for deployment