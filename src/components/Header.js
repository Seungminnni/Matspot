import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';

const Header = () => {
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const { user, clearAuthState } = useAuth();
    const isLoggedIn = !!user;
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        clearAuthState();
        setShowAccountMenu(false);
        navigate('/');
    };

    const handleMyPageClick = () => {
        navigate('/mypage');
        setShowAccountMenu(false);
    };

    const handleAuthClick = (type) => {
        navigate('/auth', { state: { isLogin: type === 'login' } });
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
                    >                        {isLoggedIn ? user.username : '로그인'}
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