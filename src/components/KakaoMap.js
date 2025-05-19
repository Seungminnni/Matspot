import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/KakaoMap.css';

function KakaoMap({ distance = 1000, searchKeyword = '', onSearchComplete = () => {} }) {
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markersRef = useRef([]);
  const placesRef = useRef(null);
  const currentPositionRef = useRef(null);
  
  // 마커들을 모두 제거하는 함수
  const removeAllMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  };
  
  // 장소 검색 함수를 useCallback으로 메모이제이션
  const searchPlaces = useCallback((keyword) => {
    if (!window.kakao || !window.kakao.maps || !mapRef.current) {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return;
    }
    
    if (!placesRef.current) {
      placesRef.current = new window.kakao.maps.services.Places();
    }
    
    // 기존 마커들 제거
    removeAllMarkers();
    
    // 검색 옵션 설정
    const searchOptions = {
      location: currentPositionRef.current,
      radius: distance,
      // 음식점 카테고리로 필터링 (FD6: 음식점)
      category_group_code: 'FD6'
    };
    
    // 장소 검색 실행
    placesRef.current.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        const results = [];
        
        // 검색 결과마다 마커 생성
        data.forEach((place) => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({
            map: mapRef.current,
            position: position
          });
          
          // 인포윈도우 생성
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`
          });
          
          // 마커 클릭 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(mapRef.current, marker);
          });
          
          // 마커 마우스 오버 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.open(mapRef.current, marker);
          });
          
          // 마커 마우스 아웃 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'mouseout', function() {
            infowindow.close();
          });
          
          markersRef.current.push(marker);
          bounds.extend(position);
          results.push(place);
        });
        
        // 검색 결과 바운드로 지도 이동
        mapRef.current.setBounds(bounds);
        
        // 검색 결과 콜백으로 전달
        onSearchComplete(results);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        onSearchComplete([]);
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        alert('검색 중 오류가 발생했습니다.');
        onSearchComplete([]);
      }
    }, searchOptions);
  }, [distance, onSearchComplete]);
  
  // 검색 키워드가 변경될 때 검색 실행
  useEffect(() => {
    if (searchKeyword && mapRef.current) {
      searchPlaces(searchKeyword);
    }
  }, [searchKeyword, searchPlaces]);
  
  useEffect(() => {
    // 이미 스크립트가 있으면 중복 추가 방지
    if (!window.kakao) {
      const script = document.createElement('script');
      script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=c6d12eab1ef43ca9745a713e8669183b&libraries=services&autoload=false";
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.kakao.maps.load(() => {
          createMap();
        });
      };
      
      script.onerror = () => {
        setMapError('카카오맵 스크립트 로드에 실패했습니다.');
      };
    } else if (window.kakao && window.kakao.maps) {
      createMap();
    }
    
    function createMap() {
      const container = document.getElementById('map');
      
      // 거리에 따른 지도 레벨 설정 (수정됨)
      // 실제 표시되는 거리에 맞게 맵 레벨 조정
      let mapLevel = 3; // 기본값
      
      // 실제 표시되는 거리와 일치하도록 레벨 수정
      if (distance <= 50) mapLevel = 3; // 50미터에 맞게 조정
      else if (distance <= 100) mapLevel = 4; // 100미터에 맞게 조정
      else if (distance <= 250) mapLevel = 5; // 250미터에 맞게 조정
      else if (distance <= 500) mapLevel = 6; // 500미터에 맞게 조정
      else if (distance <= 1000) mapLevel = 7; // 1km에 맞게 조정
      
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
        level: mapLevel,
      };
      
      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);
      mapRef.current = map;
      
      // 현재 위치 가져오기
      if (navigator.geolocation) {
        console.log('Geolocation API 지원됨, 위치 정보 요청 중...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 현재 위치 좌표 구하기
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log('위치 정보 가져오기 성공:', lat, lng);
            const currentPosition = new window.kakao.maps.LatLng(lat, lng);
            currentPositionRef.current = currentPosition;
            
            // 현재 위치로 지도 중심 이동
            map.setCenter(currentPosition);
            
            // 현재 위치 마커 생성
            const marker = new window.kakao.maps.Marker({
              position: currentPosition
            });
            marker.setMap(map);
            
            // 인포윈도우 생성
            const infowindow = new window.kakao.maps.InfoWindow({
              content: '<div style="padding:5px;font-size:12px;">현재 위치</div>'
            });
            infowindow.open(map, marker);
            
            // 마커 클릭 이벤트 등록
            window.kakao.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map, marker);
            });
            
            markerRef.current = marker;
            
            // 검색어가 있다면 검색 실행
            if (searchKeyword) {
              searchPlaces(searchKeyword);
            }
          },
          (error) => {
            console.error('위치 정보를 가져오는데 실패했습니다:', error);
            console.error('에러 코드:', error.code);
            let errorMessage = '위치 정보를 가져오는데 실패했습니다.';
            
            // 오류 코드에 따른 메시지 설정
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '위치 정보 접근이 거부되었습니다. 브라우저의 위치 접근 권한을 확인해주세요.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = '위치 정보를 사용할 수 없습니다.';
                break;
              case error.TIMEOUT:
                errorMessage = '위치 정보 요청이 시간 초과되었습니다.';
                break;
              case error.UNKNOWN_ERROR:
                errorMessage = '알 수 없는 오류가 발생했습니다.';
                break;
              default:
                errorMessage = '알 수 없는 오류가 발생했습니다.';
                break;
            }
            
            setMapError(errorMessage);
          },
          { 
            enableHighAccuracy: true, // 높은 정확도 요청
            timeout: 10000,           // 10초 타임아웃
            maximumAge: 0             // 캐시된 위치 정보를 사용하지 않음
          }
        );
      } else {
        setMapError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      }
    }
    
    // 컴포넌트가 언마운트될 때 정리 함수
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      removeAllMarkers();
    };
  }, [distance, searchKeyword, searchPlaces]);

  return (
    <div className="map-container">
      {mapError && (
        <div className="map-error">
          <p>{mapError}</p>
        </div>
      )}
      <div
        id="map"
        style={{
          width: '100%',
          height: '100%', // 400px에서 100%로 변경
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      ></div>
    </div>
  );
}

export default KakaoMap;