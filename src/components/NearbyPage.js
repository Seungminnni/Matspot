import React, { useState } from 'react';
import SearchBar from './SearchBar';
import KakaoMap from './KakaoMap';
import '../styles/NearbyPage.css';

const NearbyPage = () => {
    const [distance, setDistance] = useState(1000);
    
    const handleDistanceChange = (e) => {
        setDistance(Number(e.target.value));
    };
    
    return (
        <div className="nearby-page">
            <div className="nearby-header">
                <h1>내 주변 맛집</h1>
                <p>현재 위치 기준 {distance < 1000 ? `${distance}m` : `${distance/1000}km`} 이내의 맛집을 찾아보세요</p>
            </div>
            <SearchBar />
            <div className="map-container">
                <KakaoMap distance={distance} />
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
            </div>
            <div className="nearby-list">
                {/* 임시로 "검색 중" 메시지 표시 */}
                <div className="searching-message">
                    주변 맛집을 검색하고 있습니다...
                </div>
            </div>
        </div>
    );
};

export default NearbyPage; 