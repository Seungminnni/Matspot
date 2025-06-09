import React, { useState } from 'react';
import SearchBar from './SearchBar';
import KakaoMap from './KakaoMap';
import '../styles/NearbyPage.css';

const NearbyPage = () => {
    const [distance, setDistance] = useState(1000);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchCount, setSearchCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    
    const handleDistanceChange = (e) => {
        setDistance(Number(e.target.value));
    };
    
    const handleSearch = (keyword) => {
        setSearchKeyword(keyword);
        setSearchCount(c => c + 1);
        setIsSearching(true);
    };
    
    // 검색 결과를 받아오는 콜백 함수
    const handleSearchResults = (results) => {
        setSearchResults(results);
        setIsSearching(false);
    };
    
    return (
        <div className="nearby-page">
            <div className="nearby-header">
                <h1>내 주변 맛집</h1>
                <p>현재 위치 기준 {distance < 1000 ? `${distance}m` : `${distance/1000}km`} 이내의 맛집을 찾아보세요</p>
            </div>
            <SearchBar onSearch={handleSearch} />
            <div className="map-container">
                <KakaoMap 
                    distance={distance} 
                    searchKeyword={searchKeyword} 
                    searchCount={searchCount}
                    onSearchComplete={handleSearchResults}
                />
            </div>
            <div className="nearby-filters">
                <div className="distance-filter">
                    <select value={distance} onChange={handleDistanceChange}>
                        <option value="50">50m</option>
                        <option value="100">100m</option>
                        <option value="250">250m</option>
                        <option value="500">500m</option>
                        <option value="1000">1km</option>
                    </select>
                </div>
            </div>            <div className="recommendation-list">
                {isSearching ? (
                    <div className="searching-message">
                        "{searchKeyword}" 검색 중입니다...
                    </div>
                ) : searchResults.length > 0 ? (
                    <>
                        <h2>검색 결과</h2>
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
                    </>
                ) : searchKeyword ? (
                    <div className="no-recommendations">
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    <div className="no-recommendations">
                        주변 맛집을 검색해보세요.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NearbyPage;