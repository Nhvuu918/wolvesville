/* ==========================================================================
   MA SÓI NHẬP VAI — Sân Khấu Cổ Tích Đen (app.js)
   1. Dữ liệu 100 Thân Phận (Bộ 52 chuẩn #01–#52 & Mở rộng #53–#100)
   ========================================================================== */
const ROLES = [
  {
    "id": 1,
    "name": "Sói Đạo Tặc",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm bạn có thể chọn một người chơi. Nếu người chơi này được bảo vệ, bạn sẽ cướp đi lớp bảo vệ đó và sống sót qua một đòn tấn công lên bản thân mình. Bạn chỉ có thể cướp đi một lớp bảo vệ duy nhất."
  },
  {
    "id": 2,
    "name": "Dorothy",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, Dorothy đến thăm một người chơi để thu thập một trong ba đặc điểm: trí tuệ từ người chơi có khả năng thu thập thông tin (vd: Tri, Vĩ Cầm), trái tim từ người chơi có khả năng bảo vệ, hoặc lòng dũng cảm từ người chơi có khả năng giết chóc. \n\n Khi Dorothy đã có đủ cả ba, họ có thể ném một xô nước vào bất kỳ người chơi nào bất cứ lúc nào. Nếu người chơi đó là kẻ xấu, họ sẽ bị giết, nếu không thì nước sẽ bị lãng phí. Trong khi đến thăm, Dorothy không thể bị giết trực tiếp, nhưng nếu mục tiêu của họ chết, họ cũng sẽ chết theo.\n\n Lưu ý: Khi Dorothy ghé thăm char thuần giết/ soi/ vệ mới được tính thành công, nghĩa là char chỉ có một chức năng giết/ soi/ vệ không trộn lẫn chức năng khác. \n Ví dụ Tri thuần soi, Phù thuần giết dù có 2 bình vừa giết vừa cứu, nhưng bình cứu không tính là bảo vệ"
  },
  {
    "id": 3,
    "name": "Sói Tiên Tri",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm, bạn có thể chọn một người chơi để xem vai trò thuộc chức năng soi/ giết người/ bảo vệ,... Nếu bạn là ma sói cuối cùng hoặc bạn từ bỏ khả năng của mình, bạn sẽ trở thành ma sói thường.\n\n Tiên Tri soi Sói Tiên Tri ra hào quang 'Thiện'"
  },
  {
    "id": 4,
    "name": "Người Buôn Bí",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, bạn có thể đưa ra một thỏa thuận cho một người chơi khác. Họ có thể chấp nhận hoặc từ chối đề nghị của bạn vào ngày hôm sau. Nếu họ chấp nhận, một trong các kết quả ngẫu nhiên sau sẽ xảy ra: 10% chết ngay lập tức, 30% được bảo vệ khỏi các cuộc tấn công trong đêm tiếp theo, 20% nhận được một viên đạn để giết một người chơi khác, 20% bị chặn kỹ năng trong đêm tiếp theo hoặc 20% không có gì xảy ra."
  },
  {
    "id": 5,
    "name": "Thẩm Phán Linh Hồn",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Cân Phán Quyết: Hai lần trong trò chơi, mỗi đêm TPLH có thể chọn một người chơi và đặt linh hồn của họ lên bàn cân đã có sẵn Lông Vũ Phán Quyết. Nếu linh hồn người đó nhẹ hơn lông vũ → thiện, nếu nặng hơn → ác/không xác định. Kỹ năng này không bị nhiễu bởi bất kì char nào, soi đúng 100%. \n\n Công Lý Tuyệt Đối: Với mỗi người soi ra thiện, TPLH có khả năng bảo vệ họ khỏi mọi tác động khiến người đó bị đổi sang phe ác/không xác định. Tuy nhiên, TPLH có thể bị kéo sang phe khác, khi đó TPLH có quyền quyết định muốn bảo vệ người soi ra thiện không bị đổi phe hay không."
  },
  {
    "id": 6,
    "name": "Đạo Diễn Tử Thần",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Diễn Viên Sát Nhân.\n\nKỹ năng Đạo Diễn Sân Khấu:\n- Mỗi đêm, ĐDTT được chọn 2 người chơi khác nhau và gán cho mỗi người một vai diễn. Người được chọn sẽ được thông báo riêng rằng mình đang có một vai diễn nhưng không biết bản thân được giao vai gì.\n- Một người chơi không được nhận vai diễn trong 2 đêm liên tiếp.\n\nCác vai diễn:\n- Vai Kẻ Vu Khống: Người được giao vai bắt buộc phải là người đầu tiên thực hiện hành động vote hợp lệ vào sáng hôm sau.\n- Vai Kẻ Chết Thay: Người được giao vai phải nhận >= 2 lượt vote trong buổi bỏ phiếu sáng hôm sau\n\nCơ chế Oscar:\n- Nếu một người diễn sai vai được giao, ĐDTT nhận 1 giải Oscar từ người đó.\n- Nếu cả hai người đều diễn sai, ĐDTT nhận tổng cộng 2 giải Oscar.\n- Nếu một trong hai người được gán vai chết trong đêm, ĐDTT nhận 1 giải Oscar từ người còn lại.\n- Hai người được giao vai có thể công khai trao đổi và bàn bạc với nhau trong group chung.\n\nGhi chú:\n- Nếu ĐDTT chết, các giải Oscar đã tích lũy vẫn được giữ nguyên để Diễn Viên Sát Nhân có thể tiếp tục sử dụng.\n"
  },
  {
    "id": 7,
    "name": "Diễn Viên Sát Nhân",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Đạo Diễn Tử Thần.\n\nKỹ năng Đóng Thế:\n- 1 lần sử dụng trong trò chơi, Diễn Viên có thể kích hoạt kỹ năng để bảo vệ ĐDTT khỏi một lần tấn công trong đêm, đòn tấn công sẽ bị vô hiệu hóa và người thực hiện hành động tấn công sẽ chết do phản đòn\n - Kỹ năng không có tác dụng đối với việc ĐDTT bị treo cổ thông qua bỏ phiếu.\n\nKỹ năng Huyết Tế Sân Khấu:\n- Khi ĐDTT có ít nhất 1 giải Oscar, mỗi đêm Diễn Viên có thể sử dụng 1 giải Oscar để ám sát một người chơi đã từng diễn sai vai do ĐDTT giao.\n- Mỗi lần sử dụng sẽ tiêu hao 1 giải Oscar, bất kể mục tiêu có bị giết thành công hay không.\n\nĐiều kiện thắng:\n- Thắng khi toàn bộ người chơi thuộc phe Dân Làng bị loại bỏ\n- Nếu ĐDTT chết trước khi điều kiện thắng trên xảy ra, Diễn Viên Sát Nhân vẫn có thể giành chiến thắng bằng cách hoàn thành đủ 3 phân cảnh sau:\n  + Cảnh 1: Có ít nhất một người chơi chết do kỹ năng Huyết Tế Sân Khấu của Diễn Viên Sát Nhân.\n  + Cảnh 2: Có ít nhất một người chơi chết do bị phản đòn từ kỹ năng Đóng Thế khi thực hiện tấn công ĐDTT.\n  + Cảnh 3: Có ít nhất một người từng được giao vai Kẻ Chết Thay chết vào ban ngày, bao gồm cả trường hợp bị treo cổ thông qua bỏ phiếu.\n- Các phân cảnh được ghi nhận ngay từ đầu trò chơi, kể cả khi ĐDTT chưa chết. Tuy nhiên, điều kiện chiến thắng bằng 3 phân cảnh chỉ được kích hoạt và xét sau khi ĐDTT chết.\n"
  },
  {
    "id": 8,
    "name": "Kỵ Sĩ Không Đầu",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm, bạn có thể lấy mạng một người chơi. Vì bạn không có đầu nên bạn không thể bị treo cổ cho đến khi tất cả ma sói đều bị giết. Ma sói có thể giết bạn. Bạn thắng nếu bạn là người chơi cuối cùng."
  },
  {
    "id": 9,
    "name": "Thiên Sứ Tuyết",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, bạn có thể chọn một người chơi để bảo vệ khỏi một lần tấn công trong hai đêm liên tiếp. Hiệu lực bảo vệ vẫn tiếp tục ngay cả khi bạn bị giết. Bạn có thể bảo vệ tối đa 3 người chơi khác nhau trong một ván, và không thể bảo vệ cùng một người hai lần."
  },
  {
    "id": 10,
    "name": "Sói Kỹ Sư",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Chức năng: Hai lần trong trò chơi, sói có quyền chọn một người chơi để \"Đặt bẫy\". Lưu ý chỉ được bẫy mỗi người một lần trong cả ván. \n\n Cơ chế: Nếu sói đặt bẫy lên char nào, char đó sẽ bị lỗi và phản tác dụng lên chính người sử dụng\n\n Vd: Sói bẫy Tiên tri nhận kết quả ngược, nhưng bẫy người bị Tri soi không ảnh hưởng kết quả soi nhưng sẽ ảnh hưởng chức năng của chính người đó\n Sói bẫy Vệ nếu vệ ai sẽ làm mục tiêu chết\n Phù thủy dính bẫy ném độc không chết nhưng cứu lại khiến người đó chết"
  },
  {
    "id": 11,
    "name": "Thợ Rèn Cơ Khí",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Chức năng: Mỗi đêm, chọn 1 người chơi để \"Nâng cấp\" hoặc \"Bảo trì\". \n Cơ chế: \n - Nâng cấp: Có 2 lần giúp chức năng của người được chọn x2 lần \n - Bảo trì: Giúp mục tiêu miễn nhiễm với mọi hiệu ứng làm nhiễu hoặc chặn chức năng trong đêm đó. \n Ghi chú: Không thể nâng cấp cho chính mình."
  },
  {
    "id": 12,
    "name": "Búp Bê Nguyền Rủa",
    "team": "phe3",
    "teamName": "Không rõ",
    "aura": "Không xác định",
    "desc": "Chức năng: Búp bê bắt đầu ở một người chơi ngẫu nhiên được random. Người bị nguyền rủa sẽ được thông báo đang giữ Búp Bê\n Mỗi đêm, người giữ búp bê phải chuyển nó cho người khác. Đồng thời Búp Bê Nguyền Rủa cũng được thông báo riêng bản thân đã được chuyền cho những ai\n\n Cơ chế: Nếu người đang giữ búp bê bị chết, búp bê sẽ \"ám\" người đó (tính vào mục tiêu thắng). Búp Bê có thể được chuyền lại cho người đã từng bị nguyền rủa. \n\n Khi tất cả người từng bị nguyền rủa đều chết hoặc chỉ duy nhất người bị nguyền gần nhất còn sống, Búp Bê Nguyền Rủa thắng"
  },
  {
    "id": 13,
    "name": "Sói Truyền Thông",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Chức năng: Mỗi đêm, chọn một \"Từ khóa\" (ví dụ: \"Sói\", \"Tôi\", \"Treo\"). Cơ chế: Nếu sáng hôm sau (trừ phe sói) 2 người đầu tiên trong buổi thảo luận nói từ này, người đó sẽ bị \"Đánh dấu\". Phiếu bầu của người bị đánh dấu sẽ không có giá trị vào ngày đó. Từ này sẽ không được quản tiết lộ công khai trên group."
  },
  {
    "id": 14,
    "name": "Fan Cuồng",
    "team": "phe3",
    "teamName": "Không rõ",
    "aura": "Không xác định",
    "desc": "Mục tiêu: Vào đêm đầu tiên, Fan Cuồng phải chọn một người chơi làm \"Thần Tượng\". Mục tiêu của Fan Cuồng là cùng Thần Tượng sinh tồn đến cuối ván đấu, trở thành hai người chơi cuối cùng còn sống.\n\nChức năng: Mỗi đêm, Fan Cuồng có thể lựa chọn một trong hai hành động sau:\n- Khiên bảo vệ: có 2 lần bảo vệ Thần Tượng khỏi tấn công trong đêm đó. Khiên chỉ có tác dụng bảo vệ Thần Tượng, không thể bảo vệ bản thân Fan Cuồng và không có tác dụng vào ban ngày.\n- Súng trừng phạt: Không giới hạn số lần sử dụng, nhưng mỗi lần sử dụng chỉ có 50% tỷ lệ thành công, hệ thống sẽ random và đưa ra kết quả có thành công hay không.\n\nGhi chú:\n- Mỗi đêm, Fan Cuồng chỉ được lựa chọn một trong hai hành động Khiên bảo vệ hoặc Súng trừng phạt\n- Vào đêm đầu tiên, Fan Cuồng và Thần Tượng sẽ được đưa vào chung một group để có thể trao đổi và hợp tác với nhau.\n- Thần Tượng được giữ nguyên toàn bộ chức năng, phe và hào quang ban đầu trong thời gian Fan Cuồng còn sống.\n- Nếu Fan Cuồng chết, Thần Tượng lập tức trở về phe ban đầu, đồng thời giữ nguyên toàn bộ chức năng và hào quang. Fan Cuồng chết không kéo theo Thần Tượng và ngược lại.\n- Nếu Thần Tượng chết, Fan Cuồng lập tức mất toàn bộ chức năng ban đầu và chuyển thành Chán Đời, thắng khi bị treo cổ vào ban ngày.\n\nĐiều kiện thắng:\n- Phe Fan Cuồng: Chiến thắng khi Fan Cuồng và Thần Tượng là hai người chơi cuối cùng còn sống.\n- Chán Đời: Nếu Thần Tượng chết, Fan Cuồng chuyển thành Chán Đời và chiến thắng khi bị treo cổ vào ban ngày."
  },
  {
    "id": 15,
    "name": "Ông Kệ Noel",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Vào ban ngày, bạn có thể chọn hai người chơi để tham gia trao quà vào ban đêm. Họ sẽ bí mật quyết định có gửi cho nhau một món quà chí tử hay không\n\n Kết quả: \n - Cả hai gửi quà, cả hai chết. \n - Chỉ một người gửi quà, người nhận chết. \n - Không ai gửi quà, một người sẽ bị random giết ngẫu nhiên. \n\n Nếu một trong hai mục tiêu bị giết bằng bất kỳ cách nào khác trong đêm, người còn lại sẽ tự động chết. Bạn có thể chọn bản thân làm một trong hai mục tiêu để đảm bảo người còn lại sẽ chết. Hai người chơi được chọn ngẫu nhiên cho đêm đầu tiên.\nBạn không thể bị giết bởi ma sói.\n\nBạn thắng nếu bạn là người chơi cuối cùng."
  },
  {
    "id": 16,
    "name": "Thần Tình Yêu Hắc Ám",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm, bạn có thể chọn lên đến hai người chơi để kết tơ hồng. \n\n - Nếu bạn chọn một người chơi, họ sẽ chết. \n - Nếu bạn chọn hai người, họ sẽ bị ràng buộc với nhau, nếu một người chết, người kia cũng sẽ chết theo. \n\n Những người chơi được kết tơ hồng sẽ không biết rằng họ bị ràng buộc. Bạn chỉ có thể kết tơ hồng với mỗi người một lần.\nBạn không thể bị giết bởi ma sói.\n\nBạn thắng nếu bạn là người chơi cuối cùng."
  },
  {
    "id": 17,
    "name": "Phù Thủy Cấm Kỵ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Kỹ năng Đài Phun Thuốc Độc:\n- Có 2 lần sử dụng trong trò chơi. Vào ban đêm, PTCK có thể kích hoạt kỹ năng và chọn tối đa 2 người chơi để gieo độc.\n- Người được chọn sẽ nhận trạng thái Nhiễm Độc, nhưng không chết ngay lập tức và bản thân họ cũng không biết mình đã bị nhiễm độc.\n- Vào đêm kế tiếp, nếu người nhiễm độc thuộc phe Sói hoặc phe thứ ba, họ sẽ bị vô hiệu hóa toàn bộ kỹ năng trong đêm đó\n- Nếu người nhiễm độc thuộc phe Dân, họ sẽ không bị ảnh hưởng.\n- Sau khi hiệu ứng phát tác, trạng thái Nhiễm Độc sẽ tự động biến mất.\n\nKỹ năng Bình Thuốc Giải:\n- Có 2 lần sử dụng trong trò chơi. Vào ban đêm, PTCK có thể sử dụng thuốc giải lên một người chơi bất kỳ, bao gồm cả bản thân.\n- Người được sử dụng thuốc giải sẽ được bảo vệ khỏi một lần tấn công gây chết trong đêm đó.\n- Thuốc giải chỉ có hiệu lực trong đêm sử dụng và sẽ tự động biến mất vào sáng hôm sau.\n- Người nhận thuốc giải sẽ không biết bản thân đã được sử dụng thuốc."
  },
  {
    "id": 18,
    "name": "Nữ Tu Huyết Thệ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Kỹ năng Ánh Sao Báo Thù: mỗi đêm NTHT có thể chọn một người để ban phước cho họ, sau khi được ban phước, người đó được +1 lần giết/vệ/soi trong đêm đó. Lưu ý những ai đã được ban phước sẽ không ban phước lần nữa\nVí dụ: Bình thường Vệ mỗi đêm vệ 1 người, nếu được ban phước sẽ vệ 2 người. Nhưng nếu ban phước trúng phe 3 hoặc sói thì đêm đó họ có thể cắn/giết/ảo ảnh nhiều hơn 1 người so với bình thường\n\nKỹ năng Thiêng Khí Phán Xét: một lần duy nhất vào ban ngày NTHT có thể công khai danh tính bản thân để phán xét một người. Nếu người đó là sói/phe 3 sẽ bị mất chức năng vĩnh viễn, nếu là dân NTHT sẽ bị câm suốt ván"
  },
  {
    "id": 19,
    "name": "Búp Bê Ma Ám",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Kỹ năng ám linh:\n- 3 lần trong trò chơi. Mỗi đêm, BBMA có thể chọn một người chơi còn sống để ám, người này sẽ chết ngay trong đêm đó\n\nKỹ năng lời nguyền tái thế:\n- Khi chết lần đầu, vào đêm kế tiếp, BBMA có thể chọn một người chơi còn sống để thế thân và hồi sinh bằng cơ thể của họ. Người được chọn sẽ thực sự chết và BBMA sẽ mang thân phận, vai trò của người đó.\n- BBMA được kế thừa kỹ năng còn lượt sử dụng của vật chủ\n- Khi bị kiểm tra, BBMA hiện đúng hào quang của vật chủ nhưng vẫn thuộc Phe Ba.\n Nếu BBMA chết lần nữa mới chết hoàn toàn\n\nGhi chú:\n- Sau khi hồi sinh, thi thể ban đầu của BBMA vẫn nằm trong danh sách người chết. Dân làng và các phe khác phải tìm đúng thi thể BBMA trong số những người đã chết và tiêu diệt lần nữa.\n- Nếu sử dụng kỹ năng hoặc tài nguyên lên thi thể không phải BBMA, lượt sử dụng và tài nguyên vẫn bị trừ bình thường\n\n Sói không thể cắn BBMA\n Thắng khi chỉ còn BBMA sống sót"
  },
  {
    "id": 20,
    "name": "Sói Biến Hình",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm chọn một người để sao chép vai trò – sáng hôm sau nếu người đó chết, SBH sẽ nhận vai trò của họ đến hết ván. Nếu biến hình thành công thì không được sao chép nữa."
  },
  {
    "id": 21,
    "name": "Kẻ Mặc Cả Bóng Tối",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Kỹ năng 'GIAO DỊCH ẨN DANH': Mỗi đêm chọn một người và gửi một trong các giao kèo cụ thể sau (mỗi loại tối đa 1 lần):\n- Giao kèo Im Lặng: Nếu bạn KHÔNG dùng kỹ năng đêm nay, bạn sẽ được bất tử trong đêm nay.\n- Giao kèo Lá Phiếu: Nếu ngày mai bạn bỏ phiếu theo chỉ định của tôi, bạn sẽ được miễn nhiễm treo cổ vào ngày mai.\n- Giao kèo Che Giấu: Nếu bạn KHÔNG phát biểu hoặc nhắc tên tôi vào ngày mai, đêm sau bạn sẽ biết được phe của 1 người bất kỳ.\n- Giao kèo Thao Túng: Nếu bạn chấp nhận bị tôi đổi hướng mục tiêu kỹ năng vào đêm nay, đêm sau bạn sẽ được chọn xem vai trò chính xác của 1 người chết.\nNếu có 3 giao kèo thành công, KMCBT thắng.\n\nKỹ năng 'TRỪNG PHẠT NGẦM': Khi có người đồng ý nhưng lại phá giao kèo, có thể chọn trừng phạt bằng cách khiến người đó không thể dùng kỹ năng 2 đêm tiếp theo và mất quyền vote trong 2 ngày đó.\n\nKỹ năng 'GIAO DỊCH BẢN THÂN': Kích hoạt khi 2 đêm liên tiếp không có giao dịch thành công, KMCBT có thể chọn:\n1. Gia nhập một phe khác và thắng cùng họ.\n2. Chọn 1 trong 3 nhiệm vụ đơn độc (nếu hoàn thành, KMCBT thắng một mình):\n   - Nhiệm vụ 1: Sống sót cho đến khi trò chơi còn đúng 3 người tính cả KMCBT.\n   - Nhiệm vụ 2: Khiến 1 người chơi do quản trò chỉ định bị treo cổ vào Ban Ngày.\n   - Nhiệm vụ 3: Bảo vệ 1 người chơi cụ thể sống sót từ đầu đến hết game."
  },
  {
    "id": 22,
    "name": "Sói Kí Sinh",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Chọn một người để ký sinh vào đêm đầu tiên. Nếu bạn bị chết, bạn sống lại trong cơ thể người đó, chiếm quyền điều khiển họ (Cách chơi tương tự Kẻ Tái Sinh)."
  },
  {
    "id": 23,
    "name": "Sói Gai Độc",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Nếu bị bắn hoặc soi, người thực hiện hành động bị thương, mất khả năng 1 đêm tiếp theo."
  },
  {
    "id": 24,
    "name": "Sói Khát Máu",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Nếu trong một buổi sáng có 2 người trở lên chết đi, vào đêm kế tiếp bầy sói có thể cắn 2 mạng."
  },
  {
    "id": 25,
    "name": "Người Giao Dịch",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Một lần duy nhất, NGD có thể trao đổi chức năng của mình cho người khác. NGD sẽ không biết chức năng của người đó cho tới khi trao đổi thành công\n\n Nếu người đó nhận sẽ trở thành NGD nhưng không còn chức năng trao đổi mà được cấp 2 viên đạn chỉ bắn được vào ban đêm. Bản thân NGD sẽ lấy char của người vừa đồng ý trao đổi, sử dụng hết số tài nguyên còn lại. \n\n Nếu NGD chọn trúng sói hoặc phe 3, giao dịch thành công sẽ -1 viên đạn. Nếu sau 2 lần đều chọn trúng sói hoặc phe 3, NGD mất quyền trao đổi."
  },
  {
    "id": 26,
    "name": "Xạ Thủ Linh Hồn",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Khi còn sống, XTLH có 1 lần dùng khiên để bảo vệ chính mình hoặc người khác\n\nNếu chết, quản thông báo với toàn dân, đồng thời vào đêm tiếp theo XTLH được cấp 2 viên đạn và bí mật hồi sinh để cùng dân giết sói và phe 3, không ai biết XTLH là ai và đã hồi sinh hay chưa\n\n XTLH có thể bị giết lần 2 nếu dân làng nghi ngờ là BBMA hoặc bị sói/ phe 3 giết\nXTLH không thể vote sau khi đã chết\nNếu chết lần 2 mới chết thật sự"
  },
  {
    "id": 27,
    "name": "Quản Ngục",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban ngày, bạn có thể chọn một người chơi để giam vào ngục vào đêm hôm sau! Bạn có thể nói chuyện ẩn danh với người chơi bị giam vào ban đêm. Người đó không thể sử dụng khả năng của họ và sẽ không bị tấn công. Bạn có một viên đạn để giết người chơi bị giam vào ngục trong đêm."
  },
  {
    "id": 28,
    "name": "Tiên Tri",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm bạn có thể xem vai trò của người chơi khác."
  },
  {
    "id": 29,
    "name": "Thầy Đồng",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào buổi đêm bạn có thể trò chuyện ẩn danh với người chết. Bạn có khả năng chọn một dân làng đã chết trong đêm và hồi sinh họ khi đêm kết thúc một lần trong ván đấu."
  },
  {
    "id": 30,
    "name": "Cupid",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Vào đêm đầu tiên, Cupid sẽ chọn ra hai người ghép cặp với nhau, họ sẽ biết được mặt và vai trò của nhau, đồng thời giữ nguyên hào quang cũ của họ. \n Nếu một người chết, người kia cũng chết theo. Bất kể phe cũ của họ là gì thì hiện tại họ phải loại tất cả những người chơi còn lại để thắng cùng Cupid, hoặc nếu cặp này chết, Cupid thành dân thường\n Cupid có thể tự ghép chính mình."
  },
  {
    "id": 31,
    "name": "Thằng Ngố",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Bạn phải lừa dân làng treo cổ bạn. Nếu họ treo cổ bạn, bạn thắng."
  },
  {
    "id": 32,
    "name": "Phù Thủy",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Sở hữu hai bình thuốc, một bình để cứu một người, một bình để giết một người. Phù thuỷ chỉ được sử dụng mỗi bình một lần trong cả ván chơi và có thể sử dụng cả hai bình trong một đêm. \n Mỗi đêm, quản trò gọi Phù thuỷ dậy và cho Phù thuỷ biết hôm qua ai đã bị giết vào đêm đó và Phù thuỷ có quyền quyết định có cứu người đó hay không. Sau đó, quản trò sẽ hỏi Phù thuỷ có muốn dùng bình \"giết\" giết ai đó không."
  },
  {
    "id": 33,
    "name": "Sói Trắng",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Sói trắng cũng thức dậy chung với Sói thường. Nhưng cứ hai đêm một lần hắn có quyền giết một con Sói thường khác. Nhiệm vụ của Sói trắng là trở thành Sói duy nhất còn sống."
  },
  {
    "id": 34,
    "name": "Bảo Vệ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, Bảo Vệ có quyền chọn một người để bảo vệ nhưng không được vệ một người hai đêm liên tiếp, có thể vệ cùng một người nhưng cách ngày."
  },
  {
    "id": 35,
    "name": "Xạ Thủ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Xạ Thủ có 3 viên đạn, có quyền bắn cả ngày hoặc đêm với điều kiện chỉ chọn bắn ngày hoặc đêm trong hôm đó."
  },
  {
    "id": 36,
    "name": "Sói Lừa Gạt",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Ảo ảnh: Một lần trong ván có thể hiện lên là dân làng khi bị tiên tri soi\n\nThao túng: Một lần trong ván có khả năng ép buộc một người bỏ phiếu theo mình vào ban ngày (quản vẫn cho người bị thao túng tự vote nhưng sẽ hỏi ý Sói Lừa Gạt muốn vote ai.\nVd. A bị thao túng, A vote B. Sói Lừa Gạt vote C thì phiếu bầu của A theo SLG)\n\nBáo thù: Nếu bị treo cổ, được chọn một dân làng để kéo chết theo."
  },
  {
    "id": 37,
    "name": "Sói Mộng Du",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm sẽ đi lang thang và chọn một người, nếu chọn trúng dân làng sẽ làm mất chức năng trong đêm của người đó"
  },
  {
    "id": 38,
    "name": "Sói Gương",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm có thể phản chiếu hào quang của người cuối cùng bị bầy sói giết (nghĩa là Tri soi Sói Gương ra hào quang người bị bầy sói giết từ đêm trước). Nếu bị soi 2 lần sẽ lộ nguyên hình Sói"
  },
  {
    "id": 39,
    "name": "Pháp Sư",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Có hai quả cầu lửa và một khiên hộ vệ, mỗi đêm Pháp Sư sẽ ném một quả cầu vào một người\nMột lần duy nhất, Pháp Sư có thể nâng khiên hộ vệ bảo vệ một người, khi bảo vệ thành công, vai trò của người đó sẽ được quản tiết lộ cho bạn\n\n Lượt bảo vệ bị trừ kể cả khi người được bảo vệ không bị tấn công, Pháp Sư không thể tự bảo vệ mình"
  },
  {
    "id": 40,
    "name": "Ảo Thuật Gia",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Khả năng: Mỗi đêm có thể chọn hai người chơi và tráo đổi trạng thái của họ. Các hiệu ứng có thể bao gồm:\n\nNếu một trong hai người bị giết, người kia sẽ chết thay.\n\nNếu một trong hai người bị soi, người kia sẽ bị nhận nhầm danh tính.\n\nNếu một trong hai người bị bỏ phiếu chết vào ban ngày, người kia sẽ bị treo cổ thay thế."
  },
  {
    "id": 41,
    "name": "Nhà Sưu Tầm Linh Hồn",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Khả năng: Mỗi khi một người chơi chết, Nhà Sưu Tầm Linh Hồn có thể chọn hút linh hồn của họ để tích lũy. Tùy thuộc vào loại linh hồn đã hút, nhận được kỹ năng sử dụng một lần:\n- Linh hồn Sói: Đêm tiếp theo, có thể chọn một người để cắn.\n- Linh hồn Tiên Tri: Đêm tiếp theo, có thể soi chính xác vai trò của một người.\n- Linh hồn Bảo Vệ: Đêm tiếp theo, tự bảo vệ bản thân khỏi 1 lần tấn công\n- Linh hồn Dân Khác: Trong ngày tiếp theo, được quyền đổi phiếu bầu của mình thành 2 phiếu trong một lần treo cổ.\n- Linh hồn Phe Thứ Ba: Đêm tiếp theo, khóa kỹ năng của một người bất kỳ khiến họ không thể dùng chức năng.\n\nMiễn nhiễm với hiệu ứng cắn của Sói. Hào quang của Nhà Sưu Tầm Linh Hồn sẽ hiển thị giống với vai trò của linh hồn gần nhất mà nhân vật đang lưu trữ."
  },
  {
    "id": 42,
    "name": "Kẻ Trộm Chó",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Nếu còn Exciter, mỗi đêm Kẻ Trộm Chó có thể dùng Exciter để bắt 1 người. Nếu người đó là sói, sói đó chết. Nếu người đó là dân, Kẻ Trộm Chó bị dân đập túi bụi và bị tịch thu xe vào đêm tiếp theo. Nếu Kẻ Trộm Chó bị đập 3 lần, Kẻ Trộm Chó chết ngay trong đêm. Kẻ Trộm Chó thắng sau khi có nhiều hơn một nửa số sói trong đàn bị Kẻ Trộm Chó giết, hoặc thắng cùng các phe ba khác nếu điều kiện đầu tiên không được đáp ứng"
  },
  {
    "id": 43,
    "name": "Hoàng Hậu",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm chọn 1 người và hỏi câu hỏi với đáp án A/B. Người bị chọn sẽ được quản trò gọi dậy riêng, và đưa ra câu trả lời, khác với đáp án của Hoàng Hậu người bị chọn sẽ chết. Hoàng Hậu phe 3, thắng vòng 3 người. Sói không cắn được."
  },
  {
    "id": 44,
    "name": "Cupid Hắc Ám",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Cupid sau khi ghép đôi, Cupid hắc ám sẽ thức dậy và chọn 1 người trong cặp đôi để ghép đôi với người khác để trở thành Cặp Đôi Ngoại Tình"
  },
  {
    "id": 45,
    "name": "Cặp Đôi Ngoại Tình",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Cặp Đôi Ngoại Tình sẽ trở thành phe thứ ba bất kể trước đó từng là phe nào. Cặp Đôi ngoại tình sẽ chết nếu một trong hai chết. Nếu người còn lại trong Cặp Đôi cũ phát hiện có Cặp Đôi Ngoại Tình, họ có thể nhắn riêng với quản để xác nhận. Nếu xác nhận sai, người đó chết 1 mình. Nếu xác nhận đúng, Cặp Đôi Ngoại Tình cùng chết."
  },
  {
    "id": 46,
    "name": "Sói Bắn Tỉa",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Sói bắn tỉa có 2 viên đạn, vào ban đêm hoặc ban ngày có thể bắn một viên vào người chơi bất kì, lưu ý chỉ chọn bắn ngày hoặc đêm, không được bắn 2 viên vào cùng một ngày"
  },
  {
    "id": 47,
    "name": "Sói Cuồng Yêu",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Ma sói không biết bạn. Ban đêm, bạn có thể làm bánh hoặc tặng bánh cho người chơi khác. Sau khi làm bánh, bạn có thể đưa bánh cho người chơi khác. Người chơi nhận bánh có thể lựa chọn đáp lại tình yêu hoặc không! Khi được đáp lại tình cảm, bạn và họ sẽ trở thành một phe mới (giống couple) và tiết lộ vai trò cho nhau. Bạn có thể tối đa tặng bánh cho ba người chơi. Nếu quá ba người chơi không một ai đáp lại tình cảm của bạn, bạn sẽ từ bỏ chức năng của mình trở thành một Ma sói thường (khi đó quản add sói cuồng yêu vào box sói)\n\nLưu ý:\nMỗi đêm sói cuồng yêu báo quản sẽ tặng bánh cho ai, quản sẽ chuyển thay bánh tới người đó và thông báo người kia có đáp lại tình cảm không\nKhi trở thành một phe với ai đó, sói cuồng yêu có thể cắn một người khác vào mỗi đêm như bầy sói (có thể cắn cả sói nhưng không thể cắn solo)\nNgười cùng phe với sói cuồng yêu giữ nguyên chức năng"
  },
  {
    "id": 48,
    "name": "Người Cầu Nguyện",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban đêm, bạn có thể chọn một người chơi để cầu nguyện. Nếu họ chết, khả năng cầu nguyện của bạn sẽ được thay thế bằng một khả năng mới dựa trên hào quang của họ:\n\nHào quang tốt: Cứu một người chơi đó vào ban đêm\n\nHào quang tà ác: Bạn có thể giết bất kỳ người chơi nào ở bất kỳ giai đoạn nào của trò chơi.\n\nHào quang không xác định: Có thể sử dụng vào ban ngày để khám phá vai trò thực sự của một ai đó."
  },
  {
    "id": 49,
    "name": "Hắc Tinh",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Là 1 phần của Hắc Bạch Sát Tinh.\nKhi Hắc Tinh chết, tất cả phe sói sẽ mất hết chức năng và Bạch Sát được quyền chọn 1 người để giết mỗi đêm\nThầy Đồng không thể hồi sinh.\nKhi Bạch Sát chết, Hắc Tinh được quyền chọn 1 người để giết mỗi đêm"
  },
  {
    "id": 50,
    "name": "Bạch Sát",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Là 1 phần của Hắc Bạch Sát Tinh.\nKhi Bạch Sát chết tất cả phe dân sẽ mất hết chức năng trừ Tiên tri, Bảo vệ/Hộ vệ và Hắc Tinh được quyền chọn 1 người để giết mỗi đêm \n Thầy Đồng không thể hồi sinh bạn\nKhi Hắc Tinh chết, Bạch Sát được quyền chọn 1 người để giết mỗi đêm"
  },
  {
    "id": 51,
    "name": "Sói Thủ Lĩnh",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Khi chỉ còn mình sói thủ lĩnh còn sống, vào mỗi đêm nó có thể cắn hai mạng"
  },
  {
    "id": 52,
    "name": "Sói Ảo Ảnh",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Hai lần trong đêm được phép bật chức năng ảo ảnh, khi đó Tiên Tri soi một người bất kì đều cho ra phe sói"
  },
  {
    "id": 53,
    "name": "Sói Gây Tê",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Ban đêm bạn có thể sử dụng kỹ năng của mình để khiến 1 người chơi không thể dùng chức năng vào ban đêm và bị câm vào sáng hôm sau.\n\nLưu ý: sau khi sử dụng chức năng phải nghỉ ngơi 1 đêm mới dùng lại được"
  },
  {
    "id": 54,
    "name": "Người Lái Đò",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Người lái đò có thể nói chuyện ẩn danh với người chết vào ban đêm . Họ có thể chở một hoặc hai người chơi vào ban đêm . Nếu một trong những người chơi này bị giết vào đêm đó , người chơi đó sẽ vẫn hoạt động trong suốt giai đoạn Thảo luận và Biểu quyết tiếp theo , sau đó các mục tiêu sẽ chết và trở lại nghĩa địa. Người lái đò có thể kéo dài tuổi thọ của tối đa hai người chơi bằng khả năng này."
  },
  {
    "id": 55,
    "name": "Chó Canh Gác",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, bạn có thể chỉ định hai chú chó bảo vệ của mình để bảo vệ những người chơi khác. Một chú chó chặn các cuộc tấn công của người sói, trong khi chú chó kia chặn các cuộc tấn công của kẻ giết người solo. Bạn có thể bảo vệ tối đa hai đêm"
  },
  {
    "id": 56,
    "name": "Thiên Thần",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Chọn 1 người để bảo vệ mỗi đêm, bạn chết người đó sẽ chết theo\n\nNếu bảo vệ thành công 1 người, vào sáng hôm sau bạn có quyền chọn để giết 1 người nhưng sẽ bị lộ chức năng\n\nThầy đồng không thể hồi sinh bạn"
  },
  {
    "id": 57,
    "name": "Người Canh Gác",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Kể từ sau giai đoạn bỏ phiếu ngày thứ nhất, Người Canh Gác có thể bắn hoặc tiết lộ người chơi khác. Cả hai hành động có thể được thực hiện một lần, nhưng không thể làm cả hai một ngày."
  },
  {
    "id": 58,
    "name": "Sói Thạch",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Vào ban đêm, Sói Thạch có thể lựa chọn một người chơi sẽ được bảo vệ một lần khỏi dân làng vào ngày và đêm tiếp theo, bao gồm cả chức năng giết người và treo cổ. Chức năng giết người đó sẽ bị tiêu hao. Khi Sói Thạch cứu thành công một người chơi, Sói Thạch sẽ mất đi chức năng và trở thành một ma sói bình thường."
  },
  {
    "id": 59,
    "name": "Kỹ Nữ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban đêm bạn có thể ghé thăm người chơi khác. Nếu bạn bị tấn công vào lúc đó, bạn sẽ không chết. Tuy nhiên, nếu bạn ghé thăm một người chơi bị tấn công hoặc ghé thăm ma sói hay kẻ giết người solo, bạn chắc chắn sẽ chết!"
  },
  {
    "id": 60,
    "name": "Kẻ Biến Hình",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm bạn có thể giết một người chơi và biến thành vai trò của họ. Người chơi kiểm tra thông tin khi kiểm tra bạn sẽ thấy vai trò của bạn là người chơi cuối cùng mà bạn giết."
  },
  {
    "id": 61,
    "name": "Thám Tử Ác Ma",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm bạn có thể lựa chọn hai người chơi, bao gồm bản thân bạn. Nếu hai người chơi đó ở hai phe khác nhau, cả hai bọn họ sẽ chết, còn không thì phe của họ sẽ bị tiết lộ với bạn. Nếu bạn lựa chọn bản thân thì chỉ người còn lại sẽ chết.\nBạn không thể bị giết bởi ma sói.\n\nBạn thắng nếu bạn là người chơi cuối cùng."
  },
  {
    "id": 62,
    "name": "Ná Thủ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban ngày, bạn có thể ném viên đá vào một người chơi khác, khiến họ chấn thương và ngăn chặn họ hành động trong phiên hiện tại và kế tiếp. Ném viên đá vào một người chơi đã bị chấn thương trước đó sẽ giết chết họ và tiết lộ vai trò của bạn cho ngôi làng. Bạn chỉ có thể giết hai người chơi trong một game."
  },
  {
    "id": 63,
    "name": "Người Gọi Hồn",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Trong giai đoạn thảo luận, lựa chọn một dân làng đã chết để biến đổi thành vai trò của họ khi giai đoạn bỏ phiếu bắt đầu. Bạn sẽ quay trở về Người Gọi Hồn khi đến giai đoạn bỏ phiếu kế tiếp. Bạn có thể nói chuyện với người chết vào ban đêm khi còn là Người Gọi Hồn."
  },
  {
    "id": 64,
    "name": "Thiện Xạ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban đêm, bạn có thể đánh dấu một người chơi là mục tiêu của bạn. Sau ngày hôm sau, bạn có thể giết hoặc thay đổi mục tiêu của mình. Nếu bạn cố gắng giết một dân làng, phát bắn của bạn sẽ gây tác dụng ngược và giết chết bạn. Bạn có hai mũi tên."
  },
  {
    "id": 65,
    "name": "Kẻ Xúi Giục",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Khi bắt đầu trò chơi, hai người chơi sẽ gia nhập đội của bạn với vai trò là hội viên: một người là dân làng và một người là sói hoặc vai trò solo giết người. Các hội viên trong phe của bạn chỉ có thể thắng cùng nhau và không thể thắng với phe ban đầu của họ nữa. Với vai trò là Kẻ Xúi Giục bạn có thể gửi các tin nhắn riêng tư đến họ. Hai hội viên sẽ bị liên kết với nhau, điều đó có nghĩa nếu một trong hai người chết, người còn lại cũng sẽ chết. Nếu cả hai hội viên của bạn chết, bạn có thể giết một người mỗi đêm."
  },
  {
    "id": 66,
    "name": "Người Gắn Cờ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào đêm thứ hai, Người Gắn Cờ có thể chọn một người chơi để bảo vệ khỏi một cuộc tấn công và người chơi khác sẽ chuyển hướng cuộc tấn công. Người Gắn Cờ có thể chuyển hướng tấn công 2 lần. Sau khi thành công chuyển hướng, Người Gắn Cờ sẽ không thể sử dụng khả năng vào đêm tiếp theo."
  },
  {
    "id": 67,
    "name": "Người Rung Chuông",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban đêm, Người Rung Chuông có thể chọn hai người chơi. Sự lựa chọn có thể thay đổi miễn là một trong hai người chơi được lựa chọn không chết. Nếu một trong hai người chơi chết, vai trò của người chơi còn lại sẽ bị tiết lộ cho Người Rung Chuông."
  },
  {
    "id": 68,
    "name": "Sói Độc Tố",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Sau đêm đầu tiên, hai lần mỗi trò chơi, bạn có thể hạ độc một người chơi vào ban đêm. Vào đêm hôm sau, đòn tấn công của sói lên người chơi này sẽ xuyên qua lớp bảo vệ."
  },
  {
    "id": 69,
    "name": "Người Gác Đêm",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Ba lần trong một trò chơi, người gác đêm có thể bảo vệ một người chơi khỏi sự tấn công vào ban đêm. Lượt bảo vệ sẽ bị tiêu hao kể cả khi họ không bị tấn công. Thêm vào đó, người gác đêm có thể quan sát ai đang được bảo vệ bởi người khác vào ban đêm."
  },
  {
    "id": 70,
    "name": "Thợ Rèn",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Thợ rèn có thể rèn hai chiếc khiên và một thanh kiếm. Chiếc khiên sẽ bảo vệ người chơi khỏi bị tấn công vào ban đêm. Thanh kiếm có thể dùng để giết một người chơi khác."
  },
  {
    "id": 71,
    "name": "Sói Trẻ",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Chọn một người chơi để kéo theo khi bạn chết"
  },
  {
    "id": 72,
    "name": "Sói Mèo",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Có thể biến đổi một dân làng sang đội ma sói. Người chơi không phải là dân làng sẽ ở nguyên phe của họ"
  },
  {
    "id": 73,
    "name": "Sói Lừa Đảo",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Bạn có thể chọn một người chơi vào ban ngày. Khi người chơi đó chết bởi bất cứ tác động nào ngoài Ma sói, bạn sẽ giả danh là vai trò người đó, họ sẽ bị xem như là Sói Lừa Đảo và bạn sẽ được xem như vai trò của người đó khi bị kiểm tra."
  },
  {
    "id": 74,
    "name": "Sát Nhân Ảnh Thuật",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm bạn có thể ngụy trang một người chơi và người chơi này sẽ bị Tiên Tri soi thành Sát Nhân Ảnh Thuật. Bạn có thể giết tất cả người chơi bị dính ảo ảnh trong giai đoạn thảo luận. Bạn không thể bị giết bởi Ma Sói."
  },
  {
    "id": 75,
    "name": "Sói Pháp Sư",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Vào ban đêm, Sói Pháp Sư chọn một người để yểm, người đấy sẽ bị coi là Ma Sói (Ác) bởi Tiên Tri vào ban đêm."
  },
  {
    "id": 76,
    "name": "Sói Lửa",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Khi có ít nhất 1 sói chết, vào Đêm tiếp theo, Sói lửa có thể chọn một người. Người được chọn sẽ bị mất năng lực vĩnh viễn.\n\nKhi có ít nhất 2 sói chết, có thể thực hiện chức năng này thêm 1 lần nữa."
  },
  {
    "id": 77,
    "name": "Tiên Tri Huyền Bí",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Thuộc phe Dân làng. Mỗi đêm, Tiên tri Huyền bí sẽ tỉnh dậy và chỉ định một người. Quản trò sẽ cho Tiên tri Huyền bí biết chính xác người chơi này là Chức năng gì. Đây là một lá bài cực kì mạnh, đem đến lợi thế lớn cho Phe dân làng."
  },
  {
    "id": 78,
    "name": "Sói Điên Cuồng",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Một lần trong trò chơi, bạn có thể kích hoạt trạng thái \"điên cuồng\". Nếu trong đêm nạn nhân được chọn của bạn đang được bảo vệ, nạn nhân của bạn và tất cả những người bảo vệ nạn nhân đó sẽ chết."
  },
  {
    "id": 79,
    "name": "Sói Ác Mộng",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Hai lần trong trò chơi, bạn có thể khiến một người chơi trong ngày \"chìm vào cơn ác mộng\" trong một đêm. Người chơi đó sẽ không thể sử dụng bất kỳ khả năng nào trong một đêm."
  },
  {
    "id": 80,
    "name": "Thợ Săn Quái Thú",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Vào ban đêm, bạn có thể đặt bẫy lên một người chơi, người này không thể bị giết vào ban đêm. Nếu người chơi bị giết, người đã giết đó sẽ chết.\n Có thể tự đặt bẫy để tự vệ."
  },
  {
    "id": 81,
    "name": "Nhà Thiên Văn Học",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Bạn có quyền năng triệu hồi trăng non để ngăn chặn lũ ma sói giết chóc vào ban đêm, và triệu hồi cơn mưa sao băng để giết một người chơi khác. Cả hai quyền năng này chỉ có thể sử dụng một lần duy nhất."
  },
  {
    "id": 82,
    "name": "Sói Hòa Bình",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Một lần trong mỗi trận đấu, bạn có thể tiết lộ vai trò của người chơi và ngăn chặn cuộc bỏ phiếu trong ngày đó. Chỉ có bạn và những ma sói khác mới có thể nhìn thấy vai trò của người chơi đã được tiết lộ."
  },
  {
    "id": 83,
    "name": "Nghệ Sĩ Vĩ Cầm",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, người sở hữu kỹ năng có thể chọn 1 người chơi còn sống để kiểm tra, đối chiếu với 1 người chơi đã chết vào đêm trước đó.\n\n - Nếu cả hai người thuộc cùng một phe, kết quả sẽ là Tiếc Thương.\n- Nếu cả hai người thuộc hai phe khác nhau, kết quả sẽ là Không Tiếc Thương.\n\nKết quả chỉ phản ánh mối quan hệ cùng phe hoặc khác phe giữa hai người, không tiết lộ cụ thể phe phái của họ.\nKết quả Tiếc Thương không đồng nghĩa với việc người được kiểm tra thuộc phe Dân; chỉ cần hai người cùng phe là có kết quả Tiếc Thương."
  },
  {
    "id": 84,
    "name": "Sói Mù",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Mỗi đêm, bạn có thể chọn ngẫu nhiên hai người chơi để khám phá vai trò của họ. Các khả năng bao gồm: dân làng thường, dân làng mạnh, vai trò bỏ phiếu, solo giết người hoặc vai trò khác."
  },
  {
    "id": 85,
    "name": "Nhà Giả Kim",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Bạn có hai lọ thuốc, đỏ và đen. Mỗi đêm, bạn có thể đưa chúng cho hai người chơi khác nhau. Cả hai sẽ được cảnh báo rằng họ có thể chết vào cuối ngày, nhưng chỉ người nhận lọ thuốc đen mới thực sự chết. \n Người chơi không biết họ đã nhận lọ thuốc nào."
  },
  {
    "id": 86,
    "name": "Sói Chiêu Hồn",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Vào ban đêm, bạn có thể ngay lập tức hồi sinh một con sói đã chết trở lại với vai trò là Ma Sói thường."
  },
  {
    "id": 87,
    "name": "Phù Thủy Câm",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, Phù Thủy Câm sẽ được phép chỉ định 1 người bị câm vào hôm sau. Người này vào ngày hôm sau sẽ không được nói."
  },
  {
    "id": 88,
    "name": "Thầy Thôi Miên",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm, Thầy Thôi Miên có thể chọn một người chơi để thôi miên. Nếu Thầy Thôi Miên bị giết trong đêm đó, người bị thôi miên cũng sẽ chết thay. Thầy Thôi Miên không được chọn cùng một người chơi để thôi miên hai đêm liên tiếp"
  },
  {
    "id": 89,
    "name": "Sói Con",
    "team": "soi",
    "teamName": "Phe Sói",
    "aura": "Ác",
    "desc": "Giống Sói thường, nhưng khi Sói con chết, đêm hôm sau Sói sẽ được cắn hai người liên tục."
  },
  {
    "id": 90,
    "name": "Dược Sĩ",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Dược sĩ có 2 Bình: Bình thuốc mê và Bình hồi phục. \n- Bình Thuốc mê: dùng để làm cho một người chơi mất quyền biểu quyết và không được nói chuyện gì vào ngày hôm sau. \n - Bình Hồi phục: Dược sĩ biết ai bị Sói cắn và có thể chọn dùng thuốc cứu người đó.\n\nMỗi chức năng chỉ được sử dụng một lần duy nhất."
  },
  {
    "id": 91,
    "name": "Thợ Săn",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Mỗi đêm, Thợ Săn có quyền ghim một người. Nếu Thợ Săn bị giết hay bị treo cổ, người này chết theo."
  },
  {
    "id": 92,
    "name": "Người Khai Mệnh",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Bạn có hai thẻ bài mà có thể đưa cho người chơi khác vào ban đêm. Họ có thể sử dụng thẻ bài của họ để tiết lộ vai trò của mình. Những người chơi không thuộc phe dân làng có thể lựa chọn tiết lộ vai trò của mình thành một vai trò khác. Khi bạn bị giết, những người chơi với những thẻ bài chưa được sử dụng sẽ bị tiết lộ vai trò thật sự của họ."
  },
  {
    "id": 93,
    "name": "Giáo Chủ",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Mỗi đêm, bạn có thể chọn một người chơi để họ gia nhập giáo phái của bạn. Họ vẫn giữ nguyên vai trò ban đầu của mình. Ngoài ra, bạn có thể hiến tế một thành viên trong giáo phái để giết một người chơi khác. Bạn chỉ có thể có tối đa 5 thành viên giáo phái còn sống cùng lúc, và bạn không thể biến đổi ma sói hoặc những kẻ giết người. Vào ban ngày, bạn có thể gửi tin nhắn riêng cho các thành viên trong giáo phái của mình. Nếu Giáo chủ chết, tất cả thành viên giáo phái sẽ chết theo."
  },
  {
    "id": 94,
    "name": "Huyết Chủ",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Huyết Bộc.\n\nKỹ năng Huyết Ấn: Mỗi đêm, Huyết Chủ thức dậy và chọn 1 người chơi để khắc Huyết Ấn. Người bị đánh dấu hoàn toàn không biết bản thân mang Huyết Ấn và vẫn chơi bình thường. Tuy nhiên, vào ban ngày, phiếu vote của họ sẽ bí mật bị điều khiển theo phiếu vote của Huyết Chủ. Quản trò âm thầm cộng phiếu, không công khai.\n\nNếu Huyết Bộc chết:\n- Những người đang mang Huyết Ấn vẫn giữ dấu ấn nhưng không còn bị điều khiển phiếu vote.\n- Huyết Chủ vẫn có thể tiếp tục sử dụng Huyết Ấn.\n\nĐiều kiện thắng: Phe Huyết Tộc chiến thắng khi trở thành phe duy nhất còn người chơi sống sót."
  },
  {
    "id": 95,
    "name": "Huyết Bộc",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Huyết Chủ.\n\nMỗi đêm, Huyết Bộc chọn một trong hai kỹ năng:\n\n- Kỹ năng Huyết Thuẫn: 2 lần trong trò chơi, Huyết Bộc có thể kích hoạt Huyết Thuẫn để bảo vệ Huyết Chủ khỏi 1 đòn tấn công gây chết trong đêm đó\n\n- Kỹ năng Huyết Cảm: Mỗi đêm, Huyết Bộc có thể chọn 1 người đang mang Huyết Ấn để kiểm tra, kết quả chỉ trả về Dân hoặc Không phải Dân, không tiết lộ vai trò cụ thể. Sau khi kiểm tra, người bị chọn có 25% khả năng tử vong. Quản trò ngẫu nhiên quyết định kết quả theo tỷ lệ 1 chết, 3 sống. \n\nNếu Huyết Chủ chết:\n- Kể từ đêm tiếp theo, Huyết Bộc biến thành Kẻ Đồ Sát, mỗi đêm, Kẻ Đồ Sát được quyền chọn 1 người chơi để giết.\n- Kẻ Đồ Sát chiến thắng độc lập khi trở thành người chơi sống sót cuối cùng."
  },
  {
    "id": 96,
    "name": "Sói Lưu Đày",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Kẻ Giải Nguyền\n\n Sói Lưu Đày không thức dậy cùng bầy sói. \nMỗi đêm, Sói Lưu Đày chọn một người, người này sẽ mất toàn bộ chức năng trong đêm đó và hoàn toàn bị cấm chat, cấm bỏ phiếu vào ban ngày. \n\n Nếu Kẻ Giải Nguyền chết, phong ấn vỡ, Sói Lưu Đày hóa điên, gia nhập bầy sói cũ và bầy sói được cắn 2 người mỗi đêm."
  },
  {
    "id": 97,
    "name": "Kẻ Giải Nguyền",
    "team": "phe3",
    "teamName": "Phe Ba",
    "aura": "Không xác định",
    "desc": "Đi chung với Sói Lưu Đày\n\n Kỹ năng Hình Nhân Thế Mạng: Mỗi đêm, bạn chọn một người chơi bất kỳ để làm \"Hình Nhân\". Nếu trong đêm đó Sói Lưu Đày bị giết, toàn bộ sát thương sẽ bí mật chuyển hướng sang Hình Nhân.\n\n Kỹ năng Che Giấu Khí Tức: Khi Kẻ Giải Nguyền còn sống, nếu Tiên Tri soi trúng Sói Lưu Đày, kết quả luôn bị bóp méo và trả về là \"Thiện\"."
  },
  {
    "id": 98,
    "name": "Người Hái Thuốc",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Đi chung với Thầy Thuốc nhưng không biết đối phương là ai\n\n Mỗi đêm thức dậy chọn 1 người. Nếu người đó thuộc phe Dân, thu được 1 'Thảo dược'. Nếu là Sói hoặc phe 3, thu được 1 'Nọc độc'. \n\n Nếu Thầy Thuốc chết, mỗi đêm Người Hái Thuốc chọn 1 người để 'Đắp thuốc'. Nếu người đó bị tấn công trong đêm, họ sẽ không chết ngay mà thoi thóp sống thêm được 1 ban ngày (vẫn được phát biểu và bỏ phiếu), sau đó sẽ đột tử chết ngay khi cuộc bỏ phiếu ban ngày kết thúc."
  },
  {
    "id": 99,
    "name": "Thầy Thuốc",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Đi chung với Người Hái Thuốc nhưng không biết đối phương là ai\n\n Quản trò cho biết số nguyên liệu hiện có. Thầy Thuốc có quyền quyết định dùng 2 'Thảo dược' để chế thành Bình Giải, hoặc 2 'Nọc độc' để chế thành Bình Độc. Mỗi loại bình chỉ được chế 2 lần, Thầy Thuốc có thể tặng các bình này cho những người chơi khác hoặc tự giữ. \n\n Nếu Người Hái Thuốc chết khi chưa đủ nguyên liệu tạo bình, Thầy Thuốc sẽ vét sạch đồ nghề dự phòng để tạo ra 1 'Bình Khói' duy nhất với điều kiện chưa chế đủ 2 bình độc và 2 bình giải. Thầy Thuốc có quyền ném Bình Khói này vào 1 người bất kỳ để bảo vệ mục tiêu đó khỏi sát thương trong 1 đêm duy nhất."
  },
  {
    "id": 100,
    "name": "Thần Thảo Hồi Sinh",
    "team": "dan",
    "teamName": "Phe Dân Làng",
    "aura": "Thiện",
    "desc": "Hai lần trong trò chơi, Thần Thảo có thể trồng mỗi lần 1 hạt giống lên người còn sống nhưng không thể trồng lên chính mình, người này sẽ không biết mình được trồng hạt giống\n\n Khi người mang hạt giống chết, quản sẽ thông báo người này chết như bình thường nhưng thực tế người này chỉ rơi vào trạng thái ngủ đông và sẽ hồi sinh lại vào sáng hôm sau."
  }
];

