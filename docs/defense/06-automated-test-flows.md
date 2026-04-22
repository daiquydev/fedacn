# 5 Luong Test Tu Dong (Smoke/API)

Muc tieu: co bang chung tu dong cho cac luong quan trong de bao ve.

## File test

- `DATN_BE/src/__tests__/defense-smoke.spec.ts`

## 5 luong duoc kiem tra

1. Health check app root (`GET /`) tra ve 200.
2. Dang nhap user (`POST /api/auth/users/login`) thanh cong voi mocked dependencies.
3. Tao bai viet khong token (`POST /api/posts`) bi chan boi auth guard.
4. Join challenge khong token (`POST /api/challenges/:id/join`) bi chan boi auth guard.
5. Join training khong token (`POST /api/trainings/:id/join`) bi chan boi auth guard.

## Cach chay

Tu thu muc `DATN_BE`:

```bash
npm test -- src/__tests__/defense-smoke.spec.ts
```

Hoac chay toan bo:

```bash
npm test
```

## Ky vong

- Tat ca test pass.
- Cac route private tra ve ma loi xac thuc hop le khi khong co token.
- Luong login duoc xac nhan contract response (co `result.access_token`).
