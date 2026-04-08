# HorusVis Tasks

Thư mục này gom toàn bộ workstream cần làm cho HorusVis theo hai nhóm chính:

- DB và migration
- Các menu trên sidebar: Login, Projects, My Tasks, Reports, Admin

Mỗi folder con đều có:

- checklist công việc chi tiết
- danh sách component hoặc backend module cần dựng
- API hoặc dữ liệu liên quan
- ảnh tham chiếu lấy từ `docs/outlines/stitch_horusvis`

## Cấu trúc thư mục

- [00-db-migration](./00-db-migration/README.md)
- [01-login](./01-login/README.md)
- [02-projects](./02-projects/README.md)
- [03-my-tasks](./03-my-tasks/README.md)
- [04-reports](./04-reports/README.md)
- [05-admin](./05-admin/README.md)

## Ghi chú chung

- Stack mục tiêu: ReactJS + ASP.NET Core 10 Web API + EF Core + PostgreSQL
- Toàn bộ bảng dùng khóa chính `Id` kiểu UUID
- Auth dùng bearer access token + refresh token
- `Task` và `Issue` là hai loại work item chính; cả hai đều có thể có `Subtasks`
- `%` của `Task` được tính lại từ effort thực tế của các subtasks