/* ==========================================================================
   2. Quản lý Trạng thái (State Management) & Dữ liệu Mẫu (Seed Data)
   ========================================================================== */
const STORAGE_KEY = 'wolvesville_dark_fairytale_v3';
const AUTH_KEY = 'wolvesville_demo_accounts_v2';
const SESSION_KEY = 'wolvesville_demo_session_v2';

const DEFAULT_PLAYERS = [
  { id: 9001, name: 'Luna Moon' },
  { id: 9002, name: 'Bá Tước Đêm' },
  { id: 9003, name: 'Thợ Săn Sương Mù' },
  { id: 9004, name: 'Cô Bé Khăn Đỏ' },
  { id: 9005, name: 'Hắc Pháp Sư' },
  { id: 9006, name: 'Kỵ Sĩ Trăng Bạc' },
  { id: 9007, name: 'Nữ Tu Ánh Sao' },
  { id: 9008, name: 'Kẻ Gác Đêm' }
];

const DEFAULT_ROOMS = [
  {
    id: 1001,
    name: 'Dinh Thự Đồi Trăng',
    size: 12,
    status: 'waiting',
    playerIds: [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008],
    roleIds: [1, 2, 3, 5, 6, 7, 28, 32, 34, 35]
  },
  {
    id: 1002,
    name: 'Quán Trọ Nhung Đỏ',
    size: 16,
    status: 'playing',
    playerIds: [9001, 9003, 9005, 9007, 9002, 9004],
    roleIds: [1, 28, 30, 32, 34, 36]
  },
  {
    id: 1003,
    name: 'Tháp Canh Sương Mù',
    size: 9,
    status: 'waiting',
    playerIds: [9002, 9004, 9006, 9008],
    roleIds: [3, 27, 28, 31, 34]
  }
];

