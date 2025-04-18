import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OnclassHomePageTeacher.css";
import {
  FaBook,
  FaBell,
  FaHeadset,
  FaCog,
  FaPlus,
  FaSignOutAlt,
  FaTimes,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
 
const TestsList = () => {
  const navigate = useNavigate();
 
  // States
  const [showNotifications, setShowNotifications] = useState(false);
  const [data, setData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
 
  // Cố định 10 sinh viên mỗi trang
  const pageSize = 10;
 
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
 
  // Hàm lấy dữ liệu sinh viên với phân trang
  const fetchStudents = async (pageNumber = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5026/Student/PageNumber?pageNumber=${pageNumber}&pageSize=${pageSize}`);
      // Truy cập mảng students từ phản hồi
      const responseData = response.data;
      setData(responseData.students || []);
      // Tính toán tổng số trang từ totalCount và pageSize
      const calculatedTotalPages = Math.ceil(responseData.totalCount / pageSize);
      setTotalPages(calculatedTotalPages || 1);
      setCurrentPage(responseData.pageNumber || 1);
     
      // Lưu dữ liệu vào localStorage để có thể tìm kiếm offline
      localStorage.setItem("students", JSON.stringify(responseData.students || []));
      localStorage.setItem("totalStudents", responseData.totalCount);
      // Lưu dữ liệu phân trang
      localStorage.setItem(`students_page_${pageNumber}`, JSON.stringify(responseData.students || []));
     
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu sinh viên:", error);
     
      // Kiểm tra lỗi xác thực
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực:", error.response.data);
        // Xóa token không hợp lệ
        localStorage.removeItem('accessToken');
        // Chuyển hướng người dùng về trang đăng nhập
        navigate('/login');
        return;
      }
     
      // Nếu không phải lỗi xác thực, thử lấy dữ liệu từ localStorage
      const cachedStudents = localStorage.getItem("students");
      if (cachedStudents) {
        setData(JSON.parse(cachedStudents));
        const totalCount = localStorage.getItem("totalStudents") || 10;
        setTotalPages(Math.ceil(Number(totalCount) / pageSize));
        console.log("Đã tải dữ liệu từ localStorage");
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  // Hàm tìm kiếm học sinh trên tất cả các trang
  const searchStudents = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      fetchStudents(currentPage);
      return;
    }
   
    setIsLoading(true);
    setIsSearching(true);
   
    try {
      console.log("Đang tìm kiếm học sinh:", searchQuery);
     
      // Lấy tổng số học sinh từ localStorage để xác định có bao nhiêu trang
      const totalCount = localStorage.getItem("totalStudents") || 0;
      const maxPages = Math.ceil(Number(totalCount) / pageSize);
     
      // Mảng để lưu tất cả kết quả tìm kiếm
      let allResults = [];
     
      // API endpoint cho tìm kiếm
      const searchUrl = `http://localhost:5026/Student/Search?name=${encodeURIComponent(searchQuery)}`;
     
      // Thử gọi API tìm kiếm không phân trang (nếu có)
      try {
        const response = await axios.get(searchUrl);
        console.log("Kết quả tìm kiếm từ API không phân trang:", response.data);
       
        if (response.data) {
          if (Array.isArray(response.data)) {
            allResults = response.data;
          } else if (typeof response.data === 'object' && response.data !== null) {
            allResults = [response.data];
          }
        }
      } catch (searchError) {
        console.log("API tìm kiếm không phân trang thất bại, thực hiện tìm kiếm qua từng trang");
       
        // Lặp qua tất cả các trang và tìm kiếm
        const searchPromises = [];
       
        for (let page = 1; page <= maxPages; page++) {
          searchPromises.push(
            axios.get(`http://localhost:5026/Student/PageNumber?pageNumber=${page}&pageSize=${pageSize}`)
              .then(response => {
                const students = response.data.students || [];
                // Lọc học sinh phù hợp với từ khóa tìm kiếm
                const query = searchQuery.toLowerCase();
                return students.filter(student =>
                  (student.name && student.name.toLowerCase().includes(query))
                );
              })
              .catch(error => {
                console.error(`Lỗi khi tìm kiếm trang ${page}:`, error);
                return [];
              })
          );
        }
       
        // Chờ tất cả các yêu cầu hoàn thành
        const results = await Promise.all(searchPromises);
       
        // Gộp tất cả kết quả
        allResults = results.flat();
      }
     
      // Kiểm tra nếu không tìm thấy kết quả từ API, thử tìm trong localStorage
      if (allResults.length === 0) {
        console.log("Không tìm thấy kết quả từ API, thử tìm trong localStorage");
       
        const cachedStudents = localStorage.getItem("students");
        if (cachedStudents) {
          let allCachedStudents = [];
         
          // Lặp qua tất cả các trang
          for (let page = 1; page <= maxPages; page++) {
            try {
              const pageData = localStorage.getItem(`students_page_${page}`);
              if (pageData) {
                const parsedData = JSON.parse(pageData);
                allCachedStudents = [...allCachedStudents, ...parsedData];
              }
            } catch (error) {
              console.error(`Lỗi khi đọc dữ liệu trang ${page} từ localStorage:`, error);
            }
          }
         
          // Nếu không có dữ liệu phân trang, sử dụng dữ liệu đã lưu trong localStorage
          if (allCachedStudents.length === 0) {
            allCachedStudents = JSON.parse(cachedStudents);
          }
         
          const query = searchQuery.toLowerCase();
          allResults = allCachedStudents.filter(student =>
            (student.name && student.name.toLowerCase().includes(query))
          );
        }
      }
     
      console.log("Tổng số kết quả tìm kiếm:", allResults.length);
      setSearchResults(allResults);
     
    } catch (error) {
      console.error("Lỗi khi tìm kiếm học sinh:", error);
     
      // Kiểm tra lỗi xác thực
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error("Lỗi xác thực khi tìm kiếm:", error.response.data);
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }
     
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
 
  // Hàm xóa tìm kiếm
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    fetchStudents(currentPage);
  };
 
  // Xử lý khi người dùng thay đổi trang
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    fetchStudents(pageNumber);
  };
 
  // Hiển thị phân trang với dấu ba chấm
  const renderPagination = () => {
    // Đảm bảo totalPages là một số hợp lệ
    const safeTotal = Math.max(1, totalPages || 1);
 
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
 
  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
   
    if (!token) {
      console.log("Không tìm thấy token, chuyển hướng đến trang đăng nhập");
      navigate('/login');
      return;
    }
   
    // Thiết lập token cho mọi request axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   
    // Kiểm tra tính hợp lệ của token (tùy chọn)
    const validateToken = async () => {
      try {
        // Đây là ví dụ, bạn có thể cần điều chỉnh endpoint tùy theo API của bạn
        await axios.get('http://localhost:5026/api/auth/validate-token');
        console.log("Token hợp lệ, tiếp tục tải dữ liệu");
       
        // Token hợp lệ, tải dữ liệu
        fetchStudents(1);
        fetchNotifications();
      } catch (error) {
        console.error("Lỗi xác thực token:", error);
       
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log("Token không hợp lệ hoặc hết hạn, chuyển hướng đến trang đăng nhập");
          localStorage.removeItem('accessToken');
          navigate('/login');
        } else {
          // Nếu không phải lỗi xác thực, vẫn cố gắng tải dữ liệu
          console.log("Lỗi kiểm tra token, nhưng vẫn tiếp tục tải dữ liệu");
          fetchStudents(1);
          fetchNotifications();
        }
      }
    };
   
    // Gọi hàm xác thực token
    validateToken();
  }, [navigate]);
 
  return (
    <div className="testslist-body">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img src="images/logo.jpg" alt="Logo" className="logo-image" />
        </div>
        <div className="settings-icon">
          <FaCog className="function-icon" />
        </div>
        <div className="function-icons">
          <Link to="/hometeacher" className="icon-item active">
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
          </div>
          <div className="icon-item" onClick={handleLogout}>
            <FaSignOutAlt className="function-icon" />
            <p className="icon-description">Đăng xuất</p>
          </div>
        </div>
      </div>
 
      {/* Main Content */}
      <div className="main-content1">
        {/* Header */}
        <div className="header1">
          <h1 className="title6">4A1</h1>
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
            />
            <FaCog
              className="search-icon"
              onClick={searchStudents}
            />
            {searchQuery && (
              <FaTimes
                className="clear-search-icon"
                onClick={clearSearch}
              />
            )}
          </div>
         
        </div>
 
        {/* Thông tin tìm kiếm */}
        {isSearching && (
          <div className="search-results-info">
            Kết quả tìm kiếm cho: "{searchQuery}" ({searchResults.length} kết quả)
          </div>
        )}
 
        {/* Table */}
        {isLoading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : (
          <div className="table-container1">
            <table className="table-kho-de">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ Và Tên</th>
                  <th>Kiểm tra 15 phút</th>
                  <th>Bài tập về nhà buổi 5</th>
                  <th>Bài tập về nhà buổi 4</th>
                  <th>Bài tập về nhà buổi 3</th>
                  <th>Bài tập về nhà buổi 2</th>
                  <th>Bài tập về nhà buổi 1</th>
                </tr>
              </thead>
              <tbody>
                {isSearching ? (
                  searchResults.length > 0 ? (
                    searchResults.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.test15p || '-'}</td>
                        <td>{row.homework5 || '-'}</td>
                        <td>{row.homework4 || '-'}</td>
                        <td>{row.homework3 || '-'}</td>
                        <td>{row.homework2 || '-'}</td>
                        <td>{row.homework1 || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{textAlign: "center"}}>
                        Không tìm thấy kết quả phù hợp với từ khóa: "{searchQuery}"
                      </td>
                    </tr>
                  )
                ) : (
                  data.length > 0 ? (
                    data.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.test15p || '-'}</td>
                        <td>{row.homework5 || '-'}</td>
                        <td>{row.homework4 || '-'}</td>
                        <td>{row.homework3 || '-'}</td>
                        <td>{row.homework2 || '-'}</td>
                        <td>{row.homework1 || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{textAlign: "center"}}>Không có dữ liệu</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
       
        {/* Phân trang - chỉ hiển thị khi không tìm kiếm */}
        {!isSearching && (
          <div className="pagination-container">
            {renderPagination()}
          </div>
        )}
 
        {/* Hộp Thông Báo */}
        <div className={`notification-box ${showNotifications ? "show" : "hide"}`}>
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
                    <strong>{item.name || item.context}</strong>
                    <p>{item.message || item.time}</p>
                  </div>
                  <FaEllipsisV className="notification-options" />
                </div>
              ))
            ) : (
              <div className="no-notifications">Không có thông báo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default TestsList;
 