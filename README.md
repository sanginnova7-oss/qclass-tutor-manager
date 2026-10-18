# QClass Tutor Manager 🎓⚡
> **Hệ thống Quản lý Lớp học Dạy thêm & Trung tâm Toán Chuyên nghiệp**  
> *Tích hợp Cập nhật Dữ liệu Real-time (WebSocket & Multi-tab Bus), AI Workspace V4, Bản đồ Năng lực Thích ứng, Điểm danh Trừ buổi Thông minh, Thanh toán VietQR và Đa cổng (Giáo viên - Học sinh - Phụ huynh - Tuyển sinh).*

---

## 🌟 Tính Năng Nổi Bật

### 1. ⚡ Đồng Bộ Hóa Real-Time Đa Chiều (Mới nâng cấp)
- **Kiến trúc Full-Stack WebSocket (`server.ts`):** Kết nối 2 chiều giữa máy chủ và tất cả các thiết bị đang mở (Laptop giáo viên, iPad học sinh, Smartphone phụ huynh).
- **BroadcastChannel liên tab (0ms latency):** Đồng bộ dữ liệu ngay lập tức giữa các tab trình duyệt đang mở cùng lúc.
- **Hệ thống cảnh báo âm thanh & Thông báo nổi (Live Toasts):** Chuông báo nhẹ (Web Audio API) và pop-up cập nhật ngay khi có học sinh nộp bài thi, có phụ huynh đóng học phí hoặc có đơn tuyển sinh mới.
- **Bảng điều khiển kết nối Real-time:** Xem độ trễ mạng (latency ms), số lượng máy online, đồng bộ cưỡng bức (force sync) và phát tín hiệu thử nghiệm.

### 2. 🏛️ Hệ Thống 4 Cổng Trải Nghiệm (4-Portal Experience)
- **Cổng Giáo Viên / Admin:** Quản trị toàn diện học sinh, lớp học, lịch học, điểm danh trừ buổi, tài chính học phí, tuyển sinh CRM, ngân hàng đề thi ma trận và AI Workspace.
- **Cổng Học Sinh:** Xem lịch học, làm bài tập về nhà, thi khảo sát trắc nghiệm trực tuyến chấm điểm tự động, xem lộ trình học thích ứng và tài liệu chuyên đề.
- **Cổng Phụ Huynh:** Tra cứu chuyên cần, số buổi học còn lại, lịch sử đóng tiền và quét mã **VietQR** thanh toán học phí nhanh chóng.
- **Cổng Tuyển Sinh Công Khai:** Landing page giới thiệu lớp học Toán và form đăng ký học thử trực tuyến tự động kết nối vào CRM.

### 3. 🤖 AI Workspace V4
- Tự động sinh đề kiểm tra phân hóa 4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
- Trợ lý AI phân tích điểm mạnh, điểm yếu và gợi ý lộ trình cải thiện cá nhân hóa cho từng học sinh.
- Sinh phiếu bài tập (Worksheet) có thể in ấn chuẩn PDF / A4.

### 4. 💳 Quản Lý Học Phí & Điểm Danh Trừ Buổi Thông Minh
- Mô hình đóng học phí theo gói (10, 15, 20 buổi).
- Tự động trừ buổi khi điểm danh Có mặt / Nghỉ không phép / Học bù; Giữ nguyên buổi khi Nghỉ có phép.
- Tạo mã thanh toán VietQR động theo chuẩn ngân hàng (MB, Vietcombank, Techcombank, BIDV...).
- Cảnh báo học sinh sắp hết buổi (còn $\le 2$ buổi) hoặc âm buổi.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Node.js, Express, WebSocket (`ws`), Vite 8 (Middleware mode).
- **Lưu trữ & Đồng bộ:** Server-authoritative JSON Store, LocalStorage cache, Multi-tab BroadcastChannel.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu môi trường
- Node.js 20+ hoặc 22+
- npm hoặc bun

### Các bước cài đặt:

1. **Clone repository về máy:**
   ```bash
   git clone <URL_REPOSITORY_CUA_BAN>
   cd <thu_muc_du_an>
   ```

2. **Cài đặt các thư viện phụ thuộc:**
   ```bash
   npm install
   ```

3. **Khởi động môi trường phát triển (Dev server kèm WebSocket):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

4. **Build ứng dụng cho môi trường Production:**
   ```bash
   npm run build
   ```

5. **Chạy server Production:**
   ```bash
   npm start
   ```

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
├── server.ts                       # Máy chủ Express & WebSocket Realtime Server
├── data/                           # Thư mục lưu trữ CSDL máy chủ (qclass-realtime-db.json)
├── src/
│   ├── App.tsx                     # Component gốc điều hướng 4 cổng & modal
│   ├── main.tsx                    # Entrypoint React 19
│   ├── index.css                   # Tailwind CSS v4 cấu hình
│   ├── components/
│   │   ├── common/                 # RealtimeToastContainer, UI dùng chung
│   │   ├── layout/                 # TopBar, Sidebar, BottomNav, PortalSwitcher
│   │   ├── modals/                 # RealtimeStatusModal, AddStudent, AddPayment...
│   │   ├── portal-student/         # Cổng giao diện học sinh
│   │   ├── portal-parent/          # Cổng giao diện phụ huynh
│   │   ├── portal-public/          # Landing page tuyển sinh & học thử
│   │   └── views/                  # Dashboard, Attendance, Tuition, Academic, CRM...
│   ├── services/
│   │   ├── db.ts                   # Core Database Service & State Engine
│   │   ├── realtimeService.ts      # WebSocket & BroadcastChannel Realtime Client
│   │   ├── seedData.ts             # Dữ liệu khởi tạo chuẩn
│   │   └── vietqr.ts               # Bộ sinh mã QR thanh toán
│   └── types/                      # TypeScript definitions
├── package.json
└── vite.config.ts
```

---

## 👤 Tác Giả & Bản Quyền
- **Dự án:** QClass Tutor Manager
- **Chủ nhiệm:** Thầy Nguyễn Văn Sang (sanginnova7@gmail.com)
- **Môn:** Toán học
- **Giấy phép:** Apache-2.0
