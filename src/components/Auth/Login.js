import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// axios 기본 설정
axios.defaults.withCredentials = true;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!email) newErrors.email = '이메일을 입력해주세요';
    if (!password) newErrors.password = '비밀번호를 입력해주세요';
    
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 검증
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', 
        {
          email,
          password
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );
      
      console.log('로그인 응답:', response.data);
      
      // 토큰 저장
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // 로그인 성공 후 리다이렉트
        navigate('/');
      } else {
        throw new Error('토큰이 없습니다');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrors({
        form: error.response?.data?.message || '로그인 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/kakao', {
        withCredentials: true
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      setErrors({
        form: '카카오 로그인 연결 중 오류가 발생했습니다.'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>로그인</h2>
        
        {errors.form && <div className="alert alert-danger">{errors.form}</div>}
        
        <form onSubmit={onSubmit}>
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
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </p>
        </div>
        
        <div className="social-login">
          <p>또는</p>
          <button onClick={handleKakaoLogin} className="kakao-login-button">
            카카오 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 