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
    
    const mapRef = useRef(null); // KakaoMap 컴포넌트 참조

    useEffect(() => {
        if (places.length === 0) {
            addPlace();
        }
    }, []); 

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
            hasSearched: false // 검색 여부 추적
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
    };

    const handleCreateRoute = () => {
        console.log('루트 생성 - 모든 장소 선택 결과:', places);
        
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
                        className={`place-button ${activePlaceId === place.id ? 'active' : ''} ${place.hasSearched ? 'searched' : ''}`}
                        onClick={() => handlePlaceClick(place.id)}
                        title={place.hasSearched ? `검색됨: ${place.searchKeyword}` : '미검색'}
                    >
                        {place.name}
                        {place.hasSearched && <span className="search-indicator">🔍</span>}
                    </button>
                ))}
            </div>

            {activePlace && (
                <div className="keyword-filter-container">
                    <KeywordFilter
                        place={activePlace}
                        updatePlace={updatePlace}
                        onSearch={handleSearch}
                    />
                </div>
            )}

            <div className="create-route-button-container">
                <button className="route-button" onClick={handleCreateRoute}>
                    루트 생성하기
                </button>
            </div>

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
            <div className="recommendation-list">
                <h2>검색 결과 {activePlace && `- ${activePlace.name}`}</h2>
                {currentSearchResults.length > 0 ? (
                    <div className="recommendation-results">
                        <p className="result-count">총 {currentSearchResults.length}개의 결과</p>
                        {currentSearchResults.map((place, index) => (
                            <div key={index} className="recommendation-item">
                                <h4>{place.place_name}</h4>
                                <p>{place.address_name}</p>
                                {place.phone && <p>📞 {place.phone}</p>}
                                {place.category_name && <p>🏷️ {place.category_name}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-recommendations">
                        {activePlace && activePlace.hasSearched 
                            ? '검색 결과가 없습니다.' 
                            : '키워드를 선택하고 루트 생성하기를 눌러 검색해보세요.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RouteCreationPage;
