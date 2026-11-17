# Changelog

## [1.2.0] – 2026-11-17
### Security
- Security headers on every response (clickjacking, nosniff, referrer, HSTS); X-Powered-By removed
- Unexpected API errors return a general message; details only in the server log
- Teachers no longer receive other teachers' emails and pay rates; emails saved in lowercase
- Google Forms webhook: constant-time secret check, max field length 200

## [1.1.0] – 2026-11-17
### Changed
- Upgraded to Next 16 and React 19
- middleware.ts renamed to proxy.ts (Next 16 requirement)
- Dynamic API routes await `params` (Next 16 requirement)
- ESLint 9 with flat config (eslint.config.mjs)
- Prisma 7.10.1

## [1.0.0] – 2026-11-17
- Starting point before any steps towards upgrade