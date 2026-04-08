# 00. DB and Migration

## Mục tiêu

Dựng schema PostgreSQL và migration nền cho toàn bộ hệ thống HorusVis, bảo đảm khớp với nghiệp vụ của các page `Login`, `Projects`, `My Tasks`, `Reports`, `Admin`.

## Checklist công việc

- [ ] Bật extension `pgcrypto` để hỗ trợ `gen_random_uuid()`.
- [ ] Tạo `ApplicationDbContext` và tách cấu hình bảng bằng `IEntityTypeConfiguration<>`.
- [ ] Khai báo entity và mapping cho nhóm Identity: `Users`, `Roles`, `Permissions`, `RolePermissions`, `UserSessions`.
- [ ] Khai báo entity và mapping cho nhóm Project: `Projects`, `Teams`, `ProjectMembers`, `FeatureAreas`.
- [ ] Khai báo entity và mapping cho nhóm Work Items: `Tasks`, `TaskAssignees`, `TaskComments`, `Issues`, `Subtasks`, `IssueSteps`, `IssueActivities`.
- [ ] Khai báo entity và mapping cho nhóm Analytics: `ReportSnapshots`, `ReportBugDensityItems`, `TeamPerformanceMetrics`, `Recommendations`.
- [ ] Khai báo entity và mapping cho nhóm Admin/Ops: `Deployments`, `SystemNodes`, `Notifications`.
- [ ] Thêm unique index cho `Username`, `Email`, `Scope`, `ProjectKey`, `IssueCode`, `SubtaskCode`.
- [ ] Thêm constraint cho `Subtasks` để mỗi bản ghi chỉ thuộc một cha: hoặc `TaskId`, hoặc `IssueId`.
- [ ] Thêm seed data cho `Roles`, `Permissions`, `RolePermissions` theo mô hình scope.
- [ ] Tạo migration khởi tạo schema đầu tiên.
- [ ] Tạo migration seed dữ liệu mẫu để frontend có data render demo.
- [ ] Kiểm thử `dotnet ef database update` và rollback migration.
- [ ] Tạo chiến lược index cho `Status`, `ProjectId`, `OwnerUserId`, `RefreshTokenExpiresAt`, `SnapshotDate`.
- [ ] Chuẩn hóa audit fields: `CreatedAt`, `UpdatedAt`, `RevokedAt`, `LastUsedAt`.
- [ ] Viết rule tính `Task.ProgressPercent` từ subtasks trong service hoặc query projection.

## Component / module cần làm

- `ApplicationDbContext`
- `EntityConfigurations/*`
- `Entities/*`
- `Migrations/*`
- `Seeders/PermissionSeeder`
- `Seeders/RoleSeeder`
- `Seeders/DemoDataSeeder`
- `Services/TaskProgressCalculator`
- `Extensions/ModelBuilderExtensions`

## Trọng tâm dữ liệu

- `UserSessions` lưu `RefreshTokenHash`, `RefreshTokenExpiresAt`, `RevokedAt`, `Status`
- `Tasks.ProgressPercent` là giá trị tính toán, không nhập tay
- `Subtasks` lưu `State`, `OwnerUserId`, `EstimateHours`, `ToDoHours`, `ActualHours`
- `Issues` là work item riêng, không dùng thay cho subtask

## Ảnh tham chiếu nghiệp vụ

### Projects overview

![Projects Overview](../../stitch_horusvis/dashboard_detailed_view_v2/screen.png)

### My Tasks board

![My Tasks Board](../../stitch_horusvis/horusvis_refined_dashboard/screen.png)

### Issue detail

![Issue Detail](../../stitch_horusvis/issue_detail_bug_tracking/screen.png)

### Reports

![Reports](../../stitch_horusvis/visual_analytics_dashboard/screen.png)

### Admin

![Admin](../../stitch_horusvis/saas_user_management/screen.png)
