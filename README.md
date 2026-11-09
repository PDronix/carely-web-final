# Carely — Website quản lý thông tin sức khỏe gia đình

**Phiên bản:** 4.7.0 (bản đồ án chạy local).  
**Công nghệ:** Node.js 20+, Express, EJS, Sequelize, MySQL 8.4.

## 1. Yêu cầu môi trường

- Windows 10/11 hoặc hệ điều hành có Node.js 20+ và npm.
- MySQL 8.4 (có thể dùng MySQL Workbench).
- Trình duyệt hiện đại.
- Internet trong lần đầu cài package bằng npm.

## 2. Cài đặt trên máy mới và khôi phục dữ liệu demo

Repository có sẵn `db/data-demo.sql`, là bản snapshot cấu trúc và dữ liệu của database Carely tại thời điểm đóng gói. File chứa **27 bảng nghiệp vụ và các bản ghi demo**. Bản dump không chứa bảng kỹ thuật `app_sessions`.

> **Quan trọng:** `data-demo.sql` có các lệnh `DROP TABLE IF EXISTS` và `CREATE TABLE`. Chỉ import vào database `carely` mới hoặc database mà bạn chấp nhận bị thay thế toàn bộ 27 bảng nghiệp vụ. Không import vào database đang có dữ liệu cần giữ.

### Bước 1. Clone hoặc giải nén dự án

Mở CMD/Terminal tại thư mục gốc `carely-web-final`.

### Bước 2. Tạo database rỗng

Trong MySQL Workbench, mở tab SQL và chạy:

```sql
CREATE DATABASE IF NOT EXISTS carely
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

### Bước 3. Import bản dump

**Cách A — MySQL Workbench**

1. Chọn **Server → Data Import**.
2. Chọn **Import from Self-Contained File**.
3. Chọn file `db/data-demo.sql` trong thư mục dự án.
4. Ở **Default Target Schema**, chọn `carely`.
5. Nhấn **Start Import** và chờ hoàn tất.

**Cách B — CMD**

Chạy tại thư mục gốc dự án (MySQL client `mysql` phải có trong PATH):

```cmd
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS carely CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u root -p carely < db/data-demo.sql
```

Nếu dùng tài khoản MySQL khác `root`, thay `root` bằng username tương ứng.

### Bước 4. Cấu hình ứng dụng

1. Sao chép `.env.example` thành `.env`.
2. Cấu hình các giá trị kết nối MySQL:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=carely
DB_USER=root
DB_PASS=mat_khau_mysql_cua_ban
```

3. Đặt `SESSION_SECRET` thành một chuỗi ngẫu nhiên riêng trên máy của bạn. Không commit `.env` lên GitHub.

### Bước 5. Cài package và chạy ứng dụng

```cmd
npm ci
npm run dev
```

Mở trình duyệt tại **http://localhost:5000**.

**Không chạy `npm run demo:setup`, `npm run seed` hoặc `npm run seed:demo` sau khi đã import `data-demo.sql`.** Các lệnh đó dành cho phương án tạo bộ dữ liệu mới bằng seed, không phải bước tiếp theo của khôi phục snapshot.

## 3. Tài khoản demo

Mật khẩu các tài khoản mẫu:

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Admin | `admin@carely.local` | `Admin@12345` |
| Member | `member@carely.local`, `member2@carely.local` | `Member@12345` |
| Member | `member3@carely.local` đến `member7@carely.local` | `Demo@12345` |
| Facility | `facility@carely.local`, `pending@carely.local` | `Facility@12345` |
| Facility | `facility2@carely.local` đến `facility5@carely.local`, `pending2@carely.local` | `Demo@12345` |

Tài khoản `member7@carely.local` là bản ẩn danh của tài khoản demo bổ sung trong snapshot; ID và các quan hệ dữ liệu được giữ nguyên, email/tên/số điện thoại đã được thay bằng thông tin giả lập.

## 4. Dữ liệu và file đính kèm

