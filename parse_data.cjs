const fs = require('fs');

const data = `
| **Nhân sự**             | Tuyển dụng          | Quản lý toàn bộ quy trình tuyển dụng nhân sự | Lập nhu cầu tuyển dụng • Đăng tuyển • Tiếp nhận CV • Sàng lọc hồ sơ • Phỏng vấn • Đánh giá ứng viên • Gửi Offer • Tiếp nhận nhân viên |
|                         | Hồ sơ nhân sự       | Quản lý thông tin nhân viên                  | Hồ sơ nhân viên • Hợp đồng lao động • Điều chỉnh thông tin • Gia hạn hợp đồng • Chấm dứt hợp đồng                                     |
|                         | Chấm công           | Quản lý thời gian làm việc                   | Chấm công • Ca làm • Tăng ca • Nghỉ phép • Nghỉ bệnh • Công tác                                                                       |
|                         | Tính lương          | Quản lý thu nhập nhân viên                   | Tính lương • Phụ cấp • Thưởng • BHXH • Thuế TNCN • Phiếu lương                                                                        |
|                         | Đào tạo             | Phát triển năng lực nhân viên                | Lập kế hoạch đào tạo • Quản lý khóa học • Điểm danh • Thi đánh giá • Chứng chỉ                                                        |
|                         | Đánh giá hiệu suất  | Đánh giá năng lực và KPI                     | Thiết lập KPI • Đánh giá KPI • Đánh giá 360° • Xếp loại nhân viên                                                                     |
|                         | Phúc lợi            | Quản lý chính sách đãi ngộ                   | Bảo hiểm • Du lịch • Sinh nhật • Khám sức khỏe • Phúc lợi nội bộ                                                                      |
| **Kinh doanh**          | Quản lý Lead        | Tiếp nhận và quản lý khách hàng tiềm năng    | Nhập Lead • Phân loại Lead • Chấm điểm Lead • Phân bổ Lead                                                                            |
|                         | Quản lý khách hàng  | Quản lý thông tin khách hàng                 | Hồ sơ khách hàng • Liên hệ • Lịch sử giao dịch • Phân loại khách hàng                                                                 |
|                         | Cơ hội kinh doanh   | Theo dõi cơ hội bán hàng                     | Tạo Opportunity • Pipeline • Forecast • Chốt cơ hội                                                                                   |
|                         | Báo giá             | Quản lý báo giá                              | Tạo báo giá • Gửi báo giá • Theo dõi • Phê duyệt                                                                                      |
|                         | Hợp đồng            | Quản lý hợp đồng                             | Soạn hợp đồng • Ký số • Gia hạn • Thanh lý                                                                                            |
|                         | Đơn hàng            | Quản lý bán hàng                             | Tạo đơn hàng • Theo dõi • Giao hàng • Hoàn thành                                                                                      |
| **Marketing**           | Digital Marketing   | Triển khai hoạt động tiếp thị số             | Google Ads • Facebook Ads • TikTok Ads • Remarketing                                                                                  |
|                         | Content Marketing   | Xây dựng nội dung                            | Viết bài • Thiết kế • Video • Landing Page                                                                                            |
|                         | SEO                 | Tối ưu công cụ tìm kiếm                      | Nghiên cứu từ khóa • SEO Onpage • SEO Offpage • Theo dõi thứ hạng                                                                     |
|                         | Social Media        | Quản lý mạng xã hội                          | Facebook • LinkedIn • TikTok • YouTube • Zalo OA                                                                                      |
|                         | Email Marketing     | Gửi email tự động                            | Danh sách Email • Campaign • Automation • Báo cáo                                                                                     |
|                         | Event               | Tổ chức sự kiện                              | Webinar • Hội thảo • Roadshow • Triển lãm                                                                                             |
| **Chăm sóc khách hàng** | Ticket              | Tiếp nhận và xử lý yêu cầu                   | Tạo Ticket • Phân công • Theo dõi • Đóng Ticket                                                                                       |
|                         | Khiếu nại           | Giải quyết khiếu cụ                          | Tiếp nhận • Xác minh • Xử lý • Phản hồi                                                                                               |
|                         | Khảo sát            | Đánh giá mức độ hài lòng                     | CSAT • NPS • CES • Báo cáo khảo sát                                                                                                   |
|                         | Customer Success    | Chăm sóc sau bán                             | Gia hạn • Upsell • Cross-sell • Chăm sóc định kỳ                                                                                      |
|                         | Loyalty             | Quản lý khách hàng thân thiết                | Điểm thưởng • Hạng thành viên • Ưu đãi                                                                                                |
| **Tài chính**           | Ngân sách           | Quản lý kế hoạch tài chính                   | Lập ngân sách • Phê duyệt • Theo dõi • Điều chỉnh                                                                                     |
|                         | Dòng tiền           | Quản lý thu chi                              | Dự báo dòng tiền • Thu • Chi • Đối soát                                                                                               |
|                         | Phân tích tài chính | Đánh giá hiệu quả tài chính                  | Báo cáo • Phân tích • Dự báo • Cảnh báo                                                                                               |
| **Kế toán**             | Công nợ             | Quản lý công nợ                              | Công nợ phải thu • Công nợ phải trả • Đối chiếu                                                                                       |
|                         | Thanh toán          | Quản lý thanh toán                           | Phiếu thu • Phiếu chi • Chuyển khoản • Hoàn ứng                                                                                       |
|                         | Thuế                | Quản lý thuế                                 | VAT • Thuế TNDN • Thuế TNCN • Quyết toán                                                                                              |
| **Mua hàng**            | Đề nghị mua hàng    | Quản lý nhu cầu mua sắm                      | Tạo PR • Phê duyệt • Theo dõi                                                                                                         |
|                         | Nhà cung cấp        | Quản lý đối tác                              | Hồ sơ NCC • Đánh giá • Xếp hạng                                                                                                       |
|                         | Đơn đặt hàng        | Quản lý PO                                   | Tạo PO • Phê duyệt • Theo dõi giao hàng                                                                                               |
| **Kho**                 | Nhập kho            | Tiếp nhận hàng hóa                           | Phiếu nhập • Kiểm tra • Cập nhật tồn                                                                                                  |
|                         | Xuất kho            | Xuất hàng                                    | Phiếu xuất • Kiểm tra • Bàn giao                                                                                                      |
|                         | Kiểm kê             | Kiểm tra tồn kho                             | Kiểm kê • Chênh lệch • Điều chỉnh                                                                                                     |
| **CNTT**                | Hạ tầng             | Quản lý hạ tầng CNTT                         | Máy chủ • Mạng • Firewall • VPN                                                                                                       |
|                         | Thiết bị            | Quản lý tài sản CNTT                         | Laptop • Desktop • Máy in • Thiết bị mạng                                                                                             |
|                         | Hỗ trợ người dùng   | Hỗ trợ kỹ thuật                              | Cấp tài khoản • Reset mật khẩu • Cài phần mềm • Khắc phục sự cố                                                                       |
|                         | An toàn thông tin   | Đảm bảo an ninh hệ thống                     | Antivirus • Backup • Giám sát • Kiểm tra bảo mật                                                                                      |
| **Phát triển phần mềm** | Phân tích nghiệp vụ | Thu thập yêu cầu                             | Khảo sát • Đặc tả • User Story                                                                                                        |
|                         | Lập trình           | Phát triển phần mềm                          | Backend • Frontend • Mobile • API                                                                                                     |
|                         | Kiểm thử            | Đảm bảo chất lượng phần mềm                  | Unit Test • Integration Test • UAT • Regression Test                                                                                  |
|                         | DevOps              | Triển khai hệ thống                          | CI/CD • Docker • Kubernetes • Release                                                                                                 |
| **PMO**                 | Khởi tạo dự án      | Thiết lập dự án                              | Project Charter • Phạm vi • Mục tiêu                                                                                                  |
|                         | Quản lý tiến độ     | Theo dõi thực hiện                           | Timeline • Milestone • Báo cáo                                                                                                        |
|                         | Quản lý rủi ro      | Kiểm soát dự án                              | Risk Register • Issue Log • Change Request                                                                                            |
| **BI & Data**           | Dashboard           | Xây dựng báo cáo                             | Dashboard • KPI • Drill-down • Export                                                                                                 |
|                         | Phân tích dữ liệu   | Phân tích nghiệp vụ                          | ETL • Data Warehouse • BI • Data Mining                                                                                               |
| **AI & Chuyển đổi số**  | AI Assistant        | Hỗ trợ bằng AI                               | Chat AI • Copilot • Hỏi đáp • Sinh báo cáo                                                                                            |
|                         | Tự động hóa         | Tối ưu quy trình                             | Workflow AI • RPA • OCR • AI Agent                                                                                                    |
`;

