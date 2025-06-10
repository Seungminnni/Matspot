import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onComplete, 1000); // 페이드 아웃 애니메이션 후 완료
        }, 2000); // 2초 후 페이드아웃 시작

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div className="logo">🍽️</div>
                <h1 className="title">맛스팟</h1>
            </div>
        </div>
    );
};

export default SplashScreen; 