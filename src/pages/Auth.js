import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Auth.css';
import { loginUser, registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { updateAuthState } = useAuth();
    const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        passwordConfirm: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // location.state가 변경될 때 로그인/회원가입 모드 업데이트
        setIsLogin(location.state?.isLogin ?? true);
    }, [location.state]);    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (isLogin) {
                // 로그인 처리
                const loginData = {
                    email: formData.email,
                    password: formData.password
                };
                
                const response = await loginUser(loginData);
                updateAuthState(response.user);
                navigate('/');
            } else {
                // 회원가입 처리
                if (formData.password !== formData.passwordConfirm) {
                    setError('비밀번호가 일치하지 않습니다.');
                    setLoading(false);
                    return;
                }
                
                const registerData = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                };
                
                await registerUser(registerData);
                // 회원가입 성공 후 로그인 화면으로 전환
                setIsLogin(true);
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    passwordConfirm: ''
                }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSocialLogin = (provider) => {
        console.log(`${provider} 로그인 시도`);
        // 실제 구현시에는 각 소셜 로그인 처리
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">                            <label>이름</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="이름을 입력하세요"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>이메일</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="이메일을 입력하세요"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div className="form-group">
                            <label>비밀번호 확인</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                placeholder="비밀번호를 다시 입력하세요"
                                required
                            />
                        </div>
                    )}                    {error && <div className="error-message">{error}</div>}
                    
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
                    </button>
                </form>
                <div className="auth-footer">
                    {isLogin ? (
                        <>
                            <p>아직 계정이 없으신가요?</p>
                            <button 
                                className="switch-button"
                                onClick={() => setIsLogin(false)}
                            >
                                회원가입하기
                            </button>
                        </>
                    ) : (
                        <>
                            <p>이미 계정이 있으신가요?</p>
                            <button 
                                className="switch-button"
                                onClick={() => setIsLogin(true)}
                            >
                                로그인하기
                            </button>
                        </>
                    )}
                </div>
                {isLogin && (
                    <div className="social-login">
                        <p>소셜 계정으로 로그인</p>
                        <div className="social-buttons">
                            <button 
                                className="social-button kakao"
                                onClick={() => handleSocialLogin('kakao')}
                            >
                                <i className="fas fa-comment"></i> 카카오
                            </button>
                            <button 
                                className="social-button naver"
                                onClick={() => handleSocialLogin('naver')}
                            >
                                <i className="fas fa-n"></i> 네이버
                            </button>
                            <button 
                                className="social-button google"
                                onClick={() => handleSocialLogin('google')}
                            >
                                <i className="fab fa-google"></i> 구글
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth; 