import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import '../styles/KakaoMap.css';

const KakaoMap = forwardRef(({ 
  distance = 1000, 
  searchKeyword = '', 
  searchCount = 0, 
  onSearchComplete = () => {},
  snsRestaurants = [],
  showSnsMode = false,
  onMapReady = () => {}
}, ref) => {
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markersRef = useRef([]);
  const snsMarkersRef = useRef([]); // SNS 마커들을 별도로 관리
  const placesRef = useRef(null);
  const currentPositionRef = useRef(null);
  const centerRef = useRef(null);
  const lastSearchRef = useRef('');
  const [currentPlaces, setCurrentPlaces] = useState([]); // 현재 검색된 장소들

  // 외부에서 접근 가능한 메서드들을 정의
  useImperativeHandle(ref, () => ({
    getPlaces: () => currentPlaces,
    getCenter: () => centerRef.current,
    getBounds: () => mapRef.current?.getBounds(),
    clearSnsMarkers: clearSnsMarkers
  }));
  
  // 일반 마커들을 모두 제거하는 함수
  const removeAllMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  };

  // SNS 마커들을 모두 제거하는 함수
  const clearSnsMarkers = () => {
    if (snsMarkersRef.current.length > 0) {
      snsMarkersRef.current.forEach(marker => marker.setMap(null));
      snsMarkersRef.current = [];
    }
  };

  // SNS 마커들을 지도에 표시하는 함수
  const displaySnsMarkers = useCallback(() => {
    if (!mapRef.current || !snsRestaurants.length) return;

    // 기존 SNS 마커들 제거
    clearSnsMarkers();

    snsRestaurants.forEach((restaurant) => {
      const mapInfo = restaurant.map_info;
      const snsInfo = restaurant.sns_info;
      
      if (!mapInfo.x || !mapInfo.y) return;

      const position = new window.kakao.maps.LatLng(mapInfo.y, mapInfo.x);
      
      // SNS 마커 이미지 생성 (빨간색으로 구분)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(64, 69);
      const imageOption = { offset: new window.kakao.maps.Point(27, 69) };
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      const marker = new window.kakao.maps.Marker({
        map: mapRef.current,
        position: position,
        image: markerImage
      });
      
      // SNS 정보가 포함된 인포윈도우 생성
      const infoContent = `
        <div style="padding:10px;width:250px;font-size:12px;">
          <div style="font-weight:bold;color:#ff4757;margin-bottom:5px;">
            🌟 SNS 인기 맛집
          </div>
          <div style="font-weight:bold;margin-bottom:5px;">${mapInfo.place_name}</div>
          <div style="color:#666;margin-bottom:5px;">${mapInfo.address_name}</div>
          <div style="background:#f1f2f6;padding:5px;border-radius:4px;">
            <div>📱 SNS 언급: <strong>${snsInfo.sns_mentions}회</strong></div>
            <div>⭐ 평점: <strong>${snsInfo.rating}/5.0</strong></div>
            <div>💬 리뷰: <strong>${snsInfo.review_count}개</strong></div>
            <div>🏷️ 태그: ${snsInfo.tags.slice(0, 3).join(', ')}</div>
            <div style="margin-top:5px;font-size:11px;color:#666;">
              매칭 점수: ${(restaurant.match_score * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      `;
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: infoContent
      });
      
      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', function() {
        // 다른 인포윈도우들 닫기
        snsMarkersRef.current.forEach(m => {
          if (m.infowindow) {
            m.infowindow.close();
          }
        });
        infowindow.open(mapRef.current, marker);
      });
      
      // 마커에 인포윈도우 참조 저장
      marker.infowindow = infowindow;
      marker.restaurantData = restaurant;
      
      snsMarkersRef.current.push(marker);
    });

    console.log(`🌟 SNS 맛집 ${snsRestaurants.length}개 마커 표시 완료`);
  }, [snsRestaurants]);

  // SNS 모드 변경 시 마커 표시/숨김 처리
  useEffect(() => {
    if (showSnsMode && snsRestaurants.length > 0) {
      displaySnsMarkers();
    } else {
      clearSnsMarkers();
    }
  }, [showSnsMode, snsRestaurants, displaySnsMarkers]);

  // 장소 검색 함수를 useCallback으로 메모이제이션
  const searchPlaces = useCallback((keyword, useCurrentPosition = false) => {
    console.log('검색 시작:', { keyword, distance, useCurrentPosition });
    
    if (!window.kakao || !window.kakao.maps || !mapRef.current) {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return;
    }
    
    if (!placesRef.current) {
      placesRef.current = new window.kakao.maps.services.Places();
    }
    
    // 기존 마커들 제거
    setMapError(null);
    removeAllMarkers();
    
    // 현재 지도 중심 좌표 가져오기
    if (mapRef.current) {
      centerRef.current = mapRef.current.getCenter();
    }
    
    // 검색 옵션 설정
    const searchLocation = useCurrentPosition ? currentPositionRef.current : centerRef.current;
    
    const searchOptions = {
      location: searchLocation,
      radius: 5000
    };
    
    // 장소 검색 실행
    placesRef.current.keywordSearch(keyword, (data, status) => {
      console.log('카카오맵 검색 결과:', { status, data, keyword });
      
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
          
          // 마커에 place 정보 저장
          marker.placeInfo = place;
          
          markersRef.current.push(marker);
          bounds.extend(position);
          results.push(place);
        });
        
        // 검색 결과 바운드로 지도 이동
        if (useCurrentPosition) {
          mapRef.current.setBounds(bounds);
        }
        mapRef.current.setLevel(5);
        
        if (useCurrentPosition && currentPositionRef.current) {
          mapRef.current.setCenter(currentPositionRef.current);
          mapRef.current.setLevel(5);
          setTimeout(() => {
            mapRef.current.setCenter(currentPositionRef.current);
          }, 0);
        }
        
        // 검색된 장소들 상태 업데이트
        setCurrentPlaces(results);
        
        // 검색 결과 콜백으로 전달
        onSearchComplete(results);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        const locationMessage = searchOptions.location === currentPositionRef.current ? 
          '현재 위치' : '현재 지도 화면';
        setMapError(`'${keyword}' 검색 결과가 ${locationMessage} 기준 5km 내에 존재하지 않습니다.`);
        setCurrentPlaces([]);
        onSearchComplete([]);
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        console.error('카카오맵 검색 오류:', status);
        setMapError('검색 중 오류가 발생했습니다.');
        setCurrentPlaces([]);
        onSearchComplete([]);
      }
    }, searchOptions);
  }, [distance, onSearchComplete]);
  
  // 검색 키워드가 변경될 때 검색 실행
  useEffect(() => {
    if (
      mapRef.current &&
      searchKeyword &&
      searchCount > 0 &&
      lastSearchRef.current !== `${searchKeyword}_${searchCount}`
    ) {
      setMapError(null);
      const effectiveKeyword = searchKeyword || '맛집';
      searchPlaces(effectiveKeyword, false);
      lastSearchRef.current = `${searchKeyword}_${searchCount}`;
    }
  }, [searchKeyword, searchCount, searchPlaces]);
  
  // 지도 초기화
  useEffect(() => {
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
      const mapLevel = 7;

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
        level: mapLevel,
      };
      
      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);
      mapRef.current = map;
      
      // 지도 이벤트 리스너들
      window.kakao.maps.event.addListener(map, 'dragend', function() {
        centerRef.current = map.getCenter();
      });
      
      window.kakao.maps.event.addListener(map, 'zoom_changed', function() {
        centerRef.current = map.getCenter();
      });
      
      centerRef.current = map.getCenter();
      
      // 전역 접근을 위한 인스턴스 저장
      window.kakaoMapInstance = {
        map: map,
        getPlaces: () => currentPlaces,
        getCenter: () => centerRef.current,
        getBounds: () => map.getBounds(),
        clearSnsMarkers: clearSnsMarkers,
        markersRef: markersRef
      };
      
      // onMapReady 콜백 실행
      onMapReady(window.kakaoMapInstance);
      
      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const currentPosition = new window.kakao.maps.LatLng(lat, lng);
            currentPositionRef.current = currentPosition;
            
            // 현재 위치로 지도 중심 이동
            map.setCenter(currentPosition);
            map.setLevel(5);
            
            centerRef.current = currentPosition;
            
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
            
            window.kakao.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map, marker);
            });
            
            markerRef.current = marker;
          },
          (error) => {
            console.error('위치 정보 가져오기 실패:', error);
            let errorMessage = '위치 정보를 가져오는데 실패했습니다.';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '위치 정보 접근이 거부되었습니다.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = '위치 정보를 사용할 수 없습니다.';
                break;
              case error.TIMEOUT:
                errorMessage = '위치 정보 요청이 시간 초과되었습니다.';
                break;
              default:
                errorMessage = '알 수 없는 오류가 발생했습니다.';
                break;
            }
            
            setMapError(errorMessage);
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setMapError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      }
    }
    
    // 정리 함수
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      removeAllMarkers();
      clearSnsMarkers();
    };
  }, [onMapReady]);

  // 거리 변경 시 지도 레벨 업데이트
  useEffect(() => {
    if (mapRef.current && window.kakao && window.kakao.maps) {
      let level = 3;
      if (distance <= 50) level = 3;
      else if (distance <= 100) level = 4;
      else if (distance <= 250) level = 5;
      else if (distance <= 500) level = 6;
      else if (distance <= 1000) level = 7;
      mapRef.current.setLevel(level);
    }
  }, [distance]);

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
          height: '100%',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      ></div>
      
      {/* 현재 위치에서 검색하는 버튼 */}
      <button
        className="map-search-button"
        onClick={() => {
          if (searchKeyword) {
            lastSearchRef.current = "";
            const effectiveKeyword = searchKeyword || '맛집';
            searchPlaces(effectiveKeyword, true);
          }
        }}
        style={{
          display: searchKeyword ? 'block' : 'none',
        }}
      >
        현재 위치에서 검색
      </button>
    </div>
  );
});

export default KakaoMap;
