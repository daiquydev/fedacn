# Defense Day Checklist (1 Trang)

Checklist nay de dung truoc gio bao ve (T-30 phut -> T-0).

## T-30 phut: Moi truong

- [ ] Backend `DATN_BE` da chay va tra ve `GET /` binh thuong.
- [ ] User app `DATN_FE` da chay va dang nhap duoc.
- [ ] Admin app `DATN_ADMIN_FE` da chay va dang nhap duoc.
- [ ] Da xac nhan `.env` dung URL API/DB cho buoi demo.

## T-20 phut: Tai khoan demo

- [ ] User A (tao noi dung) san sang.
- [ ] User B (tuong tac de tao realtime) san sang.
- [ ] Admin/Inspector account san sang.

## T-15 phut: Du lieu demo

- [ ] Co it nhat 1 challenge co the join.
- [ ] Co it nhat 1 training/event co the trinh bay nhanh.
- [ ] Co du lieu post de feed khong bi trong.

## T-10 phut: Test nhanh bang chung ky thuat

- [ ] Chay smoke test backend pass (`npm run defense:test` tai root hoac lenh trong `DATN_BE`).
- [ ] Tai lieu bao ve mo san:
  - [ ] `01-system-architecture.md`
  - [ ] `02-erd-core-social-fitness.md`
  - [ ] `03-use-cases.md`
  - [ ] `04-api-main-flows.md`
  - [ ] `05-demo-script-5-10-min.md`

## T-5 phut: Dry run demo

- [ ] User A tao post moi.
- [ ] User B like/comment vao post.
- [ ] User A nhan thong bao realtime khong can refresh.
- [ ] User B gui report (post/challenge).
- [ ] Inspector xu ly report (accept/reject) va UI phan anh dung.

## Trong luc bao ve

- [ ] Trinh bay theo dung thu tu trong `05-demo-script-5-10-min.md`.
- [ ] Neu gap loi internet/DB, chuyen ngay sang phuong an backup (anh/chup man hinh + video quay truoc).
- [ ] Chot bang 3 thong diep: social realtime, fitness workflow, moderation governance.
