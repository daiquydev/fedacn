# Kien Truc Tong The He Thong

## 1) Muc tieu he thong

Nen tang mang xa hoi the duc the thao cong dong, ho tro:

- Ket noi nguoi dung (profile, follow/friends, post, comment, like, report).
- To chuc hoat dong fitness (training, challenge, sport event, tracking tien do).
- Quan tri noi dung qua Admin/Inspector (duyet, reject, phuc hoi noi dung vi pham).
- Thong bao realtime cho tuong tac xa hoi.

## 2) Kien truc 3 khoi

```text
[DATN_FE - User App]  --->  [DATN_BE - REST API + Socket + MongoDB]
         |                                 ^
         v                                 |
[DATN_ADMIN_FE - Admin App] ----------------
```

- `DATN_FE`: giao dien nguoi dung cuoi (React + Vite + React Query + Router).
- `DATN_ADMIN_FE`: giao dien quan tri/kiem duyet (React + Vite).
- `DATN_BE`: Express + TypeScript + Mongoose, cung cap REST API, middleware auth, role, notification va socket.

## 3) Thanh phan backend

Backend duoc tach lop ro:

- `routes/`: khai bao endpoint theo domain (`userRoutes`, `adminRoutes`).
- `controllers/`: nhan request/response, dieu pho hop service.
- `services/`: xu ly nghiep vu.
- `models/schemas/`: luu tru entity tren MongoDB.
- `middlewares/`: auth, role, validate, error handler.

Route namespace chinh:

- User: `/api/auth/users`, `/api/posts`, `/api/challenges`, `/api/trainings`, `/api/sport-events`, `/api/notifications`, ...
- Admin: `/api/admin/*`, `/api/inspectors`, `/api/writters`.

## 4) Kien truc frontend

### User frontend (`DATN_FE`)

- Router tong trong `src/useRouteElement.jsx`.
- Nhom man hinh lon: Home/Feed, Friends, Challenge, Training, Sport Event, Meal Plan, Profile, Dashboard.
- Quan ly data qua React Query + Axios.
- Nhan thong bao realtime qua `socket.io-client`.

### Admin frontend (`DATN_ADMIN_FE`)

- Cac man quan tri: user, report, challenge, sport category/event, workout management.
- Tich hop API admin va inspector de moderation.

## 5) Bao mat va van hanh

- Auth: JWT access/refresh token.
- Role-based access cho admin/inspector/chef.
- Middleware bao ve endpoint private.
- Helmet + CORS + rate-limit co san trong `src/index.ts`.

## 6) Kha nang mo rong

- Mo rong domain theo route/service/schemas ma khong pha vo khoi hien tai.
- Co the them queue/job cho notification/moderation neu tai he thong tang.
- Co the them CI/CD, logging quan sat va e2e test de nang muc production-ready.
