# Invoicely - (Contributions Accepted)

Modern, open-source invoice generation platform built with Next.js, tRPC, and TypeScript.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **Yarn**: Version 4.9.1 or higher (automatically managed via `packageManager` field)
- **PostgreSQL**: Database for storing application data

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/legions-developer/invoicely.git
   cd invoicely
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   # Create environment file in root directory
   cp .env.example .env

   # Create symlinks for environment variables across apps
   yarn sys-link
   ```

4. **Set up the database**

   ```bash
   # Start PostgreSQL with Docker Compose
   docker compose up -d

   # Generate database schema
   yarn db:generate

   # Run database migrations
   yarn db:migrate
   ```

5. **Start development server**
   ```bash
   yarn dev
   ```

## 🛠️ Tech Stack

### Core Framework

- **Next.js 15.3.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.8.2** - Type-safe JavaScript

### API & State Management

- **tRPC 11.1.2** - End-to-end type-safe APIs
- **TanStack Query 5.76.1** - Server state management
- **Jotai 2.12.3** - Atomic state management
- **Zod 3.25.7** - Schema validation

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Shadcn/ui** - Re-usable components built on Radix
- **Lucide React** - Icon library
- **Motion 12.10.5** - Animation library
- **Next Themes** - Theme management

### Database & Authentication

- **Drizzle ORM 0.43.1** - Type-safe database ORM
- **Neon Database** - Serverless PostgreSQL
- **Better Auth 1.2.8** - Modern authentication library
- **Google OAuth** - Social authentication

### File Storage & PDF

- **Cloudflare R2** - Object storage
- **AWS SDK** - S3-compatible storage client
- **React PDF 9.2.1** - PDF generation

### Development Tools

- **Turbo 2.5.3** - Monorepo build system
- **ESLint 9** - Code linting
- **Prettier 3.5.3** - Code formatting
- **Husky 9.1.7** - Git hooks

### Analytics & Monitoring

- **PostHog** - Product analytics
- **OpenPanel** - Privacy-focused analytics
- **React Scan** - Performance debugging

### Utilities

- **Date-fns 4.1.0** - Date manipulation
- **Lodash 4.17.21** - Utility functions
- **Decimal.js 10.5.0** - Arbitrary precision decimal arithmetic
- **UUID 11.1.0** - Unique identifier generation

## 📁 Project Structure

```
invoicely/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # Reusable UI components
│       │   ├── constants/     # Application constants
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/          # Utility libraries
│       │   ├── providers/    # Context providers
│       │   ├── trpc/         # tRPC configuration
│       │   ├── types/        # TypeScript type definitions
│       │   └── zod-schemas/  # Zod validation schemas
│       ├── public/           # Static assets
│       └── package.json      # App dependencies
│
├── packages/
│   ├── db/                   # Database package
│   │   ├── src/
│   │   │   ├── schema/      # Drizzle database schemas
│   │   │   └── index.ts     # Database exports
│   │   └── migrations/      # Database migration files
│   │
│   ├── utilities/           # Shared utilities
│   │   └── src/
│   │       └── env/        # Environment configuration
│   │
│   ├── eslint-config/      # Shared ESLint configuration
│   └── typescript-config/  # Shared TypeScript configuration
│
├── env-links.sh            # Environment symlink script
├── turbo.json             # Turbo configuration
├── package.json           # Root package configuration
└── yarn.lock             # Dependency lock file
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/invoicely"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2 Storage
CF_R2_ENDPOINT="your-r2-endpoint"
CF_R2_ACCESS_KEY_ID="your-access-key"
CF_R2_SECRET_ACCESS_KEY="your-secret-key"
CF_R2_BUCKET_NAME="your-bucket-name"
CF_R2_PUBLIC_DOMAIN="your-public-domain"

# Analytics
NEXT_PUBLIC_POSTHOG_HOST="your-posthog-host"
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"