const DEFAULT_SCORES = {
  9001: 2450,
  9002: 2180,
  9003: 1960,
  9004: 1840,
  9005: 1720,
  9006: 1610,
  9007: 1540,
  9008: 1490
};

const DEFAULT_HISTORY = [
  {
    id: 101,
    date: '22/11/2026, 22:15',
    roomId: 1001,
    roomName: 'Dinh Thự Đồi Trăng',
    winner: 'Phe Dân Làng',
    winnerTeam: 'dan',
    scoreText: '3 : 1',
    nights: 3,
    mvpName: 'Luna Moon',
    enemyLeader: 'Bá Tước Đêm',
    rewardCoins: '+12 /H',
    rewardPoints: '+95 /H',
    logSummary: [
      'Đêm 1: Tiên Tri soi trúng Sói Đạo Tặc (#9002); Bảo Vệ che chở thành công cho Phù Thủy.',
      'Ngày 2: Hội đồng làng bỏ phiếu treo cổ Sói Tiên Tri (#9005) với 6/8 phiếu thuận.',
      'Đêm 3: Xạ Thủ kết liễu Sói Kỹ Sư, mang về chiến thắng áp đảo cho Liên Minh Dân Làng.'
    ],
    result: [
      { playerId: 9001, name: 'Luna Moon', roleId: 28, role: 'Tiên Tri', team: 'dan', stars: 5, survived: true },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 34, role: 'Bảo Vệ', team: 'dan', stars: 4, survived: true },
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 32, role: 'Phù Thủy', team: 'dan', stars: 5, survived: true },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 5, role: 'Thẩm Phán Linh Hồn', team: 'dan', stars: 4, survived: true },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 35, role: 'Xạ Thủ', team: 'dan', stars: 4, survived: false },
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 1, role: 'Sói Đạo Tặc', team: 'soi', stars: 5, survived: false },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 3, role: 'Sói Tiên Tri', team: 'soi', stars: 4, survived: false },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 10, role: 'Sói Kỹ Sư', team: 'soi', stars: 4, survived: false },
      { playerId: 9009, name: 'Ảo Ảnh Sương', roleId: 6, role: 'Đạo Diễn Tử Thần', team: 'phe3', stars: 3, survived: false },
      { playerId: 9010, name: 'Kẻ Đóng Thế', roleId: 7, role: 'Diễn Viên Sát Nhân', team: 'phe3', stars: 3, survived: false }
    ]
  },
  {
    id: 102,
    date: '22/11/2026, 21:40',
    roomId: 1002,
    roomName: 'Quán Trọ Nhung Đỏ',
    winner: 'Phe Sói',
    winnerTeam: 'soi',
    scoreText: '2 : 1',
    nights: 4,
    mvpName: 'Bá Tước Đêm',
    enemyLeader: 'Luna Moon',
    rewardCoins: '+9 /H',
    rewardPoints: '+80 /H',
    logSummary: [
      'Đêm 1: Sói Lừa Gạt tung ảo ảnh đánh lừa Tiên Tri, khiến buổi bỏ phiếu sáng hôm sau đi chệch hướng.',
      'Đêm 2: Sói Khát Máu kích hoạt cơn cuồng nộ cắn gục cả Bảo Vệ lẫn Quản Ngục.',
      'Ngày 4: Bầy Sói kiểm soát hoàn toàn số phiếu tại Quán Trọ Nhung Đỏ.'
    ],
    result: [
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 36, role: 'Sói Lừa Gạt', team: 'soi', stars: 5, survived: true },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 24, role: 'Sói Khát Máu', team: 'soi', stars: 5, survived: true },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 38, role: 'Sói Gương', team: 'soi', stars: 4, survived: true },
      { playerId: 9011, name: 'Bóng Đêm Đỏ', roleId: 46, role: 'Sói Bắn Tỉa', team: 'soi', stars: 4, survived: false },
      { playerId: 9012, name: 'Sói Thủ Lĩnh', roleId: 51, role: 'Sói Thủ Lĩnh', team: 'soi', stars: 5, survived: true },
      { playerId: 9001, name: 'Luna Moon', roleId: 2, role: 'Dorothy', team: 'dan', stars: 5, survived: false },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 27, role: 'Quản Ngục', team: 'dan', stars: 4, survived: false },
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 9, role: 'Thiên Sứ Tuyết', team: 'dan', stars: 4, survived: false },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 18, role: 'Nữ Tu Huyết Thệ', team: 'dan', stars: 4, survived: false },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 29, role: 'Thầy Đồng', team: 'dan', stars: 3, survived: false }
    ]
  },
  {
    id: 103,
    date: '22/11/2026, 20:55',
    roomId: 1003,
    roomName: 'Tháp Canh Sương Mù',
    winner: 'Phe Dân Làng',
    winnerTeam: 'dan',
    scoreText: '3 : 0',
    nights: 2,
    mvpName: 'Cô Bé Khăn Đỏ',
    enemyLeader: 'Hắc Pháp Sư',
    rewardCoins: '+7 /H',
    rewardPoints: '+85 /H',
    logSummary: [
      'Đêm 1: Phù Thủy Cấm Kỵ gieo độc khóa toàn bộ kỹ năng của Sói Biến Hình và Kỵ Sĩ Không Đầu.',
      'Ngày 2: Thẩm Phán Linh Hồn đặt bàn cân lông vũ chỉ điểm chính xác 2 kẻ ác liên tiếp.'
    ],
    result: [
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 17, role: 'Phù Thủy Cấm Kỵ', team: 'dan', stars: 5, survived: true },
      { playerId: 9001, name: 'Luna Moon', roleId: 5, role: 'Thẩm Phán Linh Hồn', team: 'dan', stars: 5, survived: true },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 11, role: 'Thợ Rèn Cơ Khí', team: 'dan', stars: 4, survived: true },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 39, role: 'Pháp Sư', team: 'dan', stars: 4, survived: true },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 26, role: 'Xạ Thủ Linh Hồn', team: 'dan', stars: 4, survived: true },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 20, role: 'Sói Biến Hình', team: 'soi', stars: 4, survived: false },
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 22, role: 'Sói Kí Sinh', team: 'soi', stars: 4, survived: false },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 8, role: 'Kỵ Sĩ Không Đầu', team: 'phe3', stars: 4, survived: false },
      { playerId: 9009, name: 'Búp Bê Cổ', roleId: 19, role: 'Búp Bê Ma Ám', team: 'phe3', stars: 3, survived: false },
      { playerId: 9010, name: 'Kẻ Mặc Cả', roleId: 21, role: 'Kẻ Mặc Cả Bóng Tối', team: 'phe3', stars: 3, survived: false }
    ]
  }
];

function loadState() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    raw = null;
  }
  const s = raw && typeof raw === 'object' ? raw : {};
  if (!Array.isArray(s.players) || !s.players.length) s.players = [...DEFAULT_PLAYERS];
  if (!Array.isArray(s.rooms) || !s.rooms.length) s.rooms = JSON.parse(JSON.stringify(DEFAULT_ROOMS));
  if (!Array.isArray(s.history) || s.history.length <= 1) s.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
  if (!Array.isArray(s.favs)) s.favs = [1, 2, 5, 28, 32];
  if (!s.scores || typeof s.scores !== 'object') s.scores = { ...DEFAULT_SCORES };
  if (!s.activeRoom || !s.rooms.some(r => r.id === s.activeRoom)) {
    s.activeRoom = s.rooms[0]?.id || 1001;
  }
  s.rooms.forEach(r => {
    if (!Array.isArray(r.playerIds)) r.playerIds = s.players.slice(0, 6).map(p => p.id);
    if (!Array.isArray(r.roleIds)) r.roleIds = [1, 2, 3, 28, 32, 34];
    if (!r.status) r.status = 'waiting';
  });
  if (typeof s.bgmVolume !== 'number') s.bgmVolume = 45;
  if (typeof s.sfxVolume !== 'number') s.sfxVolume = 65;
  if (typeof s.particlesEnabled !== 'boolean') s.particlesEnabled = true;
  if (typeof s.typewriterSpeed !== 'number') s.typewriterSpeed = 24;
  return s;
}

let state = loadState();
let page = 'rooms';       // 'rooms' (World Map Lobby) | 'ingame' (In-Game Stage) | 'roles' (Codex) | 'overview' | 'profile' | 'history' | 'ranking' | 'settings'
let filter = 'all';       // 'all' | 'dan' | 'soi' | 'phe3' | 'fav'
let deckScope = '52';     // '52' (Bộ 52 chuẩn) | 'all' (Toàn bộ 100 vai)
let query = '';
let sort = 'id';          // 'id' | 'name'
let selected = ROLES[0];
let searchComposing = false;

const $ = id => document.getElementById(id);
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const portrait = c => `assets/portraits/${typeof c === 'object' ? c.id : c}.svg`;
const teamLabel = c => c.team === 'soi' ? 'Phe Sói' : c.team === 'dan' ? 'Dân Làng' : 'Phe Ba';

function getActiveRoom() {
  let room = state.rooms.find(r => r.id === state.activeRoom);
  if (!room && state.rooms.length) {
    room = state.rooms[0];
    state.activeRoom = room.id;
  }
  return room;
}

/* ==========================================================================
   3. Hệ thống Âm thanh Phản hồi kiểu Game (BGM, Hover Tick, Select Chime, Typewriter)
   ========================================================================== */
let audioCtx = null;
let bgmPlaying = false;
let bgmManuallySet = false;
let bgmTimer = null;
let bgmStep = 0;

// Giai điệu hộp nhạc / piano cổ tích đen (D minor / A minor Waltz arpeggio)
const MUSIC_BOX_NOTES = [
  293.66, 349.23, 440.00, 587.33, 523.25, 440.00,
  261.63, 329.63, 440.00, 523.25, 493.88, 392.00,
  233.08, 293.66, 349.23, 466.16, 440.00, 349.23,
  220.00, 277.18, 329.63, 440.00, 329.63, 277.18
];

function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      audioCtx.addEventListener('statechange', syncVillageEffects);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playMusicBoxNote(freq) {
  if (!bgmPlaying || state.bgmVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  overtone.type = 'triangle';
  overtone.frequency.setValueAtTime(freq * 2, now);

  const vol = (state.bgmVolume / 100) * 0.08;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(vol * 0.25, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc.connect(gain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  overtone.start(now);
  osc.stop(now + 1.5);
  overtone.stop(now + 0.5);
}

function toggleBGM(forceState) {
  if (typeof forceState !== 'boolean') bgmManuallySet = true;
  const next = typeof forceState === 'boolean' ? forceState : !bgmPlaying;
  if (next === bgmPlaying) return;
  bgmPlaying = next;
  const btn = $('bgmToggleBtn');
  if (bgmPlaying) {
    ensureAudioCtx();
    if (btn) {
      btn.classList.add('playing');
      btn.setAttribute('aria-pressed', 'true');
      $('bgmLabel').textContent = 'Nhạc sảnh: Bật';
    }
    playMusicBoxNote(MUSIC_BOX_NOTES[bgmStep % MUSIC_BOX_NOTES.length]);
    bgmStep++;
    clearInterval(bgmTimer);
    bgmTimer = setInterval(() => {
      playMusicBoxNote(MUSIC_BOX_NOTES[bgmStep % MUSIC_BOX_NOTES.length]);
      bgmStep++;
    }, 520);
  } else {
    clearInterval(bgmTimer);
    bgmTimer = null;
    if (btn) {
      btn.classList.remove('playing');
      btn.setAttribute('aria-pressed', 'false');
      $('bgmLabel').textContent = 'Nhạc sảnh: Tắt';
    }
  }
  syncVillageEffects();
  if (page === 'settings') settings();
}

// Tiếng tick / chuông nhỏ khi hover qua mục menu (hover.mp3)
function playHoverSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
  const vol = (state.sfxVolume / 100) * 0.045;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0005, vol), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.065);
}

// Tiếng chốt khóa / trống trầm khi bấm chọn (select.mp3)
function playSelectSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14);

  sub.type = 'sine';
  sub.frequency.setValueAtTime(146.83, now);
  sub.frequency.exponentialRampToValueAtTime(98.0, now + 0.18);

  const vol = (state.sfxVolume / 100) * 0.08;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  osc.connect(gain);
  sub.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  sub.start(now);
  osc.stop(now + 0.27);
  sub.stop(now + 0.27);
}

function playTypewriterTick() {
  if (state.sfxVolume <= 0 || !audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(540 + Math.random() * 120, now);
  const vol = (state.sfxVolume / 100) * 0.018;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.025);
}

function playCurtainSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const chords = [293.66, 349.23, 440.00, 587.33];
  chords.forEach((f, idx) => {
    setTimeout(() => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      const vol = (state.sfxVolume / 100) * 0.09;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    }, idx * 110);
  });
}

/* ==========================================================================
   4. Chuyển cảnh có nhịp điệu (Fade to Black 0.4s Scene Transition)
   ========================================================================== */
function runSceneTransition(actionFn) {
  const overlay = $('sceneTransition');
  if (!overlay) {
    actionFn();
    return;
  }
  overlay.classList.add('active');
  setTimeout(() => {
    actionFn();
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 180);
  }, 360);
}

/* ==========================================================================
   5. ① MÀN HÌNH KHỞI ĐỘNG (TITLE SCREEN — Hollow Knight & Elise Inspired)
   ========================================================================== */
let titleScreenOpen = true;
let titleTransitionPending = false;
let syncTitleParticles = () => {};

function enterNight() {
  if (!titleTransitionPending && titleScreenOpen) enterGamePage('rooms');
}

function openLandingAuth() {
  if (titleTransitionPending || !titleScreenOpen) return;
  showAuth('login');
  $('titleScreen').inert = true;
  $('authUser').focus();
}

function closeLandingAuth() {
  $('authScreen').hidden = true;
  $('titleScreen').inert = false;
  $('landingLogin').focus();
}

function enterGamePage(targetPage) {
  if (titleTransitionPending || !titleScreenOpen) return;
  titleTransitionPending = true;
  if (!bgmPlaying && !bgmManuallySet && state.bgmVolume > 0) toggleBGM(true);
  playSelectSfx();

  runSceneTransition(() => {
    titleScreenOpen = false;
    const title = $('titleScreen');
    title.hidden = true;
    title.inert = false;
    $('appShell').inert = false;
    syncTitleParticles();
    page = targetPage;
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('content').focus({ preventScroll: true });
    titleTransitionPending = false;
  });
}

function openTitleScreen() {
  if (titleTransitionPending || titleScreenOpen) return;
  titleTransitionPending = true;
  playSelectSfx();

  runSceneTransition(() => {
    titleScreenOpen = true;
    $('appShell').inert = true;
    const title = $('titleScreen');
    title.hidden = false;
    title.scrollTop = 0;
    title.querySelectorAll('details[open]').forEach(details => { details.open = false; });
    syncTitleParticles();
    syncVillageEffects();
    $('landingEnter').focus({ preventScroll: true });
    titleTransitionPending = false;
  });
}

/* Canvas Hạt ánh sáng / Đom đóm bay chậm trên Title Screen */
function initParticleCanvas() {
  const canvas = $('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = canvas.width = canvas.clientWidth;
  let h = canvas.height = canvas.clientHeight;
  let frame = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let heroVisible = true;

  const particles = Array.from({ length: 56 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1.2 + Math.random() * 2.8,
    vx: (Math.random() - 0.5) * 0.28,
    vy: -0.18 - Math.random() * 0.42,
    alpha: 0.2 + Math.random() * 0.65,
    phase: Math.random() * Math.PI * 2,
    gold: Math.random() > 0.42
  }));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.022;
      if (p.y < -12) {
        p.y = h + 12;
        p.x = Math.random() * w;
      }
      if (p.x < -12) p.x = w + 12;
      if (p.x > w + 12) p.x = -12;

      const a = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.4);
      if (p.gold) {
        grad.addColorStop(0, `rgba(243, 211, 139, ${a})`);
        grad.addColorStop(1, 'rgba(243, 211, 139, 0)');
      } else {
        grad.addColorStop(0, `rgba(244, 238, 250, ${a})`);
        grad.addColorStop(1, 'rgba(169, 123, 255, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    frame = requestAnimationFrame(draw);
  }

  syncTitleParticles = () => {
    const shouldDraw = titleScreenOpen && heroVisible && state.particlesEnabled &&
      !document.hidden && !reducedMotion.matches;
    if (!shouldDraw) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      ctx.clearRect(0, 0, w, h);
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width !== w || height !== h) {
      w = canvas.width = width;
      h = canvas.height = height;
      for (const particle of particles) {
        particle.x = Math.random() * w;
        particle.y = Math.random() * h;
      }
    }
    if (frame === null) frame = requestAnimationFrame(draw);
  };

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncTitleParticles();
  }, { root: $('titleScreen') }).observe(canvas);
  window.addEventListener('resize', syncTitleParticles);
  document.addEventListener('visibilitychange', syncTitleParticles);
  reducedMotion.addEventListener('change', syncTitleParticles);
  syncTitleParticles();
}

/* Điều khiển Bàn phím chuẩn Game (↑, ↓, Enter, Esc) */
function initKeyboardNavigation() {
  window.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Phím ← / → để xoay Vòng Tròn Thẻ Bài khi đang ở Bách khoa Thân phận
    if (!titleScreenOpen && !isTyping && page === 'roles' && codexViewMode === 'wheel') {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        spinCodexWheel(1);
        return;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        spinCodexWheel(-1);
        return;
      }
    }

    // Phím Esc: Đóng modal hoặc quay về Màn hình Title Screen
    if (e.key === 'Escape' && titleScreenOpen && !$('authScreen').hidden) {
      closeLandingAuth();
      return;
    }
    if (e.key === 'Escape' && (!isTyping || (page === 'rooms' && villagePanel))) {
      if (!$('authScreen')?.hidden) {
        $('authScreen').hidden = true;
        return;
      }
      if ($('rolePickerOverlay')) {
        closeRolePicker();
        return;
      }
      if (!$('stageCurtainOverlay')?.hidden) {
        closeStageShow();
        return;
      }
      if (page === 'rooms' && villagePanel) {
        closeVillagePanel();
        return;
      }
      if (!titleScreenOpen) {
        openTitleScreen();
      }
    }
  });
}

/* ==========================================================================
   6. Cổng Đăng nhập / Cổng vào làng (Auth Gate)
   ========================================================================== */
let authTab = 'login';

function demoAccounts() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
  } catch {
    return [];
  }
}

function ensureDemoAccountSeed() {
  const accounts = demoAccounts();
  if (!accounts.some(a => a.user === 'moonwalker')) {
    accounts.push({
      id: 9001,
      user: 'moonwalker',
      name: 'Luna Moon',
      pass: 'demo123',
      avatarId: 2,
      bio: 'Kẻ lữ hành dưới ánh trăng bạc — Yêu thích những ván Ma Sói cổ tích đen ✨',
      location: 'Làng Trăng Tím · Sân Khấu Gothic',
      joined: 'Tháng 11/2026'
    });
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
  }
}

function currentAccount() {
  const sid = localStorage.getItem(SESSION_KEY);
  if (!sid) return null;
  return demoAccounts().find(a => String(a.id) === sid) || null;
}

function authMode(mode) {
  authTab = mode;
  const reg = mode === 'register';
  $('tabLogin').classList.toggle('active', !reg);
  $('tabRegister').classList.toggle('active', reg);
  $('authNameField').style.display = reg ? 'grid' : 'none';
  $('authConfirmField').style.display = reg ? 'grid' : 'none';
  $('authConfirm').required = reg;
  $('authName').required = reg;
  $('authTitle').textContent = reg ? 'Đăng ký cư dân mới' : 'Đăng nhập vào làng';
  $('authDesc').textContent = reg
    ? 'Khởi tạo danh tính của bạn trước khi bước qua khung cửa vòm Gothic.'
    : 'Bước qua cổng sương mù để tiếp tục ván diễn của bạn.';
  $('authSubmit').textContent = reg ? 'Đăng ký & Vào làng →' : 'Đăng nhập vào làng →';
  $('authError').textContent = '';
  $('authPass').autocomplete = reg ? 'new-password' : 'current-password';
}

function showAuth(mode = 'login') {
  playSelectSfx();
  $('authScreen').hidden = false;
  $('chat')?.classList.remove('open');
  $('authPass').value = '';
  $('authConfirm').value = '';
  authMode(mode);
}

function showRegister() {
  showAuth('register');
}

function submitAuth(e) {
  e.preventDefault();
  const user = $('authUser').value.trim();
  const pass = $('authPass').value;
  const name = $('authName').value.trim();
  const accounts = demoAccounts();
  const err = $('authError');
  err.textContent = '';

  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(user)) {
    err.textContent = 'Tên đăng nhập gồm 3–30 ký tự: chữ, số, dấu chấm hoặc gạch dưới.';
    return;
  }
  if (pass.length < 6) {
    err.textContent = 'Mật khẩu cần ít nhất 6 ký tự.';
    return;
  }

  if (authTab === 'register') {
    if (!name) {
      err.textContent = 'Vui lòng nhập tên hiển thị trong làng.';
      return;
    }
    if (pass !== $('authConfirm').value) {
      err.textContent = 'Mật khẩu xác nhận không trùng khớp.';
      return;
    }
    if (accounts.some(a => a.user.toLowerCase() === user.toLowerCase())) {
      err.textContent = 'Tên đăng nhập này đã có người sử dụng.';
      return;
    }
    const id = Math.max(9001, ...accounts.map(a => a.id)) + 1;
    const newAcc = {
      id,
      user,
      name,
      pass,
      avatarId: (id % 52) + 1,
      bio: 'Cư dân mới của Sân Khấu Cổ Tích Đen.',
      location: 'Rừng Đêm Mờ Sương',
      joined: 'Tháng 11/2026'
    };
    accounts.push(newAcc);
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
    localStorage.setItem(SESSION_KEY, String(id));
    if (!state.players.some(p => p.id === id)) {
      state.players.push({ id, name });
      state.scores[id] = 1500;
      save();
    }
  } else {
    const found = accounts.find(a => a.user.toLowerCase() === user.toLowerCase() && a.pass === pass);
    if (!found) {
      err.textContent = 'Sai tên đăng nhập hoặc mật khẩu. Bạn có thể bấm "Trải nghiệm tài khoản mẫu" bên dưới!';
      return;
    }
    localStorage.setItem(SESSION_KEY, String(found.id));
  }

  playSelectSfx();
  $('authScreen').hidden = true;
  if (titleScreenOpen) {
    enterGamePage('rooms');
  } else {
    updateTopbarAccount();
    render();
  }
}

function guestAccess() {
  playSelectSfx();
  localStorage.removeItem(SESSION_KEY);
  $('authScreen').hidden = true;
  if (titleScreenOpen) {
    enterGamePage('rooms');
  } else {
    updateTopbarAccount();
    render();
  }
}

function useDemoAccount() {
  playSelectSfx();
  ensureDemoAccountSeed();
  localStorage.setItem(SESSION_KEY, '9001');
  $('authScreen').hidden = true;
  if (titleScreenOpen) {
    enterGamePage('rooms');
  } else {
    updateTopbarAccount();
    render();
  }
}

function logoutDemo() {
  localStorage.removeItem(SESSION_KEY);
  updateTopbarAccount();
  showAuth('login');
}

/* ==========================================================================
   7. Khung điều hướng chung (App Shell — Sidebar & Topbar)
   ========================================================================== */
const NAV_GROUPS = [
  {
    group: 'Sân khấu & Thế giới',
    items: [
      { key: 'rooms', icon: '🗺️', label: 'Bản đồ Làng (Sảnh)', badge: () => `${state.rooms.length} phòng` },
      { key: 'ingame', icon: '⚔️', label: 'Sân khấu Trong trận', badge: () => 'LIVE' },
      { key: 'roles', icon: '🎭', label: 'Bách khoa (Codex)', badge: () => '52 / 100' },
      { key: 'overview', icon: '🏰', label: 'Sảnh Tổng quan', badge: () => '' }
    ]
  },
  {
    group: 'Cá nhân & Cộng đồng',
    items: [
      { key: 'profile', icon: '👤', label: 'Hồ sơ & Thành tích', badge: () => '' },
      { key: 'history', icon: '📜', label: 'Lịch sử đấu', badge: () => `${state.history.length}` },
      { key: 'ranking', icon: '🏆', label: 'Bảng xếp hạng', badge: () => '' }
    ]
  },
  {
    group: 'Hệ thống',
    items: [
      { key: 'settings', icon: '⚙️', label: 'Cài đặt (Options)', badge: () => '' }
    ]
  }
];

const PAGE_META = {
  rooms:    { group: 'Thế giới', title: '② Sảnh Chờ Bản Đồ Làng (World Map Lobby)' },
  ingame:   { group: 'Trong trận', title: '③ Sân Khấu Trong Trận (In-Game Stage)' },
  roles:    { group: 'Bách khoa', title: 'Kho Thân Phận (Codex 52 / 100 vai)' },
  overview: { group: 'Khám phá', title: 'Trang Tổng quan (Overview Hub)' },
  profile:  { group: 'Cá nhân & Cộng đồng', title: 'Thành tích & Hồ sơ cá nhân' },
  history:  { group: 'Cá nhân & Cộng đồng', title: 'Lịch sử ván diễn' },
  ranking:  { group: 'Cá nhân & Cộng đồng', title: 'Bảng xếp hạng' },
  settings: { group: 'Hệ thống', title: 'Cài đặt (Options)' }
};

function toggleMobileSidebar(force) {
  const sb = $('appSidebar');
  if (!sb) return;
  if (typeof force === 'boolean') {
    sb.classList.toggle('mobile-open', force);
  } else {
    sb.classList.toggle('mobile-open');
  }
}

