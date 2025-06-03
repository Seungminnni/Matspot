import React, { useState, useRef, useEffect } from 'react';
import KakaoMap from '../components/KakaoMap';
import '../styles/Nearby.css';

const Nearby = () => {
    const [snsRestaurants, setSnsRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [matchStats, setMatchStats] = useState(null);
    const [showSnsMode, setShowSnsMode] = useState(false);
    const [currentMapResults, setCurrentMapResults] = useState([]);
    const [error, setError] = useState('');
    
    const kakaoMapRef = useRef(null);

    // 카카오맵에서 현재 검색 결과 가져오기
    const getCurrentMapResults = () => {
        if (window.kakaoMapInstance && window.kakaoMapInstance.getPlaces) {
            const places = window.kakaoMapInstance.getPlaces();
            console.log('지도에서 가져온 장소들:', places);
            return places;
        }
        
        // 대안: markersRef에서 마커 정보 가져오기
        if (window.kakaoMapInstance && window.kakaoMapInstance.markersRef) {
            const markers = window.kakaoMapInstance.markersRef.current || [];
            return markers.map(marker => marker.placeInfo || {});
        }
        
        return [];
    };

    // SNS 맛집 매칭 검색
    const handleSnsSearch = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            // 현재 지도의 검색 결과 가져오기
            const mapResults = getCurrentMapResults();
            
            if (!mapResults || mapResults.length === 0) {
                setError('먼저 지도에서 맛집을 검색해주세요! 검색창에 키워드를 입력하거나 지도를 클릭해보세요.');
                setIsLoading(false);
                return;
            }

            setCurrentMapResults(mapResults);

            // 현재 지도 중심점과 범위 정보
            const mapCenter = window.kakaoMapInstance?.getCenter();
            const mapBounds = window.kakaoMapInstance?.getBounds();

            console.log('매칭 요청 데이터:', {
                맛집수: mapResults.length,
                중심점: mapCenter?.toString(),
                첫번째맛집: mapResults[0]?.place_name
            });

            const response = await fetch('/api/restaurants/smart-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapRestaurants: mapResults,
                    searchArea: {
                        center: {
                            lat: mapCenter?.getLat(),
                            lng: mapCenter?.getLng()
                        },
                        bounds: mapBounds ? {
                            sw: {
                                lat: mapBounds.getSouthWest()?.getLat(),
                                lng: mapBounds.getSouthWest()?.getLng()
                            },
                            ne: {
                                lat: mapBounds.getNorthEast()?.getLat(),
                                lng: mapBounds.getNorthEast()?.getLng()
                            }
                        } : null
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setSnsRestaurants(data.matched);
                setMatchStats(data.stats);
                setShowSnsMode(true);
                
                // 성공 메시지
                if (data.matched.length > 0) {
                    console.log(`🎉 ${data.matched.length}개의 SNS 인기 맛집을 찾았습니다!`);
                } else {
                    setError('이 지역에서 SNS에서 언급된 맛집을 찾지 못했습니다. 다른 지역을 검색해보세요.');
                }
            } else {
                setError(data.error || '매칭에 실패했습니다.');
            }

        } catch (error) {
            console.error('SNS 매칭 실패:', error);
            
            if (error.message.includes('fetch')) {
                setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
            } else {
                setError(`SNS 맛집 검색 중 오류가 발생했습니다: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 일반 지도 모드로 돌아가기
    const handleResetSearch = () => {
        setShowSnsMode(false);
        setSnsRestaurants([]);
        setMatchStats(null);
        setError('');
        
        // 지도의 SNS 마커들도 제거
        if (window.kakaoMapInstance && window.kakaoMapInstance.clearSnsMarkers) {
            window.kakaoMapInstance.clearSnsMarkers();
        }
    };

    // 매칭 결과 상세보기
    const handleShowMatchDetails = () => {
        if (snsRestaurants.length > 0) {
            console.table(snsRestaurants.map(item => ({
                맛집명: item.map_info.place_name,
                SNS언급: item.sns_info.sns_mentions,
                평점: item.sns_info.rating,
                매칭점수: item.match_score,
                매칭타입: item.match_type
            })));
            
            alert(`매칭 결과 ${snsRestaurants.length}개를 콘솔에서 확인하세요 (F12 - Console 탭)`);
        }
    };

    // 서버 상태 체크
    const checkServerHealth = async () => {
        try {
            const response = await fetch('/api/restaurants/health');
            const data = await response.json();
            console.log('서버 상태:', data);
        } catch (error) {
            console.error('서버 상태 확인 실패:', error);
        }
    };

    // 컴포넌트 마운트 시 서버 상태 체크
    useEffect(() => {
        checkServerHealth();
    }, []);

    return (
        <div className="nearby-page">
            {/* 검색 컨트롤 패널 */}
            <div className="search-controls">
                <div className="button-group">
                    <button 
                        className={`sns-search-btn ${showSnsMode ? 'active' : ''}`}
                        onClick={showSnsMode ? handleResetSearch : handleSnsSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner">🔍</span>
                                매칭 중...
                            </>
                        ) : showSnsMode ? (
                            <>
                                🏠 일반 검색
                            </>
                        ) : (
                            <>
                                🔥 SNS 맛집 찾기
                            </>
                        )}
                    </button>

                    {/* 매칭 통계 표시 */}
                    {matchStats && showSnsMode && (
                        <div className="match-stats">
                            <span className="stats-text">
                                📊 매칭률: <strong>{matchStats.matchRate}%</strong> 
                                ({matchStats.matched}/{matchStats.total})
                            </span>
                            <button 
                                className="details-btn"
                                onClick={handleShowMatchDetails}
                                title="매칭 상세 정보 보기"
                            >
                                📋
                            </button>
                        </div>
                    )}
                </div>

                {/* 에러 메시지 표시 */}
                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                {/* 로딩 상태에서 진행 상황 표시 */}
                {isLoading && (
                    <div className="loading-status">
                        <div className="loading-bar">
                            <div className="loading-progress"></div>
                        </div>
                        <p>SNS에서 인기 맛집을 찾고 있습니다...</p>
                    </div>
                )}
            </div>

            {/* SNS 모드 안내 */}
            {showSnsMode && snsRestaurants.length > 0 && (
                <div className="sns-mode-banner">
                    <div className="banner-content">
                        <span className="banner-icon">🌟</span>
                        <span className="banner-text">
                            SNS에서 화제가 된 맛집 {snsRestaurants.length}곳이 표시되고 있습니다
                        </span>
                    </div>
                </div>
            )}

            {/* 카카오맵 컴포넌트 */}
            <div className="map-container">
                <KakaoMap 
                    ref={kakaoMapRef}
                    snsRestaurants={snsRestaurants}
                    showSnsMode={showSnsMode}
                    onMapReady={(mapInstance) => {
                        window.kakaoMapInstance = mapInstance;
                        console.log('카카오맵 인스턴스 준비 완료');
                    }}
                />
            </div>
        </div>
    );
};

export default Nearby;