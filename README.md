# 🎓 School LMS - Learning Management System

Xususiy maktablar uchun zamonaviy boshqaruv tizimi.

## 🚀 Features

### MVP (Phase 1)
- ✅ Multi-tenant architecture (bir nechta maktablar)
- ✅ Subscription management va blocking mexanizmi
- ✅ Role-based access control (Super Admin, Admin, Teacher, Parent)
- ✅ O'quvchilar, o'qituvchilar, sinflar boshqaruvi
- ✅ Davomat va baholar tizimi
- ✅ Dars jadvali
- ✅ Naqd to'lovlar boshqaruvi
- ✅ Dashboard va hisobotlar
- ✅ Xabarlar tizimi

### Future Phases
- 🔄 Online to'lovlar (Click, Payme, Uzum)
- 🔄 O'quvchi paneli
- 🔄 Uy vazifalari tizimi
- 🔄 Email/SMS notifications
- 🔄 Advanced analytics

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm/yarn/pnpm

## 🚀 Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd lms
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env file with your database credentials
```

4. **Setup database**
```bash
# Push Prisma schema to database
npm run db:push

# (Optional) Seed initial data
npm run db:seed
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

See `prisma/schema.prisma` for full database structure.

### Key Models:
- **Tenant** - Maktablar (subscription status bilan)
- **User** - Foydalanuvchilar (role-based)
- **Student** - O'quvchilar
- **Teacher** - O'qituvchilar
- **Class** - Sinflar
- **Subject** - Fanlar
- **Attendance** - Davomat
- **Grade** - Baholar
- **Payment** - To'lovlar

## 🔐 Default Credentials

**Super Admin:**
- Email: `admin@schoollms.uz`
- Password: `SuperAdmin123!`

⚠️ **IMPORTANT:** Change these credentials in production!

## 🏗️ Project Structure

```
lms/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── super-admin/   # Super admin pages
│   │   ├── admin/         # School admin pages
│   │   ├── teacher/       # Teacher pages
│   │   └── parent/        # Parent pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── lib/                   # Utility functions
│   ├── auth.ts           # Auth helpers
│   ├── db.ts             # Database client
│   └── utils.ts          # General utilities
├── prisma/                # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Seed data
├── types/                 # TypeScript types
└── middleware.ts          # Next.js middleware (tenant blocking)
```

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **JWT-based authentication** with NextAuth.js
- **Row-level security** (tenant isolation)
- **Role-based access control** (RBAC)
- **Subscription status checking** middleware
- **SQL injection prevention** (Prisma ORM)
- **XSS protection** (Next.js built-in)

## 📊 Subscription Plans

| Plan | Price | Students | Teachers | Features |
|------|-------|----------|----------|----------|
| **Basic** | 500,000 so'm/oy | 50 | 10 | Basic features |
| **Standard** | 1,000,000 so'm/oy | 200 | 30 | All features + SMS |
| **Premium** | 2,000,000 so'm/oy | Unlimited | Unlimited | All + Custom branding |

## 🚦 Tenant Status Flow

```
NEW → TRIAL (30 days) → ACTIVE (paid) 
                      ↓
                 GRACE_PERIOD (7 days, warning)
                      ↓
                 SUSPENDED (login only, payment page)
                      ↓
                 BLOCKED (no access)
```

## 📝 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio
npm run db:generate     # Generate Prisma Client
npm run db:seed         # Seed database

# Linting
npm run lint            # Run ESLint
```

## 🧪 Testing (Future)

```bash
npm run test           # Run tests
npm run test:e2e       # Run E2E tests
```

## 📦 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Railway (Database)
1. Create PostgreSQL instance
2. Copy connection string to `DATABASE_URL`
3. Run migrations

## 🤝 Contributing

This is a private project. Contact the project owner for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Author

**School LMS Team**

## 📞 Support

For support, contact: support@schoollms.uz

---

**Version:** 1.0.0 (MVP)
**Last Updated:** November 2025