function go(targetPage) {
  playSelectSfx();
  toggleMobileSidebar(false);
  if (page !== targetPage) {
    runSceneTransition(() => {
      if (page === 'rooms') {
        villagePanel = null;
        villageReturnPin = null;
      }
      page = targetPage;
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  } else {
    render();
  }
}

function renderSidebar() {
  const navContainer = $('nav');
  if (!navContainer) return;

  navContainer.innerHTML = NAV_GROUPS.map(g => `
    <div class="nav-group">
      <div class="nav-group-label">${esc(g.group)}</div>
      <div class="nav-list">
        ${g.items.map(it => {
          const b = it.badge();
          return `
            <button
              type="button"
              class="nav-btn ${page === it.key ? 'active' : ''}"
              onmouseenter="playHoverSfx()"
              onclick="go('${it.key}')"
            >
              <span class="nav-btn-left">
                <span class="nav-icon">${it.icon}</span>
                <span>${esc(it.label)}</span>
              </span>
              ${b ? `<span class="nav-badge">${esc(b)}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('') + `
    <div class="nav-group" style="margin-top:auto;padding-top:10px;border-top:1px solid var(--line)">
      <div class="nav-group-label">Màn hình Game</div>
      <button type="button" class="nav-btn" onmouseenter="playHoverSfx()" onclick="openTitleScreen()">
        <span class="nav-btn-left">
          <span class="nav-icon">🎬</span>
          <span>Màn hình Khởi động</span>
        </span>
      </button>
      <button type="button" class="nav-btn" onmouseenter="playHoverSfx()" onclick="showAuth('login')">
        <span class="nav-btn-left">
          <span class="nav-icon">🚪</span>
          <span>Cổng Đăng nhập</span>
        </span>
      </button>
    </div>
  `;
}

function updateTopbarAccount() {
  const acc = currentAccount();
  const bar = $('accountStrip');
  if (!bar) return;

  if (acc) {
    const avatarSrc = portrait(acc.avatarId || 2);
    bar.innerHTML = `
      <button type="button" class="account-pill" onclick="go('profile')" title="Xem Hồ sơ cá nhân">
        <img class="account-chibi" src="${avatarSrc}" alt="${esc(acc.name)}">
        <div class="account-meta">
          <strong>${esc(acc.name)}</strong>
          <small>#${acc.id}</small>
        </div>
      </button>
      <button type="button" class="btn-secondary" onclick="logoutDemo()" title="Đăng xuất và mở Cổng vào làng">Đăng xuất</button>
    `;
  } else {
    bar.innerHTML = `
      <span class="muted" style="font-size:12.5px">Khách lữ hành</span>
      <button type="button" class="btn-secondary" onclick="showAuth('login')">🚪 Đăng nhập</button>
      <button type="button" class="btn-gold" onclick="useDemoAccount()">🌙 Tài khoản mẫu</button>
    `;
  }
}

function updateBreadcrumb() {
  const meta = PAGE_META[page] || PAGE_META.rooms;
  const bc = $('breadcrumb');
  if (!bc) return;
  bc.innerHTML = `
    <span class="breadcrumb-root">🌙 Wolfville</span>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-root">${esc(meta.group)}</span>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">${esc(meta.title)}</span>
  `;
}

function render() {
  document.body?.classList?.toggle('in-game-active', page === 'ingame');
  renderSidebar();
  updateBreadcrumb();
  updateTopbarAccount();
  const views = { rooms, ingame, roles, overview, profile, history, ranking, settings };
  (views[page] || rooms)();
  syncVillageEffects();
}

/* ==========================================================================
   8. ② SẢNH CHỜ DẠNG BẢN ĐỒ LÀNG (WORLD MAP LOBBY — Cảm hứng Ảnh 4)
   ========================================================================== */
const VILLAGE_ROOM_SITES = [
  { x: 49, y: 29, icon: '♜', name: 'Dinh Thự Đồi Trăng' },
  { x: 23, y: 40, icon: '♨', name: 'Quán Trọ Nhung Đỏ' },
  { x: 74, y: 40, icon: '♖', name: 'Tháp Canh Sương Mù' }
];

let villagePanel = null;
let villageReturnPin = null;

let villageAudioUnlocked = false;
let villageAmbience = null;
let villageWindBuffer = null;

function villageAmbienceLevel() {
  if (page !== 'rooms' || titleScreenOpen || document.hidden ||
      !$('stageCurtainOverlay')?.hidden || !villageAudioUnlocked || !bgmPlaying) return 0;
  return 0.14 * Math.min(100, Math.max(0, Number(state.bgmVolume) || 0)) / 100;
}

function syncVillageEffects() {
  const visible = page === 'rooms' && !titleScreenOpen && !document.hidden && $('stageCurtainOverlay')?.hidden;
  document.body.classList.toggle('village-fx-live', Boolean(visible));

  const level = villageAmbienceLevel();
  if (!level || audioCtx?.state !== 'running') {
    if (villageAmbience) {
      const { source, filter, gain } = villageAmbience;
      source.stop();
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      villageAmbience = null;
    }
    return;
  }

  const now = audioCtx.currentTime;
  if (!villageAmbience) {
    if (!villageWindBuffer) {
      // Low-rate noise is sufficient for a quiet, low-pass wind layer.
      villageWindBuffer = audioCtx.createBuffer(1, 32000, 8000);
      const samples = villageWindBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const gust = 0.65 + 0.3 * Math.sin(2 * Math.PI * i / samples.length);
        samples[i] = (Math.random() * 2 - 1) * gust;
      }
    }

    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = villageWindBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.5;
    gain.gain.setValueAtTime(0, now);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
    villageAmbience = { source, filter, gain };
  }

  const volume = villageAmbience.gain.gain;
  volume.cancelScheduledValues(now);
  volume.setTargetAtTime(level, now, 0.12);
}

function unlockVillageAudio(event) {
  if (!event.isTrusted) return;
  if (villageAudioUnlocked && audioCtx?.state === 'running') return;
  villageAudioUnlocked = true;
  if (villageAmbienceLevel() && audioCtx?.state !== 'running') ensureAudioCtx();
  syncVillageEffects();
}

function villagePin(key, x, y, icon, label, detail, action, status = '') {
  const expanded = villagePanel?.key === key;
  return `
    <button id="villagePin-${esc(key)}" class="map-hotspot${expanded ? ' active' : ''}" type="button"
      style="--pin-x:${x}%;--pin-y:${y}%" ${action.startsWith('go(') ? '' : `aria-haspopup="dialog" aria-expanded="${expanded}"`}
      onclick="${action}">
      <span class="village-pin-icon ${status}" aria-hidden="true">${icon}</span>
      <span class="hotspot-info">
        <strong>${esc(label)}</strong>
        <small>${esc(detail)}</small>
      </span>
    </button>
  `;
}

function villageRoomStatus(room) {
  return room.status === 'playing' ? 'Đang diễn ra' : 'Đang chờ';
}

function rooms() {
  const content = $('content');
  const oldDrawer = $('villageDrawer');
  const drawerScroll = $('villageDrawerBody')?.scrollTop ?? 0;
  const restoreDrawerFocus = oldDrawer?.contains(document.activeElement);
  const orderedRooms = [...state.rooms].sort((first, second) => first.id - second.id);
  const roomPins = VILLAGE_ROOM_SITES.map(({ x, y, icon, name }, index) => {
    const room = orderedRooms[index];
    if (!room) return villagePin(`site-${index}`, x, y, icon, name, 'Mở phòng', `openVillagePanel('create', 'site-${index}')`);
    return villagePin(`room-${room.id}`, x, y, icon, room.name,
      `#${room.id} · ${room.playerIds.length}/${room.size} · ${villageRoomStatus(room)}`,
      `selectActiveRoom(${room.id}, 'room-${room.id}')`, room.status === 'playing' ? 'playing' : 'waiting');
  }).join('');

  content.innerHTML = `
    <section class="world-map-card" aria-labelledby="villageMapTitle">
      <div class="world-map-stage">
        ${villageMapArt()}
        ${villageMapEffects()}
        <header class="world-map-header">
          <h2 id="villageMapTitle">Làng Sương Mù</h2>
          <p>Chọn một địa điểm để khám phá</p>
        </header>
        ${roomPins}
        ${villagePin('well', 49, 50, '✦', 'Giếng Làng Trung Tâm', 'Tạo phòng mới', "openVillagePanel('create', 'well')")}
        ${villagePin('archive', 23, 69, '◇', 'Bia Đá Biên Niên Sử', 'Lịch sử · Xếp hạng', "openVillagePanel('archive', 'archive')")}
        ${villagePin('library', 74, 69, '▤', 'Thư Viện Cổ Tích', 'Bách khoa vai', "go('roles')")}
        ${villagePin('directory', 49, 86, '☷', 'Cổng Làng', `${state.rooms.length} phòng đấu`, "openVillagePanel('directory', 'directory')")}
      </div>
    </section>
    ${renderVillagePanel(!oldDrawer)}
  `;
  const drawer = $('villageDrawerBody');
  if (drawer) drawer.scrollTop = drawerScroll;
  if (restoreDrawerFocus) $('villagePanelTitle')?.focus({ preventScroll: true });
}

function openVillagePanel(kind, pin = kind) {
  playSelectSfx();
  villageReturnPin = pin;
  villagePanel = { kind, key: pin };
  rooms();
  $('villagePanelTitle')?.focus({ preventScroll: true });
}

function closeVillagePanel() {
  const pin = villageReturnPin;
  villagePanel = null;
  villageReturnPin = null;
  rooms();
  ($(`villagePin-${pin}`) || $('villagePin-directory'))?.focus({ preventScroll: true });
}

function selectActiveRoom(roomId, pin = 'directory') {
  if (!state.rooms.some(room => room.id === roomId)) return;
  state.activeRoom = roomId;
  save();
  openVillagePanel('room', pin);
}

function keepVillagePanelFocus(event) {
  if (event.key !== 'Tab' || $('rolePickerOverlay') || !$('stageCurtainOverlay')?.hidden) return;
  const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), input:not([disabled])')];
  const first = controls[0];
  const last = controls.at(-1);
  const focused = document.activeElement;
  if ((event.shiftKey && (focused === first || !controls.includes(focused))) ||
      (!event.shiftKey && focused === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
}

function renderVillagePanel(entering) {
  if (!villagePanel) return '';
  const activeRoom = getActiveRoom();
  let title;
  let body;

  switch (villagePanel.kind) {
    case 'create':
      title = 'Mở phòng tại Giếng Làng';
      body = `
        <form class="village-create-form" novalidate onsubmit="event.preventDefault();createRoom()">
          <label for="newRoomName">Tên phòng</label>
          <input id="newRoomName" class="input-field" placeholder="Ví dụ: Lầu Chuông Đêm">
          <label for="newRoomSize">Giới hạn người chơi</label>
          <input id="newRoomSize" class="input-field" type="number" min="1" max="100" step="1" value="12">
          <button type="submit" class="btn-gold">Tạo phòng</button>
        </form>
      `;
      break;
    case 'room':
      if (activeRoom) {
        title = activeRoom.name;
        body = renderVillageRoom(activeRoom);
        break;
      }
      // Without an active room, show the village directory.
    case 'directory':
      title = 'Danh sách phòng đấu';
      body = `
        <div class="room-cards-list">
          ${state.rooms.map(room => `
            <button type="button" class="room-item-card village-room-link" onclick="selectActiveRoom(${room.id})">
              <span class="room-item-top">
                <span class="room-code">#${room.id}</span>
                <span class="room-status ${room.status === 'playing' ? 'playing' : 'waiting'}">${villageRoomStatus(room)}</span>
              </span>
              <strong>${esc(room.name)}</strong>
              <span class="muted">${room.playerIds.length}/${room.size} người · ${room.roleIds.length} vai</span>
            </button>
          `).join('') || '<p class="empty">Chưa có phòng đấu.</p>'}
        </div>
        <button type="button" class="btn-gold" onclick="openVillagePanel('create', 'well')">Tạo phòng mới</button>
      `;
      break;
    case 'archive':
      title = 'Bia Đá Biên Niên Sử';
      body = `
        <p class="muted">${state.history.length} trận đã lưu</p>
        <div class="row">
          <button type="button" class="btn-gold" onclick="go('history')">Lịch sử đấu</button>
          <button type="button" class="btn-secondary" onclick="go('ranking')">Bảng xếp hạng</button>
        </div>
      `;
      break;
  }

  return `
    <div class="village-scrim" onclick="if(event.target===this)closeVillagePanel()">
      <section id="villageDrawer" class="village-drawer${entering ? ' entering' : ''}" role="dialog" aria-modal="true" aria-labelledby="villagePanelTitle" onkeydown="keepVillagePanelFocus(event)">
        <header class="village-drawer-header">
          <h2 id="villagePanelTitle" tabindex="-1">${esc(title)}</h2>
          <button type="button" class="btn-secondary" onclick="closeVillagePanel()" aria-label="Đóng bảng địa điểm">✕</button>
        </header>
        <div class="village-drawer-body" id="villageDrawerBody">${body}</div>
      </section>
    </div>
  `;
}

function renderVillageRoom(activeRoom) {
  const roomPlayers = activeRoom.playerIds.map(id => state.players.find(player => player.id === id)).filter(Boolean);
  const roomRoles = activeRoom.roleIds.map((id, index) => ({
    role: ROLES.find(item => item.id === id), index
  })).filter(entry => entry.role);
  const playerCount = roomPlayers.length;
  const roleCount = roomRoles.length;
  const progressPct = playerCount ? Math.min(100, Math.round(roleCount / playerCount * 100)) : 0;

  return `
    <div class="village-room-summary">
      <span class="room-code">#${activeRoom.id}</span>
      <span class="room-status ${activeRoom.status === 'playing' ? 'playing' : 'waiting'}">${villageRoomStatus(activeRoom)}</span>
      <button type="button" class="btn-secondary" onclick="deleteRoom(${activeRoom.id})">Xóa phòng</button>
    </div>
    <div class="section-header">
            <div class="row" style="margin:0">
              <label style="font-size:12.5px" class="muted">
                Giới hạn (1–100):
                <input
                  type="number"
                  min="1"
                  max="100"
                  value="${activeRoom.size}"
                  class="input-field"
                  style="width:76px;min-height:34px;padding:4px 8px;margin-left:4px"
                  onchange="updateRoomLimit(${activeRoom.id}, this.value)"
                >
              </label>
              <button type="button" class="btn-secondary" onclick="toggleRoomStatus(${activeRoom.id})">
                ${activeRoom.status === 'playing' ? '🔄 Chuyển về Đang chờ' : '🔥 Đánh dấu Đang diễn ra'}
              </button>
            </div>
          </div>

          <div class="staging-columns">
            <!-- Khối 1: Danh sách người chơi trong phòng -->
            <div class="staging-box">
              <div class="staging-box-head">
                <h4>👥 Người chơi trong phòng (${playerCount} / ${activeRoom.size})</h4>
                <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="fillSamplePlayers()">
                  + Điền nhanh người mẫu
                </button>
              </div>

              <div class="row" style="margin:0">
                <input
                  id="stagingPlayerName"
                  class="input-field"
                  style="flex:1;min-width:130px"
                  placeholder="Nhập tên người chơi mới..."
                  onkeydown="if(event.key==='Enter')addPlayerToRoom()"
                >
                <button type="button" class="btn-gold" onclick="addPlayerToRoom()">+ Thêm (#ID)</button>
              </div>

              <div class="player-chip-list">
                ${roomPlayers.map(p => `
                  <span class="player-pill">
                    <b>#${p.id}</b>
                    <span>${esc(p.name)}</span>
                    <button type="button" class="pill-remove" onclick="removePlayerFromRoom(${p.id})" title="Rời phòng">✕</button>
                  </span>
                `).join('') || '<p class="muted" style="font-size:12.5px">Chưa có người chơi trong phòng này.</p>'}
              </div>
            </div>

            <!-- Khối 2: Bộ vai của phòng -->
            <div class="staging-box">
              <div class="staging-box-head">
                <h4>🎭 Bộ vai của phòng (${roleCount} / ${playerCount} người)</h4>
                <div class="row" style="margin:0">
                  <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="autoBalanceDeck()">
                    ✨ Gợi ý cân bằng
                  </button>
                  <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="clearRoomDeck()">
                    Xóa bộ vai
                  </button>
                </div>
              </div>

              <button id="villageRolePickerButton" type="button" class="btn-gold" style="width:100%" onclick="openRolePicker()">
                ⌕ Mở bảng chọn nhanh nhân vật (+ Thêm vai)
              </button>

              <div class="deck-pill-list">
                ${roomRoles.map(({ role: r, index: idx }) => `
                  <span class="deck-pill">
                    <img src="${portrait(r)}" alt="" style="width:22px;height:22px;border-radius:6px">
                    <span class="role-id-badge">#${String(r.id).padStart(2, '0')}</span>
                    <span>${esc(r.name)}</span>
                    <button type="button" class="pill-remove" onclick="removeRoleFromRoom(${idx})" title="Bỏ vai này">✕</button>
                  </span>
                `).join('') || '<p class="muted" style="font-size:12.5px">Chưa chọn vai nào. Hãy mở bảng chọn nhanh nhân vật!</p>'}
              </div>
            </div>
          </div>

          <!-- Thanh trạng thái & Nút chính dưới cùng -->
          <div class="stage-launch-bar">
            <div style="flex:1;min-width:240px">
              <strong style="color:var(--gold);font-size:15px">
                🎬 Sẵn sàng kéo rèm: ${roleCount} vai đã chọn / ${playerCount} người chơi
              </strong>
              <div class="muted" style="font-size:12.5px;margin-top:2px">
                ${
                  playerCount === 0
                    ? 'Hãy thêm ít nhất 1 người chơi vào phòng để bắt đầu.'
                    : roleCount < playerCount
                      ? `Cần thêm ít nhất ${playerCount - roleCount} vai nữa để đủ chia cho ${playerCount} người chơi.`
                      : 'Bộ vai đã đủ! Bấm "Bắt đầu ván diễn →" để kéo rèm hoặc vào thẳng Sân Khấu Trong Trận.'
                }
              </div>
              <div class="stage-progress-track">
                <div class="stage-progress-fill" style="width:${progressPct}%"></div>
              </div>
            </div>

            <div class="row" style="margin:0">
              <button type="button" class="btn-crimson" onclick="go('ingame')">
                ⚔️ Vào sân khấu phòng
              </button>
              <button type="button" class="btn-gold btn-start-show" onclick="startStageShow()">
                🎭 Bắt đầu ván diễn →
              </button>
            </div>
          </div>
  `;
}

function villageMapEffects() {
  const houses = [[592, 187], [255, 300], [866, 274], [894, 495], [522, 504], [687, 506]];
  const lamps = [[472, 356], [716, 342], [572, 266], [602, 457], [397, 517], [782, 514], [1014, 312], [559, 609]];
  const fireflies = [[162, 456], [365, 282], [523, 396], [674, 329], [780, 425], [967, 519],
    [207, 616], [417, 575], [577, 486], [712, 606], [916, 382], [1011, 212]];
  return `
    <svg class="village-fx" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="villageFxLight">
          <stop stop-color="#ffe7b7" stop-opacity=".78"/>
          <stop offset=".38" stop-color="#ffc477" stop-opacity=".46"/>
          <stop offset="1" stop-color="#e59b57" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="villageFxFog">
          <stop stop-color="#ded8f5" stop-opacity=".41"/>
          <stop offset=".48" stop-color="#c8c0e7" stop-opacity=".24"/>
          <stop offset="1" stop-color="#bcb6da" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g fill="url(#villageFxLight)">
        <g class="village-fx-house">
          ${houses.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="46" ry="26"/>`).join('')}
        </g>
        <g class="village-fx-lamp">
          ${lamps.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="31"/>`).join('')}
        </g>
      </g>
      <g fill="url(#villageFxFog)">
        <g class="village-fx-fog"><ellipse cx="193" cy="164" rx="190" ry="49"/><ellipse cx="792" cy="605" rx="214" ry="49"/></g>
        <g class="village-fx-fog village-fx-fog-reverse"><ellipse cx="1014" cy="131" rx="198" ry="43"/><ellipse cx="255" cy="650" rx="205" ry="54"/></g>
      </g>
      <g fill="none" stroke="#afc6dc" stroke-width="1.8" stroke-linecap="round">
        <path class="village-fx-ripples" d="M18 568q32-9 64 0m-43 45q28-8 53 1m1041-217q24-7 48 0m-71 75q37-8 74 0m-87 85q29-6 56 0m-91 138q28-7 56 0"/>
        <path class="village-fx-ripples village-fx-ripples-delayed" d="M16 656q26-6 50 0m1080-395q19-4 33 0m-76 261q31-5 66 0m-56 96q25-6 51 0"/>
      </g>
      <g fill="#ffe4a4">
        ${fireflies.map(([x, y], index) => `
          <g class="village-fx-firefly" style="--flight-delay:-${index}s;--flight-time:${9 + index % 4}s;--flight-x:${index % 2 ? -16 : 19}px">
            <circle cx="${x}" cy="${y}" r="10" fill="url(#villageFxLight)"/>
            <circle cx="${x}" cy="${y}" r="2"/>
          </g>
        `).join('')}
      </g>
    </svg>
  `;
}

function villageMapArt() {
  return `
    <svg class="world-map-svg" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="villageLand" cy=".45" r=".7">
          <stop stop-color="#42464a"/><stop offset=".65" stop-color="#282c3d"/><stop offset="1" stop-color="#131526"/>
        </radialGradient>
        <linearGradient id="villageWater" x2="1" y2="1">
          <stop stop-color="#182b40"/><stop offset=".55" stop-color="#385261"/><stop offset="1" stop-color="#1a3046"/>
        </linearGradient>
        <radialGradient id="villageLight">
          <stop stop-color="#f8ae6a" stop-opacity=".44"/><stop offset="1" stop-color="#f8ae6a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="villageMist">
          <stop stop-color="#b9b7db" stop-opacity=".36"/><stop offset="1" stop-color="#b9b7db" stop-opacity="0"/>
        </radialGradient>
        <pattern id="villagePaper" width="22" height="19" patternUnits="userSpaceOnUse">
          <path d="m2 5 2-1m7 9 1-1m6-9 2 1m-4 11 2-1" stroke="#e5c0a6" stroke-opacity=".12" stroke-linecap="round"/>
        </pattern>
        <g id="villageTree">
          <ellipse cx="5" cy="44" rx="22" ry="8" fill="#121827" opacity=".7"/>
          <path d="M0 0 15 22l-7-1 13 15-6-1 10 10-23-3v7h-5v-7l-21 2 10-10-5 1 12-14-6 1Z" fill="currentColor"/>
          <path d="M0 5v36l-18 2 10-11-4 1 12-15-7 3Z" fill="#bbb5ba" opacity=".14"/>
        </g>
        <g id="villagePane">
          <path d="M0 11V5a5 5 0 0 1 10 0v6Z" fill="#ffe0a1"/>
          <path d="M5 1v10M1 6h8" stroke="#985a48" stroke-width="1"/>
        </g>
        <g id="villageCottage">
          <ellipse cx="39" cy="54" rx="48" ry="20" fill="#171624" opacity=".75"/>
          <ellipse cx="41" cy="38" rx="58" ry="48" fill="url(#villageLight)"/>
          <path d="M4 23 33 9l41 13v30L33 69 4 55Z" fill="#66505a"/>
          <path d="M33 33 74 22v30L33 69Z" fill="#493b4d"/>
          <path d="m-4 26 27-29 40-10 18 40-39 12Z" fill="currentColor" stroke="#c69692" stroke-opacity=".42" stroke-width="1.4"/>
          <path d="M23-3 42 39m-36-15 27 8m-19-17 13 4m23-17 16-5m-11 20 16-5m-11 20 15-5" fill="none" stroke="#eed1ab" stroke-opacity=".24" stroke-width="1.5"/>
          <path d="M44 65V53q5-8 11-2v9" fill="#201c2c"/>
          <use href="#villagePane" x="13" y="35"/><use href="#villagePane" x="59" y="39"/>
        </g>
        <g id="villageSpire">
          <ellipse cx="22" cy="84" rx="36" ry="15" fill="#191926" opacity=".7"/>
          <path d="M5 35 22 27l19 9v44L22 90 5 81Z" fill="#726171"/>
          <path d="M22 41 41 36v44l-19 10Z" fill="#51475c"/>
          <path d="M-3 36 22-14l27 50-27 11Z" fill="currentColor" stroke="#c69692" stroke-opacity=".55"/>
          <path d="M22-14v-13l14 5-14 4m0 7v50m-16 25 33-9" fill="none" stroke="#c39581" stroke-opacity=".7"/>
          <use href="#villagePane" x="27" y="50"/><use href="#villagePane" x="10" y="56"/>
        </g>
        <g id="villageLamp">
          <circle r="23" cy="1" fill="url(#villageLight)"/>
          <path d="M0 5v16m-6-17 6-7 6 7" fill="none" stroke="#2b2334" stroke-width="2"/>
          <path d="M-4 0h8l-1 7h-6Z" fill="#ffd295"/>
        </g>
        <path id="villageRoads" d="M600 735q-30-66-23-150t20-205q12-63-4-190M596 380q-93-14-152-38T288 320Q161 333 84 413m512-33q126-30 197-76t226-6l122 40M582 510q-149-35-245 21l-108 69M580 511q119 24 211-1l104-26m-301-284q-126-38-208 4t-121 93m327-95q120-41 214-11"/>
      </defs>

      <rect width="1200" height="780" fill="url(#villageLand)"/>
      <path d="M0 106Q194 29 339 110t253-8q182-74 362-58t246 27v169q-121-132-257-101t-290 49q-117 4-260-37T0 240Z" fill="#555167" opacity=".32"/>
      <path d="M0 203Q190 111 350 158t264-7q190-63 369-50t217 49M0 239q180-115 350-54t264-20q190-54 366-35t220 48M0 284q151-102 315-76" fill="none" stroke="#b9a3aa" stroke-opacity=".2" stroke-width="2"/>
      <ellipse cx="593" cy="189" rx="181" ry="114" fill="#706167" opacity=".35"/>
      <ellipse cx="593" cy="187" rx="158" ry="91" fill="none" stroke="#c2a191" stroke-opacity=".19" stroke-width="2"/>
      <ellipse cx="597" cy="376" rx="104" ry="80" fill="#977e73" opacity=".24"/>
      <ellipse cx="597" cy="376" rx="86" ry="63" fill="none" stroke="#c4a18d" stroke-opacity=".28" stroke-width="2"/>

      <path d="M1200 135q-143 58-133 184t-49 196q-35 61-15 128t-54 137h251Z" fill="#211f31" stroke="#98829a" stroke-opacity=".3" stroke-width="4"/>
      <path d="M1200 154q-117 58-109 169t-56 207q-28 54-11 118t-52 132h228Z" fill="url(#villageWater)"/>
      <path d="M1150 241q-55 63-46 108t-25 111m65-95q-6 57-44 103t-25 109m17 59q15 58-32 110m100-249q-61 82-35 181" fill="none" stroke="#9ea9bb" stroke-opacity=".31" stroke-width="2"/>
      <path d="M0 504q108-18 144 48t-20 128q-23 34 30 100H0Z" fill="url(#villageWater)" stroke="#938596" stroke-opacity=".34" stroke-width="3"/>

      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <use href="#villageRoads" stroke="#262435" stroke-width="37"/>
        <use href="#villageRoads" stroke="#867071" stroke-width="24"/>
        <use href="#villageRoads" stroke="#bea08c" stroke-opacity=".46" stroke-width="2" stroke-dasharray="3 13"/>
      </g>
      <path d="m1039 292 100 31-8 27-99-29Z" fill="#67505b" stroke="#bb9383" stroke-width="2"/>
      <path d="m1051 296-7 28m22-24-7 28m23-23-8 28m24-23-8 28m24-23-8 28m22-23-8 28" stroke="#c29284" stroke-opacity=".55" stroke-width="2"/>
      <rect width="1200" height="780" fill="url(#villagePaper)"/>

      <g color="#303448">
        <use href="#villageTree" x="132" y="121"/><use href="#villageTree" x="169" y="110"/><use href="#villageTree" x="195" y="132"/><use href="#villageTree" x="227" y="114"/>
        <use href="#villageTree" x="330" y="76"/><use href="#villageTree" x="359" y="68"/><use href="#villageTree" x="390" y="76"/>
        <use href="#villageTree" x="793" y="59"/><use href="#villageTree" x="836" y="78"/><use href="#villageTree" x="868" y="63"/><use href="#villageTree" x="896" y="79"/>
        <use href="#villageTree" x="991" y="155"/><use href="#villageTree" x="1021" y="173"/><use href="#villageTree" x="1040" y="146"/>
      </g>
      <g color="#273744">
        <use href="#villageTree" x="78" y="402"/><use href="#villageTree" x="115" y="414"/><use href="#villageTree" x="153" y="447"/><use href="#villageTree" x="182" y="427"/>
        <use href="#villageTree" x="399" y="395"/><use href="#villageTree" x="429" y="409"/><use href="#villageTree" x="461" y="395"/>
        <use href="#villageTree" x="700" y="372"/><use href="#villageTree" x="728" y="396"/><use href="#villageTree" x="755" y="379"/>
        <use href="#villageTree" x="952" y="395"/><use href="#villageTree" x="971" y="426"/><use href="#villageTree" x="1005" y="394"/>
        <use href="#villageTree" x="352" y="622"/><use href="#villageTree" x="392" y="639"/><use href="#villageTree" x="429" y="616"/><use href="#villageTree" x="453" y="642"/>
        <use href="#villageTree" x="694" y="650"/><use href="#villageTree" x="726" y="664"/><use href="#villageTree" x="753" y="632"/>
        <use href="#villageTree" x="932" y="603"/><use href="#villageTree" x="959" y="621"/><use href="#villageTree" x="978" y="589"/>
      </g>

      <g color="#4e3e5d">
        <use href="#villageCottage" transform="translate(453 159) scale(.59)"/><use href="#villageCottage" transform="translate(686 147) scale(.63)"/>
        <use href="#villageCottage" transform="translate(499 263) scale(.61)"/><use href="#villageCottage" transform="translate(671 263) scale(.55)"/>
        <use href="#villageCottage" transform="translate(127 316) scale(.8)"/><use href="#villageCottage" transform="translate(171 271) scale(.71)"/>
        <use href="#villageCottage" transform="translate(341 264) scale(.74)"/><use href="#villageCottage" transform="translate(378 305) scale(.64)"/>
        <use href="#villageCottage" transform="translate(763 246) scale(.74)"/><use href="#villageCottage" transform="translate(940 269) scale(.72)"/>
        <use href="#villageCottage" transform="translate(437 474) scale(.7)"/><use href="#villageCottage" transform="translate(493 448) scale(.66)"/>
        <use href="#villageCottage" transform="translate(645 470) scale(.74)"/><use href="#villageCottage" transform="translate(713 459) scale(.68)"/>
      </g>

      <g color="#57405b">
        <ellipse cx="587" cy="181" rx="116" ry="74" fill="url(#villageLight)"/>
        <path d="m520 168 70-35 69 25v48l-70 29-69-26Z" fill="#716474" stroke="#a08b91" stroke-width="2"/>
        <path d="m540 166 45-60 54 50-50 24Z" fill="#5c3b58" stroke="#bd9290" stroke-width="2"/>
        <use href="#villageSpire" transform="translate(523 107) scale(.89)"/><use href="#villageSpire" transform="translate(625 102) scale(.91)"/>
        <use href="#villageSpire" transform="translate(569 78) scale(1.13)"/>
        <use href="#villagePane" x="551" y="183"/><use href="#villagePane" x="576" y="192"/><use href="#villagePane" x="612" y="182"/>
      </g>
      <use href="#villageCottage" color="#874757" transform="translate(218 239) scale(1.45)"/>
      <use href="#villageCottage" color="#6f4357" transform="translate(282 277) scale(.87)"/>
      <use href="#villageSpire" color="#604a70" transform="translate(837 178) scale(1.47)"/>
      <use href="#villageCottage" color="#53425d" transform="translate(887 252) scale(.86)"/>

      <g transform="translate(593 354)">
        <circle r="51" fill="url(#villageLight)"/>
        <ellipse cy="32" rx="43" ry="14" fill="#272531"/>
        <path d="M-31 8v19q30 24 61 0V8" fill="#797184" stroke="#be9d9c" stroke-width="2"/>
        <ellipse cy="8" rx="31" ry="12" fill="#323949" stroke="#c6aaa5" stroke-width="3"/>
        <path d="M-24 4v-28m49 27v-27M-36-22l14-21 41-2 19 25Z" stroke="#b08888" stroke-width="3" fill="#5f3e5b"/>
      </g>

      <g transform="translate(284 506)">
        <ellipse cy="16" rx="65" ry="48" fill="url(#villageLight)"/>
        <path d="m-41 39 23-12 43 8-20 12Z" fill="#797481" stroke="#a68c92" stroke-width="2"/>
        <path d="M-25 33v-54l17-24 30 19v63Z" fill="#6b647c" stroke="#b0929c" stroke-width="2"/>
        <path d="m-4-17 6 10-6 10-6-10Zm-9 28 20 3m-20 6 15 2" fill="none" stroke="#e6b883" stroke-width="2"/>
      </g>
      <use href="#villageCottage" color="#785061" transform="translate(838 438) scale(1.32)"/>
      <use href="#villageSpire" color="#60445d" transform="translate(909 421) scale(.59)"/>
      <g>
        <use href="#villageLamp" x="472" y="356"/><use href="#villageLamp" x="716" y="342"/>
        <use href="#villageLamp" x="572" y="266"/><use href="#villageLamp" x="602" y="457"/>
        <use href="#villageLamp" x="397" y="517"/><use href="#villageLamp" x="782" y="514"/>
        <use href="#villageLamp" x="1014" y="312"/><use href="#villageLamp" x="559" y="609"/>
      </g>
      <g fill="url(#villageMist)">
        <ellipse cx="144" cy="155" rx="223" ry="64"/><ellipse cx="979" cy="108" rx="267" ry="66"/>
        <ellipse cx="201" cy="649" rx="234" ry="59"/><ellipse cx="1055" cy="592" rx="261" ry="62"/>
      </g>
      <path d="M45 40h1110v700H45Zm12 12v676h1086V52Z" fill="#c6a688" fill-opacity=".16" fill-rule="evenodd"/>
      <g transform="translate(1034 106)" stroke="#c9ab8a" fill="none" opacity=".62">
        <circle r="24"/><path d="M0-35 7-7 34 0 7 7 0 35-7 7-34 0-7-7Z"/><path d="M0-35 7-7 0 0Z" fill="#d8b691"/>
      </g>
    </svg>
  `;
}

/* ==========================================================================
   9. ③ MÀN HÌNH TRONG TRẬN (IN-GAME STAGE — Cảm hứng Ảnh 5)
   HUD góc trên trái + Sân khấu Rừng đêm/Bình minh + Hộp thoại Typewriter ở đáy
   ========================================================================== */
let stageState = {
  phase: 'night',      // 'night' | 'day'
  dayNumber: 1,
  myRoleId: 28,        // Tiên Tri mặc định (có thể đổi trực tiếp)
  targetPlayerId: 9002,
  charges: { skill: 2, shield: 1, potion: 1 },
  hp: 4,
  maxHp: 5,
  votes: {
    9002: 2,
    9005: 1
  },
  dayChatMessages: [
    { author: '#9001 Luna Moon (Tiên Tri)', time: '09:15', text: 'Đêm qua mình đã soi #9002 Bá Tước Đêm ra hào quang Ác! Mọi người tập trung vote #9002 nhé!', me: true },
    { author: '#9002 Bá Tước Đêm', time: '09:18', text: 'Khoan vội! Đêm qua có Sói Ảo Ảnh hoặc Sói Lừa Gạt làm nhiễu kết quả soi đó, mình là Dân mà!' },
    { author: '#9003 Thợ Săn Sương Mù (Bảo Vệ)', time: '09:22', text: 'Đêm qua mình đã bật khiên bảo vệ cho #9001 Luna Moon. Mình tin Tiên Tri, mình bỏ phiếu #9002!' },
    { author: '⚖️ Hội Đồng Làng', time: '09:25', text: 'Thợ Săn Sương Mù (#9003) và Cô Bé Khăn Đỏ (#9004) đã bỏ phiếu treo cổ Bá Tước Đêm (#9002).', systemVote: true }
  ],
  seatStatuses: {
    9001: ['🛡️ Có khiên'],
    9002: ['🎯 Bị tình nghi'],
    9003: [],
    9004: ['🛡️ Có khiên'],
    9005: ['⛓️ Bị xích'],
    9006: [],
    9007: ['🔮 Đã soi: Thiện'],
    9008: ['💀 Đã ngã xuống']
  },
  speaker: 'Quản Trò Bóng Đêm',
  speakerImg: 'assets/redhood.png',
  dialogue: 'Đêm thứ nhất buông xuống Làng Sương Mù... Ánh trăng lưỡi liềm treo trên đỉnh lâu đài cổ. Hãy chọn một người chơi trên sân khấu để thi triển kỹ năng đêm!'
};

let typewriterTimer = null;

function runTypewriter(text) {
  clearInterval(typewriterTimer);
  const el = $('stageTypewriterText');
  if (!el) return;
  el.textContent = '';
  let i = 0;
  const speed = Math.max(10, state.typewriterSpeed || 24);
  typewriterTimer = setInterval(() => {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      if (i % 3 === 0) playTypewriterTick();
      i++;
    } else {
      clearInterval(typewriterTimer);
    }
  }, speed);
}

