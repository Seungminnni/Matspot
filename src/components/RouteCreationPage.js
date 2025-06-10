import React, { useState, useRef, useEffect } from 'react';
import KakaoMap from './KakaoMap'; // KakaoMap 컴포넌트 재사용
import KeywordFilter from './KeywordFilter'; // KeywordFilter 컴포넌트 사용
import '../styles/RouteCreationPage.css';

const RouteCreationPage = () => {
    const [center] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본 위치
    const [searchKeyword, setSearchKeyword] = useState(''); // 카카오맵으로 전달할 검색 키워드
    const [searchCount, setSearchCount] = useState(0); // 검색 카운트
    const [places, setPlaces] = useState([]);
    const [activePlaceId, setActivePlaceId] = useState(null);
    // 각 장소별 검색 결과를 저장하는 객체 (key: placeId, value: searchResults)
    const [placeSearchResults, setPlaceSearchResults] = useState({});
    // 선택된 레스토랑 관리 (각 장소별로 저장된 레스토랑)
    const [selectedRestaurants, setSelectedRestaurants] = useState({});
    // 현재 선택된 레스토랑 (지도에 표시할 핀)
    const [currentSelectedRestaurant, setCurrentSelectedRestaurant] = useState(null);
    // 경로 정보 상태
    const [routeInfo, setRouteInfo] = useState(null);
    // 경로 생성 로딩 상태
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    
    const mapRef = useRef(null); // KakaoMap 컴포넌트 참조

    useEffect(() => {
        if (places.length === 0) {
            addPlace();
        }
    }, [places.length]); // addPlace는 의존성에서 제외해도 안전함 (컴포넌트가 리렌더링되어도 같은 함수)

    // 검색 결과 처리 함수 - 현재 활성 장소에 결과 저장
    const handleSearchComplete = (results) => {
        console.log('검색 결과:', results);
        if (activePlaceId) {
            setPlaceSearchResults(prev => ({
                ...prev,
                [activePlaceId]: results
            }));
        }
    };

    // 레스토랑 선택 함수
    const handleRestaurantSelect = (restaurant) => {
        console.log('선택된 레스토랑:', restaurant);
        setCurrentSelectedRestaurant(restaurant);
        
        // 지도 중심을 선택된 레스토랑으로 이동하고 해당 핀만 표시
        if (mapRef.current) {
            mapRef.current.showSinglePin(restaurant);
        }
    };

    // 장소 저장 함수
    const handleSavePlace = () => {
        if (!currentSelectedRestaurant || !activePlaceId) {
            alert('먼저 레스토랑을 선택해주세요.');
            return;
        }

        setSelectedRestaurants(prev => ({
            ...prev,
            [activePlaceId]: currentSelectedRestaurant
        }));

        // 장소를 저장됨 상태로 업데이트
        updatePlace(activePlaceId, { isSaved: true });
        
        alert('장소가 저장되었습니다!');
        setCurrentSelectedRestaurant(null);
    };

    // 최종 루트 생성 함수
    const handleCreateFinalRoute = async () => {
        const savedPlaces = Object.values(selectedRestaurants);
        if (savedPlaces.length < 2) {
            alert('두 개의 장소를 모두 저장해야 루트를 생성할 수 있습니다.');
            return;
        }

        // 1번째 장소와 2번째 장소 순서로 경로 생성
        const sortedPlaces = Object.keys(selectedRestaurants)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(placeId => selectedRestaurants[placeId]);

        const startPlace = sortedPlaces[0];
        const endPlace = sortedPlaces[1];

        console.log('루트 생성 시작:', { startPlace, endPlace });
        setIsCalculatingRoute(true);
        setRouteInfo(null);

        try {
            // 지도에서 경로 표시 및 정보 가져오기
            if (mapRef.current) {
                const routeData = await mapRef.current.showRoute(startPlace, endPlace);
                
                if (routeData) {
                    setRouteInfo({
                        startPlace: startPlace,
                        endPlace: endPlace,
                        distance: routeData.distance,
                        duration: routeData.duration,
                        toll: routeData.toll,
                        isEstimated: routeData.isEstimated || false
                    });
                    
                    // 성공 메시지
                    const distanceKm = (routeData.distance / 1000).toFixed(1);
                    const durationMin = Math.round(routeData.duration / 60);
                    alert(`루트가 생성되었습니다!\n거리: ${distanceKm}km\n소요시간: ${durationMin}분`);
                } else {
                    alert('경로를 찾을 수 없습니다.');
                }
            }
        } catch (error) {
            console.error('루트 생성 오류:', error);
            alert('루트 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCalculatingRoute(false);
        }
    };

    // KeywordFilter에서 검색 요청을 받는 함수
    const handleSearch = (searchTerm) => {
        console.log('검색어:', searchTerm);
        setSearchKeyword(searchTerm);
        setSearchCount(prev => prev + 1);
    };

    // 장소 상태 업데이트 함수
    const updatePlace = (id, updates) => {
        setPlaces(prevPlaces =>
            prevPlaces.map(place =>
                place.id === id ? { ...place, ...updates } : place
            )
        );
    };

    const addPlace = () => {
        if (places.length >= 3) {
            alert('최대 3개의 장소까지만 추가할 수 있습니다.');
            return;
        }
        const newPlace = {
            id: places.length + 1,
            name: `${places.length + 1}번째 장소`,
            placeType: '',
            selectedKeywords: [],
            selectedSortOption: '',
            searchKeyword: '', // 각 장소별 검색 키워드 저장
            hasSearched: false, // 검색 여부 추적
            isSaved: false // 저장 여부 추적
        };
        setPlaces([...places, newPlace]);
        setActivePlaceId(newPlace.id);
    };

    const handlePlaceClick = (placeId) => {
        setActivePlaceId(placeId);
        
        // 선택된 장소의 검색 키워드가 있다면 지도에 반영
        const selectedPlace = places.find(place => place.id === placeId);
        if (selectedPlace && selectedPlace.hasSearched && selectedPlace.searchKeyword) {
            setSearchKeyword(selectedPlace.searchKeyword);
            setSearchCount(prev => prev + 1);
        } else {
            // 검색 기록이 없으면 지도 초기화
            setSearchKeyword('');
        }

        // 현재 선택된 레스토랑 초기화
        setCurrentSelectedRestaurant(null);
        
        // 이미 저장된 장소가 있다면 해당 핀을 지도에 표시
        if (selectedRestaurants[placeId]) {
            if (mapRef.current) {
                mapRef.current.showSinglePin(selectedRestaurants[placeId]);
            }
        }
    };

    const handleCreateRoute = () => {
        console.log('검색 실행 - 현재 활성 장소:', activePlace);
        
        // 활성 장소의 선택된 키워드들로 검색어 생성
        if (activePlace) {
            const { placeType, selectedKeywords, selectedSortOption } = activePlace;
            
            // 키워드 매핑
            const keywordMap = {
                'western': '양식',
                'chinese': '중식',
                'japanese': '일식',
                'korean': '한식',
                'dessert': '디저트'
            };
            
            // 검색어 생성 로직
            let searchTerm = '';
            
            // 1. 장소 유형이 선택된 경우
            if (placeType === 'restaurant') {
                searchTerm = '맛집';
            } else if (placeType === 'cafe') {
                searchTerm = '카페';
            }
            
            // 2. 음식 키워드가 선택된 경우 추가
            if (selectedKeywords.length > 0) {
                const selectedKeyword = selectedKeywords[0]; // 첫 번째(유일한) 키워드만 사용
                const foodKeyword = keywordMap[selectedKeyword] || selectedKeyword;
                if (placeType === 'restaurant') {
                    // 맛집 + 음식종류 조합
                    searchTerm = foodKeyword + ' 맛집';
                } else {
                    searchTerm = foodKeyword;
                }
            }
            
            // 3. 기본값 설정
            if (!searchTerm) {
                searchTerm = '맛집';
            }
            
            console.log('생성된 검색어:', searchTerm);
            console.log('선택된 정렬 옵션:', selectedSortOption);
            
            // 검색 실행
            if (searchTerm) {
                // 현재 장소의 검색 키워드와 검색 상태 업데이트
                updatePlace(activePlace.id, { 
                    searchKeyword: searchTerm, 
                    hasSearched: true 
                });
                
                setSearchKeyword(searchTerm);
                setSearchCount(prev => prev + 1);
            }
        } else {
            alert('먼저 장소를 선택하고 키워드를 설정해주세요.');
        }
    };

    const activePlace = places.find(place => place.id === activePlaceId);
    // 현재 활성 장소의 검색 결과 가져오기
    const currentSearchResults = activePlaceId ? (placeSearchResults[activePlaceId] || []) : [];
    // 저장된 장소들의 개수 확인
    const savedPlacesCount = Object.keys(selectedRestaurants).length;
    // 현재 활성 장소가 저장되었는지 확인
    const isCurrentPlaceSaved = activePlaceId && selectedRestaurants[activePlaceId];

    return (
        <div className="route-creation-page">
            <div className="route-creation-header">
                <h1>루트 생성하기</h1>
                <p>키워드를 선택하여 맛집을 검색하고 루트를 생성해보세요.</p>
            </div>

            <div className="places-container">
                <button className="add-place-button" onClick={addPlace}>+</button>
                {places.map(place => (
                    <button
                        key={place.id}
                        className={`place-button ${activePlaceId === place.id ? 'active' : ''} ${place.hasSearched ? 'searched' : ''} ${place.isSaved ? 'saved' : ''}`}
                        onClick={() => handlePlaceClick(place.id)}
                        title={place.isSaved ? `저장됨: ${selectedRestaurants[place.id]?.place_name}` : place.hasSearched ? `검색됨: ${place.searchKeyword}` : '미검색'}
                    >
                        {place.name}
                        {place.isSaved && <span className="save-indicator">💾</span>}
                        {place.hasSearched && !place.isSaved && <span className="search-indicator">🔍</span>}
                    </button>
                ))}
            </div>

            {activePlace && !isCurrentPlaceSaved && (
                <KeywordFilter
                    place={activePlace}
                    updatePlace={updatePlace}
                    onSearch={handleSearch}
                />
            )}

            {/* 저장된 장소 표시 */}
            {isCurrentPlaceSaved && (
                <div className="saved-place-info">
                    <h3>{activePlace.name} - 저장된 장소</h3>
                    <div className="saved-restaurant">
                        <h4>{selectedRestaurants[activePlaceId].place_name}</h4>
                        <p>{selectedRestaurants[activePlaceId].address_name}</p>
                        {selectedRestaurants[activePlaceId].phone && <p>📞 {selectedRestaurants[activePlaceId].phone}</p>}
                    </div>
                </div>
            )}

            {/* 버튼들 */}
            <div className="button-container">
                {!isCurrentPlaceSaved && (
                    <div className="search-button-container">
                        <button className="search-button" onClick={handleCreateRoute}>
                            찾기
                        </button>
                    </div>
                )}

                {/* 레스토랑이 선택되었을 때 장소 저장 버튼 표시 */}
                {currentSelectedRestaurant && !isCurrentPlaceSaved && (
                    <div className="save-place-button-container">
                        <button className="save-place-button" onClick={handleSavePlace}>
                            장소 저장하기
                        </button>
                    </div>
                )}

                {/* 두 장소 모두 저장되었을 때 루트 생성 버튼 표시 */}
                {savedPlacesCount >= 2 && !routeInfo && (
                    <div className="create-route-button-container">
                        <button 
                            className="final-route-button" 
                            onClick={handleCreateFinalRoute}
                            disabled={isCalculatingRoute}
                        >
                            {isCalculatingRoute ? '경로 계산 중...' : '루트 생성하기'}
                        </button>
                    </div>
                )}
            </div>

            {/* 생성된 경로 정보 표시 */}
            {routeInfo && (
                <div className="route-info-container">
                    <h3>생성된 루트 정보</h3>
                    <div className="route-summary">
                        <div className="route-places">
                            <div className="route-place start">
                                <span className="route-number">1</span>
                                <div className="place-info">
                                    <h4>{routeInfo.startPlace.place_name}</h4>
                                    <p>{routeInfo.startPlace.address_name}</p>
                                </div>
                            </div>
                            <div className="route-arrow">➜</div>
                            <div className="route-place end">
                                <span className="route-number">2</span>
                                <div className="place-info">
                                    <h4>{routeInfo.endPlace.place_name}</h4>
                                    <p>{routeInfo.endPlace.address_name}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="route-details">
                            <div className="route-stat">
                                <span className="stat-icon">📍</span>
                                <span className="stat-label">거리</span>
                                <span className="stat-value">{(routeInfo.distance / 1000).toFixed(1)}km</span>
                            </div>
                            <div className="route-stat">
                                <span className="stat-icon">⏱️</span>
                                <span className="stat-label">소요시간</span>
                                <span className="stat-value">{Math.round(routeInfo.duration / 60)}분</span>
                            </div>
                            {routeInfo.toll > 0 && (
                                <div className="route-stat">
                                    <span className="stat-icon">💳</span>
                                    <span className="stat-label">톨게이트</span>
                                    <span className="stat-value">{routeInfo.toll.toLocaleString()}원</span>
                                </div>
                            )}
                            {routeInfo.isEstimated && (
                                <div className="route-notice">
                                    * 직선거리 기준 예상 시간입니다
                                </div>
                            )}
                        </div>
                        
                        <div className="route-actions">
                            <button 
                                className="route-reset-button" 
                                onClick={() => {
                                    setRouteInfo(null);
                                    // 지도에서 경로 제거
                                    if (mapRef.current) {
                                        mapRef.current.clearRoute();
                                    }
                                }}
                            >
                                새로운 루트 만들기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="map-container">
                <KakaoMap
                    ref={mapRef}
                    center={center}
                    distance={1000}
                    searchKeyword={searchKeyword}
                    searchCount={searchCount}
                    onSearchComplete={handleSearchComplete}
                />
            </div>

            {/* 검색 결과 목록 */}
            {!isCurrentPlaceSaved && (
                <div className="recommendation-list">
                    <h2>검색 결과 {activePlace && `- ${activePlace.name}`}</h2>
                    {currentSearchResults.length > 0 ? (
                        <>
                            <p className="result-count">총 {currentSearchResults.length}개의 결과</p>
                            <div className="recommendation-results">
                                {currentSearchResults.map((place, index) => (
                                    <div 
                                        key={index} 
                                        className={`recommendation-item ${currentSelectedRestaurant?.place_name === place.place_name ? 'selected' : ''}`}
                                        onClick={() => handleRestaurantSelect(place)}
                                    >
                                        <h4>{place.place_name}</h4>
                                        <p>{place.address_name}</p>
                                        {place.phone && <p>📞 {place.phone}</p>}
                                        {place.category_name && <p>🏷️ {place.category_name}</p>}
                                        {currentSelectedRestaurant?.place_name === place.place_name && 
                                            <div className="selection-indicator">✓ 선택됨</div>
                                        }
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="no-recommendations">
                            {activePlace && activePlace.hasSearched 
                                ? '검색 결과가 없습니다.' 
                                : '키워드를 선택하고 찾기를 눌러 검색해보세요.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RouteCreationPage;
