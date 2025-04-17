import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuiz } from "../../QuizContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AddNewTest2.css";

function AddNewTest2() {
  const { quizData, setQuizData } = useQuiz();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Load dữ liệu quiz từ location.state hoặc localStorage và tạo mảng câu hỏi nếu chưa có
  useEffect(() => {
    let data = null;
    if (location.state && location.state.totalQuestions) {
      data = location.state;
    } else {
      const savedQuizData = localStorage.getItem("quizData");
      if (savedQuizData) {
        data = JSON.parse(savedQuizData);
      }
    }
    if (data) {
      const total = Number(data.totalQuestions) || 0;
      if (!data.questions || data.questions.length < total) {
        let existingQuestions = data.questions || [];
        const missingCount = total - existingQuestions.length;
        const additionalQuestions = Array.from({ length: missingCount }, () => ({
          question: "",
          options: ["", "", "", ""],
          correctIndex: null,
        }));
        data.questions = existingQuestions.concat(additionalQuestions);
      }
      setQuizData(data);
    }
  }, [location, setQuizData]);

  // Lưu quizData vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (quizData) {
      localStorage.setItem("quizData", JSON.stringify(quizData));
    }
  }, [quizData]);

  // Cập nhật nội dung câu hỏi
  const updateQuestionText = (value) => {
    if (!quizData || !quizData.questions) return;
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[currentQuestion] = {
      ...updatedQuestions[currentQuestion],
      question: value,
    };
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  // Cập nhật nội dung đáp án
  const updateOption = (indexOption, value) => {
    if (!quizData || !quizData.questions) return;
    const updatedQuestions = [...quizData.questions];
    const updatedOptions = [...updatedQuestions[currentQuestion].options];
    updatedOptions[indexOption] = value;
    updatedQuestions[currentQuestion] = {
      ...updatedQuestions[currentQuestion],
      options: updatedOptions,
    };
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  // Cập nhật đáp án đúng cho câu hỏi hiện tại
  const updateCorrectIndex = (index) => {
    if (!quizData || !quizData.questions) return;
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[currentQuestion] = {
      ...updatedQuestions[currentQuestion],
      correctIndex: index,
    };
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  // Khi nhấn Hoàn Tất: tổng hợp lại dữ liệu quiz và gửi API lưu dữ liệu
  const handleFinish = async () => {
    const quizToSave = {
      subjectID: selectedSubject.value,
      title: quizData.title,
      description: quizData.description,
      duration: quizData.duration,
      deadline: quizData.deadline,
      questions: quizData.questions,
    };

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post("http://localhost:5026/api/Quiz/create", quizToSave, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Lưu dữ liệu thành công!");
      navigate("/onclass-viewtest");
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
      toast.error("Lỗi: không lưu được dữ liệu, vui lòng thử lại!");
      // Không chuyển trang nếu lưu không thành công
    }
  };

  if (!quizData || !quizData.questions) {
    return <div>Loading...</div>;
  }

  return (
    <div className="test2-container">
      <div className="timer">Thời gian làm bài: {quizData.duration}:00</div>

      <div className="question-list">
        <ul>
          {quizData.questions.map((q, index) => {
            // Kiểm tra câu hỏi đã nhập đủ nội dung, đáp án và chọn đáp án đúng chưa
            const isCompleted =
              q.question.trim() !== "" &&
              q.options.every((opt) => opt.trim() !== "") &&
              q.correctIndex !== null;
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

      <div className="question-container">
        <h2>Câu {currentQuestion + 1}</h2>
        <div className="question-label">Câu Hỏi:</div>
        <input
          type="text"
          className="question-text"
          placeholder="Nhập nội dung câu hỏi..."
          value={quizData.questions[currentQuestion]?.question}
          onChange={(e) => updateQuestionText(e.target.value)}
        />

        <div className="options">
          {quizData.questions[currentQuestion]?.options.map((option, idx) => (
            <div className="option" key={idx}>
              {/* Ẩn radio button và hiển thị chữ cái làm nút chọn */}
              <input
                id={`option-${currentQuestion}-${idx}`}
                type="radio"
                name={`correctOption-${currentQuestion}`}
                checked={quizData.questions[currentQuestion].correctIndex === idx}
                onChange={() => updateCorrectIndex(idx)}
              />
              <label
                htmlFor={`option-${currentQuestion}-${idx}`}
                className="option-letter"
              >
                {String.fromCharCode(65 + idx)}
              </label>
              <input
                type="text"
                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                value={option}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="option-input"
              />
            </div>
          ))}
        </div>

        <div className="nav-buttons">
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            Câu Trước
          </button>
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={currentQuestion === quizData.questions.length - 1}
          >
            Câu Sau
          </button>
        </div>
      </div>

      <button className="finish-button" onClick={handleFinish}>
        Hoàn Tất
      </button>
      <ToastContainer />
    </div>
  );
}

export default AddNewTest2;