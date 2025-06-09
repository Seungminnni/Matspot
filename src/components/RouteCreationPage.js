import React, { useState, useRef, useEffect } from 'react';
import KakaoMap from './KakaoMap'; // KakaoMap 컴포넌트 재사용
import KeywordFilter from './KeywordFilter'; // KeywordFilter 컴포넌트 사용
import '../styles/RouteCreationPage.css';

const RouteCreationPage = () => {
    const [center] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본 위치
    const [searchKeyword, setSearchKeyword] = useState(''); // 카카오맵으로 전달할 검색 키워드
    const [searchCount, setSearchCount] = useState(0); // 검색 카운트
    const [searchResults, setSearchResults] = useState([]); // 검색 결과
    const [places, setPlaces] = useState([]);
    const [activePlaceId, setActivePlaceId] = useState(null);
    
    const mapRef = useRef(null); // KakaoMap 컴포넌트 참조

    useEffect(() => {
        if (places.length === 0) {
            addPlace();
        }
    }, []); 

    // 검색 결과 처리 함수
    const handleSearchComplete = (results) => {
        console.log('검색 결과:', results);
        setSearchResults(results);
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
            selectedSortOption: ''
        };
        setPlaces([...places, newPlace]);
        setActivePlaceId(newPlace.id);
    };

    const handlePlaceClick = (placeId) => {
        setActivePlaceId(placeId);
    };

    const handleCreateRoute = () => {
        console.log('루트 생성 - 모든 장소 선택 결과:', places);
        // 여기에서 모든 장소의 선택 결과를 기반으로 루트 생성 로직을 추가합니다.
        // 예시: 선택된 모든 장소의 이름 나열
        const routeSummary = places.map(place => 
            `${place.name}: 유형(${place.placeType}), 음식(${place.selectedKeywords.join(', ')}), 정렬(${place.selectedSortOption})`
        ).join('\n');

        alert(`루트가 생성되었습니다!\n\n${routeSummary}`);
    };

    const activePlace = places.find(place => place.id === activePlaceId);

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
                        className={`place-button ${activePlaceId === place.id ? 'active' : ''}`}
                        onClick={() => handlePlaceClick(place.id)}
                    >
                        {place.name}
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
                    searchKeyword={searchKeyword}
                    searchCount={searchCount}
                    onSearchComplete={handleSearchComplete}
                />
            </div>

            {/* 검색 결과 목록 */}
            <div className="recommendation-list">
                <h2>검색 결과</h2>
                {searchResults.length > 0 ? (
                    <div className="recommendation-results">
                        {searchResults.map((place, index) => (
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
                        {searchKeyword ? '검색 결과가 없습니다.' : '키워드를 선택하고 검색해보세요.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RouteCreationPage;