function ingame() {
  const room = getActiveRoom();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const roomPlayers = (room ? room.playerIds : DEFAULT_PLAYERS.map(p => p.id))
    .map(pid => state.players.find(p => p.id === pid))
    .filter(Boolean);
  const targetPlayer = state.players.find(p => p.id === stageState.targetPlayerId) || roomPlayers[0];
  const isNight = stageState.phase === 'night';
  const totalVotes = Object.values(stageState.votes || {}).reduce((a, b) => a + b, 0);

  const heartsHtml = Array.from({ length: stageState.maxHp }, (_, idx) =>
    idx < stageState.hp ? '❤️' : '🖤'
  ).join(' ');

  $('content').innerHTML = `
    <section class="ingame-stage-wrap ${isNight ? 'night-phase' : 'day-phase'}">
      <!-- Biểu ngữ Pha duy nhất ở chính giữa đỉnh màn hình (Không lặp lại ở HUD dưới) -->
      <div class="phase-sky-banner">
        ${isNight
          ? `🌙 PHA BAN ĐÊM (ĐÊM THỨ ${stageState.dayNumber}) — CẢ LÀNG NHẮM MẮT · KẺ ĐÊM THỨC GIẤC`
          : `☀️ PHA BAN NGÀY (NGÀY THỨ ${stageState.dayNumber}) — BÌNH MINH THẢO LUẬN & BỎ PHIẾU TREO CỔ (${totalVotes} PHIẾU)`}
      </div>

      <!-- Bối cảnh Sân Khấu Tràn Màn Hình SVG: Phân biệt rõ Ban Đêm ↔ Ban Ngày -->
      <svg class="ingame-backdrop-svg" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nightMoonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF5D6" stop-opacity="0.65"/>
            <stop offset="45%" stop-color="#F3D38B" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#2A1B47" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="daySunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFDF0" stop-opacity="0.95"/>
            <stop offset="35%" stop-color="#FDE08D" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#F6AD55" stop-opacity="0"/>
          </radialGradient>
        </defs>

        ${isNight ? `
          <!-- BẦU TRỜI BAN ĐÊM -->
          <g fill="#F4EEFA" opacity="0.8">
            <circle cx="120" cy="85" r="1.8"/><circle cx="260" cy="140" r="1.4"/><circle cx="390" cy="65" r="2.2"/>
            <circle cx="520" cy="110" r="1.5"/><circle cx="880" cy="70" r="2"/><circle cx="1050" cy="120" r="1.6"/>
            <circle cx="1240" cy="80" r="2.2"/><circle cx="1350" cy="160" r="1.5"/><circle cx="190" cy="220" r="1.5"/>
          </g>
          <circle cx="720" cy="210" r="185" fill="url(#nightMoonHalo)"/>
          <path d="M735 125 A76 76 0 1 0 735 265 A58 58 0 1 1 735 125 Z" fill="#F3D38B"/>
          <path d="M0 440 Q220 360 460 415 T940 400 T1440 430 L1440 800 L0 800 Z" fill="#16132B" opacity="0.82"/>
          <path d="M0 530 Q360 450 720 510 T1440 495 L1440 800 L0 800 Z" fill="#100D22"/>
        ` : `
          <!-- BẦU TRỜI BAN NGÀY -->
          <circle cx="720" cy="215" r="240" fill="url(#daySunHalo)"/>
          <g stroke="#FFF9DB" stroke-width="28" stroke-opacity="0.18" stroke-linecap="round">
            <line x1="720" y1="215" x2="220" y2="60"/>
            <line x1="720" y1="215" x2="360" y2="20"/>
            <line x1="720" y1="215" x2="1080" y2="20"/>
            <line x1="720" y1="215" x2="1220" y2="60"/>
            <line x1="720" y1="215" x2="180" y2="280"/>
            <line x1="720" y1="215" x2="1260" y2="280"/>
          </g>
          <circle cx="720" cy="215" r="68" fill="#FFFBEB"/>
          <g fill="#FFFFFF" opacity="0.72">
            <ellipse cx="290" cy="180" rx="95" ry="28"/>
            <ellipse cx="330" cy="168" rx="65" ry="24"/>
            <ellipse cx="1110" cy="165" rx="105" ry="30"/>
            <ellipse cx="1065" cy="152" rx="70" ry="24"/>
          </g>
          <path d="M0 450 Q260 365 540 420 T1060 405 T1440 435 L1440 800 L0 800 Z" fill="#4A7C59" opacity="0.88"/>
          <path d="M0 545 Q380 465 740 525 T1440 510 L1440 800 L0 800 Z" fill="#2F523B"/>
        `}

        <!-- Tòa Lâu Đài Cổ Tích Gothic bên phải -->
        <g transform="translate(1060, 210)">
          <rect x="75" y="110" width="130" height="290" rx="4" fill="${isNight ? '#131126' : '#4A435A'}"/>
          <path d="M45 112 Q140 5 235 112 Z" fill="${isNight ? '#241D3D' : '#6C5B7B'}"/>
          <rect x="5" y="210" width="105" height="190" rx="4" fill="${isNight ? '#181530' : '#574F68'}"/>
          <path d="M-12 212 Q57 120 126 212 Z" fill="${isNight ? '#2C234A' : '#7B688A'}"/>
          <rect x="180" y="235" width="95" height="165" rx="4" fill="${isNight ? '#181530' : '#574F68'}"/>
          <path d="M165 237 Q227 160 290 237 Z" fill="${isNight ? '#2C234A' : '#7B688A'}"/>
          <circle cx="57" cy="252" r="16" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
          <rect x="126" y="155" width="28" height="44" rx="14" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
          <rect x="215" y="272" width="24" height="36" rx="12" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
        </g>

        <!-- Rừng cây cổ tích bên trái & Đèn lồng -->
        <g fill="${isNight ? '#0C0A18' : '#263E2E'}">
          <path d="M110 640 Q135 460 105 340 Q60 270 20 235 Q85 260 125 320 Q155 240 215 195 Q165 260 148 345 Q205 305 275 305 Q205 330 155 405 L162 640 Z"/>
          <path d="M390 640 Q410 500 385 390 Q340 320 300 290 Q355 312 395 365 Q428 295 485 260 Q438 318 415 395 L425 640 Z"/>
        </g>
        <line x1="230" y1="312" x2="230" y2="365" stroke="#5A4878" stroke-width="2"/>
        <rect x="221" y="365" width="18" height="24" rx="5" fill="${isNight ? '#F3D38B' : '#CBD5E0'}"/>
        ${isNight ? '<circle cx="230" cy="377" r="28" fill="url(#nightMoonHalo)"/>' : ''}

        <path d="M0 615 Q720 575 1440 615 L1440 800 L0 800 Z" fill="${isNight ? '#090814' : '#1E2D24'}"/>
      </svg>

      <!-- 1. Góc trên bên trái & phải (HUD tinh gọn, không còn nút/nhãn trùng lặp) -->
      <header class="ingame-hud-top">
        <div class="hud-left-cluster">
          <div class="hud-hearts" title="Sinh mệnh & Tinh thần hiện tại">
            <span>${heartsHtml}</span>
            <span class="muted" style="font-size:12.5px;letter-spacing:0;margin-left:8px">
              Phòng #${room?.id || 1001} · ${esc(room?.name || 'Dinh Thự Đồi Trăng')}
            </span>
          </div>

          <div class="hud-slots-row">
            <div class="hud-slot active-role" title="Thân phận đang nhập vai">
              <img src="${portrait(myRole)}" alt="${esc(myRole.name)}">
              <div>
                <strong style="color:var(--gold)">#${String(myRole.id).padStart(2, '0')} ${esc(myRole.name)}</strong>
                <span class="muted" style="font-size:11px;display:block">${teamLabel(myRole)} · Hào quang: ${esc(myRole.aura)}</span>
              </div>
            </div>

            <div class="hud-slot">
              <span>🔮 Kỹ năng:</span>
              <b style="color:var(--gold)">${stageState.charges.skill}</b>
            </div>
            <div class="hud-slot">
              <span>🛡️ Khiên:</span>
              <b style="color:var(--gold)">${stageState.charges.shield}</b>
            </div>
            <div class="hud-slot">
              <span>🧪 Đạo cụ:</span>
              <b style="color:var(--gold)">${stageState.charges.potion}</b>
            </div>
          </div>
        </div>

        <div class="hud-right-cluster">
          <select
            class="input-field"
            style="min-height:36px;padding:5px 10px;font-size:12.5px"
            aria-label="Đổi vai nhập vai thử nghiệm"
            onchange="changeMyStageRole(Number(this.value))"
          >
            ${ROLES.slice(0, 52).map(r => `
              <option value="${r.id}" ${r.id === myRole.id ? 'selected' : ''}>
                Hóa thân: #${String(r.id).padStart(2, '0')} ${esc(r.name)}
              </option>
            `).join('')}
          </select>
          <button type="button" class="btn-gold" style="padding:7px 14px;font-size:12.5px" onclick="toggleStagePhase()">
            ${isNight ? '☀️ Sang Ban Ngày (Thảo luận & Vote)' : '🌙 Sang Ban Đêm (Hành động)'}
          </button>
          <button type="button" class="btn-secondary" style="padding:7px 12px;font-size:12.5px" onclick="go('rooms')">
            🗺️ Rời trận
          </button>
        </div>
      </header>

      <!-- 2. Trung tâm sân khấu: Ban đêm chỉ hiện Vòng người chơi | Ban ngày mở thêm Khung Chat Thảo Luận & Vote -->
      <div class="ingame-arena ${!isNight ? 'day-split-layout' : ''}">
        <div class="arena-players-grid">
          ${roomPlayers.map((p, idx) => {
            const isTarget = p.id === stageState.targetPlayerId;
            const badges = stageState.seatStatuses[p.id] || [];
            const isDead = badges.some(b => b.includes('💀'));
            const voteCount = stageState.votes?.[p.id] || 0;
            const avatarRoleId = (room?.roleIds?.[idx % (room?.roleIds?.length || 1)]) || ((idx % 52) + 1);
            return `
              <div
                class="arena-seat ${isTarget ? 'targeted' : ''} ${isDead ? 'dead' : ''}"
                onmouseenter="playHoverSfx()"
                onclick="selectStageTarget(${p.id})"
              >
                ${!isNight && voteCount > 0 ? `<span class="vote-tally-pill">⚖️ ${voteCount} phiếu</span>` : ''}
                <img class="arena-seat-avatar" src="${portrait(avatarRoleId)}" alt="${esc(p.name)}">
                <span class="role-id-badge">#${p.id}</span>
                <div class="arena-seat-name">${esc(p.name)}</div>
                <div class="arena-seat-badges">
                  ${isTarget ? '<span class="seat-badge" style="color:var(--gold);border-color:var(--border-gold-hover)">🎯 Đang chọn</span>' : ''}
                  ${badges.map(b => `<span class="seat-badge">${esc(b)}</span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${!isNight ? `
          <!-- KHUNG CHAT HỘI ĐỒNG LÀNG BAN NGÀY: Thảo luận & Bỏ phiếu trực tiếp -->
          <aside class="day-discussion-panel" aria-label="Khung chat thảo luận và bỏ phiếu ban ngày">
            <div class="day-chat-header">
              <strong>💬 Hội Đồng Làng · Thảo Luận & Vote</strong>
              <span class="nav-badge">${stageState.dayChatMessages.length} tin nhắn</span>
            </div>

            <div class="day-chat-messages" id="dayChatMessagesBox">
              ${stageState.dayChatMessages.map(m => `
                <div class="day-chat-msg ${m.me ? 'me' : ''} ${m.systemVote ? 'vote-system' : ''}">
                  <div class="day-chat-author">
                    <span>${esc(m.author)}</span>
                    <small style="opacity:0.75">${esc(m.time || 'Ban ngày')}</small>
                  </div>
                  <div>${esc(m.text)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Thanh câu thoại báo cáo nhanh 1 chạm -->
            <div class="day-quick-phrases">
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('seer')">
                🔮 Báo kết quả soi #${targetPlayer?.id || 9002}
              </button>
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('vote')">
                ⚖️ Kêu gọi vote #${targetPlayer?.id || 9002}
              </button>
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('defend')">
                🛡️ Tôi thuộc Phe Dân Làng!
              </button>
            </div>

            <form class="day-chat-form" onsubmit="sendDayChatMessage(event)">
              <input
                id="dayChatInput"
                placeholder="Nhập lời thảo luận hoặc biện hộ trước làng..."
                autocomplete="off"
              >
              <button type="submit" class="btn-gold" style="padding:6px 12px;font-size:12px">Gửi ➤</button>
            </form>
          </aside>
        ` : ''}
      </div>

      <!-- 3. Đáy màn hình: Hộp thoại theo ngữ cảnh (Ban Đêm = Kỹ năng | Ban Ngày = Bỏ phiếu, không trùng nút chuyển pha) -->
      <footer class="ingame-dialogue-bar">
        <div class="dialogue-portrait-box">
          <img src="${esc(stageState.speakerImg)}" alt="${esc(stageState.speaker)}">
        </div>

        <div class="dialogue-text-area">
          <span class="dialogue-speaker">
            ${esc(stageState.speaker)} · Mục tiêu đang chọn: ${targetPlayer ? `${targetPlayer.name} (#${targetPlayer.id})` : 'Chưa chọn'}
          </span>
          <p class="dialogue-typewriter" id="stageTypewriterText"></p>
        </div>

        <div class="dialogue-choices">
          ${isNight ? `
            <button type="button" class="dialogue-choice-btn primary-choice" onmouseenter="playHoverSfx()" onclick="stageActionUseSkill()">
              ✦ DÙNG KỸ NĂNG ĐÊM
            </button>
            <button type="button" class="dialogue-choice-btn" onmouseenter="playHoverSfx()" onclick="stageActionToggleBadge()">
              🛡️ GẮN KHIÊN / XÍCH
            </button>
          ` : `
            <button type="button" class="dialogue-choice-btn primary-choice" onmouseenter="playHoverSfx()" onclick="stageActionVote()">
              ⚖️ BỎ PHIẾU TREO CỔ (#${targetPlayer?.id || 9002})
            </button>
            <button type="button" class="dialogue-choice-btn" onmouseenter="playHoverSfx()" onclick="executeDayVoteVerdict()">
              🔥 CHỐT PHIẾU XỬ QUYẾT
            </button>
          `}
        </div>
      </footer>
    </section>
  `;

  runTypewriter(stageState.dialogue);
  const chatBox = $('dayChatMessagesBox');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function selectStageTarget(playerId) {
  playSelectSfx();
  stageState.targetPlayerId = playerId;
  const target = state.players.find(p => p.id === playerId);
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.speaker = `${myRole.name} (#${String(myRole.id).padStart(2, '0')})`;
  stageState.speakerImg = portrait(myRole);
  stageState.dialogue = stageState.phase === 'night'
    ? `Đang chọn ${target?.name || 'người chơi'} (#${playerId}). Nhấn [ ✦ DÙNG KỸ NĂNG ĐÊM ] để thi triển năng lực của ${myRole.name}.`
    : `Đang chỉ định ${target?.name || 'người chơi'} (#${playerId}). Bạn có thể thảo luận ở khung Chat bên phải hoặc nhấn [ ⚖️ BỎ PHIẾU TREO CỔ ].`;
  ingame();
}

function changeMyStageRole(roleId) {
  playSelectSfx();
  const r = ROLES.find(x => x.id === roleId) || ROLES[0];
  stageState.myRoleId = r.id;
  stageState.charges = { skill: 2, shield: 1, potion: 1 };
  stageState.speaker = `${r.name} (${teamLabel(r)})`;
  stageState.speakerImg = portrait(r);
  stageState.dialogue = `Bạn đã hóa thân thành ${r.name}: "${r.desc.split(/\n/)[0]}"`;
  ingame();
}

function stageActionUseSkill() {
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  if (stageState.charges.skill <= 0) {
    stageState.speaker = 'Quản Trò Bóng Đêm';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `Kỹ năng của ${myRole.name} đã hết lượt sử dụng trong đêm nay! Hãy bấm nút "☀️ Sang Ban Ngày" trên góc phải để bước vào phiên thảo luận.`;
    runTypewriter(stageState.dialogue);
    return;
  }
  stageState.charges.skill = Math.max(0, stageState.charges.skill - 1);
  const pid = stageState.targetPlayerId;
  stageState.seatStatuses[pid] = stageState.seatStatuses[pid] || [];
  const tag = myRole.team === 'soi' ? '🐺 Bị Sói nhắm' : myRole.team === 'dan' ? '✨ Được kiểm tra/hộ vệ' : '🔮 Dính ấn Phe Ba';
  if (!stageState.seatStatuses[pid].includes(tag)) {
    stageState.seatStatuses[pid].push(tag);
  }
  stageState.speaker = myRole.name;
  stageState.speakerImg = portrait(myRole);
  stageState.dialogue = `[KỸ NĂNG ĐÊM] ${myRole.name} đã thi triển năng lực lên ${target?.name || 'mục tiêu'} (#${pid})! Kết quả đã được ghi nhận.`;
  ingame();
}

function stageActionVote() {
  playSelectSfx();
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  const pid = stageState.targetPlayerId;
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.votes[pid] = (stageState.votes[pid] || 0) + 1;

  stageState.dayChatMessages.push({
    author: '⚖️ Hội Đồng Làng',
    time: 'Vừa xong',
    text: `Luna Moon (${myRole.name}) đã bỏ 1 phiếu treo cổ ${target?.name || 'người chơi'} (#${pid}) → Tổng: ${stageState.votes[pid]} phiếu.`,
    systemVote: true
  });

  stageState.speaker = 'Hội Đồng Làng Sương Mù';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `[BỎ PHIẾU PHÁN XÉT] Bạn đã bỏ phiếu treo cổ ${target?.name || 'người chơi'} (#${pid}) — hiện có ${stageState.votes[pid]} phiếu!`;
  ingame();
}

function executeDayVoteVerdict() {
  playCurtainSfx();
  const entries = Object.entries(stageState.votes || {});
  if (!entries.length) {
    stageState.dialogue = 'Chưa có lá phiếu nào được bỏ trong ngày hôm nay!';
    runTypewriter(stageState.dialogue);
    return;
  }
  entries.sort((a, b) => b[1] - a[1]);
  const [topIdStr, topVotes] = entries[0];
  const topId = Number(topIdStr);
  const topPlayer = state.players.find(p => p.id === topId);
  stageState.seatStatuses[topId] = ['💀 Bị treo cổ (' + topVotes + ' phiếu)'];

  stageState.dayChatMessages.push({
    author: '🔥 Phán Quyết Quảng Trường',
    time: 'Kết thúc ngày',
    text: `Với ${topVotes} phiếu bầu cao nhất, ${topPlayer?.name || 'người chơi'} (#${topId}) đã bị xử quyết trên giàn treo cổ!`,
    systemVote: true
  });

  stageState.speaker = 'Phán Quyết Hội Đồng';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `[XỬ QUYẾT HOÀN TẤT] ${topPlayer?.name || 'Người chơi'} (#${topId}) đã bị treo cổ với ${topVotes} phiếu bầu! Hãy bấm "🌙 Sang Ban Đêm" ở góc trên phải để bước sang đêm kế tiếp.`;
  ingame();
}

function sendDayChatMessage(e) {
  e.preventDefault();
  const input = $('dayChatInput');
  const text = input?.value.trim();
  if (!text) return;
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.dayChatMessages.push({
    author: `#9001 Luna Moon (${myRole.name})`,
    time: 'Vừa xong',
    text,
    me: true
  });
  input.value = '';
  ingame();
}

function sendDayQuickPhrase(type) {
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  const tName = `${target?.name || 'mục tiêu'} (#${stageState.targetPlayerId})`;
  let text = '';
  if (type === 'seer') {
    text = `Đêm qua mình dùng kỹ năng kiểm tra ${tName} và phát hiện dấu hiệu đáng ngờ, mọi người chú ý!`;
  } else if (type === 'vote') {
    text = `Mình đề nghị cả làng dồn phiếu treo cổ ${tName} ngay trong hôm nay!`;
  } else {
    text = `Mình giữ vai ${myRole.name} thuộc ${teamLabel(myRole)}, đừng treo cổ nhầm mình nhé!`;
  }
  stageState.dayChatMessages.push({
    author: `#9001 Luna Moon (${myRole.name})`,
    time: 'Vừa xong',
    text,
    me: true
  });
  ingame();
}

function stageActionToggleBadge() {
  playSelectSfx();
  const pid = stageState.targetPlayerId;
  const target = state.players.find(p => p.id === pid);
  const cur = stageState.seatStatuses[pid] || [];
  if (cur.includes('🛡️ Có khiên')) {
    stageState.seatStatuses[pid] = ['⛓️ Bị xích'];
  } else if (cur.includes('⛓️ Bị xích')) {
    stageState.seatStatuses[pid] = ['💀 Đã ngã xuống'];
  } else {
    stageState.seatStatuses[pid] = ['🛡️ Có khiên'];
  }
  stageState.speaker = 'Quản Trò Bóng Đêm';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `Đã cập nhật trạng thái trên sân khấu của ${target?.name || 'người chơi'} (#${pid}) thành: ${stageState.seatStatuses[pid].join(', ')}.`;
  ingame();
}

function toggleStagePhase() {
  playCurtainSfx();
  if (stageState.phase === 'night') {
    stageState.phase = 'day';
    stageState.speaker = 'Bình Minh Làng Sương Mù';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `☀️ Ngày thứ ${stageState.dayNumber} bắt đầu! Khung Chat Hội Đồng Làng đã mở bên phải — hãy thảo luận cùng các người chơi và nhấn [ ⚖️ BỎ PHIẾU TREO CỔ ]!`;
  } else {
    stageState.phase = 'night';
    stageState.dayNumber += 1;
    stageState.charges.skill = Math.min(3, stageState.charges.skill + 1);
    stageState.speaker = 'Đêm Định Mệnh';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `🌙 Đêm thứ ${stageState.dayNumber} buông xuống! Tiếng hộp nhạc vang lên từ khu rừng cổ tích. Hãy chọn mục tiêu và nhấn [ ✦ DÙNG KỸ NĂNG ĐÊM ].`;
  }
  ingame();
}

/* ==========================================================================
   10. Trang Tổng quan / Sảnh chính (Overview Hub)
   ========================================================================== */
function getPlayerRankInfo() {
  const acc = currentAccount();
  const ranked = [...state.players].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0));
  if (!acc) {
    const top = ranked[0];
    return {
      points: top ? (state.scores[top.id] || 2450) : 2450,
      rank: '#1 (Mẫu)',
      sub: 'Đăng nhập để lưu hạng cá nhân'
    };
  }
  const idx = ranked.findIndex(p => p.id === acc.id);
  const pts = state.scores[acc.id] ?? 2450;
  return {
    points: pts,
    rank: idx >= 0 ? `#${idx + 1}` : '#1',
    sub: `${acc.name} (#${acc.id})`
  };
}

function overview() {
  const rankInfo = getPlayerRankInfo();
  const waitingRooms = state.rooms.filter(r => r.status === 'waiting').length;

  $('content').innerHTML = `
    <section class="hero-stage">
      <div class="hero-copy">
        <div class="hero-kicker">☾ MA SÓI NHẬP VAI — Sân Khấu Cổ Tích Đen</div>
        <h1>Mỗi đêm là một bí mật mới</h1>
        <p>
          Khi bức rèm nhung đỏ rượu hé mở, ánh trăng bạc chiếu rọi xuống khu rừng sương mù.
          Khám phá Bản đồ Làng về đêm, tra cứu 52 vai chuẩn cùng 100 thân phận mở rộng và bước lên Sân khấu Trong trận.
        </p>
        <div class="hero-actions">
          <button type="button" class="btn-gold" onclick="go('rooms')">🗺️ Vào Bản Đồ Làng (Sảnh Đấu)</button>
          <button type="button" class="btn-crimson" onclick="go('ingame')">⚔️ Sân Khấu Trong Trận</button>
          <button type="button" class="btn-secondary" onclick="go('roles')">🎭 Bách Khoa Thân Phận</button>
          <button type="button" class="btn-secondary" onclick="openTitleScreen()">🎬 Title Screen</button>
        </div>
      </div>
      <div class="hero-artwork" aria-hidden="true">
        <svg class="hero-curtain-svg" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="heroMoon" cx="50%" cy="38%" r="55%">
              <stop offset="0%" stop-color="#FFF4D4"/>
              <stop offset="35%" stop-color="#F3D38B" stop-opacity="0.85"/>
              <stop offset="100%" stop-color="#2A1B47" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="heroCurtain" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#4A1120"/>
              <stop offset="50%" stop-color="#7A2438"/>
              <stop offset="100%" stop-color="#9E304A"/>
            </linearGradient>
          </defs>
          <rect x="12" y="10" width="336" height="200" rx="18" fill="#120E24" stroke="#463766" stroke-width="2"/>
          <circle cx="180" cy="92" r="78" fill="url(#heroMoon)"/>
          <circle cx="180" cy="84" r="34" fill="#F4EEFA"/>
          <circle cx="192" cy="76" r="28" fill="#22183C" opacity="0.22"/>
          <path d="M162 175 L168 122 L180 102 L192 122 L198 175 Z" fill="#0E0C1D"/>
          <path d="M55 198 Q85 135 65 80 Q95 125 110 198 Z" fill="#0B0917"/>
          <path d="M305 198 Q275 135 295 80 Q265 125 250 198 Z" fill="#0B0917"/>
          <path d="M14 185 Q110 158 180 176 T346 180 L346 208 L14 208 Z" fill="#0E0C1D"/>
          <path d="M14 12 H112 Q86 95 58 148 Q42 178 14 208 Z" fill="url(#heroCurtain)" stroke="#8B6B5C" stroke-opacity="0.4" stroke-width="1"/>
          <path d="M346 12 H248 Q274 95 302 148 Q318 178 346 208 Z" fill="url(#heroCurtain)" stroke="#8B6B5C" stroke-opacity="0.4" stroke-width="1"/>
          <circle cx="62" cy="142" r="5" fill="#F3D38B"/>
          <circle cx="298" cy="142" r="5" fill="#F3D38B"/>
        </svg>
      </div>
    </section>

    <section class="metrics-grid" aria-label="Chỉ số nhanh">
      <div class="metric-card">
        <div class="metric-label"><span>Tổng số thân phận</span><span>🎭</span></div>
        <div class="metric-value">52 / 100</div>
        <div class="metric-sub">Bộ 52 chuẩn & 100 vai toàn bộ</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Số phòng đang mở</span><span>🗺️</span></div>
        <div class="metric-value">${state.rooms.length} phòng</div>
        <div class="metric-sub">${waitingRooms} phòng đang chờ trên Bản đồ Làng</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Số trận đã lưu</span><span>📜</span></div>
        <div class="metric-value">${state.history.length} trận</div>
        <div class="metric-sub">Biên niên sử ván diễn trên thiết bị</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Điểm / Hạng hiện tại</span><span>🏆</span></div>
        <div class="metric-value">${rankInfo.points} · ${rankInfo.rank}</div>
        <div class="metric-sub">${esc(rankInfo.sub)}</div>
      </div>
    </section>

    <section class="shortcuts-grid" aria-label="Lối tắt trải nghiệm">
      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 01 · Bách khoa thân phận</span>
        <h3>🎭 Tra cứu vai trò (Codex)</h3>
        <p>
          Tìm kiếm nhanh theo tên, kỹ năng hoặc #ID. Chuyển đổi linh hoạt giữa Bộ 52 chuẩn và Toàn bộ 100 vai với 4 thông số nhanh & lưu ý tương tác.
        </p>
        <button type="button" class="btn-gold" onclick="go('roles')">Mở Kho Thân Phận →</button>
      </article>

      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 02 · Bản đồ làng & chia vai</span>
        <h3>🗺️ Bản đồ Làng & Phòng đấu</h3>
        <p>
          Khám phá ngôi làng về đêm, chọn công trình đại diện cho phòng chơi (1–100 người), gắn #ID, chọn bộ vai và kéo rèm bắt đầu ván diễn.
        </p>
        <button type="button" class="btn-gold" onclick="go('rooms')">Mở Bản Đồ Làng →</button>
      </article>

      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 03 · Sân khấu nhập vai</span>
        <h3>⚔️ Sân khấu Trong trận (In-Game)</h3>
        <p>
          Trải nghiệm HUD góc trên trái, vòng tròn người chơi quanh lâu đài trăng lưỡi liềm và hộp thoại Quản trò chạy chữ Typewriter ở đáy màn hình.
        </p>
        <button type="button" class="btn-crimson" onclick="go('ingame')">Vào Sân Khấu Trong Trận →</button>
      </article>
    </section>
  `;
}

/* ==========================================================================
   11. ④ Kho Thân Phận (Role Encyclopedia / Codex)
   ========================================================================== */
function extractRoleFacts(c) {
  const d = c.desc || '';
  const hasDay = /ban ngày|buổi sáng|vào ngày|giai đoạn thảo luận|treo cổ/i.test(d);
  const hasNight = /mỗi đêm|ban đêm|vào đêm|đêm đầu tiên|đêm kế tiếp/i.test(d);
  const time = hasDay && hasNight ? 'Đêm & Ngày' : hasDay ? 'Ban ngày' : hasNight ? 'Ban đêm' : 'Linh hoạt';

  const usesMatch = d.match(/(?:hai|2|ba|3|một|1)\s*(?:lần|viên đạn|bình|quả cầu)/i);
  const count = usesMatch
    ? usesMatch[0]
    : /mỗi đêm/i.test(d)
      ? 'Mỗi đêm'
      : /mỗi khi/i.test(d)
        ? 'Theo sự kiện'
        : 'Nội tại / Cả ván';

  const target = /hai người|2 người|tối đa 2 người/i.test(d)
    ? '1–2 người chơi'
    : /một người|1 người/i.test(d)
      ? '1 người chơi'
      : 'Theo mô tả';

  let group = 'Đặc biệt / Biến hóa';
  if (/bảo vệ|khiên|cứu|miễn nhiễm|thuốc giải/i.test(d) && !/giết|bắn|ám sát/i.test(d)) {
    group = 'Bảo vệ / Hộ vệ';
  } else if (/soi|xem vai trò|hào quang|bàn cân|thông tin|kiểm tra/i.test(d)) {
    group = 'Trinh sát / Thông tin';
  } else if (/cắn|giết|ám sát|bắn|lấy mạng|độc/i.test(d)) {
    group = 'Tấn công / Sát thương';
  } else if (/ghép cặp|kết tơ hồng|thần tượng|giao kèo|thỏa thuận|trao đổi/i.test(d)) {
    group = 'Liên kết / Giao kèo';
  } else if (/khóa|vô hiệu|bẫy|câm|giam|mất chức năng/i.test(d)) {
    group = 'Khống chế / Nhiễu';
  }

  const conditions = [];
  for (const line of d.split(/\n+/)) {
    const trimmed = line.trim();
    if (trimmed && /lưu ý|ghi chú|nếu |khi |chỉ |không thể|không được|điều kiện/i.test(trimmed)) {
      conditions.push(trimmed.replace(/^[-+•]\s*/, ''));
    }
  }

  return { time, count, target, group, conditions: conditions.slice(0, 4) };
}

function getFilteredRoles() {
  const q = query.trim().toLocaleLowerCase('vi');
  let list = ROLES.filter(c => {
    if (deckScope === '52' && c.id > 52) return false;
    if (filter === 'dan' && c.team !== 'dan') return false;
    if (filter === 'soi' && c.team !== 'soi') return false;
    if (filter === 'phe3' && c.team !== 'phe3') return false;
    if (filter === 'fav' && !state.favs.includes(c.id)) return false;
    if (!q) return true;
    const haystack = `#${c.id} #${String(c.id).padStart(2, '0')} ${c.name} ${c.desc} ${c.teamName} ${c.aura}`.toLocaleLowerCase('vi');
    return haystack.includes(q);
  });

  if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else {
    list.sort((a, b) => a.id - b.id);
  }
  return list;
}

function renderRoleListItems(list) {
  if (!list.length) {
    return '<div class="empty">Không tìm thấy thân phận phù hợp với bộ lọc hiện tại.</div>';
  }
  return list.map(c => `
    <button type="button" class="role-item ${selected.id === c.id ? 'selected' : ''}" onmouseenter="playHoverSfx()" onclick="chooseRole(${c.id})">
      <img class="portrait" src="${portrait(c)}" alt="${esc(c.name)}" loading="lazy">
      <div class="role-item-info">
        <div class="role-item-title">
          <span class="role-id-badge">#${String(c.id).padStart(2, '0')}</span>
          <span>${esc(c.name)}</span>
        </div>
        <div class="role-tags">
          <span class="tag ${c.team}">${teamLabel(c)}</span>
          <span class="tag">Hào quang: ${esc(c.aura)}</span>
          ${c.id <= 52 ? '<span class="tag set52">Bộ 52</span>' : ''}
        </div>
      </div>
    </button>
  `).join('');
}

let codexViewMode = 'wheel'; // 'wheel' (Vòng tròn thẻ bài) | 'list' (Danh sách 2 cột)
let wheelAnimId = null;
let wheelAnimOffset = 0;

function setCodexViewMode(mode) {
  playSelectSfx();
  codexViewMode = mode;
  roles();
}

function roles() {
  const list = getFilteredRoles();
  if (!list.some(c => c.id === selected.id) && list.length) {
    selected = list[0];
  }
  const totalInScope = deckScope === '52' ? 52 : 100;
  const activeRoom = getActiveRoom();
  const roomRoleCount = activeRoom ? activeRoom.roleIds.length : 0;

  $('content').innerHTML = `
    <section class="role-toolbar">
      <div class="role-toolbar-top">
        <div class="role-search-wrap">
          <input
            class="search"
            id="roleSearchInput"
            type="search"
            placeholder="⌕ Tìm kiếm theo tên vai, kỹ năng hoặc #ID (vd: #01, Tiên Tri, bảo vệ)..."
            value="${esc(query)}"
            oninput="setRoleQuery(this.value)"
            oncompositionstart="searchComposing=true"
            oncompositionend="searchComposing=false;setRoleQuery(this.value)"
          >
        </div>

        <!-- Chuyển đổi chế độ Vòng Tròn Thẻ Bài ↔ Danh Sách 2 Cột -->
        <div class="deck-scope-toggle" role="group" aria-label="Chế độ hiển thị Bách khoa">
          <button type="button" class="${codexViewMode === 'wheel' ? 'active' : ''}" onclick="setCodexViewMode('wheel')">
            🎡 Vòng Tròn Thẻ Bài
          </button>
          <button type="button" class="${codexViewMode === 'list' ? 'active' : ''}" onclick="setCodexViewMode('list')">
            ☷ Danh Sách 2 Cột
          </button>
        </div>

        <div class="deck-scope-toggle" role="group" aria-label="Bộ lọc phạm vi bộ vai">
          <button type="button" class="${deckScope === '52' ? 'active' : ''}" onclick="setDeckScope('52')">
            ✦ Bộ 52 chuẩn
          </button>
          <button type="button" class="${deckScope === 'all' ? 'active' : ''}" onclick="setDeckScope('all')">
            📚 Toàn bộ (100 vai)
          </button>
        </div>
      </div>

      <div class="role-toolbar-filters">
        <div class="filter-chips">
          ${[
            ['all', '▦ Tất cả'],
            ['dan', '🌿 Dân Làng'],
            ['soi', '🐺 Phe Sói'],
            ['phe3', '🔮 Phe Ba'],
            ['fav', `★ Yêu thích (${state.favs.length})`]
          ].map(([k, label]) => `
            <button type="button" class="chip ${filter === k ? 'active' : ''}" onclick="setRoleFilter('${k}')">
              ${label}
            </button>
          `).join('')}
        </div>

        <div class="row" style="margin:0">
          <label for="roleSortSelect" class="muted" style="font-size:12.5px">Sắp xếp:</label>
          <select id="roleSortSelect" class="input-field" style="min-height:36px;padding:6px 10px" onchange="sort=this.value;roles()">
            <option value="id" ${sort === 'id' ? 'selected' : ''}>#ID tăng dần</option>
            <option value="name" ${sort === 'name' ? 'selected' : ''}>Tên A → Z</option>
          </select>
        </div>
      </div>
    </section>

    ${codexViewMode === 'wheel' ? `
      <!-- CHẾ ĐỘ 1: VÒNG TRÒN THẺ BÀI XOAY 3D (ORBITAL TAROT RING CAROUSEL) -->
      <section class="codex-wheel-stage">
        <!-- Minh họa SVG Đôi Bàn Tay Định Mệnh & Dây Xích Trăng Khuyết (Smooth Dark Fairytale Vector Art) -->
        <svg class="codex-hands-backdrop" viewBox="0 0 1280 540" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="altarGlow" cx="50%" cy="46%" r="44%">
              <stop offset="0%" stop-color="#7A2438" stop-opacity="0.38"/>
              <stop offset="52%" stop-color="#2A1B47" stop-opacity="0.24"/>
              <stop offset="100%" stop-color="#0E0C1D" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="handFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#352B52"/>
              <stop offset="60%" stop-color="#221B3A"/>
              <stop offset="100%" stop-color="#141026"/>
            </linearGradient>
          </defs>
          <circle cx="640" cy="245" r="340" fill="url(#altarGlow)"/>
          <!-- Vòng quỹ đạo ma thuật mảnh -->
          <ellipse cx="640" cy="242" rx="385" ry="155" fill="none" stroke="rgba(243,211,139,0.18)" stroke-width="1.5" stroke-dasharray="6 6"/>
          <ellipse cx="640" cy="242" rx="320" ry="122" fill="none" stroke="rgba(169,123,255,0.14)" stroke-width="1"/>

          <!-- Bàn Tay Định Mệnh Bên Trái & Dây Xích Mặt Trăng (Mượt mà, không răng cưa pixel) -->
          <g stroke="rgba(243,211,139,0.42)" stroke-width="1.8" fill="url(#handFill)">
            <path d="M-20 220 C45 160, 115 118, 175 112 C215 108, 255 155, 298 188 C260 192, 222 170, 195 158 C235 208, 295 268, 345 305 C292 308, 232 268, 182 228 C205 278, 238 325, 262 365 C215 352, 168 302, 134 258 C138 302, 152 342, 164 374 C124 352, 92 304, 65 265 L-20 295 Z"/>
            <!-- Dây xích bạc & Mặt dây chuyền Ngôi Sao / Trăng Khuyết -->
            <path d="M198 135 Q192 265 196 395" fill="none" stroke="#F3D38B" stroke-width="2.5" stroke-dasharray="5 5"/>
            <circle cx="196" cy="418" r="20" fill="#18152C" stroke="#F3D38B" stroke-width="2"/>
            <text x="196" y="424" text-anchor="middle" fill="#F3D38B" font-size="16" stroke="none">✦</text>
          </g>

          <!-- Bàn Tay Định Mệnh Bên Phải & Quyển Trục Cổ Tích -->
          <g transform="translate(1280, 0) scale(-1, 1)" stroke="rgba(243,211,139,0.42)" stroke-width="1.8" fill="url(#handFill)">
            <path d="M-20 220 C45 160, 115 118, 175 112 C215 108, 255 155, 298 188 C260 192, 222 170, 195 158 C235 208, 295 268, 345 305 C292 308, 232 268, 182 228 C205 278, 238 325, 262 365 C215 352, 168 302, 134 258 C138 302, 152 342, 164 374 C124 352, 92 304, 65 265 L-20 295 Z"/>
            <!-- Trượng / Quyển trục cổ tích -->
            <rect x="176" y="128" width="24" height="235" rx="12" transform="rotate(14 188 245)" fill="#18152C" stroke="#F3D38B" stroke-width="2"/>
          </g>
        </svg>

        <!-- Thanh tiêu đề nhỏ trên đỉnh Vòng xoay -->
        <div class="codex-wheel-top">
          <div>
            <strong style="color:var(--gold);font-family:var(--card-serif-font);font-size:18px">
              🎡 Vòng Tròn Thẻ Bài Định Mệnh (${list.length} / ${totalInScope} thân phận)
            </strong>
            <span class="muted" style="font-size:12.5px;margin-left:10px">
              Nhấp vào lá bài bất kỳ, lăn chuột hoặc dùng nút ⟲ / ⟳ để xoay vòng tròn
            </span>
          </div>
          <span class="nav-badge">${deckScope === '52' ? '✦ Bộ 52 chuẩn' : '📚 Toàn bộ 100 vai'}</span>
        </div>

        <!-- Vùng Quỹ Đạo Xoay 3D của các lá bài Tarot -->
        <div class="codex-wheel-arena" id="codexWheelArena">
          <!-- Tâm Bàn Cân / Gương Linh Hồn ở giữa vòng bài -->
          <div class="codex-wheel-altar">
            <div class="altar-counters">
              <div><strong id="altarTotalCount">${list.length}</strong><span>Thẻ bài</span></div>
              <div><strong id="altarRoomCount">${roomRoleCount}</strong><span>Trong phòng</span></div>
              <div><strong id="altarFavCount">${state.favs.length}</strong><span>Yêu thích</span></div>
            </div>
            <div class="altar-disc">
              <strong id="altarRoleTitle">#${String(selected.id).padStart(2, '0')} ${esc(selected.name)}</strong>
              <small id="altarRoleSub">${teamLabel(selected)} · Hào quang: ${esc(selected.aura)}</small>
            </div>
          </div>

          <!-- Các lá bài trên vòng tròn -->
          <div id="codexWheelCardsContainer" style="position:absolute;inset:0"></div>
        </div>

        <!-- Cụm nút xoay vòng tròn & Thao tác nhanh dưới chân Vòng bài -->
        <div class="codex-wheel-bottom">
          <div class="wheel-spin-controls">
            <button type="button" class="wheel-spin-btn" onmouseenter="playHoverSfx()" onclick="spinCodexWheel(-1)">
              ⟲ Xoay Trái
            </button>
            <button type="button" class="btn-gold" id="wheelAddRoomBtn" onclick="addRoleToActiveRoom(selected.id)">
              + Thêm "${esc(selected.name)}" vào phòng (#${activeRoom?.id || 1001})
            </button>
            <button type="button" class="btn-secondary" id="wheelFavBtn" onclick="toggleFav(selected.id)">
              ${state.favs.includes(selected.id) ? '★ Đã yêu thích' : '☆ Yêu thích'}
            </button>
            <button type="button" class="wheel-spin-btn" onmouseenter="playHoverSfx()" onclick="spinCodexWheel(1)">
              Xoay Phải ⟳
            </button>
          </div>
        </div>
      </section>

      <!-- Khung Chi Tiết Thân Phận Đang Chọn ở ngay bên dưới Vòng Tròn -->
      <section class="panel role-detail-panel" id="detail" style="height:auto"></section>
    ` : `
      <!-- CHẾ ĐỘ 2: DANH SÁCH 2 CỘT TRUYỀN THỐNG -->
      <section class="layout resizable-roles" id="roleLayout">
        <div class="panel role-list-panel">
          <div class="panelhead">
            <strong id="roleCount" style="color:var(--gold)">
              Danh sách (${list.length} / ${totalInScope} vai)
            </strong>
            <span class="muted" style="font-size:12px">${deckScope === '52' ? 'Bộ 52 chuẩn' : 'Toàn bộ 100 vai'}</span>
          </div>
          <div class="role-list-scroll" id="roleList">
            ${renderRoleListItems(list)}
          </div>
        </div>

        <div
          class="role-divider"
          id="roleDivider"
          role="separator"
          aria-label="Kéo để chỉnh độ rộng cột danh sách và chi tiết"
          aria-orientation="vertical"
          tabindex="0"
          title="Kéo để thay đổi độ rộng · Nhấn đúp để đặt lại"
        ></div>

        <div class="panel role-detail-panel" id="detail"></div>
      </section>
    `}
  `;

  renderRoleDetail();
  if (codexViewMode === 'wheel') {
    initCodexWheel(list);
  } else {
    initRoleDivider();
  }
}

function initCodexWheel(list) {
  const arena = $('codexWheelArena');
  if (!arena) return;
  drawCodexWheelCards(list, 0);

  let wheelCooldown = false;
  arena.addEventListener('wheel', e => {
    e.preventDefault();
    if (wheelCooldown) return;
    wheelCooldown = true;
    const dir = (e.deltaY || e.deltaX) > 0 ? 1 : -1;
    spinCodexWheel(dir);
    setTimeout(() => { wheelCooldown = false; }, 140);
  }, { passive: false });
}

function drawCodexWheelCards(list, animSlotShift = 0) {
  const container = $('codexWheelCardsContainer');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="empty">Không tìm thấy thẻ bài phù hợp.</div>';
    return;
  }

  const selIdx = Math.max(0, list.findIndex(c => c.id === selected.id));
  const visibleCount = Math.min(12, list.length);
  const half = Math.floor(visibleCount / 2);

  // Tạo hoặc cập nhật các thẻ bài trên quỹ đạo hình elip
  const slots = [];
  for (let k = 0; k < visibleCount; k++) {
    const rel = k - half; // rel = 0 là vị trí chính diện 6 giờ (bottom-front)
    const roleIdx = ((selIdx + rel) % list.length + list.length) % list.length;
    const role = list[roleIdx];
    slots.push({ k, rel, role });
  }

  // Nếu số lượng DOM node chưa khớp thì khởi tạo
  if (container.children.length !== visibleCount) {
    container.innerHTML = slots.map(s => `
      <div class="wheel-tarot-card" data-slot="${s.k}">
        <div class="wheel-card-top">
          <span class="w-id"></span>
          <span class="w-team"></span>
        </div>
        <img class="wheel-card-art" src="" alt="">
        <div class="wheel-card-name"></div>
      </div>
    `).join('');
  }

  slots.forEach(s => {
    const el = container.children[s.k];
    if (!el) return;
    const effectiveRel = s.rel + animSlotShift;
    // Góc theta: rel = 0 nằm ở đáy chính diện (Math.PI / 2 = 90 độ)
    const theta = Math.PI / 2 + (effectiveRel / visibleCount) * Math.PI * 2;
    const xPct = 50 + 30.5 * Math.cos(theta);
    const yPct = 46 + 34.5 * Math.sin(theta);
    const depth = (Math.sin(theta) + 1) / 2; // 0 ở đỉnh xa (12h), 1 ở đáy gần (6h)
    const scale = 0.62 + 0.58 * Math.pow(depth, 1.4);
    const zIdx = Math.round(10 + depth * 40);
    const opacity = 0.42 + 0.58 * depth;

    el.className = `wheel-tarot-card team-${s.role.team} ${s.rel === 0 && Math.abs(animSlotShift) < 0.25 ? 'active-front' : ''}`;
    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;
    el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    el.style.zIndex = String(zIdx);
    el.style.opacity = opacity.toFixed(2);
    el.onclick = () => {
      if (s.rel === 0) return;
      spinCodexWheel(s.rel);
    };

    const idSpan = el.querySelector('.w-id');
    const teamSpan = el.querySelector('.w-team');
    const imgEl = el.querySelector('.wheel-card-art');
    const nameEl = el.querySelector('.wheel-card-name');
    if (idSpan) idSpan.textContent = `#${String(s.role.id).padStart(2, '0')}`;
    if (teamSpan) teamSpan.textContent = s.role.team === 'soi' ? '🐺' : s.role.team === 'dan' ? '🌿' : '🔮';
    if (imgEl && !imgEl.src.endsWith(portrait(s.role))) {
      imgEl.src = portrait(s.role);
      imgEl.alt = s.role.name;
    }
    if (nameEl) nameEl.textContent = s.role.name;
  });

  // Cập nhật thông tin trên Bàn Cân ở tâm vòng tròn & Nút hành động dưới chân vòng
  const titleEl = $('altarRoleTitle');
  const subEl = $('altarRoleSub');
  const totalEl = $('altarTotalCount');
  const addBtnEl = $('wheelAddRoomBtn');
  const favBtnEl = $('wheelFavBtn');
  const activeRoom = getActiveRoom();
  if (titleEl) titleEl.textContent = `#${String(selected.id).padStart(2, '0')} ${selected.name}`;
  if (subEl) subEl.textContent = `${teamLabel(selected)} · Hào quang: ${selected.aura}`;
  if (totalEl) totalEl.textContent = String(list.length);
  if (addBtnEl) addBtnEl.textContent = `+ Thêm "${selected.name}" vào phòng (#${activeRoom?.id || 1001})`;
  if (favBtnEl) favBtnEl.textContent = state.favs.includes(selected.id) ? '★ Đã yêu thích' : '☆ Yêu thích';
}

function spinCodexWheel(stepDelta) {
  const list = getFilteredRoles();
  if (!list.length) return;
  playHoverSfx();
  const curIdx = Math.max(0, list.findIndex(c => c.id === selected.id));
  const nextIdx = ((curIdx + stepDelta) % list.length + list.length) % list.length;
  selected = list[nextIdx];

  // Nội suy quỹ đạo tròn 60fps bằng requestAnimationFrame để các lá bài lướt theo đường cong elip
  cancelAnimationFrame(wheelAnimId);
  wheelAnimOffset = stepDelta;
  const startTime = performance.now();
  const duration = 360;

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const currentShift = stepDelta * (1 - ease);
    // Tắt CSS transition trong lúc rAF đang vẽ đường cong lượng giác
    const container = $('codexWheelCardsContainer');
    if (container) {
      Array.from(container.children).forEach(ch => { ch.style.transition = 'none'; });
    }
    drawCodexWheelCards(list, currentShift);
    if (t < 1) {
      wheelAnimId = requestAnimationFrame(step);
    } else {
      drawCodexWheelCards(list, 0);
    }
  }
  wheelAnimId = requestAnimationFrame(step);
  renderRoleDetail();
}

function setRoleFilter(v) {
  playSelectSfx();
  filter = v;
  roles();
}

function setDeckScope(scope) {
  playSelectSfx();
  deckScope = scope;
  roles();
}

function setRoleQuery(v) {
  query = v;
  if (searchComposing) return;
  const list = getFilteredRoles();
  if (list.length && !list.some(c => c.id === selected.id)) {
    selected = list[0];
  }
  if (codexViewMode === 'wheel') {
    drawCodexWheelCards(list, 0);
    renderRoleDetail();
    return;
  }
  const totalInScope = deckScope === '52' ? 52 : 100;
  const countEl = $('roleCount');
  const listEl = $('roleList');
  if (countEl) countEl.textContent = `Danh sách (${list.length} / ${totalInScope} vai)`;
  if (listEl) listEl.innerHTML = renderRoleListItems(list);
}

function chooseRole(id) {
  playSelectSfx();
  const found = ROLES.find(c => c.id === id);
  if (!found) return;
  selected = found;
  const list = getFilteredRoles();
  const listEl = $('roleList');
  if (listEl) listEl.innerHTML = renderRoleListItems(list);
  renderRoleDetail();
}

function roleExampleText(c, facts) {
  if (c.id === 1) {
    return 'Trên sân khấu đêm thứ nhất, Người chơi A đang được Bảo Vệ che chở. Sói Đạo Tặc chọn A: lớp bảo vệ của A bị đánh cắp và chuyển sang hộ mệnh cho Sói Đạo Tặc trước một đòn chí mạng sau đó.';
  }
  if (c.id === 28) {
    return 'Vào mỗi đêm khi làng chìm trong sương mù, Tiên Tri chỉ định 1 người chơi. Quản trò bí mật lật thẻ tiết lộ chính xác thân phận hoặc hào quang theo quy ước bàn chơi.';
  }
  return `Trong giai đoạn "${facts.time}", người giữ vai ${c.name} kích hoạt năng lực thuộc nhóm "${facts.group}" lên mục tiêu (${facts.target}). Quản trò đối chiếu điều kiện và công bố kết quả khi bình minh lên.`;
}

function renderRoleDetail() {
  const container = $('detail');
  if (!container || !selected) return;
  const c = selected;
  const facts = extractRoleFacts(c);
  const isFav = state.favs.includes(c.id);
  const activeRoom = getActiveRoom();
  const countInRoom = activeRoom ? activeRoom.roleIds.filter(id => id === c.id).length : 0;

  container.innerHTML = `
    <div class="role-hero-card">
      <img class="role-hero-portrait" src="${portrait(c)}" alt="${esc(c.name)}">
      <div class="role-hero-meta">
        <div class="role-tags" style="margin-bottom:6px">
          <span class="tag" style="color:var(--gold);border-color:var(--border-gold-soft)">#${String(c.id).padStart(2, '0')}</span>
          <span class="tag ${c.team}">${teamLabel(c)}</span>
          <span class="tag">Hào quang: ${esc(c.aura)}</span>
          <span class="tag set52">${c.id <= 52 ? '✦ Bộ 52 chuẩn' : 'Mở rộng #53–100'}</span>
        </div>
        <h2>${esc(c.name)}</h2>
        <div class="role-hero-actions">
          <button type="button" class="${isFav ? 'btn-gold' : 'btn-secondary'}" onclick="toggleFav(${c.id})">
            ${isFav ? '★ Đã yêu thích' : '☆ Yêu thích'}
          </button>
          <button type="button" class="btn-crimson" onclick="addRoleToActiveRoom(${c.id})">
            + Thêm vào phòng ${activeRoom ? `(#${activeRoom.id})` : ''} ${countInRoom ? `[${countInRoom}]` : ''}
          </button>
          <button type="button" class="btn-secondary" onclick="stageState.myRoleId=${c.id};go('ingame')">
            ⚔️ Thử vai này trên Sân khấu
          </button>
          <button type="button" class="btn-secondary" onclick="askRole(${c.id})">
            🧺 Hỏi Khăn Đỏ
          </button>
        </div>
      </div>
    </div>

    <div class="facts-grid">
      <div class="fact-box">
        <span>◷ Thời điểm (Đêm/Ngày)</span>
        <strong>${esc(facts.time)}</strong>
      </div>
      <div class="fact-box">
        <span>⌛ Lượt dùng</span>
        <strong>${esc(facts.count)}</strong>
      </div>
      <div class="fact-box">
        <span>◎ Mục tiêu</span>
        <strong>${esc(facts.target)}</strong>
      </div>
      <div class="fact-box">
        <span>✦ Nhóm kỹ năng</span>
        <strong>${esc(facts.group)}</strong>
      </div>
    </div>

    <div class="detail-block">
      <h3>📜 Mô tả kỹ năng gốc (Nguyên bản JSON)</h3>
      <p>${esc(c.desc)}</p>
    </div>

    <div class="detail-duo">
      <div class="detail-block">
        <h3>📖 Ví dụ minh họa trên sân khấu</h3>
        <p>${esc(roleExampleText(c, facts))}</p>
      </div>
      <div class="detail-block detail-warning">
        <h3>⚖️ Lưu ý tương tác & Xung đột luật</h3>
        ${
          facts.conditions.length
            ? facts.conditions.map(line => `<p style="margin-bottom:6px">• ${esc(line)}</p>`).join('')
            : '<p>• Kỹ năng vận hành theo thứ tự gọi đêm tiêu chuẩn của Quản trò.</p>'
        }
        <p class="muted" style="font-size:12px;margin-top:8px">
          Các tương tác đồng thời (Bảo vệ / Phản đòn / Đổi phe) được Quản trò phân xử theo quy ước phòng đấu.
        </p>
      </div>
    </div>
  `;
}

function toggleFav(roleId) {
  playSelectSfx();
  const id = roleId || selected.id;
  if (state.favs.includes(id)) {
    state.favs = state.favs.filter(x => x !== id);
  } else {
    state.favs.push(id);
  }
  save();
  if (page === 'roles') roles();
  if (page === 'profile') profile();
}

function addRoleToActiveRoom(roleId) {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.push(roleId);
  save();
  if (page === 'roles') renderRoleDetail();
  if (page === 'rooms') rooms();
}

function initRoleDivider() {
  const layout = $('roleLayout');
  const bar = $('roleDivider');
  if (!layout || !bar) return;
  const saved = Number(localStorage.getItem('wolvesville_role_column_pct'));
  const clamp = n => Math.max(24, Math.min(62, n));
  if (saved >= 24 && saved <= 62) layout.style.setProperty('--role-left', saved + '%');

  let dragging = false;
  const update = x => {
    const r = layout.getBoundingClientRect();
    const pct = clamp(((x - r.left) / r.width) * 100);
    layout.style.setProperty('--role-left', pct + '%');
    return pct;
  };
  bar.addEventListener('pointerdown', e => {
    if (window.innerWidth <= 1120) return;
    dragging = true;
    bar.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  bar.addEventListener('pointermove', e => {
    if (dragging) update(e.clientX);
  });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    localStorage.setItem('wolvesville_role_column_pct', String(update(e.clientX)));
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', () => {
    layout.style.setProperty('--role-left', '36%');
    localStorage.removeItem('wolvesville_role_column_pct');
  });
}

/* ==========================================================================
   12. Thao tác Phòng chơi & Modal Bảng chọn nhanh nhân vật
   ========================================================================== */
function createRoom() {
  playSelectSfx();
  const nameInput = $('newRoomName');
  const sizeInput = $('newRoomSize');
  const name = (nameInput?.value.trim()) || `Lầu Chuông Đêm #${state.rooms.length + 1}`;
  const size = Number(sizeInput?.value || 12);
  if (!Number.isInteger(size) || size < 1 || size > 100) {
    alert('Vui lòng nhập giới hạn số người chơi từ 1 đến 100.');
    sizeInput?.focus();
    return;
  }
  const newId = Math.max(1000, ...state.rooms.map(r => r.id)) + 1;
  const newRoom = {
    id: newId,
    name,
    size,
    status: 'waiting',
    playerIds: state.players.slice(0, Math.min(size, 6)).map(p => p.id),
    roleIds: [1, 3, 28, 32, 34, 35].slice(0, Math.min(size, 6))
  };
  state.rooms.unshift(newRoom);
  state.activeRoom = newId;
  save();
  const pinned = [...state.rooms].sort((first, second) => first.id - second.id)
    .slice(0, VILLAGE_ROOM_SITES.length).some(room => room.id === newId);
  openVillagePanel('room', pinned ? 'room-' + newId : 'directory');
}

function deleteRoom(roomId) {
  if (!confirm(`Xóa phòng #${roomId} khỏi Sảnh đấu?`)) return;
  state.rooms = state.rooms.filter(r => r.id !== roomId);
  if (state.activeRoom === roomId) {
    state.activeRoom = state.rooms[0]?.id || null;
  }
  save();
  openVillagePanel('directory');
}

function updateRoomLimit(roomId, val) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const n = Number(val);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    alert('Giới hạn phòng phải là số nguyên từ 1 đến 100.');
    rooms();
    return;
  }
  room.size = n;
  save();
  rooms();
}

