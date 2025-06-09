import React, { useState, useRef } from 'react';
import KakaoMap from './KakaoMap'; // KakaoMap 컴포넌트 재사용
import KeywordFilter from './KeywordFilter'; // KeywordFilter 컴포넌트 사용
import '../styles/RouteCreationPage.css';

const RouteCreationPage = () => {
    const [center] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본 위치
    const [searchKeyword, setSearchKeyword] = useState(''); // 카카오맵으로 전달할 검색 키워드
    const [searchCount, setSearchCount] = useState(0); // 검색 카운트
    const [searchResults, setSearchResults] = useState([]); // 검색 결과
    
    const mapRef = useRef(null); // KakaoMap 컴포넌트 참조

    // 키워드 매핑
    const keywordMap = {
        'western': '양식',
        'chinese': '중식',
        'japanese': '일식',
        'korean': '한식',
        'dessert': '디저트'
    };

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

    // KeywordFilter에서 루트 생성 요청을 받는 함수
    const handleCreateRoute = (filterGroups) => {
        console.log('루트 생성:', filterGroups);
        
        // 거리순이 선택된 그룹들만 필터링
        const distanceGroups = filterGroups.filter(group => 
            group.placeType === 'restaurant' && 
            group.selectedKeywords.length > 0 && 
            group.selectedSortOption === 'distance'
        );
        
        if (distanceGroups.length === 0) {
            alert('거리순으로 선택된 식당이 없습니다.');
            return;
        }
        
        alert(`${distanceGroups.length}개의 장소로 루트가 생성되었습니다!`);
    };    return (
        <div className="route-creation-page">
            <div className="route-creation-header">
                <h1>루트 생성하기</h1>
                <p>키워드를 선택하여 맛집을 검색하고 루트를 생성해보세요.</p>
            </div>

            {/* KeywordFilter 컴포넌트 사용 */}
            <div className="keyword-filter-container">
                <KeywordFilter 
                    onCreateRoute={handleCreateRoute}
                    onSearch={handleSearch}
                />
            </div>

            {/* 지도 컨테이너 */}
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
