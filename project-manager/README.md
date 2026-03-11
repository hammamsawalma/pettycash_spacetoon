# Spacetoon Pocket — Project & Financial Management System

<div align="center">

**نظام إدارة المشاريع والعُهد المالية**

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)
![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b?logo=playwright)

</div>

---

## Overview

Spacetoon Pocket is an enterprise-grade **ERP system** for managing projects, employees, financial custody, invoices, and procurement. Built for organizations that need strict financial tracking with a two-layer RBAC permission model.

### Key Features
- 📊 **Project Management** — Create, track, and close projects with real-time budget monitoring
- 💰 **Financial Custody** — Issue, confirm, return, and close employee custodies with digital signatures
- 🧾 **Invoice & Purchase Orders** — Full lifecycle with approval workflows
- 🏦 **Company Wallet** — Branch-scoped wallet with deposits, withdrawals, and transfers
- 👥 **Employee Management** — Profiles, debt tracking, and branch assignment
- 🔐 **Two-Layer RBAC** — System roles (ROOT, ADMIN, GM, Accountant, User) + Project roles (PE, PM)
- 📱 **Mobile-First PWA** — Responsive design with bottom navigation and pull-to-refresh
- 🌐 **Bilingual** — Full Arabic (RTL) and English support
- 📤 **Export** — Excel and PDF reports for all modules
- 🔔 **Push Notifications** — Real-time alerts via Web Push API
- 🖨️ **Digital Vouchers** — Printable custody vouchers with QR codes and e-signatures
- 💬 **Support Chat** — Built-in customer support system

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Database | PostgreSQL (AWS RDS) via Prisma 6 |
| Auth | JWT (jose + jsonwebtoken) |
| Testing | Playwright (E2E, 21 phases, 300+ scenarios) |
| AI | Google Gemini (Excel parsing) |
| Deployment | Docker → AWS EC2 + GitHub Actions CI/CD |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech))

### Installation

```bash
# Clone and install
git clone <repository-url>
cd project-manager
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secret, etc.

# Setup database
npx prisma migrate deploy
npx prisma db seed

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Login: `root@pocket.com` / `123456`

---

## Project Structure

```
src/
├── actions/        # 21 Server Actions (custody, invoices, projects, etc.)
├── app/
│   ├── (dashboard)/ # 23 protected pages
│   ├── api/         # 9 API routes (auth, vouchers, AI, push, etc.)
│   ├── login/       # Authentication pages
│   └── welcome/     # Onboarding portal
├── components/
│   ├── dashboard/   # 7 role-specific dashboard components
│   ├── layout/      # Header, Sidebar, MobileBottomNav
│   └── ui/          # 24 reusable UI components
├── context/         # Auth, Currency, Language, ProjectRoles
├── hooks/           # 7 custom hooks (debounce, pull-to-refresh, etc.)
├── lib/             # Core utilities (auth, permissions, voucher, export)
├── locales/         # ar.json + en.json translations
├── types/           # Centralized type re-exports
└── middleware.ts    # Route protection & RBAC Layer 1
tests/
├── phase-1/ → phase-21/  # Phased E2E test suites
├── fixtures/              # Auth & mobile test fixtures
└── unit/                  # Unit tests (schemas, branding)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Run all Playwright tests |
| `npm run test:prod` | Build + run E2E against production bundle |
| `npm run test:unit` | Run unit tests only |
| `npm run test:regression` | Run phases 1-5 regression suite |

---

## RBAC Permission Model

### Layer 1: System Roles
| Role | Access |
|------|--------|
| **ROOT** | Full system control |
| **ADMIN** | User management, budget allocation, project CRUD |
| **GENERAL_MANAGER** | Read-only access to all dashboards |
| **GLOBAL_ACCOUNTANT** | Financial management, invoice approval |
| **USER** | Base role — gains access via Layer 2 |

### Layer 2: Project Roles
| Role | Capabilities |
|------|-------------|
| **PROJECT_EMPLOYEE (PE)** | Submit invoices, receive/confirm custodies |
| **PROJECT_MANAGER (PM)** | Create purchase orders, procurement |
| **PE + PM** | Combined access |

---

## Deployment

### Docker (AWS EC2)
```bash
# Build and push
docker build -t spacetoon-pocket .
docker tag spacetoon-pocket:latest <ecr-uri>:latest
docker push <ecr-uri>:latest

# Deploy
./deploy-aws.sh
```

### CI/CD
GitHub Actions workflow (`.github/workflows/ci.yml`) handles:
1. Lint & type check
2. Build verification
3. Docker image push to ECR
4. EC2 deployment via SSH

---

## License

Private — Spacetoon Pocket © 2026
