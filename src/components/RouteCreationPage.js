import React, { useState } from 'react';
import KakaoMap from './KakaoMap'; // KakaoMap 컴포넌트 재사용
import '../styles/RouteCreationPage.css'; // 새로운 CSS 파일 (나중에 생성)

const RouteCreationPage = () => {
    // 여기에 위치 및 키워드 관련 상태를 추가할 수 있습니다.
    const [center] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본 위치
    const [recommendations] = useState([]); // 추천 장소 목록
    
    // TODO: 향후 setCenter와 setRecommendations 기능이 필요할 때 추가 구현

    return (
        <div className="route-creation-page">
            <div className="route-creation-header">
                <h1>루트 생성하기</h1>
                <p>현재 위치를 기반으로 키워드에 맞는 장소를 추천받아 루트를 생성해보세요.</p>
                {/* 여기에 키워드 선택 또는 검색바를 추가할 수 있습니다. */}
            </div>
            <div className="map-container">
                <KakaoMap
                    // 필요한 props를 여기에 전달합니다. (예: 중심 좌표, 마커 등)
                    center={center}
                />
            </div>
            <div className="recommendation-list">
                <h2>추천 장소</h2>
                {recommendations.length > 0 ? (
                    <div className="recommendation-results">
                        {recommendations.map((place, index) => (
                            <div key={index} className="recommendation-item">
                                <h4>{place.name}</h4>
                                <p>{place.address}</p>
                                {/* 추가 정보 표시 */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-recommendations">
                        추천 장소가 없습니다. 키워드를 선택하거나 검색해보세요.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RouteCreationPage;
