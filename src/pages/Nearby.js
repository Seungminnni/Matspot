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
    const [pythonApiStatus, setPythonApiStatus] = useState(null); // 'online', 'offline', 'checking'
    const [backendApiStatus, setBackendApiStatus] = useState(null); // 'online', 'offline', 'checking'
    
    const kakaoMapRef = useRef(null);
    const retryCountRef = useRef(0);
    const maxRetryCount = 3;

    // Python API 서버 상태 확인
    const checkPythonApiStatus = async () => {
        setPythonApiStatus('checking');
        try {
            const response = await fetch('http://localhost:5001/api/health', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // 3초 타임아웃 설정
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                console.log('Python API 서버 연결 성공');
                setPythonApiStatus('online');
                return true;
            } else {
                throw new Error(`상태 코드: ${response.status}`);
            }
        } catch (error) {
            console.error('Python API 서버 연결 실패:', error);
            setPythonApiStatus('offline');
            return false;
        }
    };
    
    // 백엔드 API 서버 상태 확인
    const checkBackendApiStatus = async () => {
        setBackendApiStatus('checking');
        try {
            const response = await fetch('http://localhost:5000/api/auth/status', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // 3초 타임아웃 설정
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                console.log('백엔드 API 서버 연결 성공');
                setBackendApiStatus('online');
                return true;
            } else {
                throw new Error(`상태 코드: ${response.status}`);
            }
        } catch (error) {
            console.error('백엔드 API 서버 연결 실패:', error);
            setBackendApiStatus('offline');
            return false;
        }
    };
    
    // 컴포넌트 마운트 시 서버 상태 확인
    useEffect(() => {
        checkPythonApiStatus();
        checkBackendApiStatus();
        
        // 10초마다 서버 상태 확인
        const intervalId = setInterval(() => {
            if (pythonApiStatus !== 'online') {
                checkPythonApiStatus();
            }
            if (backendApiStatus !== 'online') {
                checkBackendApiStatus();
            }
        }, 10000);
        
        return () => clearInterval(intervalId);
    }, []);
    
    // Python API 상태가 변경될 때 실행
    useEffect(() => {
        if (pythonApiStatus === 'online') {
            // 서버가 온라인이면 에러 메시지 제거
            if (error.includes('Python API 서버 연결에 실패')) {
                setError('');
            }
        }
    }, [pythonApiStatus, error]);

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
    };    // SNS 맛집 매칭 검색
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

            // 직접 Python 크롤링 API 호출
            try {
                const response = await fetch('http://localhost:5001/api/sns-restaurants?limit=10', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP 에러: ${response.status}`);
                }

                const data = await response.json();
                console.log('Python API 응답:', data);
                
                if (data && Array.isArray(data)) {
                    // 받아온 SNS 맛집 데이터를 지도 검색 결과와 매칭
                    const matched = matchRestaurantsWithMapResults(data, mapResults);
                    
                    setSnsRestaurants(matched);
                    setMatchStats({
                        total: mapResults.length,
                        matched: matched.length,
                        matchRate: Math.round((matched.length / mapResults.length) * 100)
                    });
                    setShowSnsMode(true);
                    
                    // 성공 메시지
                    if (matched.length > 0) {
                        console.log(`🎉 ${matched.length}개의 SNS 인기 맛집을 찾았습니다!`);
                    } else {
                        setError('이 지역에서 SNS에서 언급된 맛집을 찾지 못했습니다. 다른 지역을 검색해보세요.');
                    }
                } else {
                    throw new Error('API 응답이 올바른 형식이 아닙니다');
                }
            } catch (fetchError) {
                console.error('Python API 요청 실패:', fetchError);
                
                // 대체 로직: 로컬 더미 데이터로 테스트 가능하게 함
                const dummyMatched = mapResults.slice(0, 3).map((rest, index) => ({
                    map_info: rest,
                    sns_info: {
                        id: index + 1,
                        name: rest.place_name,
                        address: rest.address_name,
                        sns_mentions: Math.floor(Math.random() * 100) + 50,
                        rating: (Math.random() * 2 + 3).toFixed(1),
                        review_count: Math.floor(Math.random() * 50) + 20,
                        tags: ['맛집', '인기', '추천'],
                        description: '인스타그램에서 인기 있는 맛집',
                        source: 'fallback'
                    },
                    match_score: (Math.random() * 0.3 + 0.7).toFixed(2),
                    match_type: 'fallback'
                }));
                
                setSnsRestaurants(dummyMatched);
                setMatchStats({
                    total: mapResults.length,
                    matched: dummyMatched.length,
                    matchRate: Math.round((dummyMatched.length / mapResults.length) * 100)
                });
                setShowSnsMode(true);
                
                console.warn('⚠️ Python API 서버 연결 실패로 로컬 더미 데이터를 사용합니다.');
                setError('Python API 서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
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
    
    // Python API에서 가져온 SNS 맛집 데이터와 지도 검색 결과를 매칭하는 함수
    const matchRestaurantsWithMapResults = (snsRestaurants, mapResults) => {
        const matched = [];
        
        // 각 지도 검색 결과에 대해
        mapResults.forEach(mapPlace => {
            // 가장 유사한 SNS 맛집 찾기
            const matchedSnsRestaurant = findSimilarRestaurant(mapPlace, snsRestaurants);
            
            if (matchedSnsRestaurant) {
                matched.push({
                    map_info: mapPlace,
                    sns_info: {
                        id: matchedSnsRestaurant.id || 0,
                        name: matchedSnsRestaurant.name || mapPlace.place_name,
                        address: matchedSnsRestaurant.address || mapPlace.address_name,
                        sns_mentions: matchedSnsRestaurant.sns_mentions || 0,
                        rating: matchedSnsRestaurant.rating || "0.0",
                        review_count: matchedSnsRestaurant.review_count || 0,
                        tags: matchedSnsRestaurant.tags || [],
                        description: matchedSnsRestaurant.description || '',
                        source: 'python_api'
                    },
                    match_score: 0.8,
                    match_type: 'name_match'
                });
            }
        });
        
        return matched;
    };
    
    // 유사한 식당을 찾는 함수
    const findSimilarRestaurant = (mapPlace, snsRestaurants) => {
        if (!mapPlace || !mapPlace.place_name || !snsRestaurants || !Array.isArray(snsRestaurants)) {
            return null;
        }
        
        // 가장 이름이 유사한 식당 찾기
        const mapPlaceName = mapPlace.place_name.toLowerCase();
        
        return snsRestaurants.find(snsPlace => {
            const snsPlaceName = (snsPlace.name || '').toLowerCase();
            return snsPlaceName.includes(mapPlaceName) || mapPlaceName.includes(snsPlaceName);
        });
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
                        disabled={isLoading || pythonApiStatus === 'offline'}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner">🔍</span>
                                매칭 중...
                            </>
                        ) : showSnsMode ? (
                            <>
                                🏠 일반 검색으로 돌아가기
                            </>
                        ) : (
                            <>
                                🔥 SNS 인기 맛집 찾기
                            </>
                        )}
                    </button>
                    
                    {/* Python API 서버 상태 표시 */}
                    <div className={`api-status ${pythonApiStatus}`}>
                        {pythonApiStatus === 'checking' && (
                            <span>크롤링 API 확인 중...</span>
                        )}
                        {pythonApiStatus === 'online' && (
                            <span>✅ 크롤링 API 연결됨</span>
                        )}
                        {pythonApiStatus === 'offline' && (
                            <span>❌ 크롤링 API 연결 안됨
                                <button 
                                    className="retry-btn"
                                    onClick={checkPythonApiStatus}
                                >
                                    재시도
                                </button>
                            </span>
                        )}
                    </div>
                    
                    {/* 백엔드 API 서버 상태 표시 */}
                    <div className={`api-status ${backendApiStatus}`}>
                        {backendApiStatus === 'checking' && (
                            <span>백엔드 API 확인 중...</span>
                        )}
                        {backendApiStatus === 'online' && (
                            <span>✅ 백엔드 연결됨</span>
                        )}
                        {backendApiStatus === 'offline' && (
                            <span>❌ 백엔드 연결 안됨
                                <button 
                                    className="retry-btn"
                                    onClick={checkBackendApiStatus}
                                >
                                    재시도
                                </button>
                            </span>
                        )}
                    </div>
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