- `db/data-demo.sql`: snapshot cấu trúc và dữ liệu MySQL tại thời điểm export.
- `db/schema.sql`: chỉ tạo cấu trúc 27 bảng nghiệp vụ; dùng khi muốn tự tạo database sạch để chạy seed thay vì khôi phục snapshot.
- `scripts/seed.js`, `scripts/seed-demo.js`: tạo bộ dữ liệu demo theo kịch bản lập trình sẵn.
- `scripts/verify-demo.js`: kiểm tra bộ dữ liệu được tạo bằng seed; không dùng làm tiêu chí xác nhận snapshot `data-demo.sql`.
- `storage/private/facility-documents/`: chứa 7 PDF giả lập được tham chiếu bởi bảng `facility_documents`. Đây là tài liệu mô phỏng, không phải giấy phép thật.
- `app_sessions` là bảng kỹ thuật do session store tự tạo khi ứng dụng chạy; không nằm trong snapshot và không thuộc ERD nghiệp vụ.
- Snapshot hiện có thêm catalog `body_temperature` và các bản ghi nhiệt độ lịch sử. Tuy nhiên `backend/config/healthMetrics.js` và `MetricService` hiện chỉ cho phép thao tác/hiển thị huyết áp, nhịp tim và cân nặng; dữ liệu nhiệt độ vẫn được giữ trong database nhưng không xuất hiện trong giao diện hiện tại. Không chạy `verify-demo` trên snapshot này vì script đó chỉ xác minh bộ seed 6 Member/3 loại chỉ số.

### Phương án tạo dữ liệu demo bằng seed (thay thế snapshot)

Nếu muốn tạo database mới từ cấu trúc và bộ seed thay vì khôi phục dữ liệu snapshot:

1. Tạo database `carely`.
2. Chạy toàn bộ `db/schema.sql`.
3. Cấu hình `.env`.
4. Chạy:

```cmd
npm ci
npm run demo:setup
```

Phương án seed tạo dữ liệu theo kịch bản trong mã nguồn, **không tái tạo chính xác snapshot**. Chỉ chọn một trong hai phương án: import `data-demo.sql` hoặc chạy seed trên schema mới.

## 5. Cập nhật database cũ

- Database từ các bản trước có thể cần chạy migration tương ứng trong `db/migrations/`.
- Chỉ chạy migration khi xác định database còn thiếu các cột/bảng mà migration bổ sung.
- Các file `.integration.sql` và `schema.integration.sql` chỉ dành cho database kiểm thử `carely_test`.
- Không chạy `db/reset-dev.sql` trên database có dữ liệu cần giữ vì file này xóa và tạo lại database phát triển.

## 6. Kiểm thử

Kiểm thử mã nguồn và unit/regression:

```cmd
npm run check:source
npm test
```

Kiểm thử HTTP + MySQL phải dùng database test riêng, không dùng `carely`:

1. Sao chép `.env.test.example` thành `.env.test`.
2. Cấu hình `DB_NAME=carely_test`, session secret riêng và cổng test riêng.
3. Trong MySQL Workbench chạy `db/schema.integration.sql` để tạo cấu trúc database kiểm thử.
4. Chạy:

```cmd
npm run test:preflight
npm run test:integration
```

Bản mã nguồn trước khi đóng gói đã được nghiệm thu 15/15 integration test trên môi trường local. Cần chạy lại trên máy mới để xác nhận cấu hình môi trường tương ứng. Nếu `npm test` hiển thị một nhóm integration `SKIP`, nhóm này được chạy riêng bằng `npm run test:integration`.

## 7. Lưu ý phạm vi đồ án và bảo mật

- Đây là bản đồ án chạy localhost với dữ liệu giả lập, không phải sản phẩm y tế triển khai công khai.
- `MAIL_MODE=console` hỗ trợ phát triển local; cần cấu hình SMTP nếu muốn gửi email thật.
- Không dùng tài khoản/mật khẩu demo trên môi trường thật hoặc mở ứng dụng ra Internet.
- Dependency có thể phát sinh cảnh báo bảo mật theo thời gian; cần kiểm tra và cập nhật có kiểm soát trước khi triển khai production.
