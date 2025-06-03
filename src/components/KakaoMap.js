import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import '../styles/KakaoMap.css';
import axios from 'axios'; // axios 추가

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
  const centerRef = useRef(null);  const lastSearchRef = useRef('');
  const [currentPlaces, setCurrentPlaces] = useState([]); // 현재 검색된 장소들
  const [isFetchingSns, setIsFetchingSns] = useState(false); // SNS 추천 데이터 로딩 상태
  const [snsError, setSnsError] = useState(null); // SNS 추천 에러 상태

  // SNS 추천 데이터 가져오기
  const fetchSnsRecommendations = async () => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isFetchingSns) return;
    
    try {
      setIsFetchingSns(true);
      setSnsError(null);
      
      // 현재 위치 또는 지도 중심 좌표 가져오기
      const currentLocation = currentPositionRef.current || centerRef.current;
      if (!currentLocation) {
        setSnsError('위치 정보를 가져올 수 없습니다.');
        return;
      }
      
      const lat = currentLocation.getLat();
      const lng = currentLocation.getLng();
      
      console.log('SNS 추천 요청:', { lat, lng });
      
      // 백엔드 크롤링 API 호출
      const response = await axios.get('http://localhost:5001/api/recommendations', {
        params: {
          lat,
          lng,
          radius: distance || 1000,
          limit: 10
        }
      });
        console.log('SNS 추천 응답:', response.data);
      
      if (response.data && response.data.restaurants && response.data.restaurants.length > 0) {
        // 기존 마커 제거 - SNS 추천 버튼 클릭 시 모든 마커 제거
        console.log('SNS 추천: 기존 마커 제거 시작');
        removeAllMarkers(); // 일반 마커 제거
        clearSnsMarkers();  // SNS 마커 제거
        
        // SNS 추천 마커 표시
        const formattedRestaurants = response.data.restaurants.map(restaurant => ({
          map_info: {
            place_name: restaurant.name,
            address_name: restaurant.address,
            x: restaurant.longitude,
            y: restaurant.latitude
          },
          sns_info: {
            sns_mentions: restaurant.mentions || 0,
            rating: restaurant.rating || 0,
            review_count: restaurant.reviews || 0,
            tags: restaurant.tags || []
          },
          match_score: restaurant.score || 0.8
        }));
        
        // snsRestaurants 상태 업데이트 (props로 전달된 함수 사용)
        if (typeof onSearchComplete === 'function') {
          onSearchComplete(formattedRestaurants);
        }
        
        // SNS 마커 표시
        displaySnsMarkers(formattedRestaurants);
      } else {
        setSnsError('현재 위치 주변에 추천할 SNS 맛집이 없습니다.');
      }    } catch (error) {
      console.error('SNS 추천 에러:', error);
      setSnsError('SNS 추천 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingSns(false);
    }
  };
  
  // 외부에서 접근 가능한 메서드들을 정의
  useImperativeHandle(ref, () => ({
    getPlaces: () => currentPlaces,
    getCenter: () => centerRef.current,
    getBounds: () => mapRef.current?.getBounds(),
    clearSnsMarkers: clearSnsMarkers,
    fetchSnsRecommendations: fetchSnsRecommendations // SNS 추천 함수 추가
  }));
  
  // SNS 마커 표시 함수 (snsRestaurants를 파라미터로 받도록 수정)
  const displaySnsMarkers = useCallback((restaurants = snsRestaurants) => {
    if (!mapRef.current || !restaurants || !restaurants.length) return;

    console.log('SNS 마커 표시 시작:', restaurants.length);

    // 기존 SNS 마커들 제거
    clearSnsMarkers();
    // 일반 마커들을 모두 제거하는 함수
  const removeAllMarkers = () => {
    console.log('마커 제거 전 상태:', {
      일반마커: markersRef.current.length,
      SNS마커: snsMarkersRef.current.length
    });
    
    if (markersRef.current.length > 0) {
      // 기존 마커 제거 전에 보존해야 할 마커 확인
      const markersToPreserve = snsMarkersRef.current.map(snsMarker => snsMarker.getPosition().toString());
      
      // 일반 마커만 제거
      markersRef.current.forEach(marker => {
        const markerPosition = marker.getPosition().toString();
        
        // SNS 마커와 위치가 동일한 일반 마커는 유지 (중복 방지)
        if (!markersToPreserve.includes(markerPosition)) {
          marker.setMap(null);
        }
      });
      
      markersRef.current = [];
      console.log('일반 마커 제거 완료');
    }
  };

  // SNS 마커들을 모두 제거하는 함수
  const clearSnsMarkers = () => {
    if (snsMarkersRef.current.length > 0) {
      snsMarkersRef.current.forEach(marker => marker.setMap(null));
      snsMarkersRef.current = [];
      console.log('SNS 마커 제거 완료');
    }
  };

    // SNS 마커 위치 추적을 위한 배열
    const snsMarkerPositions = [];

    snsRestaurants.forEach((restaurant) => {
      const mapInfo = restaurant.map_info;
      const snsInfo = restaurant.sns_info;
      
      if (!mapInfo.x || !mapInfo.y) {
        console.warn('위치 정보가 없는 맛집:', mapInfo.place_name);
        return;
      }

      const position = new window.kakao.maps.LatLng(mapInfo.y, mapInfo.x);
      snsMarkerPositions.push(position.toString());
      
      // SNS 마커 이미지 생성 (빨간색으로 구분)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(64, 69);
      const imageOption = { offset: new window.kakao.maps.Point(27, 69) };
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      const marker = new window.kakao.maps.Marker({
        map: mapRef.current,
        position: position,
        image: markerImage,
        zIndex: 10 // 일반 마커보다 위에 표시
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
        content: infoContent,
        removable: true
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
    
    // 일반 마커 중에서 SNS 마커와 위치가 동일한 마커가 있다면 잠시 숨기기
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        const markerPosition = marker.getPosition().toString();
        if (snsMarkerPositions.includes(markerPosition)) {
          marker.setVisible(false);
        }
      });
    }
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
    console.log('🔍 검색 시작:', { 
      키워드: keyword, 
      거리: distance, 
      현재위치사용: useCurrentPosition,
      마커상태: {
        일반마커: markersRef.current.length,
        SNS마커: snsMarkersRef.current.length,
        SNS모드: showSnsMode
      }
    });
    
    if (!window.kakao || !window.kakao.maps || !mapRef.current) {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return;
    }
    
    if (!placesRef.current) {
      placesRef.current = new window.kakao.maps.services.Places();
    }
    
    // 새로운 검색 시 기존 마커들 제거 (SNS 마커는 showSnsMode가 true일 때만 유지)
    setMapError(null);
    
    // 마커 관리
    if (showSnsMode) {
      // SNS 모드에서는 일반 마커만 제거하고 SNS 마커는 유지
      removeAllMarkers();
    } else {
      // 일반 모드에서는 모든 마커 제거 
      removeAllMarkers();
      clearSnsMarkers();
    }
    
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
      console.log('카카오맵 검색 결과:', { 
        상태: status, 
        결과수: data?.length || 0,
        키워드: keyword 
      });
      
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        const results = [];
        
        // 검색 결과마다 마커 생성
        data.forEach((place) => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          
          // SNS 마커와 위치가 같은 마커는 생성하지 않음 (충돌 방지)
          if (showSnsMode) {
            const isDuplicate = snsMarkersRef.current.some(snsMarker => 
              snsMarker.getPosition().equals(position)
            );
            if (isDuplicate) {
              console.log(`중복 마커 방지: ${place.place_name} (SNS 마커와 위치 동일)`);
              results.push(place);  // 결과에는 포함
              bounds.extend(position);  // 바운드에는 포함
              return;  // 마커는 생성하지 않음
            }
          }
          
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
        
        // 로그 추가: 검색 후 마커 상태 확인
        console.log('검색 완료 후 마커 상태:', {
          일반마커: markersRef.current.length,
          SNS마커: snsMarkersRef.current.length,
          검색키워드: keyword
        });
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
      
      // 검색 전 상태 로깅
      console.log('검색 전 마커 상태:', {
        일반마커: markersRef.current.length,
        SNS마커: snsMarkersRef.current.length,
        검색키워드: searchKeyword,
        검색카운트: searchCount
      });
      
      // 검색어가 완전히 다른 경우 마커 비우기
      if (lastSearchRef.current && !lastSearchRef.current.includes(searchKeyword)) {
        removeAllMarkers();
      }
      
      const effectiveKeyword = searchKeyword || '맛집';
      searchPlaces(effectiveKeyword, false);
      
      // 현재 검색 저장
      lastSearchRef.current = `${searchKeyword}_${searchCount}`;
      
      // 검색 후 마커 상태 확인용 타이머
      setTimeout(() => {
        console.log('검색 후 마커 상태:', {
          일반마커: markersRef.current.length,
          SNS마커: snsMarkersRef.current.length
        });
      }, 1000);
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
      
      {snsError && (
        <div className="map-error sns-error">
          <p>{snsError}</p>
        </div>
      )}
      
      {isFetchingSns && (
        <div className="loading-indicator">
          <p>SNS 맛집 추천 데이터를 가져오는 중...</p>
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
          bottom: '80px', // SNS 추천 버튼 위에 위치하도록 조정
          right: '20px' // 우측에 배치
        }}
      >
        현재 위치에서 검색
      </button>
      
      {/* SNS 추천 버튼 추가 */}
      <button
        className="map-search-button sns-recommend-button"
        onClick={() => {
          // SNS 추천 버튼 클릭 시 백엔드 크롤링 DB와 통신
          fetchSnsRecommendations();
        }}
        style={{
          bottom: '20px',
          right: '20px', // 우측에 배치
          backgroundColor: '#ff6b6b', // 다른 색상으로 구분
          fontWeight: 'bold',
          border: '2px solid white',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
        }}
      >
        SNS 맛집 추천
      </button>
    </div>
  );
});

export default KakaoMap;
