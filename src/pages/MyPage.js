import React, { useState } from 'react';
import '../styles/MyPage.css';

const MyPage = () => {
    const [activeSection, setActiveSection] = useState('profile');
    
    // 임시 사용자 데이터
    const userData = {
        name: '김맛집',
        email: 'foodie@example.com',
        profileImage: 'https://via.placeholder.com/150',
        joinDate: '2024-01-01',
        reviews: [
            {
                id: 1,
                restaurant: '맛있는 파스타',
                rating: 4.5,
                content: '파스타가 정말 맛있었어요!',
                date: '2024-03-15'
            }
        ],
        routes: [
            {
                id: 1,
                name: '강남 맛집 투어',
                places: ['스시바', '파스타집', '디저트카페'],
                created: '2024-03-10'
            }
        ],
        recentlyViewed: [
            {
                id: 1,
                name: '스시 오마카세',
                location: '서울시 강남구',
                lastViewed: '2024-03-19'
            }
        ]
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="profile-section">
                        <div className="profile-header">
                            <div className="profile-image">
                                <img src={userData.profileImage} alt="프로필" />
                                <button className="edit-image-btn">
                                    <i className="fas fa-camera"></i>
                                </button>
                            </div>
                            <div className="profile-info">
                                <h2>{userData.name}</h2>
                                <p>{userData.email}</p>
                                <p>가입일: {userData.joinDate}</p>
                            </div>
                        </div>
                        <div className="profile-edit">
                            <h3>프로필 수정</h3>
                            <form className="profile-form">
                                <div className="form-group">
                                    <label>이름</label>
                                    <input type="text" defaultValue={userData.name} />
                                </div>
                                <div className="form-group">
                                    <label>이메일</label>
                                    <input type="email" defaultValue={userData.email} />
                                </div>
                                <button type="submit" className="save-button">저장하기</button>
                            </form>
                        </div>
                    </div>
                );
            
            case 'reviews':
                return (
                    <div className="reviews-section">
                        <h3>내가 작성한 리뷰</h3>
                        <div className="reviews-grid">
                            {userData.reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <h4>{review.restaurant}</h4>
                                        <div className="rating">
                                            {[...Array(5)].map((_, i) => (
                                                <i 
                                                    key={i} 
                                                    className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}
                                                ></i>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="review-content">{review.content}</p>
                                    <span className="review-date">{review.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'routes':
                return (
                    <div className="routes-section">
                        <h3>내가 만든 맛집 루트</h3>
                        <div className="routes-grid">
                            {userData.routes.map(route => (
                                <div key={route.id} className="route-card">
                                    <h4>{route.name}</h4>
                                    <div className="route-places">
                                        {route.places.map((place, index) => (
                                            <span key={index} className="place-tag">
                                                {place}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="route-date">생성일: {route.created}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'recent':
                return (
                    <div className="recent-section">
                        <h3>최근 본 매장</h3>
                        <div className="recent-grid">
                            {userData.recentlyViewed.map(place => (
                                <div key={place.id} className="recent-card">
                                    <h4>{place.name}</h4>
                                    <p>{place.location}</p>
                                    <span className="view-date">
                                        마지막 방문: {place.lastViewed}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'notice':
                return (
                    <div className="notice-section">
                        <h3>공지사항</h3>
                        <div className="notice-list">
                            <div className="notice-item">
                                <h4>서비스 업데이트 안내</h4>
                                <p>새로운 기능이 추가되었습니다.</p>
                                <span className="notice-date">2024-03-20</span>
                            </div>
                        </div>
                    </div>
                );
            
            case 'terms':
                return (
                    <div className="terms-section">
                        <h3>약관 및 정책</h3>
                        <div className="terms-list">
                            <div className="terms-item">
                                <h4>서비스 이용약관</h4>
                                <button className="view-terms-btn">자세히 보기</button>
                            </div>
                            <div className="terms-item">
                                <h4>개인정보 처리방침</h4>
                                <button className="view-terms-btn">자세히 보기</button>
                            </div>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="mypage-container">
            <div className="mypage-sidebar">
                <h2>마이페이지</h2>
                <nav className="mypage-nav">
                    <button 
                        className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveSection('profile')}
                    >
                        <i className="fas fa-user"></i>
                        프로필 정보
                    </button>
                    <button 
                        className={`nav-item ${activeSection === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveSection('reviews')}
                    >
                        <i className="fas fa-star"></i>
                        내 리뷰
                    </button>
                    <button 
                        className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`}
                        onClick={() => setActiveSection('routes')}
                    >
                        <i className="fas fa-route"></i>
                        루트 보기
                    </button>
                    <button 
                        className={`nav-item ${activeSection === 'recent' ? 'active' : ''}`}
                        onClick={() => setActiveSection('recent')}
                    >
                        <i className="fas fa-history"></i>
                        최근 본 매장
                    </button>
                    <button 
                        className={`nav-item ${activeSection === 'notice' ? 'active' : ''}`}
                        onClick={() => setActiveSection('notice')}
                    >
                        <i className="fas fa-bell"></i>
                        공지사항
                    </button>
                    <button 
                        className={`nav-item ${activeSection === 'terms' ? 'active' : ''}`}
                        onClick={() => setActiveSection('terms')}
                    >
                        <i className="fas fa-file-alt"></i>
                        약관 및 정책
                    </button>
                </nav>
            </div>
            <div className="mypage-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default MyPage; 