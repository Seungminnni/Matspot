import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyPage.css';
import { useAuth } from '../context/AuthContext';
import RouteMapViewer from '../components/RouteMapViewer';

const MyPage = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);    const [selectedRoute, setSelectedRoute] = useState(null); // 선택된 루트
    const routeMapRef = useRef(null); // 루트 지도 참조
    
    // 인증되지 않은 사용자는 로그인 페이지로 리디렉션
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth', { state: { isLogin: true } });
        }
    }, [user, loading, navigate]);

    // 저장된 루트 가져오기
    const fetchSavedRoutes = async () => {
        if (!user) return;
        
        setIsLoadingRoutes(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5001/api/restaurants/my-routes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                setSavedRoutes(data.routes);
            } else {
                console.error('루트 가져오기 실패:', data.error);
            }
        } catch (error) {
            console.error('루트 가져오기 오류:', error);
        } finally {
            setIsLoadingRoutes(false);
        }
    };    // 루트 삭제 함수
    const handleDeleteRoute = async (routeId) => {
        if (!window.confirm('이 루트를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/restaurants/routes/${routeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                alert('루트가 삭제되었습니다.');                // 선택된 루트가 삭제된 경우 선택 해제
                if (selectedRoute && selectedRoute.id === routeId) {
                    setSelectedRoute(null);
                    if (routeMapRef.current) {
                        routeMapRef.current.clearRoute();
                    }
                }
                fetchSavedRoutes(); // 목록 새로고침
            } else {
                alert(`루트 삭제 실패: ${data.error}`);
            }
        } catch (error) {
            console.error('루트 삭제 오류:', error);
            alert('루트 삭제 중 오류가 발생했습니다.');
        }
    };    // 루트 선택 및 지도에 표시
    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
        if (routeMapRef.current) {
            routeMapRef.current.displayRoute(route);
        }
    };

    // 루트 선택 해제
    const handleClearRoute = () => {
        setSelectedRoute(null);
        if (routeMapRef.current) {
            routeMapRef.current.clearRoute();
        }
    };

    // 컴포넌트 마운트 시 루트 데이터 가져오기
    useEffect(() => {
        if (user && activeSection === 'routes') {
            fetchSavedRoutes();
        }
    }, [user, activeSection]);
    
    // 로딩 중일 때 표시
    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }
    
    // 인증되지 않은 사용자가 보이지 않아야 하므로 null 반환
    if (!user) {
        return null;
    }
    
    // 임시 사용자 데이터 (실제로는 API에서 가져온 정보를 사용)
    const userData = {
        name: user?.username || '사용자',
        email: user?.email || 'user@example.com',
        profileImage: null, // 기본 아바타 사용
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
                                <div className="default-avatar">
                                    <i className="fas fa-user"></i>
                                </div>
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
                );              case 'routes':
                return (
                    <div className="routes-section">
                        <h3>내가 만든 맛집 루트</h3>
                        {isLoadingRoutes ? (
                            <div className="loading">루트 정보를 불러오는 중...</div>
                        ) : savedRoutes.length > 0 ? (
                            <div className="routes-container">
                                <div className="routes-list">
                                    <div className="routes-list-header">
                                        <h4>저장된 루트 목록</h4>
                                        <span className="routes-count">{savedRoutes.length}개의 루트</span>
                                    </div>
                                    <div className="routes-grid">
                                        {savedRoutes.map(route => (
                                            <div 
                                                key={route.id} 
                                                className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                                                onClick={() => handleSelectRoute(route)}
                                            >
                                                <div className="route-header">
                                                    <h4>{route.route_name}</h4>
                                                    <button 
                                                        className="delete-route-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // 카드 클릭 이벤트 방지
                                                            handleDeleteRoute(route.id);
                                                        }}
                                                        title="루트 삭제"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <div className="route-places">
                                                    <div className="route-place">
                                                        <span className="place-label">출발:</span>
                                                        <span className="place-name">{route.search_center_name}</span>
                                                    </div>
                                                    <div className="route-place">
                                                        <span className="place-label">1번째:</span>
                                                        <span className="place-name">{route.place1_name}</span>
                                                        <span className="place-address">{route.place1_address}</span>
                                                    </div>
                                                    <div className="route-place">
                                                        <span className="place-label">2번째:</span>
                                                        <span className="place-name">{route.place2_name}</span>
                                                        <span className="place-address">{route.place2_address}</span>
                                                    </div>
                                                </div>
                                                <div className="route-summary">
                                                    <div className="route-stat">
                                                        <span>📍 총 거리: {route.total_distance_km}km</span>
                                                    </div>
                                                    <div className="route-stat">
                                                        <span>⏱️ 총 시간: {route.total_duration_min}분</span>
                                                    </div>
                                                    {route.total_toll > 0 && (
                                                        <div className="route-stat">
                                                            <span>💳 톨게이트: {route.total_toll.toLocaleString()}원</span>
                                                        </div>
                                                    )}                                                </div>
                                                <span className="route-date">생성일: {route.created_date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>                                <div className="routes-map-container">
                                    <RouteMapViewer
                                        ref={routeMapRef}
                                        selectedRoute={selectedRoute}
                                        onClearRoute={handleClearRoute}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="no-routes">
                                <p>저장된 루트가 없습니다.</p>
                                <p>루트 생성 페이지에서 새로운 루트를 만들어보세요!</p>
                                <button 
                                    className="create-route-btn"
                                    onClick={() => navigate('/route-creation')}
                                >
                                    루트 만들러 가기
                                </button>
                            </div>
                        )}
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