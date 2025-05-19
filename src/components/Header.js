import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Header.css';

const Header = () => {
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // 컴포넌트 마운트 시 로그인 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData(token);
        }
    }, []);

    // 사용자 정보 가져오기
    const fetchUserData = async (token) => {
        try {
            const response = await axios.get('http://localhost:5000/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setUser(response.data.data);
                setIsLoggedIn(true);
            }
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error);
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost:5000/api/auth/logout');
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            setUser(null);
            setShowAccountMenu(false);
            navigate('/');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    const handleMyPageClick = () => {
        navigate('/mypage');
        setShowAccountMenu(false);
    };

    const handleAuthClick = (type) => {
        if (type === 'login') {
            navigate('/login');
        } else {
            navigate('/register');
        }
        setShowAccountMenu(false);
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo-container">
                    <Link to="/" className="logo">맛스팟</Link>
                </div>
                <div className="account-container">
                    <button 
                        className="account-button"
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                    >
                        {isLoggedIn ? (user?.nickname || '사용자') : '로그인'}
                    </button>
                    {showAccountMenu && (
                        <div className="account-menu">
                            {isLoggedIn ? (
                                <>
                                    <button className="menu-item" onClick={handleMyPageClick}>
                                        <i className="fas fa-user"></i>
                                        마이페이지
                                    </button>
                                    <button className="menu-item" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt"></i>
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="menu-item" onClick={() => handleAuthClick('login')}>
                                        <i className="fas fa-sign-in-alt"></i>
                                        로그인
                                    </button>
                                    <button className="menu-item" onClick={() => handleAuthClick('signup')}>
                                        <i className="fas fa-user-plus"></i>
                                        회원가입
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header; 