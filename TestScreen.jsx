import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TestScreen.css";

const questionsData = [
  {
    id: 1,
    question: "Question description go in here.",
    options: [
      "Wrong provided answer.",
      "Correct provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
    ],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "Second question description go in here.",
    options: [
      "Correct provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
    ],
    correctAnswer: 0,
  },
  {
    id: 3,
    question: "Third question description go in here.",
    options: [
      "Correct provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
    ],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: "Second question description go in here.",
    options: [
      "Correct provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
    ],
    correctAnswer: 0,
  },
  {
    id: 5,
    question: "Second question description go in here.",
    options: [
      "Correct provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
      "Wrong provided answer.",
    ],
    correctAnswer: 0,
  },
];



function TestScreen() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Xử lý đồng hồ đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Tự động nộp bài khi hết giờ
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format thời gian (phút:giây)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Chọn đáp án
  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: optionIndex,
    });
  };

  // Chuyển sang câu tiếp theo
  const handleNextQuestion = () => {
    if (currentQuestion < questionsData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Quay lại câu trước
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Mở hộp thoại xác nhận
  const handleOpenConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  // Đóng hộp thoại xác nhận
  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  // Nộp bài
  const handleSubmitTest = () => {
    const totalCorrect = questionsData.reduce((total, question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        return total + 1;
      }
      return total;
    }, 0);

    const score = ((totalCorrect / questionsData.length) * 10).toFixed(2);

    navigate("/test-result", {
      state: {
        score,
        selectedAnswers,
        questionsData,
      },
    });
  };

  return (
    <div className="test-screen-body">
      {/* Đồng hồ đếm ngược */}
      <div className="timer">
        Thời gian còn lại: <span>{formatTime(timeLeft)}</span>
      </div>

      {/* Tiêu đề */}
      <h2>Kiểm tra 15 phút lần 2</h2>

      {/* Nội dung câu hỏi */}
      <div className="question-card">
        <p>
          <strong>Câu {currentQuestion + 1}:</strong> {questionsData[currentQuestion].question}
        </p>
        {questionsData[currentQuestion].options.map((option, index) => (
          <p
            key={index}
            className={`option ${
              selectedAnswers[currentQuestion] === index ? "selected" : ""
            }`}
            onClick={() => handleAnswerSelect(index)}
          >
            {String.fromCharCode(65 + index)}. {option}
          </p>
        ))}

        {/* Nút chuyển câu */}
        <div className="navigation-buttons">
          <button onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
            Câu Trước
          </button>
          <button onClick={handleNextQuestion} disabled={currentQuestion === questionsData.length - 1}>
            Câu Sau
          </button>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="question-list">
        <ul>
          {questionsData.map((q, index) => {
            const isCompleted =
              q.question.trim() !== "" &&
              q.options.every((opt) => opt.trim() !== "");

            return (
              <li
                key={index}
                className={`${currentQuestion === index ? "selected" : ""} ${
                  isCompleted ? "completed" : ""
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                Câu {index + 1}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Nút nộp bài */}
      <button className="submit-button" onClick={handleOpenConfirmDialog}>
        Nộp Bài
      </button>

      {/* Hộp thoại xác nhận */}
      {showConfirmDialog && (
        <div className="confirm-dialog">
          <div className="confirm-dialog-content">
            <p>Bạn có chắc chắn muốn nộp bài?</p>
            <div className="confirm-dialog-buttons">
              <button onClick={handleSubmitTest} className="confirm-button">
                Có
              </button>
              <button onClick={handleCloseConfirmDialog} className="cancel-button">
                Không
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestScreen;