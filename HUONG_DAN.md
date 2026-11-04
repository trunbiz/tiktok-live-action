# Hướng dẫn cài đặt và sử dụng Chùa Linh Ứng Online

Project tạo màn hình chùa tương tác với TikTok Live: thắp hương, cầu nguyện, xin xăm, thả tim, tặng quà và đọc lời khấn bằng ZeroTTS. Có thể đưa giao diện vào OBS để phát trực tiếp theo khung dọc 9:16.

## 1. Chuẩn bị

- Cài Bun để chạy server.
- Nếu cần giọng đọc AI: chuẩn bị Python 3.10 trở lên, uv và thư viện ZeroTTS.
- Cài OBS Studio nếu muốn đưa giao diện lên livestream.

## 2. Chạy nhanh trên Windows

Mở PowerShell tại thư mục project, hoặc chuyển đến thư mục bằng lệnh:

```powershell
cd D:\DevMMo\tiktok-live-temple-rpc
```

Cài thư viện lần đầu:

```powershell
bun install
```

Khởi động project:

```powershell
bun start
```

Khi phát triển và cần tự tải lại server sau khi sửa code:

```powershell
bun run dev
```

Chỉ chạy một trong hai lệnh khởi động. Giữ terminal mở trong lúc sử dụng; nhấn `Ctrl+C` để dừng server.

## 3. Mở giao diện

| Trang | Địa chỉ |
| --- | --- |
| Màn hình chính và điều khiển nhanh | http://localhost:3000 |
| Bảng quản trị | http://localhost:3000/admin |
| Giao diện cho OBS | http://localhost:3000/?obs=1 |

Trong trang quản trị, nhập `@username` của tài khoản TikTok đang phát Live rồi nhấn nút kết nối. Có thể thử các thao tác nghi lễ bằng bảng điều khiển trước khi kết nối livestream.

## 4. Đưa giao diện vào OBS

1. Khởi động server bằng `bun start`.
2. Trong OBS, thêm nguồn **Browser / Trình duyệt**.
3. Nhập URL `http://localhost:3000/?obs=1`.
4. Đặt chiều rộng **1080**, chiều cao **1920**.
5. Đặt khung hình OBS theo tỷ lệ 9:16 và kiểm tra hình ảnh, âm thanh trước khi phát.

Nếu dùng OBS trên máy khác, thay `localhost` bằng địa chỉ IP của máy chạy server và bảo đảm hai máy kết nối được với nhau.

## 5. Các tương tác chính

| Tương tác | Cách kích hoạt |
| --- | --- |
| Thắp hương, bái Phật | Bình luận `thắp hương`, `dâng hương`, `bái phật`, `lạy phật` |
| Cầu nguyện | Bình luận lời cầu như `cầu bình an`, `nguyện ...`, `nam mô`, `a di đà phật` |
| Xin xăm | Bình luận `xin xăm`, `gieo quẻ`, `rút quẻ` |
| Gõ mõ | Thả tim |
| Thỉnh chuông | Follow hoặc chia sẻ |
| Dâng lễ vật | Tặng quà trong livestream |

## 6. Cài giọng đọc ZeroTTS

Giọng đọc dùng tiến trình Python `tts_worker.py`. Lần đầu khởi tạo model có thể cần Internet và thời gian tải dữ liệu.

**Lưu ý về phiên bản code hiện tại:** `server.js` tìm Python tại `.venv/bin/python`, nếu không có sẽ gọi `python3`. Đây là cách tìm đường dẫn dành cho Linux/macOS; môi trường Python trên Windows thường nằm ở `.venv\Scripts\python.exe`. Vì vậy, chỉ cài thư viện vào `.venv` trên Windows chưa bảo đảm server sử dụng được giọng đọc.

Trên Linux/macOS, cài đặt tại thư mục project:

```bash
uv venv .venv
uv pip install --python .venv/bin/python zerotts pillow
bun start
```

Trên Windows, có thể chuẩn bị thư viện bằng:

```powershell
uv venv .venv
uv pip install --python .venv\Scripts\python.exe zerotts pillow
```

Để server sử dụng môi trường này, cần điều chỉnh hàm `resolvePythonBin()` trong `server.js` để nhận đường dẫn `.venv\Scripts\python.exe`, hoặc chạy project trong môi trường Linux/WSL với các thư viện được cài tại đó. Sau khi cấu hình xong, khởi động lại server và thử giọng đọc trong trang quản trị.

## 7. Xử lý lỗi thường gặp

- **Không nhận lệnh `bun`:** kiểm tra Bun đã được cài và có trong PATH, sau đó mở lại terminal.
- **Thiếu thư viện JavaScript:** chạy `bun install` tại thư mục chứa `package.json`.
- **Cổng 3000 đang được sử dụng:** dừng phiên server cũ hoặc dùng cổng khác trong PowerShell:

  ```powershell
  $env:PORT = "3001"
  bun start
  ```

  Khi đó mở `http://localhost:3001` và cập nhật URL trong OBS tương ứng.
- **Không có giọng đọc:** kiểm tra log ZeroTTS trong terminal, đường dẫn Python và thư viện đã cài theo mục 6.
- **Trình duyệt không phát âm thanh:** tương tác với trang để cho phép phát âm thanh và kiểm tra âm lượng trình duyệt/OBS.
- **Không kết nối TikTok:** kiểm tra đúng username, tài khoản đang Live và kết nối Internet; xem thông báo lỗi trong bảng quản trị hoặc terminal.

## 8. Donate ủng hộ phát triển project

Nếu project hữu ích, bạn có thể donate để ủng hộ tác giả duy trì và phát triển thêm tính năng. Xin cảm ơn sự đồng hành của bạn!

- **Ngân hàng:** Techcombank
- **Chủ tài khoản:** TRAN BA TRUNG
- **Số tài khoản:** `19035302164011`

Mở ứng dụng ngân hàng và quét mã bên dưới, hoặc lưu ảnh để nhập từ thư viện. Kiểm tra thông tin người nhận trên ứng dụng trước khi xác nhận chuyển khoản.

![Mã QR donate Techcombank – TRAN BA TRUNG](docs/donate-qr.png)

[Mở ảnh QR donate gốc](docs/donate-qr.png)