function toggleRoomStatus(roomId) {
  playSelectSfx();
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  room.status = room.status === 'playing' ? 'waiting' : 'playing';
  save();
  rooms();
}

function addPlayerToRoom() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  const input = $('stagingPlayerName');
  const name = input?.value.trim();
  if (!name) return;
  if (room.playerIds.length >= room.size) {
    alert(`Phòng #${room.id} đã đạt giới hạn ${room.size} người chơi. Hãy tăng giới hạn phòng nếu muốn thêm!`);
    return;
  }
  const newId = Math.max(9000, ...state.players.map(p => p.id)) + 1;
  state.players.push({ id: newId, name });
  state.scores[newId] = 1500;
  room.playerIds.push(newId);
  save();
  rooms();
}

function removePlayerFromRoom(playerId) {
  const room = getActiveRoom();
  if (!room) return;
  room.playerIds = room.playerIds.filter(id => id !== playerId);
  save();
  rooms();
}

function fillSamplePlayers() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  DEFAULT_PLAYERS.forEach(dp => {
    if (!state.players.some(p => p.id === dp.id)) {
      state.players.push({ ...dp });
      state.scores[dp.id] = DEFAULT_SCORES[dp.id] || 1500;
    }
    if (room.playerIds.length < room.size && !room.playerIds.includes(dp.id)) {
      room.playerIds.push(dp.id);
    }
  });
  save();
  rooms();
}

