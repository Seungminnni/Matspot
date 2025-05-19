import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// axios 기본 설정 제거 - 문제 해결을 위해 단순화
// axios.defaults.withCredentials = true;

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, nickname } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!name) newErrors.name = '이름을 입력해주세요';
    if (!email) newErrors.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '유효한 이메일을 입력해주세요';
    
    if (!password) newErrors.password = '비밀번호를 입력해주세요';
    else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    
    if (password !== confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    
    if (!nickname) newErrors.nickname = '닉네임을 입력해주세요';
    
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // 이전 메시지 초기화
    setSuccessMsg('');
    setErrors({});
    
    // 폼 검증
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('회원가입 요청 데이터:', { name, email, password: '***', nickname });
      
      // 가장 기본적인 axios 요청 형태로 단순화
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        nickname
      });
      
      console.log('회원가입 응답:', response.data);
      
      if (response.data.success) {
        // 토큰 저장
        localStorage.setItem('token', response.data.token);
        
        // 성공 메시지 설정
        setSuccessMsg('회원가입에 성공했습니다! 3초 후 메인 페이지로 이동합니다.');
        
        // 3초 후 리다이렉트
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        throw new Error(response.data.message || '회원가입 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (error.response) {
        // 서버 응답이 있는 경우
        console.log('서버 응답 오류:', error.response);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // 요청은 보냈으나 응답이 없는 경우
        console.log('서버 응답 없음. 서버가 실행 중인지 확인하세요.');
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.';
      } else {
        // 요청 생성 중 오류 발생
        console.log('요청 생성 오류:', error.message);
      }
      
      setErrors({
        form: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>회원가입</h2>
        
        {errors.form && <div className="alert alert-danger">{errors.form}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              name="name"
              id="name"
              value={name}
              onChange={onChange}
              placeholder="이름을 입력해주세요"
            />
            {errors.name && <small className="error-text">{errors.name}</small>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={onChange}
              placeholder="이메일을 입력해주세요"
            />
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>
          
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              name="nickname"
              id="nickname"
              value={nickname}
              onChange={onChange}
              placeholder="닉네임을 입력해주세요"
            />
            {errors.nickname && <small className="error-text">{errors.nickname}</small>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={onChange}
              placeholder="비밀번호를 입력해주세요"
            />
            {errors.password && <small className="error-text">{errors.password}</small>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              placeholder="비밀번호를 다시 입력해주세요"
            />
            {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '처리 중...' : '가입하기'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
        
        <div className="social-login">
          <p>또는</p>
          <a href="http://localhost:5000/api/auth/kakao" className="kakao-login-button">
            카카오 계정으로 시작하기
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register; 