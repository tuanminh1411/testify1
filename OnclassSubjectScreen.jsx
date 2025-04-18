import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OnclassSubjectScreen.css";
import { FaBook, FaBell, FaHeadset, FaCog, FaSignOutAlt, FaTimes, FaEllipsisV, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const OnclassSubjectScreen = () => {
  const navigate = useNavigate();
  // State để điều khiển hiển thị thông báo
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State cho dữ liệu bảng
  const [tests, setTests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Dùng cùng pageSize với API
  const pageSize = 10;
  
  // Toggle hiển thị hộp thông báo
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
  
  // Hàm lấy dữ liệu bài kiểm tra với phân trang
  const fetchTests = async (pageNumber = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5026/api/Quiz/PageNumber?pageNumber=${pageNumber}&pageSize=${pageSize}`);
      console.log("API Quiz response:", response.data);
      
      if (response.data) {
        setTests(response.data.quizzes || []);
        const calculatedTotalPages = Math.ceil(response.data.totalCount / pageSize);
        setTotalPages(calculatedTotalPages || 1);
        setCurrentPage(response.data.pageNumber || 1);
        localStorage.setItem("tests", JSON.stringify(response.data.quizzes || []));
        localStorage.setItem("totalTests", response.data.totalCount);
        localStorage.setItem(`tests_page_${pageNumber}`, JSON.stringify(response.data.quizzes || []));
        setIsSearchActive(false);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bài kiểm tra:", error);
      const cachedTests = localStorage.getItem("tests");
      if (cachedTests) {
        setTests(JSON.parse(cachedTests));
        const totalCount = localStorage.getItem("totalTests") || 10;
        setTotalPages(Math.ceil(Number(totalCount) / pageSize));
        console.log("Đã tải dữ liệu bài kiểm tra từ localStorage");
      }
    } finally {
      setIsLoading(false);
    }
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
      const cachedNotifications = localStorage.getItem("notifications");
      if (cachedNotifications) {
        setNotifications(JSON.parse(cachedNotifications));
      }
    }
  };
  
  // Xử lý tìm kiếm trên tất cả các trang
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchTests(1);
      return;
    }
    
    setIsLoading(true);
    setIsSearchActive(true);
    
    try {
      console.log("Đang tìm kiếm bài kiểm tra:", searchTerm);
      const totalCount = localStorage.getItem("totalTests") || 0;
      const maxPages = Math.ceil(Number(totalCount) / pageSize);
      let allResults = [];
      const searchUrl = `http://localhost:5026/api/Quiz/search?title=${encodeURIComponent(searchTerm)}`;
      
      try {
        const response = await axios.get(searchUrl);
        console.log("Kết quả tìm kiếm từ API không phân trang:", response.data);
        if (response.data) {
          if (Array.isArray(response.data)) {
            allResults = response.data;
          } else if (response.data.quizzes && Array.isArray(response.data.quizzes)) {
            allResults = response.data.quizzes;
          } else if (typeof response.data === 'object' && response.data !== null) {
            allResults = [response.data];
          }
        }
      } catch (searchError) {
        console.log("API tìm kiếm không phân trang thất bại, thực hiện tìm kiếm qua từng trang");
        const searchPromises = [];
        for (let page = 1; page <= maxPages; page++) {
          searchPromises.push(
            axios.get(`http://localhost:5026/api/Quiz/PageNumber?pageNumber=${page}&pageSize=${pageSize}`)
              .then(response => {
                const quizzes = response.data.quizzes || [];
                const query = searchTerm.toLowerCase();
                return quizzes.filter(quiz => quiz.title && quiz.title.toLowerCase().includes(query));
              })
              .catch(error => {
                console.error(`Lỗi khi tìm kiếm trang ${page}:`, error);
                return [];
              })
          );
        }
        const results = await Promise.all(searchPromises);
        allResults = results.flat();
      }
      
      if (allResults.length === 0) {
        console.log("Không tìm thấy kết quả từ API, thử tìm trong localStorage");
        const cachedTests = localStorage.getItem("tests");
        if (cachedTests) {
          let allCachedTests = [];
          for (let page = 1; page <= maxPages; page++) {
            try {
              const pageData = localStorage.getItem(`tests_page_${page}`);
              if (pageData) {
                const parsedData = JSON.parse(pageData);
                allCachedTests = [...allCachedTests, ...parsedData];
              }
            } catch (error) {
              console.error(`Lỗi khi đọc dữ liệu trang ${page} từ localStorage:`, error);
            }
          }
          if (allCachedTests.length === 0) {
            allCachedTests = JSON.parse(cachedTests);
          }
          const query = searchTerm.toLowerCase();
          allResults = allCachedTests.filter(test => test.title && test.title.toLowerCase().includes(query));
        }
      }
      
      console.log("Tổng số kết quả tìm kiếm:", allResults.length);
      setTests(allResults);
      setTotalPages(1);
      setCurrentPage(1);
      
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bài kiểm tra:", error);
      setTests([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Xử lý xóa tìm kiếm
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchTests(1);
    setIsSearchActive(false);
  };
  
  // Hàm format ngày tháng dạng dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // Xử lý khi người dùng thay đổi trang
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    if (!isSearchActive) {
      fetchTests(pageNumber);
    }
  };
  
  // Khi người dùng nhấp vào tiêu đề bài kiểm tra -> chuyển hướng đến Teststart
  const handleTestClick = (testId) => {
    const selectedTest = tests.find(test => test.id === testId);
    if (selectedTest) {
      localStorage.setItem('selectedTest', JSON.stringify(selectedTest));
    }
    navigate(`/teststart/${testId}`);
  };
  
  // Hiển thị phân trang với dấu ba chấm
  const renderPagination = () => {
    const safeTotal = Math.max(1, totalPages || 1);
    if (safeTotal <= 1) {
      return null;
    }
    const items = [];
    items.push(
      <button
        key={1}
        className={`page-btn ${currentPage === 1 ? "active" : ""}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );
    if (currentPage > 4) {
      items.push(<span key="ellipsis-1" className="dots">...</span>);
    }
    for (let i = Math.max(2, currentPage - 2); i <= Math.min(safeTotal - 1, currentPage + 2); i++) {
      if (i === 1 || i === safeTotal) continue;
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
    if (currentPage < safeTotal - 3) {
      items.push(<span key="ellipsis-2" className="dots">...</span>);
    }
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
  
  // Xử lý nhấn Enter trong ô tìm kiếm
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchTests(1);
      fetchNotifications();
    }
  }, [navigate]);
  
  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };
  
  return (
    <div className="testslist-body">
      <div className="sidebar">
        <div className="logo">
          <img src="images/logo.jpg" alt="Logo" className="logo-image" />
        </div>
        <div className="settings-icon">
          <FaCog className="function-icon" />
        </div>
        <div className="function-icons">
          <Link to="/homestudent" className="icon-item">
            <FaBook className="function-icon" />
            <p className="icon-description">Môn học</p>
          </Link>
          <Link to="/supportstudent" className="icon-item">
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

      <div className="main-contentteacher">
        <div className="headerteacher">
          <h1 className="title5">Kho Đề</h1>
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <FaCog className="search-icon" onClick={handleSearch} />
            {searchTerm && (
              <FaTimes className="clear-search-icon" onClick={handleClearSearch} />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Đang tải dữ liệu</div>
        ) : (
          <div className="table-containerteacher">
            <table className="table-kho-de">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tiêu đề</th>
                  <th>Mô tả</th>
                  <th>Thời gian làm</th>
                  <th>Hạn nộp</th>
                  <th>Điểm số</th>
                </tr>
              </thead>
              <tbody>
                {tests.length > 0 ? (
                  tests.map((test, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="test-title-cell" onClick={() => handleTestClick(test.id)}>
                        {test.title || 'N/A'}
                      </td>
                      <td>{test.description || 'N/A'}</td>
                      <td>{test.duration ? `${test.duration} phút` : 'N/A'}</td>
                      <td>{formatDate(test.deadline)}</td>
                      <td>{test.score !== undefined ? test.score : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      {isSearchActive
                        ? "Không tìm thấy bài kiểm tra nào."
                        : "Không có bài kiểm tra nào."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {!isSearchActive && tests.length > 0 && renderPagination()}

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

export default OnclassSubjectScreen;