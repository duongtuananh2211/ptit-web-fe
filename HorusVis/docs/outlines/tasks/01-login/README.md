# 01. Login

## Mục tiêu

Dựng flow đăng nhập bằng bearer access token + refresh token, có phân quyền theo scope và tự làm mới phiên an toàn.

## FE checklist

- [ ] Thiết kế `LoginPage` với form `username/email` và `password`.
- [ ] Thêm validation phía client cho field rỗng, email sai định dạng, password quá ngắn.
- [ ] Gọi `POST /api/auth/login` và lưu access token theo chiến lược frontend đã chọn.
- [ ] Tạo session bootstrap khi refresh trang.
- [ ] Tạo interceptor để tự gọi `POST /api/auth/refresh` khi access token hết hạn.
- [ ] Tạo flow logout ở client và xóa local auth state.
- [ ] Tạo `ProtectedRoute` hoặc auth guard cho toàn bộ page sau đăng nhập.
- [ ] Điều hướng theo role/scope sau khi login thành công.
- [ ] Hiển thị trạng thái loading, lỗi xác thực, token hết hạn.
- [ ] Xử lý trường hợp refresh token bị revoke hoặc hết hạn để đẩy người dùng về login.

## FE component cần làm

- `pages/LoginPage`
- `components/auth/LoginForm`
- `components/auth/PasswordField`
- `components/auth/AuthSubmitButton`
- `layouts/AuthLayout`
- `router/ProtectedRoute`
- `services/authApi`
- `stores/authStore` hoặc `context/AuthProvider`
- `hooks/useRefreshToken`
- `lib/httpClient`

## BE checklist

- [ ] Tạo `AuthController` với các endpoint login, refresh, logout, me.
- [ ] Validate username/email + password và trả lỗi chuẩn hóa cho FE.
- [ ] Sinh bearer access token JWT và refresh token khi login thành công.
- [ ] Băm refresh token trước khi lưu `UserSessions`.
- [ ] Implement refresh token rotation và revoke phiên cũ khi logout.
- [ ] Kiểm tra trạng thái `Revoked`, `Expired` của session trước khi refresh.
- [ ] Trả `role` và `scope` để FE điều hướng sau đăng nhập.
- [ ] Ghi nhận `LastLoginAt` và trạng thái phiên.
- [ ] Thêm authorization policy theo scope cho các endpoint phía sau.

## BE module cần làm

- `Controllers/AuthController`
- `Services/AuthService`
- `Services/TokenService`
- `Services/RefreshTokenService`
- `Services/CurrentUserService`
- `Models/Auth/LoginRequest`
- `Models/Auth/AuthResponse`
- `Models/Auth/RefreshTokenRequest`
- `Entities/UserSession`
- `Authorization/ScopePolicyProvider`

## API contract dùng chung

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Ghi chú nghiệp vụ

- `Login` hiện chưa có ảnh màn hình riêng trong `stitch_horusvis`.
- Tạm dùng layout chung của hệ thống để bám branding, header, spacing và sidebar shell.
- Sau khi login thành công, điều hướng chính sẽ đi vào `Projects` hoặc `My Tasks` tùy role.

## Ảnh tham chiếu layout chung

![Shared App Layout](../../stitch_horusvis/horusvis_main_dashboard/screen.png)