# Public URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_TRPC_BASE_URL="http://localhost:3000/api/trpc"
```

### Environment Management

The project uses a symlink-based approach for environment management:

- Run `yarn sys-link` to create symlinks from the root `.env` file to all apps
- This ensures consistent environment variables across the monorepo
- Environment variables are validated using `@t3-oss/env-nextjs` and Zod

## 📜 Available Scripts

### Root Level Scripts

```bash
yarn dev              # Start development servers for all apps
yarn build            # Build all apps for production
yarn start            # Start production servers
yarn lint             # Lint all packages
yarn lint:fix         # Fix linting issues
yarn format           # Format code with Prettier
yarn check-types      # Type check all packages

# Database Operations
yarn db:generate      # Generate database schema
yarn db:migrate       # Run database migrations
yarn db:push          # Push schema changes to database
yarn db:studio        # Open Drizzle Studio

# Utility Scripts
yarn sys-link         # Create environment symlinks
yarn reset-repo       # Clean all build artifacts
```

### App-Specific Scripts (apps/web)

```bash
yarn dev              # Start Next.js development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Lint the web app
```

## 🎯 Naming Conventions

### Files and Directories

- **Directories**: Use lowercase with dashes (e.g., `components/auth-wizard`)
- **Components**: Use PascalCase for component files (e.g., `UserProfile.tsx`)
- **Client Components**: Add `.client.tsx` suffix for components using `"use client"`
- **Utilities**: Use camelCase for utility files (e.g., `formatCurrency.ts`)

### Variables and Functions

- **Variables**: Use camelCase (e.g., `userName`, `isLoading`, `hasError`)
- **Constants**: Use SCREAMING_SNAKE_CASE (e.g., `R2_PUBLIC_URL`, `TOAST_OPTIONS`)
- **Functions**: Use camelCase with descriptive verbs (e.g., `createInvoice`, `validateEmail`)
- **Booleans**: Prefix with auxiliary verbs (e.g., `isLoading`, `hasPermission`, `canEdit`)

### TypeScript Types

- **Interfaces**: Use PascalCase (e.g., `UserProfile`, `InvoiceData`)
- **Zod Schemas**: Prefix with "Zod" (e.g., `ZodInvoiceSchema`, `ZodUserSchema`)
- **Type Exports**: Use named exports, avoid default exports

### Code Style

- Use the `function` keyword for pure functions
- Prefer named exports over default exports
- Use functional and declarative programming patterns
- Structure files: exported component, subcomponents, helpers, static content, types

## 🤝 Contributing

We welcome contributions to Invoicely! Please follow these guidelines:

### Branch Naming Convention

- Format: `profilename/featurename`
- Examples: `john/add-dark-mode`, `sarah/fix-invoice-validation`

### Pull Request Guidelines

- **PR Title Format**: `type: description`
  - `feature: add invoice templates`
  - `fix: resolve authentication redirect issue`
  - `chore: update dependencies`

### Development Workflow

1. Fork the repository
2. Create a feature branch following the naming convention
3. Make your changes following the code style guidelines
4. Test your changes thoroughly
5. Submit a pull request with a descriptive title and description

### Important Notes

- **Do NOT push database migrations** - Migrations should be reviewed and managed by maintainers
- Ensure all tests pass before submitting
- Follow the existing code style and conventions
- Update documentation for any new features

### Code Review Process

- All PRs require review from at least one maintainer
- Ensure your code follows TypeScript best practices
- Write meaningful commit messages
- Keep PRs focused and atomic

## 📚 Libraries and Documentation

### Core Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### API & Data Management

- [tRPC Documentation](https://trpc.io/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Jotai Documentation](https://jotai.org)
- [Zod Documentation](https://zod.dev)

### Database & Authentication

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Better Auth Documentation](https://www.better-auth.com)
- [Neon Database Documentation](https://neon.tech/docs)

### UI & Styling

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

### Development Tools

- [Turbo Documentation](https://turbo.build/repo/docs)
- [ESLint Documentation](https://eslint.org/docs)
- [Prettier Documentation](https://prettier.io/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the Invoicely team</p>
  <p>
    <a href="https://github.com/legions-developer/invoicely">⭐ Star us on GitHub</a> |
    <a href="https://github.com/legions-developer/invoicely/issues">🐛 Report Bug</a> |
    <a href="https://github.com/legions-developer/invoicely/issues">💡 Request Feature</a>
  </p>
</div>
