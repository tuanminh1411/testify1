import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OnclassHomePageTeacher.css";
import {
  FaBook,
  FaBell,
  FaHeadset,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
 
const OnClassHomepageTeacher = () => {
  const navigate = useNavigate();
 
  // States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
 
  const [className, setClassName] = useState("Danh sách học sinh");
  const [students, setStudents] = useState([]);
  const [totalStudentPages, setTotalStudentPages] = useState(1);
 
  // Cố định 10 sinh viên mỗi trang
  const pageSize = 10;
 
  // Kiểm tra token khi component mount
  useEffect(() => {
    // Kiểm tra token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
   
    // Lấy và thiết lập tên lớp từ localStorage
    const savedClassName = localStorage.getItem("selectedClassName");
    if (savedClassName) {
      setClassName(savedClassName);
    }
   
    // Lấy dữ liệu học sinh, thông báo
    fetchClassStudents();
    fetchNotifications();
  }, [navigate]);
 
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
 
  // Hàm lấy dữ liệu học sinh của lớp được chọn
  const fetchClassStudents = async () => {
    setIsLoading(true);
    try {
      // Lấy classId từ localStorage
      const classId = localStorage.getItem("selectedClassId");
     
      if (!classId) {
        console.log("Không tìm thấy ID lớp học");
        return;
      }
     
      // Gọi API lấy thông tin lớp học kèm danh sách học sinh
      
      const response = await axios.get(`http://localhost:5026/api/Class/with-students`);
      

     
      // Tìm kiếm lớp học theo classId trong dữ liệu trả về từ API
      const classInfo = response.data.find(cls => cls.classId === classId);
     
      if (classInfo) {
        console.log("Tìm thấy lớp học:", classInfo);
       
        // Lấy danh sách học sinh từ classInfo
        if (Array.isArray(classInfo.students)) {
          setStudents(classInfo.students);
          setTotalStudentPages(Math.ceil(classInfo.students.length / pageSize));
         
          // Lưu vào localStorage để có thể truy cập offline
          localStorage.setItem("classStudents", JSON.stringify(classInfo.students));
        } else {
          setStudents([]);
          setTotalStudentPages(1);
        }
      } else {
        console.log("Không tìm thấy thông tin lớp học với ID:", classId);
        setStudents([]);
        setTotalStudentPages(1);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu học sinh của lớp:", error);
     
      // Kiểm tra lỗi xác thực
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực:", error.response.data);
        // Xóa token không hợp lệ
        localStorage.removeItem('accessToken');
        // Chuyển hướng người dùng về trang đăng nhập
        navigate('/login');
        return;
      }
     
      // Nếu không kết nối được với API, thử lấy dữ liệu từ localStorage
      const cachedStudents = localStorage.getItem("classStudents");
      if (cachedStudents) {
        const parsedStudents = JSON.parse(cachedStudents);
        setStudents(parsedStudents);
        setTotalStudentPages(Math.ceil(parsedStudents.length / pageSize));
        console.log("Đã tải dữ liệu học sinh từ localStorage");
      } else {
        setStudents([]);
        setTotalStudentPages(1);
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  // Hàm tìm kiếm học sinh
  const searchStudents = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
   
    setIsSearching(true);
   
    // Lọc học sinh trong mảng students
    const filteredStudents = students.filter(student =>
      student.name && student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
   
    setSearchResults(filteredStudents);
  };
 
  // Xử lý khi submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchStudents();
  };
 
  // Hàm xóa tìm kiếm
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };
 
  // Phân trang cho học sinh (client-side pagination)
  const getPaginatedStudents = () => {
    const dataToUse = isSearching ? searchResults : students;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return dataToUse.slice(startIndex, endIndex);
  };
 
  // Xử lý khi người dùng thay đổi trang
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalStudentPages) return;
    setCurrentPage(pageNumber);
  };
 
  // Hiển thị phân trang với dấu ba chấm
  const renderPagination = () => {
    // Đảm bảo totalPages là một số hợp lệ
    const safeTotal = Math.max(1, totalStudentPages || 1);
 
    // Nếu chỉ có 1 trang, không hiển thị phân trang
    if (safeTotal <= 1) {
      return null;
    }
 
    // Mảng để chứa các nút phân trang
    const items = [];
   
    // Luôn thêm trang đầu tiên
    items.push(
      <button
        key={1}
        className={`page-btn ${currentPage === 1 ? "active" : ""}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );
 
    // Hiển thị dấu ba chấm đầu tiên nếu cần
    if (currentPage > 4) {
      items.push(<span key="ellipsis-1" className="dots">...</span>);
    }
 
    // Hiển thị trang xung quanh trang hiện tại
    for (let i = Math.max(2, currentPage - 2); i <= Math.min(safeTotal - 1, currentPage + 2); i++) {
      if (i === 1 || i === safeTotal) continue; // Bỏ qua trang đầu và trang cuối vì đã hiển thị riêng
      items.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
 
    // Hiển thị dấu ba chấm cuối cùng nếu cần
    if (currentPage < safeTotal - 3) {
      items.push(<span key="ellipsis-2" className="dots">...</span>);
    }
 
    // Luôn thêm trang cuối cùng nếu có nhiều hơn 1 trang
    if (safeTotal > 1) {
      items.push(
        <button
          key={safeTotal}
          className={`page-btn ${currentPage === safeTotal ? "active" : ""}`}
          onClick={() => handlePageChange(safeTotal)}
        >
          {safeTotal}
        </button>
      );
    }
 
    return (
      <div className="pagination">
        <button
          className="page-btn"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <FaChevronLeft />
        </button>
       
        {items}
       
        <button
          className="page-btn"
          disabled={currentPage === safeTotal}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };
 
  // Lấy dữ liệu thông báo
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("http://localhost:5026/api/Notification");
      const notificationData = response.data;
      setNotifications(notificationData);
      localStorage.setItem("notifications", JSON.stringify(notificationData));
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thông báo:", error);
     
      // Kiểm tra lỗi xác thực
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực khi lấy thông báo:", error.response.data);
        return; // Không chuyển hướng, chỉ bỏ qua việc lấy thông báo
      }
     
      // Nếu không phải lỗi xác thực, thử lấy từ localStorage
      const cachedNotifications = localStorage.getItem("notifications");
      if (cachedNotifications) {
        setNotifications(JSON.parse(cachedNotifications));
      }
    }
  };
 
  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };
 
  // Hàm format ngày tháng dạng dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
   
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch (error) {
      return dateString;
    }
  };
 
  // Format thời gian cho thông báo
  const formatTime = (dateString) => {
    if (!dateString) return '';
   
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
     
      if (diffDays < 1) {
        // Nếu thông báo trong vòng 24 giờ, hiển thị giờ:phút
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffDays < 7) {
        // Nếu thông báo trong vòng 1 tuần, hiển thị thứ và giờ:phút
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[date.getDay()]}, ${date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      } else {
        // Nếu thông báo cũ hơn 1 tuần, hiển thị ngày/tháng và giờ:phút
        return `${date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit'
        }).replace(/\//g, '/')}, ${date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }
    } catch (error) {
      return dateString;
    }
  };
 
  return (
    <div className="onclass-body">
      <div className="sidebar">
        <div className="logo">
          <img src="images/logo.jpg" alt="Logo" className="logo-image" />
        </div>
        <div className="settings-icon">
          <FaCog className="function-icon" />
        </div>
        <div className="function-icons">
          <Link to="/hometeacher" className="icon-item">
            <FaBook className="function-icon" />
            <p className="icon-description">Môn học</p>
          </Link>
          <Link to="/support" className="icon-item">
            <FaHeadset className="function-icon" />
            <p className="icon-description">Hỗ trợ</p>
          </Link>
          <div className="icon-item" onClick={toggleNotifications}>
            <FaBell className="function-icon" />
            <p className="icon-description">Thông báo</p>
            {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
          </div>
          <div className="icon-item" onClick={handleLogout}>
            <FaSignOutAlt className="function-icon" />
            <p className="icon-description">Đăng xuất</p>
          </div>
        </div>
      </div>
 
      <div className="main-content1">
        <div className="header1">
          <h1 className="title6">{className}</h1>
          <div className="search-wrapper">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Tìm kiếm</button>
              {isSearching && (
                <button type="button" onClick={clearSearch} className="clear-search-icon">
                  Xóa tìm kiếm
                </button>
              )}
            </form>
          </div>
        </div>
 
        <div className="class-info">
          <div className="info-card">
            <h3>Tổng số học sinh</h3>
            <p>{students.length}</p>
          </div>
        </div>
 
        <div className="student-list1">
 
          {isLoading ? (
            <div className="loading">Đang tải dữ liệu...</div>
          ) : (
            <>
              <table className="student-table1">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và tên</th>
                    <th>Ngày sinh</th>
                    <th>Giới tính</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedStudents().length > 0 ? (
                    getPaginatedStudents().map((student, index) => (
                      <tr key={student.id || index}>
                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                        <td>{student.name}</td>
                        <td>{formatDate(student.birthDate)}</td>
                        <td>{student.gender === 'Male' ? 'Nam' : 'Nữ'}</td>
                        <td>{student.phoneNumber}</td>
                        <td>{student.email}</td>
                        <td className="actions">
                          <button className="action-btn view-btn">Xem</button>
                          <button className="action-btn edit-btn">Sửa</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        {isSearching ? "Không tìm thấy học sinh phù hợp" : "Không có học sinh"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination()}
            </>
          )}
        </div>
      </div>
 
      {showNotifications && (
        <div className="notification-box show">
          <div className="notification-header">
            <span>Thông Báo</span>
            <FaTimes className="close-btn" onClick={toggleNotifications} />
          </div>
          <div className="notification-content">
            {notifications.length > 0 ? (
              notifications.map((item, index) => (
                <div className="notification-item" key={index}>
                  <span className="user-icon"></span>
                  <div className="notification-text">
                    <strong>{item.name || item.context || item.title}</strong>
                    <p>{item.message || item.content}</p>
                    <small>{formatTime(item.time || item.createdAt)}</small>
                  </div>
                  <FaEllipsisV className="notification-options" />
                </div>
              ))
            ) : (
              <div className="no-notifications">Không có thông báo</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
 
export default OnClassHomepageTeacher;
 