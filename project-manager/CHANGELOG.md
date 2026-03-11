# Changelog

All notable changes to the Spacetoon Pocket project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-12

### Added
- **Projects Module**: Full project lifecycle management with budget tracking (Project -> Budget -> Employee Expenses).
- **Financial Custody**: Multi-step custody workflows (Issue -> Receive via E-Signature -> Refund/Settle). Includes `CustodyConfirmation` entity for data integrity.
- **Invoices & Purchases**: Approval chains for invoices and generation of purchase orders with PDF QR-coded printable templates.
- **Wallet & Deposits**: Company branch-level wallets with manual deposits or custody settlements, tracking absolute balance accuracy.
- **Role-Based Access Control (RBAC v6)**: A comprehensive two-layer permission system featuring Global/System roles (`ROOT`, `ADMIN`, `GLOBAL_ACCOUNTANT`, `GENERAL_MANAGER`) and Contextual Project roles (`PROJECT_MANAGER`, `PROJECT_EMPLOYEE`).
- **Web Push Notifications**: Real-time push alerts to mobile properties built on the VAPID infrastructure.
- **Document Branding**: High-resolution print-ready vouchers with embedded company logos, dual-language watermarks, and cryptographic signatures in URLs and QR codes.
- **AI Processing (Gemini)**: Bulk-addition of project expenses by parsing natural language from pasted Excel data.
- **Localization**: Full dual-language system (Arabic/English) supporting RTL layouts using `next-intl` equivalents and customized Contexts.
- **Support Chat**: In-app ticketing system connecting employees with the Admin support layer.
- **Comprehensive E2E Test Suite**: 21 Playwright phases enforcing architectural strictness over RBAC constraints and state management.

### Changed
- Refactored `src/types/index.ts` to centralize all Prisma DTOs and Shared Business Logic.
- Upgraded ESLint strictness by enforcing `react-hooks/rules-of-hooks` errors over warnings.
- Switched default hosting database profile to **AWS RDS PostgreSQL** (from Neon Tech) for strict IP binding and direct connectivity.

### Fixed
- Fixed critical lint errors representing conditional React hook execution in `finance-requests` and `notifications/send`.
- Fixed multiple memory leaks occurring in background automated cron jobs.
- Fixed AWS CI/CD missing `.env` build variables preventing database migrations dynamically.
