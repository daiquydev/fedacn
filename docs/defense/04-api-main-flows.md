# Luong API Chinh De Trinh Bay

Tai lieu nay tap trung cac endpoint "de demo", co mapping ro giua FE -> BE -> ket qua nghiep vu.

## 1) Auth flow (User)

### Dang nhap

- `POST /api/auth/users/login`
- Input: `email`, `password`
- Output: `access_token`, `refresh_token`, thong tin user.

### Lam moi token

- `POST /api/auth/users/refresh-token`
- Input: `refresh_token`
- Output: cap moi access token.

## 2) Social post flow

### Tao bai viet

- `POST /api/posts`
- Header: `Authorization: Bearer <access_token>`
- Payload: text + media (upload array image).

### Tuong tac bai viet

- `POST /api/posts/actions/like`
- `POST /api/posts/actions/comment`
- `POST /api/posts/actions/share`
- Cac endpoint tren tao du lieu tuong tac va co the kich hoat thong bao.

### Xem feed

- `GET /api/posts` (co auth)
- `GET /api/posts/public` (public, co pagination).

## 3) Challenge flow

### Xem challenge

- `GET /api/challenges`
- `GET /api/challenges/:id`

### Tham gia challenge

- `POST /api/challenges/:id/join`
- Header auth bat buoc.

### Cap nhat tien do

- `POST /api/challenges/:id/progress`
- `GET /api/challenges/:id/leaderboard`

## 4) Training flow

- `GET /api/trainings`, `GET /api/trainings/:id`
- `POST /api/trainings/:id/join`
- `GET /api/trainings/:id/leaderboard`

## 5) Sport event flow

- `GET /api/sport-events`, `GET /api/sport-events/:id`
- Tham gia/event progress thong qua bo route sport-event attendance/progress.
- Theo doi ket qua hoat dong qua route personal/activity tracking.

## 6) Notification flow

- `GET /api/notifications`
- `PUT /api/notifications/read/:id`
- `PUT /api/notifications/read-all`
- `GET /api/notifications/check-read`

## 7) Moderation flow (Inspector/Admin)

- Report source tu user (post/challenge/sport-event) vao he thong moderation.
- Inspector thao tac:
  - `GET /api/inspectors/post-reports`
  - `PUT /api/inspectors/post-accept/:id`
  - `PUT /api/inspectors/post-reject/:id`
  - Tuong tu cho challenge/sport-event reports.
- Admin challenge:
  - `GET /api/admin/challenges`
  - `POST /api/admin/challenges`
  - `DELETE /api/admin/challenges/:id`
  - `PATCH /api/admin/challenges/:id/restore`

## 8) Luong realtime notification (Socket)

Backend socket xu ly cac event:

- `like post` -> emit `toast like`
- `comment post` -> emit `toast comment`
- `share post` -> emit `toast share`
- `follow` -> emit `toast follow`

Dieu kien:

- User phai ket noi socket voi token hop le.
- Nguoi nhan dang online (co socket_id trong danh sach user connected).