function removeRoleFromRoom(idx) {
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.splice(idx, 1);
  save();
  rooms();
}

function clearRoomDeck() {
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds = [];
  save();
  rooms();
}

function autoBalanceDeck() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  const targetCount = Math.max(6, room.playerIds.length || 8);
  const preset = [28, 34, 32, 1, 3, 6, 7, 35, 5, 27, 36, 30, 2, 9, 10, 33];
  room.roleIds = [];
  for (let i = 0; i < targetCount; i++) {
    room.roleIds.push(preset[i % preset.length]);
  }
  save();
  rooms();
}

let rolePickerQuery = '';
let rolePickerTeam = 'all';
let rolePickerScope = '52';
let rolePickerComposing = false;

function openRolePicker() {
  playSelectSfx();
  if ($('rolePickerOverlay')) return;
  rolePickerQuery = '';
  rolePickerTeam = 'all';
  rolePickerScope = '52';

  const overlay = document.createElement('div');
  overlay.id = 'rolePickerOverlay';
  overlay.className = 'role-picker-overlay';
  overlay.innerHTML = `
    <div class="role-picker-modal" role="dialog" aria-modal="true" aria-labelledby="pickerTitle">
      <div class="role-picker-header">
        <h3 id="pickerTitle">🎭 Bảng chọn nhanh nhân vật cho phòng #${getActiveRoom()?.id || ''}</h3>
        <button type="button" class="btn-secondary" onclick="closeRolePicker()">✕ Đóng</button>
      </div>
      <div class="role-picker-controls">
        <input
          id="pickerSearch"
          class="input-field"
          type="search"
          autocomplete="off"
          placeholder="Tìm theo tên vai, #ID hoặc kỹ năng..."
          oninput="pickerSearchChanged(this.value)"
          oncompositionstart="rolePickerComposing=true"
          oncompositionend="rolePickerComposing=false;pickerSearchChanged(this.value)"
        >
        <select id="pickerScope" class="input-field" onchange="rolePickerScope=this.value;renderPickerItems()">
          <option value="52">✦ Bộ 52 chuẩn</option>
          <option value="all">📚 Toàn bộ 100 vai</option>
        </select>
        <select id="pickerTeam" class="input-field" onchange="rolePickerTeam=this.value;renderPickerItems()">
          <option value="all">Tất cả phe</option>
          <option value="dan">🌿 Dân Làng</option>
          <option value="soi">🐺 Phe Sói</option>
          <option value="phe3">🔮 Phe Ba</option>
        </select>
      </div>
      <div class="role-picker-results" id="pickerResults"></div>
      <div class="role-picker-footer">
        <span class="muted" id="pickerSelectedCount"></span>
        <button type="button" class="btn-gold" onclick="closeRolePicker()">Hoàn tất chọn vai</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeRolePicker();
  });
  document.body.append(overlay);
  renderPickerItems();
  $('pickerSearch')?.focus();
}

function closeRolePicker() {
  $('rolePickerOverlay')?.remove();
  if (page === 'rooms') {
    rooms();
    $('villageRolePickerButton')?.focus({ preventScroll: true });
  }
  if (page === 'roles') renderRoleDetail();
}

function pickerSearchChanged(v) {
  rolePickerQuery = v;
  if (!rolePickerComposing) renderPickerItems();
}

function renderPickerItems() {
  const results = $('pickerResults');
  if (!results) return;
  const room = getActiveRoom();
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi');
  const q = normalize(rolePickerQuery.trim());

  const matches = ROLES.filter(c => {
    if (rolePickerScope === '52' && c.id > 52) return false;
    if (rolePickerTeam !== 'all' && c.team !== rolePickerTeam) return false;
    if (!q) return true;
    return normalize(`#${c.id} ${c.name} ${c.desc}`).includes(q);
  });

  results.innerHTML = matches.map(c => {
    const count = room ? room.roleIds.filter(id => id === c.id).length : 0;
    return `
      <div class="role-picker-item">
        <img src="${portrait(c)}" alt="${esc(c.name)}">
        <div class="info">
          <strong><span style="color:var(--gold)">#${String(c.id).padStart(2, '0')}</span> ${esc(c.name)}</strong>
          <small>${teamLabel(c)} · Hào quang: ${esc(c.aura)} ${c.id <= 52 ? '· Bộ 52 chuẩn' : ''}</small>
        </div>
        <button type="button" class="btn-gold" style="padding:7px 12px" onclick="addPickerRole(${c.id})">
          + Thêm ${count ? `(${count})` : ''}
        </button>
      </div>
    `;
  }).join('') || '<div class="empty">Không tìm thấy nhân vật phù hợp.</div>';

  const label = $('pickerSelectedCount');
  if (label && room) {
    label.textContent = `Đã chọn ${room.roleIds.length} vai / ${room.playerIds.length} người chơi trong phòng #${room.id}`;
  }
}

function addPickerRole(roleId) {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.push(roleId);
  save();
  renderPickerItems();
}

/* ==========================================================================
   13. Hiệu ứng Kéo Rèm Nhung & Bắt Đầu Ván Diễn (Stage Curtain Transition)
   ========================================================================== */
