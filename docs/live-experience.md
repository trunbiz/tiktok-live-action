# Trải nghiệm phòng live

## Bản sửa kết nối TikTok

WebSocket dùng IPv4 và thời gian bắt tay mặc định 35 giây (đổi bằng `WS_CONNECT_TIMEOUT_MS`, giới hạn 10–60 giây). Timeout/reset mạng được thử lại tối đa hai lần với kết nối mới; kênh offline không bị thử liên tục. Các yêu cầu cùng kênh dùng chung lần kết nối đang chờ. Ngắt kết nối hủy yêu cầu chờ; sự kiện socket cũ không được ghi vào phòng mới. Nút kết nối hiển thị lần thử và khóa trong lúc chờ.

Không phát lại chat lịch sử trước bước bắt tay, tránh nhầm lịch sử với chat đang nhận trực tiếp. Cấu hình này không bảo đảm khắc phục mọi sự cố mạng hoặc hạn chế từ TikTok. Giao diện mới: `http://localhost:3000/?obs=1&v=13`.

Khởi động lại server sau khi cập nhật, tải lại màn hình live và bấm nút bật âm thanh ở bảng điều khiển. Trong OBS Browser Source, dùng Interact bấm vào khung để mở tiếng; bật **Control audio via OBS** và kiểm tra mixer nếu tiếng chưa ra luồng phát.

- Nhạc nền tự tạo nằm trong `public/assets/temple-ambience.wav`, không cần tải nhạc ngoài.
- Ưu tiên ZeroTTS Mai Chi; nếu chưa sẵn sàng hoặc phản hồi quá 35 giây, dùng giọng trình duyệt. Chỉ dùng giọng trình duyệt có mã ngôn ngữ tiếng Việt. Nếu chưa cài giọng tiếng Việt, bỏ qua lời đọc và báo trong bảng điều khiển; không chọn giọng mặc định khác ngôn ngữ.
- Lời chào được xét mỗi 2 giây khi hàng đọc rảnh, mỗi tài khoản chào lại sau ít nhất 10 phút.
- Bình luận và tim được cảm ơn rõ tên, tối đa hai tên mỗi câu. Hàng đọc xét mỗi 2 giây, giãn cách 12 giây; ưu tiên cảm ơn trước lời chào và câu dẫn. Chưa đến lượt thì giữ chờ (tối đa 2 phút), không xóa lời cảm ơn ngay. Mỗi người được cảm ơn lại theo loại tương tác sau ít nhất 20 giây; thông báo hình vẫn xuất hiện ngay.
- Sáu câu dẫn luân phiên sau ít nhất 65 giây, chỉ khi đang live hoặc giả lập và không có tương tác trong 20 giây.
- Các nút trong mục **Chủ lễ tự động** bật/tắt từng loại. **Nghe thử chuông & lời chào** kiểm tra đường tiếng; bật giả lập để thử các nghi thức cùng lời chào/cảm ơn mà không cần phòng TikTok.
- Ánh sáng, hào quang, hoa đăng và động tác lễ giữ khung cảnh chuyển động khi vắng tương tác; các chuyển động nền không tạo số liệu người xem giả.

Kiểm tra: `node --test tests/engagement.test.js tests/audio.test.js`.

## Tương tác trên khung live

Màn hình người xem chỉ hiển thị khung cảnh, phản hồi và gợi ý tương tác. Không có mục tiêu xu, bảng giá hoặc bảng doanh thu.

- **Vào phòng:** xuất hiện sen mang tên và lời chào.
- **Thả tim:** tim bay, sen nở lại và tên người vừa tương tác hiện ngay. Lời cảm ơn bằng giọng được giãn cách riêng.
- **Bình luận:** nội dung đã lọc hiện thành lời nhắn, kèm hoa đăng mang tên. Các lệnh thắp hương, chuông, xin xăm tiếp tục kích hoạt nghi thức, nhân vật hoặc tờ quẻ.
- **Tặng quà:** sen vàng, chuông, hoa đăng và khung cảm ơn mang tên người tặng; quà lớn thêm mưa vàng và viền sáng.

Hoa của tối đa 18 người gần nhất ở lại trong cảnh 90 giây; ba lời nhắn cùng lúc và hàng đợi sáu hiệu ứng quà giúp tránh che kín hình khi đông. Các nút thử nằm trong bảng điều khiển bên ngoài khung OBS và chỉ trình diễn trên máy đang mở.

Dùng `http://localhost:3000/?obs=1&v=4` trong OBS (1080 × 1920); tải lại Browser Source sau cập nhật.

## Người hành hương

Mỗi người tương tác có nhân vật độc lập mang tên, đi lên dâng hương, quỳ lễ và đi ra trong khoảng 21 giây. Tương tác lặp khi nhân vật còn trong cảnh sẽ làm sáng thẻ tên, không tạo bản sao. Tối đa tám nhân vật cùng lúc và hàng đợi 24 người.

