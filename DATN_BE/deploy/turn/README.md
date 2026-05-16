# TURN server nhanh cho VPS (coturn + Docker)

Tài liệu này giúp bạn dựng TURN server nhanh để WebRTC hoạt động ổn định khi gọi khác mạng (đặc biệt mạng công ty).

## 1) Chuẩn bị VPS

- Ubuntu VPS có Docker + Docker Compose plugin
- Có public IP tĩnh
- Mở firewall/security group:
  - `3478/udp`
  - `3478/tcp`
  - `49160-49200/udp` (relay media range)

> Nếu chưa có Docker:
>
> - `curl -fsSL https://get.docker.com | sh`
> - `sudo usermod -aG docker $USER` rồi đăng nhập lại

## 2) Cấu hình biến môi trường TURN

Trong thư mục này:

- copy `.env.example` thành `.env`
- chỉnh các giá trị trong `.env`, tối thiểu:
  - `TURN_EXTERNAL_IP`: IP public của VPS
  - `TURN_REALM`: domain của bạn
  - `TURN_USERNAME`, `TURN_PASSWORD`: credential dùng cho frontend

## 3) Chạy TURN

Trong thư mục `deploy/turn`:

- `docker compose up -d`
- kiểm tra: `docker compose ps`
- xem log: `docker compose logs -f coturn`

## 4) Gắn vào FE (`DATN_FE/.env`)

```env
VITE_API_URL=https://loan-comedy-licenses-talent.trycloudflare.com/api/v1
VITE_SOCKET_URL=https://loan-comedy-licenses-talent.trycloudflare.com

VITE_TURN_URLS=turn:<VPS_PUBLIC_IP>:3478?transport=udp,turn:<VPS_PUBLIC_IP>:3478?transport=tcp
VITE_TURN_USERNAME=<TURN_USERNAME>
VITE_TURN_CREDENTIAL=<TURN_PASSWORD>
VITE_FORCE_TURN=true
```

Sau đó restart FE.

## 5) Test nhanh

- Dùng 2 máy khác mạng (1 mạng công ty, 1 mạng nhà) gọi lại.
- Trong console FE, bạn nên thấy candidate type `relay` ở log `Selected pair`.

## 6) Gợi ý production

- Nên dùng domain riêng cho TURN (vd `turn.yourdomain.com`) và thêm TURN TLS (5349).
- Nếu mạng công ty chặn UDP, giữ thêm đường TCP như đã cấu hình.
- Nếu tải lớn, tăng `TURN_MAX_PORT`.

