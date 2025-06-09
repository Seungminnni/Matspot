import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    const location = useLocation();

    return (
        <footer className="footer">
            <Link to="/" className={`footer-item ${location.pathname === '/' ? 'active' : ''}`}>
                <i className="fas fa-home"></i>
                <span>홈</span>
            </Link>
            <Link to="/nearby" className={`footer-item ${location.pathname === '/nearby' ? 'active' : ''}`}>
                <i className="fas fa-map-marker-alt"></i>
                <span>내주변</span>
            </Link>
            <Link to="/social" className="footer-item">
                <i className="fas fa-users"></i>
                <span>소셜</span>
            </Link>
            <Link to="/mypage" className="footer-item">
                <i className="fas fa-user"></i>
                <span>마이페이지</span>
            </Link>
        </footer>
    );
};

export default Footer; 