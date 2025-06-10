import React, { useState } from 'react';
import KakaoMap from '../components/KakaoMap';
import '../styles/Nearby.css';

const Nearby = () => {
    const [center] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본 위치
    const [searchKeyword, setSearchKeyword] = useState(''); // 카카오맵으로 전달할 검색 키워드
    const [searchCount, setSearchCount] = useState(0); // 검색 카운트
    const [searchResults, setSearchResults] = useState([]); // 검색 결과

    // 검색 결과 처리 함수
    const handleSearchComplete = (results) => {
        console.log('검색 결과:', results);
        setSearchResults(results);
    };

    // 검색 요청 함수
    const handleSearch = () => {
        // 입력된 키워드로 검색을 수행합니다.
        const inputElement = document.querySelector('.search-input');
        if (inputElement) {
            const searchTerm = inputElement.value;
            console.log('검색어:', searchTerm);
            setSearchKeyword(searchTerm);
            setSearchCount(prev => prev + 1);
        }
    };

    return (
        <div className="nearby-page">
            <div className="nearby-header">
                <h1>내 주변 맛집</h1>
                <p>현재 위치 기준 1km 이내의 맛집을 찾아보세요</p>
            </div>

            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="맛집을 검색해보세요"
                    className="search-input"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                />
                <button className="search-button" onClick={handleSearch}>검색</button>
            </div>

            <div className="map-container">
                <KakaoMap
                    center={center}
                    distance={1000}
                    searchKeyword={searchKeyword}
                    searchCount={searchCount}
                    onSearchComplete={handleSearchComplete}
                />
            </div>

            <div className="search-results-list">
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
                        {searchKeyword ? '검색 결과가 없습니다.' : '주변 맛집을 검색해보세요.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nearby; 