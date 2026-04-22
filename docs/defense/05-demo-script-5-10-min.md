# Kich Ban Demo Chuan (5-10 Phut)

Muc tieu demo:

1. Chung minh day du user flow xa hoi + fitness.
2. Chung minh moderation flow ben admin/inspector.
3. Chung minh realtime notification hoat dong.

## 0) Chuan bi truoc demo (1 phut)

- Mo san 3 app:
  - `DATN_FE` (user)
  - `DATN_ADMIN_FE` (admin/inspector)
  - `DATN_BE` (api)
- Dang nhap san 2 tai khoan user tren 2 tab trinh duyet:
  - User A: nguoi tao noi dung.
  - User B: nguoi nhan thong bao.
- Dang nhap 1 tai khoan inspector/admin tren admin app.

## 1) User flow (3-4 phut)

### Buoc 1 - Dang nhap va vao trang chu

- User A dang nhap.
- Trinh bay nhanh dashboard/feed/challenge menu de hoi dong thay pham vi.

### Buoc 2 - Tao bai viet

- User A tao 1 post moi (text + image neu co).
- Kiem tra post xuat hien tren feed.

### Buoc 3 - Tuong tac tu User B va realtime

- User B mo post cua User A, thuc hien like hoac comment.
- Tren man User A, xuat hien thong bao realtime (toast/notification) ngay lap tuc.
- Nhan manh: day la socket event, khong can refresh trang.

### Buoc 4 - Tham gia challenge

- User A vao `Challenge`, chon 1 challenge va bam Join.
- Hien trang thai da tham gia (hoac co trong danh sach my challenges).

## 2) Admin/Inspector moderation flow (2-3 phut)

### Buoc 5 - Tao report (tu user)

- User B report post/challenge (tuong ung tinh nang dang co).

### Buoc 6 - Xu ly report tren admin

- Inspector vao danh sach report.
- Mo chi tiet report.
- Chon Accept hoac Reject.
- Kiem tra ket qua phan anh ve user app:
  - Noi dung bi an/xoa tam, hoac
  - Trang thai report thay doi.

## 3) Chot demo va thong diep ky thuat (1-2 phut)

- Tong ket 3 gia tri:
  1. Social interaction co realtime.
  2. Fitness workflow (challenge/training/event) hoat dong end-to-end.
  3. Co governance qua admin moderation.
- Neu con thoi gian, mo nhanh API/Swagger/Postman collection de doi chieu endpoint.

## Loi thoai goi y khi trinh bay

- "He thong khong chi la app dang bai, ma da co chu trinh day du: tao noi dung -> tuong tac -> thong bao realtime -> report -> moderation."
- "Challenge va training la lop nghiep vu the thao cot loi, giup he thong mang tinh cong dong thay vi social chung chung."
