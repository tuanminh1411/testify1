import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OnclassSubjectScreen.css";
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

const OnclassSubjectScreen = () => {
  const navigate = useNavigate();

  // State điều khiển hiển thị thông báo
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State cho dữ liệu bảng
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // State cho tên lớp và môn
  const [className, setClassName] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // Toggle thông báo
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  // Hàm lấy quiz theo classId & subjectId
  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const classId = localStorage.getItem("classId");
      const subjectId = localStorage.getItem("SubjectId");
      if (!classId || !subjectId) {
        console.error("Thiếu classId hoặc subjectId trong localStorage");
        setTests([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:5026/api/Quiz/${classId}/${subjectId}`
      );
      console.log("API Quiz theo Lớp-Môn:", response.data);

      // Nếu backend trả về mảng, dùng luôn, nếu trả về object có quizzes thì dùng quizzes
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.quizzes || [];
      setTests(data);

      // Xoá trạng thái search nếu có
      setIsSearchActive(false);
    } catch (error) {
      console.error("Lỗi khi lấy quiz theo classId-subjectId:", error);
      // fallback: lấy từ localStorage
      const cached = localStorage.getItem("tests");
      if (cached) setTests(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy thông báo (giữ nguyên)
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("http://localhost:5026/api/Notification");
      setNotifications(response.data);
      localStorage.setItem("notifications", JSON.stringify(response.data));
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      const cached = localStorage.getItem("notifications");
      if (cached) setNotifications(JSON.parse(cached));
    }
  };

  // Tìm kiếm (giữ nguyên logic, chỉ đổi gọi fetchTests())
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchTests();
      return;
    }
    setIsLoading(true);
    setIsSearchActive(true);
    try {
      console.log("Đang tìm kiếm bài kiểm tra:", searchTerm);
      //const totalCount = localStorage.getItem("totalTests") || 0;
      //const maxPages = Math.ceil(Number(totalCount) / pageSize);
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
        // for (let page = 1; page <= maxPages; page++) {
        //   searchPromises.push(
        //     axios.get(`http://localhost:5026/api/Quiz/PageNumber?pageNumber=${page}&pageSize=${pageSize}`)
        //       .then(response => {
        //         const quizzes = response.data.quizzes || [];
        //         const query = searchTerm.toLowerCase();
        //         return quizzes.filter(quiz => quiz.title && quiz.title.toLowerCase().includes(query));
        //       })
        //       .catch(error => {
        //         console.error(`Lỗi khi tìm kiếm trang ${page}:`, error);
        //         return [];
        //       })
        //   );
        // }
        const results = await Promise.all(searchPromises);
        allResults = results.flat();
      }
     
      if (allResults.length === 0) {
        console.log("Không tìm thấy kết quả từ API, thử tìm trong localStorage");
        const cachedTests = localStorage.getItem("tests");
        if (cachedTests) {
          let allCachedTests = [];
          // for (let page = 1; page <= maxPages; page++) {
          //   try {
          //     const pageData = localStorage.getItem(`tests_page_${page}`);
          //     if (pageData) {
          //       const parsedData = JSON.parse(pageData);
          //       allCachedTests = [...allCachedTests, ...parsedData];
          //     }
          //   } catch (error) {
          //     console.error(`Lỗi khi đọc dữ liệu trang ${page} từ localStorage:`, error);
          //   }
          // }
          if (allCachedTests.length === 0) {
            allCachedTests = JSON.parse(cachedTests);
          }
          const query = searchTerm.toLowerCase();
          allResults = allCachedTests.filter(test => test.title && test.title.toLowerCase().includes(query));
        }
      }
     
      console.log("Tổng số kết quả tìm kiếm:", allResults.length);
      setTests(allResults);
      //setTotalPages(1);
      //setCurrentPage(1);
     
    } catch (error) {
      console.error("Lỗi khi tìm kiếm bài kiểm tra:", error);
      setTests([]);
      //setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchTests();
    setIsSearchActive(false);
  };

  const formatDate = DateTime => {
    if (!DateTime) return "N/A";
    try {
      const date = new Date(DateTime);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return DateTime;
    }
  };

  const isTestActive = dueDate => {
    if (!dueDate) return false;
    const testDue = new Date(dueDate);
    const now = new Date();
    testDue.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);
    return testDue >= now;
  };

  const handleTestClick = testId => {
    const sel = tests.find(t => t.id === testId);
    if (sel) localStorage.setItem("selectedTest", JSON.stringify(sel));
    navigate(`/teststart/${testId}`);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Lấy tên lớp & môn để hiển thị
    const savedClassName = localStorage.getItem("className");
    const savedSubjectName = localStorage.getItem("selectedSubjectName");
    if (savedClassName) setClassName(savedClassName);
    if (savedSubjectName) setSubjectName(savedSubjectName);

    fetchTests();
    fetchNotifications();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
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
          <h1 className="title5">
            {className} - Kho đề {subjectName}
          </h1>
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm bài kiểm tra..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSearch()}
            />
            <FaCog className="search-icon" onClick={handleSearch} />
            {searchTerm && (
              <FaTimes
                className="clear-search-icon"
                onClick={handleClearSearch}
              />
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
                  <th>Tình trạng</th>
                  <th>Tiêu đề</th>
                  <th>Ngày hết hạn</th>
                  <th>Thời gian làm bài</th>
                  <th>Số câu</th>
                  <th>Điểm số</th>
                </tr>
              </thead>
              <tbody>
                {tests.length > 0 ? (
                  tests.map((test, idx) => {
                    const active = isTestActive(test.dueDate);
                    return (
                      <tr
                        key={test.id}
                        onClick={() => handleTestClick(test.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{idx + 1}</td>
                        <td
                          style={{
                            color: active ? "#41D052" : "#8E0505",
                            fontWeight: "bold"
                          }}
                        >
                          {active ? "Còn hạn" : "Hết hạn"}
                        </td>
                        <td>{test.title}</td>
                        <td>{formatDate(test.dueDate)}</td>
                        <td>{test.timeLimit || test.duration || 0} phút</td>
                        <td>
                          {test.questionCount || test.questions?.length || 0}
                        </td>
                        <td>{test.maxScore || 10}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Không có bài kiểm tra
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showNotifications && (
          <div className="notification-box show">
            <div className="notification-header">
              <span>Thông Báo</span>
              <FaTimes className="close-btn" onClick={toggleNotifications} />
            </div>
            <div className="notification-content">
              {notifications.length > 0 ? (
                notifications.map((item, i) => (
                  <div className="notification-item" key={i}>
                    <div className="notification-text">
                      <strong>{item.title || item.name || "Thông báo"}</strong>
                      <p>{item.message || item.content || ""}</p>
                      <small>
                        {item.time || formatDate(item.createdAt) || ""}
                      </small>
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
    </div>
  );
};

export default OnclassSubjectScreen;
