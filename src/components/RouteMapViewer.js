import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import KakaoMap from './KakaoMap';
import '../styles/RouteMapViewer.css';

const RouteMapViewer = forwardRef(({ selectedRoute, onClearRoute }, ref) => {
    const mapRef = useRef(null);

    // 부모 컴포넌트에서 지도 메서드에 접근할 수 있도록 함
    useImperativeHandle(ref, () => ({
        displayRoute: (route) => {
            displayRouteOnMap(route);
        },
        clearRoute: () => {
            if (mapRef.current) {
                mapRef.current.clearRoute();
            }
        }
    }));

    // 지도에 루트 표시하는 함수
    const displayRouteOnMap = (route) => {
        if (!mapRef.current || !route) return;

        try {
            // 검색 중심 좌표 (일반 객체로 전달)
            const searchCenter = {
                lat: parseFloat(route.search_center_lat),
                lng: parseFloat(route.search_center_lng),
                place_name: route.search_center_name
            };

            // 장소들 데이터 구성
            const places = [];
            
            if (route.place1_lat && route.place1_lng) {
                places.push({
                    id: `${route.id}_place1`,
                    place_name: route.place1_name,
                    address_name: route.place1_address,
                    x: route.place1_lng.toString(),
                    y: route.place1_lat.toString(),
                    category_name: route.place1_category || '음식점',
                    distance: route.segment1_distance || '0'
                });
            }

            if (route.place2_lat && route.place2_lng) {
                places.push({
                    id: `${route.id}_place2`,
                    place_name: route.place2_name,
                    address_name: route.place2_address,
                    x: route.place2_lng.toString(),
                    y: route.place2_lat.toString(),
                    category_name: route.place2_category || '음식점',
                    distance: route.segment2_distance || '0'
                });
            }

            // 지도에 루트 표시
            if (places.length > 0) {
                mapRef.current.showMultiRoute(searchCenter, places);
            }
        } catch (error) {
            console.error('루트 표시 오류:', error);
            alert('루트를 지도에 표시하는 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="route-map-viewer">
            <div className="map-header">
                <h4>
                    {selectedRoute ? 
                        `${selectedRoute.route_name} 경로` : 
                        '루트를 선택하면 지도에서 확인할 수 있습니다'
                    }
                </h4>
                {selectedRoute && (
                    <button 
                        className="clear-route-btn"
                        onClick={onClearRoute}
                    >
                        <i className="fas fa-times"></i>
                        지우기
                    </button>
                )}
            </div>
            <div className="kakao-map-container">
                <KakaoMap
                    ref={mapRef}
                    distance={5000}
                    searchKeyword=""
                    searchCount={0}
                    onSearchComplete={() => {}}
                    places={[]}
                    activePlace={null}
                    sortOption="distance"
                />
            </div>
        </div>
    );
});

RouteMapViewer.displayName = 'RouteMapViewer';

export default RouteMapViewer;
