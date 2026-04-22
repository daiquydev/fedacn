# DATN_BE - Backend API

Backend cho do an "mang xa hoi the duc the thao cong dong".

## Vai tro

- Cung cap REST API cho user app (`DATN_FE`) va admin app (`DATN_ADMIN_FE`).
- Xu ly auth/phan quyen, social interactions, challenge/training/sport event.
- Cung cap notification va socket realtime.

## Yeu cau

- Node.js `20.9.0`
- npm
- MongoDB URL hop le trong file `.env`

## Cai dat

```bash
nvm use 20.9.0
npm install
```

## Chay development

```bash
npm run dev
```

## Chay test

```bash
# full test
npm test

# smoke test phuc vu bao ve
npm test -- src/__tests__/defense-smoke.spec.ts
```

## Build production

```bash
npm run build
npm start
```

## Tai lieu bao ve lien quan

- `../docs/DEFENSE_KIT_OVERVIEW.md`
- `../docs/defense/01-system-architecture.md`
- `../docs/defense/02-erd-core-social-fitness.md`
- `../docs/defense/03-use-cases.md`
- `../docs/defense/04-api-main-flows.md`
- `../docs/defense/05-demo-script-5-10-min.md`
- `../docs/defense/06-automated-test-flows.md`

## Script audit recipe (giu lai cho van hanh)

```bash
npm run audit:recipe-instructions
npm run audit:recipe-instructions -- --apply --verbose
```