function startStageShow() {
  const room = getActiveRoom();
  if (!room) return;
  const roomPlayers = room.playerIds.map(pid => state.players.find(p => p.id === pid)).filter(Boolean);
  if (!roomPlayers.length) {
    alert('Phòng chưa có người chơi nào. Hãy thêm người chơi trước khi kéo rèm!');
    return;
  }
  if (room.roleIds.length < roomPlayers.length) {
    alert(`Số vai đã chọn (${room.roleIds.length}) đang ít hơn số người chơi (${roomPlayers.length}). Hãy bấm "Gợi ý cân bằng" hoặc thêm vai vào phòng!`);
    return;
  }

  const pool = [...room.roleIds].sort(() => Math.random() - 0.5);
  const assignments = roomPlayers.map((p, idx) => {
    const roleObj = ROLES.find(r => r.id === pool[idx]) || ROLES[0];
    return {
      playerId: p.id,
      name: p.name,
      roleId: roleObj.id,
      role: roleObj.name,
      team: roleObj.team,
      aura: roleObj.aura
    };
  });

  if (assignments[0]) {
    stageState.myRoleId = assignments[0].roleId;
  }

  room.status = 'playing';
  state.history.unshift({
    date: new Date().toLocaleString('vi-VN'),
    roomId: room.id,
    roomName: room.name,
    winner: 'Đang diễn ra trên sân khấu',
    result: assignments
  });
  save();

  playCurtainSfx();
  const overlay = $('stageCurtainOverlay');
  const body = $('stagePlayBody');
  const title = $('stagePlayTitle');
  if (!overlay || !body) return;

  if (title) {
    title.textContent = `🎭 Sân Khấu Đêm: ${room.name} (#${room.id})`;
  }

  body.innerHTML = `
    <p class="muted" style="margin:0">
      Rèm nhung đã khép lại và mở ra đêm đầu tiên! Dưới đây là bảng phân vai bí mật cho <b>${assignments.length} người chơi</b>:
    </p>
    <div class="stage-cards-grid">
      ${assignments.map(a => `
        <div class="stage-deal-card" onclick="closeStageShowAndInspect(${a.roleId})">
          <img src="${portrait(a.roleId)}" alt="${esc(a.role)}">
          <div>
            <small class="muted">#${a.playerId} · ${esc(a.name)}</small>
            <strong style="display:block;color:var(--gold);font-size:15.5px">${esc(a.role)}</strong>
            <span class="tag ${a.team}" style="margin-top:4px">${a.team === 'soi' ? 'Phe Sói' : a.team === 'dan' ? 'Dân Làng' : 'Phe Ba'}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:8px">
      <button type="button" class="btn-secondary" onclick="closeStageShow('history')">📜 Xem Lịch sử đấu</button>
      <button type="button" class="btn-gold" onclick="closeStageShow('ingame')">⚔️ Bước vào Sân Khấu Trong Trận →</button>
    </div>
  `;

  overlay.hidden = false;
  syncVillageEffects();
  requestAnimationFrame(() => {
    overlay.classList.add('active', 'closing');
    setTimeout(() => {
      overlay.classList.add('show-stage');
    }, 680);
  });
}

function closeStageShow(targetPage) {
  const overlay = $('stageCurtainOverlay');
  if (!overlay) return;
  overlay.classList.remove('show-stage', 'closing');
  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.hidden = true;
    if (targetPage) go(targetPage);
    else syncVillageEffects();
  }, 550);
}

function closeStageShowAndInspect(roleId) {
  const found = ROLES.find(r => r.id === roleId);
  if (found) selected = found;
  closeStageShow('roles');
}

/* ==========================================================================
   14. Cá nhân & Cộng đồng (Hồ sơ cá nhân, Lịch sử đấu, Bảng xếp hạng)
   ========================================================================== */
function profile() {
  const a = currentAccount();
  if (!a) {
    $('content').innerHTML = `
      <section class="section" style="text-align:center;padding:48px 24px">
        <div style="font-size:58px">🌙</div>
        <h2 style="color:var(--gold);margin:8px 0">Hồ Sơ Cư Dân Sân Khấu Cổ Tích Đen</h2>
        <p class="muted" style="max-width:520px;margin:0 auto 20px">
          Đăng nhập hoặc chọn Tài khoản mẫu Luna Moon (#9001) để mở khóa hồ sơ cá nhân, biểu đồ hoạt động 7 ngày, tỷ lệ thắng theo phe và huy hiệu.
        </p>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn-gold" onclick="useDemoAccount()">🌙 Trải nghiệm tài khoản mẫu (Luna Moon)</button>
          <button type="button" class="btn-secondary" onclick="showAuth('login')">🚪 Mở Cổng Đăng Nhập</button>
        </div>
      </section>
    `;
    return;
  }

  const demo = a.user === 'moonwalker';
  const stats = demo
    ? { matches: 128, wins: 76, losses: 52, streak: 5, points: state.scores[a.id] || 2450, rank: 1, days: [4, 7, 5, 9, 6, 10, 8], teams: [48, 34, 18] }
    : { matches: Math.max(1, state.history.length), wins: 1, losses: 0, streak: 1, points: state.scores[a.id] || 1500, rank: 2, days: [1, 2, 1, 3, 2, 4, 3], teams: [50, 30, 20] };
  const rate = stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0;

  const bars = stats.days.map((v, i) => `
    <div class="barcol">
      <div class="bartrack"><div class="barfill" style="height:${(v / 10) * 100}%"></div></div>
      <span class="muted" style="font-size:11px">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
    </div>
  `).join('');

  const circle = `conic-gradient(#174B44 0 ${stats.teams[0]}%, #7A2438 ${stats.teams[0]}% ${stats.teams[0] + stats.teams[1]}%, #5B388C ${stats.teams[0] + stats.teams[1]}% 100%)`;

  $('content').innerHTML = `
    <section class="social-cover">
      <div class="cover-banner">☾ ✦ 🐺 ✦ ☽</div>
      <div class="social-identity">
        <img class="social-avatar" src="${portrait(a.avatarId || 2)}" alt="${esc(a.name)}">
        <div>
          <h2>${esc(a.name)}</h2>
          <p>@${esc(a.user)} · Mã định danh <b style="color:var(--gold)">#${a.id}</b> · <span style="color:#6EE7B7">● Đang trực tuyến tại Sảnh</span></p>
        </div>
        <button type="button" class="btn-secondary" style="margin-left:auto" onclick="editProfile()">✎ Chỉnh sửa hồ sơ</button>
      </div>
    </section>

    <div class="profile-grid">
      <div class="profile-side">
        <section class="section">
          <h3>✦ Danh tính cư dân</h3>
          <p>${esc(a.bio || 'Chưa có lời giới thiệu.')}</p>
          <p class="muted">📍 ${esc(a.location || 'Làng Trăng Tím')}</p>
          <p class="muted">📅 Gia nhập: ${esc(a.joined || 'Tháng 11/2026')}</p>
          <p class="muted">🪪 ID cố định: <b style="color:var(--gold)">#${a.id}</b></p>
        </section>

        <section class="section">
          <h3>★ Thân phận yêu thích (${state.favs.length})</h3>
          <div class="fav-row">
            ${state.favs.slice(0, 6).map(id => {
              const c = ROLES.find(x => x.id === id);
              return c ? `
                <button type="button" class="fav-card" onclick="selected=ROLES.find(x=>x.id===${c.id});go('roles')">
                  <img src="${portrait(c)}" alt="${esc(c.name)}">
                  <span>${esc(c.name)}</span>
                </button>
              ` : '';
            }).join('') || '<p class="muted">Chưa đánh dấu vai yêu thích nào.</p>'}
          </div>
        </section>

        <section class="section">
          <h3>🏅 Huy hiệu Thành tích (Achievements)</h3>
          <div class="badge-grid">
            <span class="achievement">🌕 Kẻ Lữ Hành Đêm</span>
            <span class="achievement">🎭 Bậc Thầy Hóa Thân</span>
            <span class="achievement">🕯️ Chủ Phòng Uy Tín</span>
            <span class="achievement">🔮 Thấu Thị Hào Quang</span>
          </div>
        </section>
      </div>

      <div class="profile-main">
        <div class="profile-kpis">
          <div class="kpi"><span>🎮 Tổng số ván</span><b>${stats.matches}</b></div>
          <div class="kpi"><span>🏆 Chiến thắng</span><b>${stats.wins}</b></div>
          <div class="kpi"><span>📈 Tỷ lệ thắng</span><b>${rate}%</b></div>
          <div class="kpi"><span>⭐ Điểm / Hạng</span><b>${stats.points} (#${stats.rank})</b></div>
        </div>

        <div class="chart-grid">
          <section class="section">
            <h3>📊 Nhịp độ ván diễn 7 ngày</h3>
            <p class="muted" style="font-size:12px">Số ván tham gia theo từng đêm trong tuần</p>
            <div class="bars">${bars}</div>
          </section>

          <section class="section">
            <h3>◉ Tỷ lệ hóa thân theo Phe</h3>
            <div class="donut-wrap">
              <div class="donut" style="background:${circle}">
                <div>${stats.matches}<small style="font-size:11px;color:var(--muted)">ván</small></div>
              </div>
              <div style="display:grid;gap:8px;font-size:12.5px">
                <span>🌿 Dân Làng: <b>${stats.teams[0]}%</b></span>
                <span>🐺 Phe Sói: <b>${stats.teams[1]}%</b></span>
                <span>🔮 Phe Ba: <b>${stats.teams[2]}%</b></span>
              </div>
            </div>
          </section>
        </div>

        <section class="section">
          <h3>📜 Hoạt động gần đây</h3>
          ${state.history.slice(0, 4).map(h => `
            <div style="padding:10px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div>
                <strong style="color:var(--gold)">🎭 ${esc(h.roomName || 'Phòng đấu')} ${h.roomId ? `(#${h.roomId})` : ''}</strong>
                <div class="muted" style="font-size:12px">${h.result.length} người chơi · ${esc(h.date)}</div>
              </div>
              <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="go('history')">Chi tiết</button>
            </div>
          `).join('') || '<p class="muted">Chưa có hoạt động nào.</p>'}
        </section>
      </div>
    </div>
  `;
}

function editProfile() {
  const a = currentAccount();
  if (!a) return showAuth('login');
  const name = prompt('Tên hiển thị:', a.name);
  if (name === null || !name.trim()) return;
  const bio = prompt('Lời giới thiệu:', a.bio || '');
  if (bio === null) return;
  const location = prompt('Địa điểm trong làng:', a.location || '');
  if (location === null) return;

  const accounts = demoAccounts();
  const target = accounts.find(x => x.id === a.id);
  if (target) {
    target.name = name.trim().slice(0, 40);
    target.bio = bio.trim().slice(0, 220);
    target.location = location.trim().slice(0, 80);
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
  }
  const p = state.players.find(x => x.id === a.id);
  if (p) {
    p.name = name.trim().slice(0, 40);
    save();
  }
  updateTopbarAccount();
  profile();
}

let selectedBattleIdx = 0;
let openBattleStatsIdx = null;
let historyTeamFilter = 'all'; // 'all' | 'dan' | 'soi' | 'phe3'

function normalizeBattleRecord(h, idx) {
  const rawList = Array.isArray(h.result) ? h.result : [];
  const enriched = rawList.map((item, i) => {
    const roleObj = ROLES.find(r => r.id === item.roleId || r.name === item.role) || ROLES[(i * 3) % 52];
    return {
      playerId: item.playerId || (9001 + i),
      name: item.name || `Cư dân #${i + 1}`,
      roleId: roleObj.id,
      role: roleObj.name,
      team: item.team || roleObj.team,
      stars: item.stars || (4 + (i % 2)),
      survived: typeof item.survived === 'boolean' ? item.survived : (i < Math.ceil(rawList.length / 2))
    };
  });

  const winTeam = h.winnerTeam || (
    /sói/i.test(h.winner || '') ? 'soi' : /ba/i.test(h.winner || '') ? 'phe3' : 'dan'
  );

  let winners = enriched.filter(u => u.team === winTeam);
  let losers = enriched.filter(u => u.team !== winTeam);
  if (!winners.length) {
    const half = Math.ceil(enriched.length / 2);
    winners = enriched.slice(0, half);
    losers = enriched.slice(half);
  }
  if (!losers.length) {
    // Bổ sung đội đối đầu mẫu nếu bản ghi cũ chỉ có 1 phe
    losers = [1, 3, 6, 7, 10].map((rid, k) => {
      const rObj = ROLES.find(r => r.id === rid) || ROLES[0];
      return {
        playerId: 9010 + k,
        name: ['Bá Tước Đêm', 'Hắc Pháp Sư', 'Ảo Ảnh Sương', 'Kẻ Đóng Thế', 'Kỵ Sĩ Đêm'][k],
        roleId: rObj.id,
        role: rObj.name,
        team: rObj.team,
        stars: 4,
        survived: false
      };
    });
  }

  const winFactionName = winTeam === 'soi' ? 'Bầy Sói Ác Ma' : winTeam === 'phe3' ? 'Liên Minh Phe Ba' : 'Liên Minh Dân Làng';
  const loseFactionName = winTeam === 'dan' ? 'Bầy Sói & Phe Ba' : 'Hội Đồng Dân Làng';

  return {
    idx,
    date: h.date || '22/11/2026, 21:30',
    roomId: h.roomId || h.room || (1001 + idx),
    roomName: h.roomName || 'Dinh Thự Đồi Trăng',
    winTeam,
    winFactionName,
    loseFactionName,
    mvpName: h.mvpName || winners[0]?.name || 'Luna Moon',
    enemyLeader: h.enemyLeader || losers[0]?.name || 'Mastermind',
    scoreText: h.scoreText || `${winners.filter(x => x.survived).length || winners.length} : ${losers.filter(x => x.survived).length}`,
    rewardCoins: h.rewardCoins || `+${7 + (idx % 5) * 2} /H`,
    rewardPoints: h.rewardPoints || `+${80 + (idx % 4) * 15} /H`,
    logSummary: Array.isArray(h.logSummary) && h.logSummary.length ? h.logSummary : [
      `Đêm 1: Các thân phận tại ${h.roomName || 'Làng Sương Mù'} bí mật kích hoạt năng lực đầu tiên.`,
      `Ngày 2: Cuộc tranh luận nảy lửa tại quảng trường định đoạt cục diện giữa ${winFactionName} và ${loseFactionName}.`,
      `Kết cục: ${winFactionName} giành chiến thắng chung cuộc với đội hình ${winners.length} thành viên.`
    ],
    winners,
    losers
  };
}

function history() {
  const allBattles = state.history.map((h, i) => normalizeBattleRecord(h, i));
  const filteredBattles = allBattles.filter(b =>
    historyTeamFilter === 'all' ? true : b.winTeam === historyTeamFilter
  );

  if (selectedBattleIdx >= allBattles.length) selectedBattleIdx = 0;
  const activeBattle = allBattles[selectedBattleIdx] || allBattles[0];

  const danWins = allBattles.filter(b => b.winTeam === 'dan').length;
  const soiWins = allBattles.filter(b => b.winTeam === 'soi').length;

  $('content').innerHTML = `
    <div class="history-desktop-wrap">
      <!-- BANNER VICT✦RY TINH GỌN, CÂN ĐỐI (Đã đổi ngôi sao 4 cánh sang chữ O và lược bỏ mọi thông tin thừa) -->
      <section class="victory-banner-clean">
        <div class="victory-silhouette-wrap">
          <svg class="victory-silhouette-svg" viewBox="0 0 760 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="amberBacklight" cx="50%" cy="68%" r="58%">
                <stop offset="0%" stop-color="#FFF3C4"/>
                <stop offset="38%" stop-color="#E6A145"/>
                <stop offset="75%" stop-color="#5E2929"/>
                <stop offset="100%" stop-color="#1A0E1C"/>
              </radialGradient>
            </defs>
            <rect width="760" height="220" fill="url(#amberBacklight)"/>
            <!-- Khung vòm giáo đường Gothic -->
            <g stroke="#3A1D1E" stroke-width="5" fill="none" opacity="0.45">
              <path d="M120 220 V30 Q380 -20 640 30 V220"/>
              <path d="M220 220 V15 M540 220 V15 M380 120 V0"/>
              <path d="M220 82 Q380 18 540 82"/>
            </g>
            <!-- Tia sáng chiến thắng tỏa từ tâm -->
            <g stroke="#FFF6D6" stroke-width="18" stroke-opacity="0.16">
              <line x1="380" y1="155" x2="110" y2="8"/>
              <line x1="380" y1="155" x2="260" y2="0"/>
              <line x1="380" y1="155" x2="500" y2="0"/>
              <line x1="380" y1="155" x2="650" y2="8"/>
            </g>

            <!-- Bóng đổ (Silhouette) Đội Quân Cổ Tích & Kỵ Sĩ Trung Tâm -->
            <g fill="#23120E" transform="translate(60, -28)">
              <line x1="295" y1="22" x2="352" y2="155" stroke="#23120E" stroke-width="4.5"/>
              <path d="M298 26 Q215 14 155 42 Q95 66 48 49 Q105 94 175 78 Q238 62 310 70 Z"/>
              <path d="M115 245 L138 168 L112 142 L145 122 L152 88 L174 110 L195 92 L198 124 L228 145 L212 245 Z"/>
              <line x1="35" y1="220" x2="215" y2="148" stroke="#23120E" stroke-width="5"/>
              <path d="M245 245 Q255 186 292 160 L278 118 L266 96 L288 92 L298 66 L318 88 L334 65 L336 96 L354 116 L342 154 Q372 130 392 94 Q414 82 436 96 Q442 115 426 135 Q412 152 422 182 L456 214 L442 224 L408 196 L392 245 Z"/>
              <path d="M448 245 L465 162 L445 118 L485 104 L515 128 L552 122 L532 155 L568 175 L545 245 Z"/>
              <path d="M518 66 Q565 112 528 168" fill="none" stroke="#23120E" stroke-width="3.5"/>
              <line x1="485" y1="122" x2="565" y2="104" stroke="#23120E" stroke-width="3"/>
              <path d="M-60 228 Q160 206 320 220 T700 224 L700 250 L-60 250 Z" fill="#120B18"/>
            </g>
          </svg>
        </div>

        <!-- Tiêu đề VICT✦RY (Ngôi sao 4 cánh nằm đúng vị trí chữ O) -->
        <div class="victory-title-lockup">
          <h2 class="victory-word">VICT<span class="victory-star-o">✦</span>RY</h2>
        </div>

        <!-- Bảng Tỷ Số Final Score & 2 Huy hiệu Champion gọn gàng -->
        <div class="victory-scoreboard">
          <div class="champion-crest">
            <div class="crest-emblem">👑</div>
            <strong>${esc(activeBattle?.mvpName || 'Luna Moon')}</strong>
            <small>${esc(activeBattle?.winFactionName || 'Liên Minh Dân Làng')}</small>
          </div>

          <div class="final-score-center">
            <span>Final Score</span>
            <strong>${danWins} : ${soiWins}</strong>
          </div>

          <div class="champion-crest">
            <div class="crest-emblem" style="border-color:#8A7BA8">⚔️</div>
            <strong style="color:#D6CBE8">${esc(activeBattle?.enemyLeader || 'Bá Tước Đêm')}</strong>
            <small>${esc(activeBattle?.loseFactionName || 'Bầy Sói & Phe Ba')}</small>
          </div>
        </div>

        <!-- Thanh công cụ gọn dưới chân Banner: Bên trái là Cộng điểm, bên phải là Bộ lọc nhanh -->
        <div class="victory-bottom-toolbar">
          <div class="victory-rewards-inline">
            <span>
              🪙 <span class="reward-gain">${esc(activeBattle?.rewardCoins || '+12 /H')} <span class="reward-up-arrow">▲</span></span>
            </span>
            <span>
              Point Accumulation: <span class="reward-gain">${esc(activeBattle?.rewardPoints || '+95 /H')} <span class="reward-up-arrow">▲</span></span>
            </span>
          </div>

          <div class="row" style="margin:0;gap:8px">
            ${[
              ['all', `Tất cả (${allBattles.length})`],
              ['dan', '🌿 Dân Làng'],
              ['soi', '🐺 Phe Sói'],
              ['phe3', '🔮 Phe Ba']
            ].map(([k, label]) => `
              <button
                type="button"
                class="chip ${historyTeamFilter === k ? 'active' : ''}"
                style="padding:6px 11px;font-size:12px"
                onclick="historyTeamFilter='${k}';playSelectSfx();history()"
              >${label}</button>
            `).join('')}
            <button type="button" class="btn-gold" style="padding:6px 12px;font-size:12px" onclick="simulateNewBattleRecord()">
              + Thêm Battle
            </button>
          </div>
        </div>
      </section>

      <!-- TẦNG DƯỚI: DANH SÁCH CÁC TRẬN ĐẤU ĐỐI KHÁNG (Battle 1, Battle 2, Battle 3... Widescreen) -->
      <section class="battle-list-container">
        ${filteredBattles.map((b, displayIdx) => {
          const isSelected = b.idx === selectedBattleIdx;
          const isDrawerOpen = openBattleStatsIdx === b.idx;
          const winCaptain = b.winners[0];
          const loseCaptain = b.losers[0];

          return `
            <article
              class="battle-vs-card ${isSelected ? 'selected-battle' : ''}"
              onclick="selectHistoryBattle(${b.idx})"
            >
              <!-- Thanh Header của từng Battle -->
              <header class="battle-bar-header">
                <div class="row" style="margin:0;gap:8px">
                  <span class="room-code">Phòng #${b.roomId}</span>
                  <strong style="color:var(--text)">${esc(b.roomName)}</strong>
                  <span class="muted" style="font-size:12px">· ${esc(b.date)}</span>
                </div>

                <div class="battle-title-center">
                  <span>✦ Battle ${displayIdx + 1} ✦</span>
                </div>

                <div class="row" style="margin:0;gap:8px">
                  <button
                    type="button"
                    class="btn-secondary"
                    style="padding:4px 10px;font-size:12px"
                    onclick="event.stopPropagation();toggleBattleStatsDrawer(${b.idx})"
                  >
                    📊 ${isDrawerOpen ? 'Ẩn diễn biến' : 'Xem diễn biến đêm'}
                  </button>
                  <button
                    type="button"
                    class="btn-secondary"
                    style="padding:4px 9px;font-size:12px"
                    onclick="event.stopPropagation();deleteHistory(${b.idx})"
                    title="Xóa Battle này"
                  >✕</button>
                </div>
              </header>

              <!-- Hàng Đối Kháng Ngang: Phe Thắng (W) ◄── VS ──► Phe Bại (L) -->
              <div class="battle-matchup-grid">
                <!-- BÊN TRÁI: PHE CHIẾN THẮNG (W) -->
                <div class="battle-team-side winner-side">
                  <div class="team-captain-strip">
                    <div class="captain-badge">
                      <div class="captain-avatar-ring">
                        <img src="${portrait(winCaptain?.roleId || 28)}" alt="">
                        <span class="captain-lvl">#${winCaptain?.playerId || 9001}</span>
                      </div>
                      <div class="captain-meta">
                        <strong>${esc(b.mvpName)}</strong>
                        <small>${esc(b.winFactionName)} · ${b.winners.length} thành viên</small>
                      </div>
                    </div>
                    <div class="wl-ribbon win" title="Victory / Chiến thắng">W</div>
                  </div>

                  <!-- Dàn 5 thẻ nhân vật vuông Phe Thắng (Sáng rực rỡ) -->
                  <div class="team-units-row">
                    ${b.winners.slice(0, 5).map(u => `
                      <div
                        class="battle-unit-card ${u.survived ? '' : 'fallen-unit'}"
                        onclick="event.stopPropagation();inspectRoleFromHistory(${u.roleId})"
                        title="#${u.playerId} ${esc(u.name)} — Vai: ${esc(u.role)} (Nhấp để xem kỹ năng)"
                      >
                        <div class="unit-top-bar">
                          <span class="unit-faction-dot">${u.team === 'soi' ? '🐺' : u.team === 'dan' ? '🌿' : '🔮'}</span>
                          <span>#${u.playerId}</span>
                        </div>
                        <img class="unit-portrait-img" src="${portrait(u.roleId)}" alt="${esc(u.role)}">
                        <span class="unit-name-label">${esc(u.role)}</span>
                        <span class="unit-player-sub">${esc(u.name)}</span>
                        <span class="unit-stars">${'★'.repeat(u.stars)}${'☆'.repeat(Math.max(0, 5 - u.stars))}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- CHÍNH GIỮA: NÚT BIỂU ĐỒ HÌNH THOI (◇ 📊) & CHỮ VS VÀNG KIM -->
                <div class="vs-center-column">
                  <button
                    type="button"
                    class="vs-stats-diamond"
                    onclick="event.stopPropagation();toggleBattleStatsDrawer(${b.idx})"
                    title="Xem biểu đồ & nhật ký diễn biến trận này"
                  >
                    <span>📊</span>
                  </button>
                  <div class="vs-gold-letters">VS</div>
                </div>

                <!-- BÊN PHẢI: PHE THẤT BẠI (L) -->
                <div class="battle-team-side loser-side">
                  <div class="team-captain-strip">
                    <div class="captain-badge">
                      <div class="captain-avatar-ring">
                        <img src="${portrait(loseCaptain?.roleId || 1)}" alt="">
                        <span class="captain-lvl">#${loseCaptain?.playerId || 9002}</span>
                      </div>
                      <div class="captain-meta">
                        <strong>${esc(b.enemyLeader)}</strong>
                        <small>${esc(b.loseFactionName)} · ${b.losers.length} thành viên</small>
                      </div>
                    </div>
                    <div class="wl-ribbon lose" title="Defeat / Thất bại">L</div>
                  </div>

                  <!-- Dàn 5 thẻ nhân vật vuông Phe Bại (Trắng đen trầm như ảnh mẫu, hover sáng màu) -->
                  <div class="team-units-row">
                    ${b.losers.slice(0, 5).map(u => `
                      <div
                        class="battle-unit-card"
                        onclick="event.stopPropagation();inspectRoleFromHistory(${u.roleId})"
                        title="#${u.playerId} ${esc(u.name)} — Vai: ${esc(u.role)} (Nhấp để xem kỹ năng)"
                      >
                        <div class="unit-top-bar">
                          <span class="unit-faction-dot">${u.team === 'soi' ? '🐺' : u.team === 'dan' ? '🌿' : '🔮'}</span>
                          <span>#${u.playerId}</span>
                        </div>
                        <img class="unit-portrait-img" src="${portrait(u.roleId)}" alt="${esc(u.role)}">
                        <span class="unit-name-label">${esc(u.role)}</span>
                        <span class="unit-player-sub">${esc(u.name)}</span>
                        <span class="unit-stars">${'★'.repeat(u.stars)}${'☆'.repeat(Math.max(0, 5 - u.stars))}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Ngăn kéo Diễn biến chi tiết từng Đêm (Mở khi bấm nút hình thoi ◇ 📊) -->
              ${isDrawerOpen ? `
                <div class="battle-detail-drawer">
                  ${b.logSummary.map((line, stepIdx) => `
                    <div class="fact-box">
                      <span>Hồi ${stepIdx + 1} · Biên niên sử</span>
                      <strong style="color:var(--text);font-weight:500;line-height:1.5">${esc(line)}</strong>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </article>
          `;
        }).join('') || '<div class="empty">Không có trận đấu nào khớp với bộ lọc hiện tại.</div>'}
      </section>
    </div>
  `;
}

function selectHistoryBattle(idx) {
  playHoverSfx();
  selectedBattleIdx = idx;
  history();
}

function toggleBattleStatsDrawer(idx) {
  playSelectSfx();
  selectedBattleIdx = idx;
  openBattleStatsIdx = openBattleStatsIdx === idx ? null : idx;
  history();
}

function inspectRoleFromHistory(roleId) {
  const found = ROLES.find(r => r.id === roleId);
  if (found) selected = found;
  go('roles');
}

function simulateNewBattleRecord() {
  playSelectSfx();
  const winTeams = ['dan', 'soi', 'phe3'];
  const pickedTeam = winTeams[state.history.length % winTeams.length];
  const shuffled = [...ROLES.slice(0, 52)].sort(() => Math.random() - 0.5);
  const winners = shuffled.filter(r => r.team === pickedTeam).slice(0, 5);
  const losers = shuffled.filter(r => r.team !== pickedTeam).slice(0, 5);

  const result = [
    ...winners.map((r, i) => ({
      playerId: 9001 + i,
      name: DEFAULT_PLAYERS[i % DEFAULT_PLAYERS.length].name,
      roleId: r.id,
      role: r.name,
      team: r.team,
      stars: 5 - (i % 2),
      survived: i < 4
    })),
    ...losers.map((r, i) => ({
      playerId: 9006 + i,
      name: DEFAULT_PLAYERS[(i + 3) % DEFAULT_PLAYERS.length].name,
      roleId: r.id,
      role: r.name,
      team: r.team,
      stars: 4,
      survived: false
    }))
  ];

  state.history.unshift({
    id: 100 + state.history.length + 1,
    date: new Date().toLocaleString('vi-VN'),
    roomId: 1001 + (state.history.length % 3),
    roomName: ['Dinh Thự Đồi Trăng', 'Quán Trọ Nhung Đỏ', 'Tháp Canh Sương Mù'][state.history.length % 3],
    winner: pickedTeam === 'soi' ? 'Phe Sói' : pickedTeam === 'phe3' ? 'Phe Ba' : 'Phe Dân Làng',
    winnerTeam: pickedTeam,
    scoreText: '4 : 1',
    mvpName: result[0]?.name || 'Luna Moon',
    enemyLeader: result[5]?.name || 'Bá Tước Đêm',
    rewardCoins: '+11 /H',
    rewardPoints: '+90 /H',
    result
  });
  selectedBattleIdx = 0;
  save();
  history();
}

function deleteHistory(idx) {
  state.history.splice(idx, 1);
  save();
  history();
}

function ranking() {
  const ranked = [...state.players].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0));
  $('content').innerHTML = `
    <section class="section">
      <div class="section-header">
        <h3>🏆 Bảng xếp hạng Cư dân Làng Trăng</h3>
        <span class="muted" style="font-size:12.5px">Có thể cộng/trừ điểm trực tiếp sau mỗi ván diễn</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Mã #ID</th>
              <th>Người chơi</th>
              <th>Điểm danh vọng</th>
              <th>Điều chỉnh nhanh</th>
            </tr>
          </thead>
          <tbody>
            ${ranked.map((p, i) => `
              <tr>
                <td><b style="color:var(--gold)">${['🥇 #1', '🥈 #2', '🥉 #3'][i] || '#' + (i + 1)}</b></td>
                <td><span class="room-code">#${p.id}</span></td>
                <td><strong>${esc(p.name)}</strong></td>
                <td><b style="color:var(--gold);font-size:15px">${state.scores[p.id] || 0}</b></td>
                <td>
                  <button type="button" class="btn-secondary" style="padding:4px 10px" onclick="adjustScore(${p.id}, 25)">+25</button>
                  <button type="button" class="btn-secondary" style="padding:4px 10px" onclick="adjustScore(${p.id}, -25)">−25</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function adjustScore(playerId, delta) {
  state.scores[playerId] = Math.max(0, (state.scores[playerId] || 0) + delta);
  save();
  ranking();
}

/* ==========================================================================
   15. Hệ thống: Cài đặt (OPTIONS — Âm lượng, Tốc độ hiệu ứng, Hạt nền, Theme)
   ========================================================================== */
const THEME_OPTIONS = [
  ['moon', '🌙 Cổ tích đen (Chuẩn báo cáo #0E0C1D)'],
  ['gothic', '🦇 Gothic Đỏ Rượu'],
  ['classic', '🕯️ Cổ điển Charcoal'],
  ['basicdark', '🌑 Basic Tối dịu mắt'],
  ['basiclight', '☁️ Basic Sáng (Ban ngày)'],
  ['cream', '☕ Kem ấm (Giấy cổ tích)'],
  ['sage', '🌿 Xanh Sage dịu nhẹ'],
  ['europe', '🏰 Trung cổ châu Âu'],
  ['eastasia', '🏯 Trung cổ Đông Á'],
  ['jade', '🍃 Ngọc bích'],
  ['sakura', '🌸 Sakura Đêm'],
  ['loli', '🎀 Loli Fantasy'],
  ['frost', '❄️ Băng nguyệt'],
  ['bloodmoon', '🩸 Trăng máu'],
  ['forest', '🌲 Rừng cổ tích'],
  ['royal', '👑 Hoàng gia']
];

function settings() {
  const curTheme = document.body.dataset.theme || 'moon';
  $('content').innerHTML = `
    <div class="settings-grid">
      <section class="section">
        <h3>🎵 Âm thanh Game (BGM & UI Sound Feedback)</h3>
        <p class="muted" style="font-size:13px">
          Điều chỉnh âm lượng nhạc nền hộp nhạc sảnh chờ, tiếng tick khi di chuyển con trỏ menu và tiếng chốt khóa khi chọn.
        </p>
        <div class="slider-row">
          <label for="bgmVolRange">Nhạc nền sảnh (BGM): <b id="bgmVolVal" style="color:var(--gold)">${state.bgmVolume}%</b></label>
          <input
            id="bgmVolRange"
            type="range"
            min="0"
            max="100"
            value="${state.bgmVolume}"
            oninput="state.bgmVolume=Number(this.value);$('bgmVolVal').textContent=this.value+'%';save();syncVillageEffects()"
          >
        </div>
        <div class="slider-row">
          <label for="sfxVolRange">Âm thanh phản hồi (SFX): <b id="sfxVolVal" style="color:var(--gold)">${state.sfxVolume}%</b></label>
          <input
            id="sfxVolRange"
            type="range"
            min="0"
            max="100"
            value="${state.sfxVolume}"
            oninput="state.sfxVolume=Number(this.value);$('sfxVolVal').textContent=this.value+'%';save()"
          >
        </div>
        <div class="row">
          <button type="button" class="btn-gold" onclick="toggleBGM()">
            ${bgmPlaying ? '⏸ Tắt nhạc hộp nhạc' : '▶ Bật nhạc hộp nhạc'}
          </button>
          <button type="button" class="btn-secondary" onclick="playSelectSfx()">
            🔔 Thử tiếng chọn (Select)
          </button>
        </div>
      </section>

      <section class="section">
        <h3>✨ Hiệu ứng Game (Hạt đom đóm & Tốc độ chạy chữ)</h3>
        <p class="muted" style="font-size:13px">
          Tùy chỉnh hạt bụi sáng trên màn hình Khởi động (Title Screen) và tốc độ chạy chữ Typewriter trong hộp thoại Quản trò.
        </p>
        <div class="row" style="margin:12px 0">
          <button
            type="button"
            class="${state.particlesEnabled ? 'btn-gold' : 'btn-secondary'}"
            onclick="state.particlesEnabled=!state.particlesEnabled;save();settings()"
          >
            ${state.particlesEnabled ? '✦ Hạt đom đóm nền: ĐANG BẬT' : '○ Hạt đom đóm nền: ĐANG TẮT'}
          </button>
        </div>
        <div class="slider-row">
          <label for="typeSpeedRange">Tốc độ chạy chữ hộp thoại: <b id="typeSpeedVal" style="color:var(--gold)">${state.typewriterSpeed}ms/ký tự</b></label>
          <input
            id="typeSpeedRange"
            type="range"
            min="10"
            max="60"
            value="${state.typewriterSpeed}"
            oninput="state.typewriterSpeed=Number(this.value);$('typeSpeedVal').textContent=this.value+'ms/ký tự';save()"
          >
        </div>
      </section>

      <section class="section">
        <h3>🎨 Chọn Theme Sáng / Tối & 16 Phong cách</h3>
        <div class="row">
          <button type="button" class="btn-gold" onclick="setWolvesTheme('moon')">🌙 Tối Cổ Tích Đen</button>
          <button type="button" class="btn-secondary" onclick="setWolvesTheme('basiclight')">☀️ Chế độ Sáng</button>
          <button type="button" class="btn-secondary" onclick="setWolvesTheme('cream')">📜 Giấy Kem Ấm</button>
        </div>
        <div style="margin-top:12px">
          <select
            id="settingsThemeSelect"
            class="input-field"
            style="width:100%"
            onchange="setWolvesTheme(this.value)"
          >
            ${THEME_OPTIONS.map(([val, label]) => `
              <option value="${val}" ${curTheme === val ? 'selected' : ''}>${esc(label)}</option>
            `).join('')}
          </select>
        </div>
      </section>

      <section class="section">
        <h3>💾 Xuất / Nhập & Khôi phục Dữ liệu</h3>
        <div class="row">
          <button type="button" class="btn-gold" onclick="exportData()">↓ Xuất file JSON</button>
          <label class="btn-secondary" style="cursor:pointer">
            ↑ Nhập file JSON
            <input type="file" accept="application/json" onchange="importData(this)" style="display:none">
          </label>
          <button type="button" class="btn-crimson" onclick="resetData()">↺ Khôi phục dữ liệu gốc</button>
        </div>
      </section>
    </div>
  `;
}

function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'wolvesville-stage-data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importData(input) {
  const f = input.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      if (!Array.isArray(parsed.players) || !Array.isArray(parsed.rooms)) throw new Error('Invalid format');
      state = parsed;
      save();
      render();
      alert('Đã nhập dữ liệu thành công!');
    } catch {
      alert('Tệp JSON không đúng định dạng dữ liệu Wolvesville.');
    }
  };
  r.readAsText(f);
}

function resetData() {
  if (!confirm('Khôi phục toàn bộ dữ liệu phòng đấu, người chơi và lịch sử về mặc định?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  save();
  render();
}

/* ==========================================================================
   16. Trợ lý Cô Bé Quàng Khăn Đỏ & Theme Studio
   ========================================================================== */
function setWolvesTheme(name) {
  const allowed = THEME_OPTIONS.map(x => x[0]);
  if (!allowed.includes(name)) name = 'moon';
  document.body.dataset.theme = name;
  const sel = $('themeSelect');
  if (sel) sel.value = name;
  const sel2 = $('settingsThemeSelect');
  if (sel2) sel2.value = name;
  try {
    localStorage.setItem('wolvesville_theme_v2', name);
  } catch (e) {}
}

function addMessage(text, me = false) {
  const d = document.createElement('div');
  d.className = 'bubble' + (me ? ' me' : '');
  d.textContent = text;
  const box = $('messages');
  if (!box) return;
  box.append(d);
  box.scrollTop = box.scrollHeight;
}

function respondBot(q) {
  const s = q.toLocaleLowerCase('vi');
  const foundRole = ROLES.find(c => s.includes(c.name.toLocaleLowerCase('vi')) || s === `#${c.id}`);
  if (foundRole) {
    return `🎭 #${String(foundRole.id).padStart(2, '0')} ${foundRole.name} (${teamLabel(foundRole)} · Hào quang: ${foundRole.aura})\n\n${foundRole.desc}`;
  }
  if (/bản đồ|làng|phòng/.test(s)) {
    return 'Tại mục "Bản đồ Làng (Sảnh)", mỗi công trình phát sáng trên đồi đại diện cho một phòng chơi hoặc khu chức năng. Bạn chỉ cần nhấp vào công trình để cấu hình phòng hoặc vào trận!';
  }
  if (/trong trận|sân khấu|hud|hộp thoại/.test(s)) {
    return 'Mục "Sân khấu Trong trận" tái hiện HUD góc trên trái (tim máu, thẻ vai, lượt kỹ năng), vòng người chơi ở giữa và hộp thoại Quản trò chạy chữ Typewriter ở đáy màn hình!';
  }
  return 'Xin chào lữ khách! Bạn có thể gõ tên bất kỳ nhân vật nào trong 100 vai (vd: "Sói Đạo Tặc", "Dorothy", "Tiên Tri") để mình trích xuất nguyên văn kỹ năng cho bạn.';
}

function askRole(roleId) {
  const c = ROLES.find(r => r.id === roleId) || selected;
  const chat = $('chat');
  if (chat) {
    chat.classList.add('open');
    placeChat();
  }
  addMessage(`Giải thích kỹ năng của #${String(c.id).padStart(2, '0')} ${c.name}`, true);
  addMessage(respondBot(c.name));
}

function placeChat() {
  const botEl = $('bot');
  const c = $('chat');
  if (!botEl || !c) return;
  const b = botEl.getBoundingClientRect();
  const w = Math.min(365, innerWidth - 24);
  const h = Math.min(460, innerHeight - 110);
  let left = b.left - w - 12;
  if (left < 8) left = Math.min(innerWidth - w - 8, b.right + 12);
  const top = Math.min(innerHeight - h - 8, Math.max(8, b.top - h + 65));
  c.style.left = left + 'px';
  c.style.top = top + 'px';
}

function initFloatingBot() {
  const bot = $('bot');
  if (!bot) return;
  let drag = null, botX = 0, botY = 0;
  const EDGE = 12;
  const clamp = (x, y) => [
    Math.max(EDGE, Math.min(innerWidth - bot.offsetWidth - EDGE, x)),
    Math.max(EDGE, Math.min(innerHeight - bot.offsetHeight - EDGE, y))
  ];
  const position = (x, y) => {
    [botX, botY] = clamp(x, y);
    bot.style.left = botX + 'px';
    bot.style.top = botY + 'px';
  };
  const snapToEdge = () => {
    const maxX = innerWidth - bot.offsetWidth - EDGE;
    const maxY = innerHeight - bot.offsetHeight - EDGE;
    const distances = [
      { d: botX, x: EDGE, y: botY },
      { d: maxX - botX, x: maxX, y: botY },
      { d: botY, x: botX, y: EDGE },
      { d: maxY - botY, x: botX, y: maxY }
    ];
    distances.sort((a, b) => a.d - b.d);
    position(distances[0].x, distances[0].y);
    if ($('chat')?.classList.contains('open')) placeChat();
  };

  requestAnimationFrame(() => position(innerWidth - bot.offsetWidth - EDGE, innerHeight - bot.offsetHeight - 80));

  bot.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x: botX, y: botY, moved: false };
    bot.setPointerCapture(e.pointerId);
    bot.classList.add('dragging');
  });
  bot.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 7) drag.moved = true;
    if (drag.moved) position(drag.x + dx, drag.y + dy);
  });
  bot.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    bot.classList.remove('dragging');
    if (moved) {
      snapToEdge();
    } else {
      $('chat')?.classList.toggle('open');
      if ($('chat')?.classList.contains('open')) placeChat();
    }
  });
  window.addEventListener('resize', () => {
    position(botX, botY);
    snapToEdge();
  });

  $('closechat')?.addEventListener('click', () => $('chat')?.classList.remove('open'));
  $('chatForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('question');
    const q = input?.value.trim();
    if (!q) return;
    addMessage(q, true);
    input.value = '';
    addMessage(respondBot(q));
  });
}

function initSidebarResize() {
  const bar = $('sidebarResize');
  if (!bar) return;
  const root = document.documentElement;
  const storageKey = 'wolvesville_sidebar_width';
  const clamp = v => Math.min(320, Math.max(200, v));
  try {
    const n = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(n) && n >= 200 && n <= 320) root.style.setProperty('--wv-sidebar-width', n + 'px');
  } catch (e) {}

  let active = false, startX = 0, startWidth = 232, pointerId = null;
  const apply = w => {
    const n = clamp(w);
    root.style.setProperty('--wv-sidebar-width', n + 'px');
    return n;
  };
  bar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || matchMedia('(max-width:780px)').matches) return;
    active = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startWidth = document.querySelector('.sidebar').getBoundingClientRect().width;
    bar.setPointerCapture(e.pointerId);
    bar.classList.add('resizing');
    e.preventDefault();
  });
  bar.addEventListener('pointermove', e => {
    if (active && e.pointerId === pointerId) apply(startWidth + e.clientX - startX);
  });
  const finish = e => {
    if (!active || e.pointerId !== pointerId) return;
    active = false;
    bar.classList.remove('resizing');
    try {
      localStorage.setItem(storageKey, String(Math.round(document.querySelector('.sidebar').getBoundingClientRect().width)));
    } catch (e) {}
  };
  bar.addEventListener('pointerup', finish);
  bar.addEventListener('pointercancel', finish);
  bar.addEventListener('dblclick', () => {
    root.style.setProperty('--wv-sidebar-width', '232px');
    try { localStorage.removeItem(storageKey); } catch (e) {}
  });
}

/* ==========================================================================
   17. Khởi tạo Ứng dụng (Bootstrapping)
   ========================================================================== */
function initStoryCharacter() {
  const art = $('landingStory')?.querySelector('.landing-story-art');
  if (!art || !('IntersectionObserver' in window)) return;

  let visible = false;
  const sync = () => art.classList.toggle('is-animating', visible && !document.hidden);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(art);
  document.addEventListener('visibilitychange', sync);
}

document.addEventListener('DOMContentLoaded', () => {
  initStoryCharacter();
  document.addEventListener('click', unlockVillageAudio, { capture: true });
  document.addEventListener('visibilitychange', syncVillageEffects);
  ensureDemoAccountSeed();
  let savedTheme = 'moon';
  try {
    savedTheme = localStorage.getItem('wolvesville_theme_v2') || 'moon';
  } catch (e) {}
  setWolvesTheme(savedTheme);

  if (!localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, '9001');
  }

  $('appShell').inert = true;
  initParticleCanvas();
  initKeyboardNavigation();
  initSidebarResize();
  initFloatingBot();
  render();
});