Sau 12 giây yên, cảnh có thể tạo một người hành hương nền mỗi bảy giây, tối đa ba người. Mỗi người có nhãn **Nhân vật nền**; không có bình luận, TTS, quà hay điểm giả. Người thật được ưu tiên thay chỗ nhân vật nền khi đông. Tắt/bật bằng nút **Nhân vật nền** ở bảng điều khiển. Các chuyển động này chạy tại trình duyệt, không cần bật chế độ giả lập người xem.

OBS: tải lại trang `http://localhost:3000/?obs=1&v=6` sau cập nhật.

## Nội dung khung phát

Ẩn trạng thái LIVE, số mắt và nút xin quyền âm thanh khỏi khung phát; chủ phòng bật tiếng qua bảng điều khiển hoặc OBS Interact. Khách mô phỏng có 288 tổ hợp họ tên, chọn không lặp hết một vòng; nhãn nhỏ **Khách mô phỏng** phân biệt với tên người thật.

Lời mời “Gửi 99 đóa hoa · Gửi một điều ước” xuất hiện 9 giây sau khoảng 30 giây đầu, rồi tối đa mỗi 90 giây lúc yên. Tương tác thật hoặc hiệu ứng quà sẽ ẩn lời mời. Đây là lời mời gửi lời ước trên hoa đăng, không phải lời hứa điều ước thành hiện thực; bình luận lời chúc vẫn được thả đèn mà không cần tặng quà.

Bản hiện tại: `http://localhost:3000/?obs=1&v=7`.

## Hộ pháp đấu yêu quái

Trận đấu hoạt hình chung được server cập nhật mỗi 900 ms. Mỗi phe có 100 máu, đòn thường, né đòn, bạo kích; có kết quả thắng/thua và nghỉ khoảng 5 giây trước hiệp tiếp theo. Mọi trình duyệt xem cùng một hiệp, không tự tung kết quả riêng. Khởi động lại server bắt đầu lại tỷ số.

Tương tác thật tiếp sức hộ pháp: tim +8, bình luận hợp lệ +12, quà +18 năng lượng. Chung giới hạn một lượt tiếp sức mỗi 2,5 giây cho từng người, tối đa 100 năng lượng. Đủ 50 thì đòn kế tiếp của hộ pháp tung pháp ấn. Không bảo đảm bên nào thắng; không có phần thưởng hay đặt cược. Nhân vật mô phỏng không tiếp sức.

Khách dâng hương đi theo hai mép sân để chừa giữa cho trận chiến. Bản mới: `http://localhost:3000/?obs=1&v=8`.

## Cảm ơn bằng giọng

Câu đọc: “Cảm ơn Minh Anh đã bình luận, Hoàng Nam đã thả tim. Chúc bạn bình an!”. Nếu cùng một người vừa bình luận vừa thả tim, gộp thành một câu. Bình luận vẫn kích hoạt đầy đủ hiệu ứng nghi thức; không đồng thời đọc lại lời khấn dài để tránh che mất lời cảm ơn. Nút **Cảm ơn bình luận**, **Cảm ơn thả tim** và **Giọng đọc** ở bảng điều khiển bật/tắt từng phần. Giọng đọc cần được mở quyền âm thanh và ZeroTTS hoặc giọng Việt dự phòng sẵn sàng.

Bản mới: `http://localhost:3000/?obs=1&v=9`.

## Kiểm tra đường nhận bình luận và tiếng

Mở bảng điều khiển, kiểm tra **Đã nhận N bình luận** và tên người gần nhất. Nếu bằng 0, kiểm tra đúng @tài khoản đang phát và thông báo kết nối; cấu hình mới xác minh kênh đang live, không chỉ coi mở WebSocket là đã nhận được phòng. Kênh kết nối thành công được nhớ trong settings cho lần khởi động tiếp.

Nút **Thử đọc tên đang nhập** đọc tên ở ô người xem trên chính trình duyệt đó. Trong OBS phải mở quyền tiếng cho Browser Source bằng Interact/click; mở tiếng ở Chrome không tự mở tiếng cho OBS. `/api/diagnostics` cho biết số gói TikTok, số bình luận, trạng thái worker và báo cáo âm thanh của từng cửa sổ (được mở tiếng hay chưa, hàng đợi, lần phát gần nhất, lỗi).

TTS chỉ gửi yêu cầu tạo giọng khi đã có quyền phát, xử lý tuần tự để tránh dồn worker; lời cảm ơn ưu tiên có thể chờ 5 phút. Khi worker đang khởi động, client thử lại trong tối đa 5 phút, không chuyển ngay sang giọng dự phòng. Bản mới: `http://localhost:3000/?obs=1&v=10`.