const lines = data.split('\n').filter(l => l.trim().startsWith('|'));
let currentDept = '';
let deptCounter = 1;
let funcCounter = 1;

let nodes = [];

nodes.push({
  id: "node-root",
  name: "Ban Giám đốc",
  title: "Cơ quan điều hành",
  department: "Ban Giám đốc",
  email: "bod@company.vn",
  phone: "",
  managerId: null,
  relationship: "champion",
  influence: "high",
  notes: "Điều hành và quản lý toàn bộ hoạt động công ty.",
  isDepartment: true
});

for (const line of lines) {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 5) continue;
  
  let dept = parts[1].replace(/\*\*/g, '').trim();
  const func = parts[2];
  const desc = parts[3];
  const tasks = parts[4];
  
  if (dept) {
    currentDept = dept;
    nodes.push({
      id: `dept-${deptCounter}`,
      name: `Khối ${currentDept}`,
      title: "Phòng ban",
      department: currentDept,
      email: `${currentDept.toLowerCase().replace(/ /g, '')}@company.vn`,
      phone: "",
      managerId: "node-root",
      relationship: "neutral",
      influence: "medium",
      notes: `Quản lý các hoạt động ${currentDept}`,
      isDepartment: true
    });
    deptCounter++;
  }
  
  nodes.push({
    id: `func-${funcCounter}`,
    name: func,
    title: "Nhánh chức năng",
    department: currentDept,
    email: "",
    phone: "",
    managerId: `dept-${deptCounter - 1}`,
    relationship: "neutral",
    influence: "low",
    notes: `${desc}\n\nCông việc: ${tasks}`,
    isDepartment: true
  });
  funcCounter++;
}

console.log(JSON.stringify(nodes, null, 2));
