import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../styles/KakaoMap.css';

function KakaoMap({ distance = 1000, searchKeyword = '', searchCount = 0, onSearchComplete = () => {}, places, activePlace }) {
  const [mapError, setMapError] = useState(null);
  const [searchCenter, setSearchCenter] = useState(null); // 검색 중심 좌표 상태
  const mapRef = useRef(null);
  const currentLocationMarkerRef = useRef(null); // 현재 위치 마커
  const customLocationMarkerRef = useRef(null); // 사용자가 클릭한 위치 마커
  const markersRef = useRef([]);
  const placesRef = useRef(null);
  const currentPositionRef = useRef(null);
  const centerRef = useRef(null); // 지도의 현재 중심 좌표를 저장할 ref
  const lastSearchRef = useRef(''); // track last searched keyword to prevent repeats
    // 마커들을 모두 제거하는 함수 (검색 결과 마커만 제거)
  const removeSearchMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  };

  // 커스텀 위치 마커 생성/업데이트 함수
  const setCustomLocationMarker = (position) => {
    if (!mapRef.current) return;

    // 기존 커스텀 마커 제거
    if (customLocationMarkerRef.current) {
      customLocationMarkerRef.current.setMap(null);
    }

    // 파란색 마커 이미지 설정
    const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
    const imageSize = new window.kakao.maps.Size(24, 35);
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

    // 새 커스텀 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage
    });
    marker.setMap(mapRef.current);
    customLocationMarkerRef.current = marker;

    // 인포윈도우 생성
    const infowindow = new window.kakao.maps.InfoWindow({
      content: '<div style="padding:5px;font-size:12px;color:#1e40af;">검색 위치</div>'
    });

    // 마커 클릭 이벤트
    window.kakao.maps.event.addListener(marker, 'click', function() {
      infowindow.open(mapRef.current, marker);
    });

    // 검색 중심 좌표 업데이트
    setSearchCenter(position);
  };

  // 현재 위치 마커 생성/업데이트 함수
  const setCurrentLocationMarker = (position) => {
    if (!mapRef.current) return;

    // 기존 현재 위치 마커 제거
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    // 빨간색 마커 이미지 설정
    const imageSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAyNCAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDMuNUM3LjMwNTU4IDMuNSAzLjUgNy4zMDU1OCAzLjUgMTJDMy41IDE4LjUgMTIgMzEuNSAxMiAzMS41UzIwLjUgMTguNSAyMC41IDEyQzIwLjUgNy4zMDU1OCAxNi42OTQ0IDMuNSAxMiAzLjVaIiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
    const imageSize = new window.kakao.maps.Size(24, 35);
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

    // 새 현재 위치 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage
    });
    marker.setMap(mapRef.current);
    currentLocationMarkerRef.current = marker;

    // 인포윈도우 생성
    const infowindow = new window.kakao.maps.InfoWindow({
      content: '<div style="padding:5px;font-size:12px;color:#ef4444;">현재 위치</div>'
    });

    // 마커 클릭 이벤트
    window.kakao.maps.event.addListener(marker, 'click', function() {
      infowindow.open(mapRef.current, marker);
    });
  };
    // 장소 검색 함수를 useCallback으로 메모이제이션 (45개 결과 pagination 지원)
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
    removeSearchMarkers();
    
    // 검색 중심 좌표 결정
    let searchLocation;
    if (useCurrentPosition && currentPositionRef.current) {
      searchLocation = currentPositionRef.current;
      setSearchCenter(currentPositionRef.current);
    } else if (searchCenter) {
      searchLocation = searchCenter;
    } else {
      searchLocation = mapRef.current ? mapRef.current.getCenter() : new window.kakao.maps.LatLng(37.5665, 126.9780);
    }
    
    console.log('검색 위치:', { 
      useCurrentPosition, 
      searchLocation: searchLocation?.toString(),
      searchCenter: searchCenter?.toString(),
      userPosition: currentPositionRef.current?.toString()
    });
    
    const searchOptions = {
      location: searchLocation,
      radius: distance, // distance prop 사용 (기본값: 1000m)
    };
    
    // 페이지네이션으로 최대 45개 결과 수집
    searchWithPagination(keyword, searchOptions, useCurrentPosition);
  }, [distance, onSearchComplete, searchCenter]);

  // 페이지네이션을 통해 최대 45개 결과를 수집하는 함수
  const searchWithPagination = async (keyword, searchOptions, useCurrentPosition) => {
    const allResults = [];
    const bounds = new window.kakao.maps.LatLngBounds();
    let hasMorePages = true;
    let currentPage = 1;
    const maxPages = 3; // 최대 3페이지 (페이지당 최대 15개 = 총 45개)

    console.log('페이지네이션 검색 시작 - 최대 45개 결과 수집');

    while (hasMorePages && currentPage <= maxPages) {
      try {
        const pageResults = await searchSinglePage(keyword, searchOptions, currentPage);
        
        if (pageResults.length === 0) {
          console.log(`페이지 ${currentPage}: 검색 결과 없음`);
          hasMorePages = false;
          break;
        }

        console.log(`페이지 ${currentPage}: ${pageResults.length}개 결과 추가`);
        allResults.push(...pageResults);

        // 마커 생성
        pageResults.forEach((place) => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({
            map: mapRef.current,
            position: position
          });
          
          // 인포윈도우 생성
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`
          });
          
          // 마커 이벤트 등록
          window.kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(mapRef.current, marker);
          });
          
          window.kakao.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.open(mapRef.current, marker);
          });
          
          window.kakao.maps.event.addListener(marker, 'mouseout', function() {
            infowindow.close();
          });
          
          markersRef.current.push(marker);
          bounds.extend(position);
        });

        // 15개 미만이면 더 이상 페이지가 없음
        if (pageResults.length < 15) {
          hasMorePages = false;
        }

        currentPage++;
        
        // 다음 페이지 요청 전 짧은 지연
        if (hasMorePages && currentPage <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`페이지 ${currentPage} 검색 오류:`, error);
        hasMorePages = false;
      }
    }

    console.log(`페이지네이션 검색 완료: 총 ${allResults.length}개 결과 수집`);

    // 검색 결과 처리
    if (allResults.length > 0) {
      // 지도 중심 조정
      if (useCurrentPosition) {
        mapRef.current.setBounds(bounds);
      }
      mapRef.current.setLevel(Math.min(mapRef.current.getLevel(), 7));
      
      // 백엔드로 데이터 전송
      await sendSearchResultsToBackend(allResults, keyword, searchOptions.location);
      
      // 검색 결과 콜백으로 전달
      onSearchComplete(allResults);
    } else {
      const locationMessage = useCurrentPosition ? '현재 위치' : searchCenter ? '선택한 위치' : '현재 지도 화면';
      const distanceKm = distance >= 1000 ? `${distance/1000}km` : `${distance}m`;
      setMapError(`'${keyword}' 검색 결과가 ${locationMessage} 기준 ${distanceKm} 내에 존재하지 않습니다.`);
      onSearchComplete([]);
    }
  };

  // 단일 페이지 검색을 Promise로 래핑
  const searchSinglePage = (keyword, searchOptions, page) => {
    return new Promise((resolve, reject) => {
      const pageOptions = { ...searchOptions, page };
      
      placesRef.current.keywordSearch(keyword, (data, status, pagination) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(data);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
        } else {
          reject(new Error(`검색 오류: ${status}`));
        }
      }, pageOptions);
    });
  };

  // 백엔드로 검색 결과 전송
  const sendSearchResultsToBackend = async (searchResults, searchKeyword, searchLocation) => {
    try {
      console.log('백엔드로 검색 결과 전송:', {
        count: searchResults.length,
        keyword: searchKeyword,
        location: { lat: searchLocation.getLat(), lng: searchLocation.getLng() }
      });

      const response = await fetch('/api/restaurants/process-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResults: searchResults,
          searchKeyword: searchKeyword,
          searchLocation: {
            lat: searchLocation.getLat(),
            lng: searchLocation.getLng()
          },
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('백엔드 응답:', result);
      } else {
        console.error('백엔드 전송 실패:', response.statusText);
      }
    } catch (error) {
      console.error('백엔드 전송 오류:', error);
    }
  };
  
  // 검색 키워드가 변경될 때 검색 실행 (한 번만 수행)
  useEffect(() => {
    // 무한루프 방지: searchKeyword가 비어있지 않고, searchCount가 0보다 클 때만 검색
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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // 이미 스크립트가 있으면 중복 추가 방지
    if (!window.kakao) {
      const script = document.createElement('script');
      script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=c6d12eab1ef43ca9745a713e8669183b&libraries=services&autoload=false";
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
      
      // 초기 지도 레벨 설정 (기본값: 1km 범위)
      const mapLevel = 5; // 1km에 대응하는 레벨

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
        level: mapLevel,
      };
      
      // 지도 생성
      const map = new window.kakao.maps.Map(container, options);
      mapRef.current = map;
        // 지도 이동 이벤트 리스너 추가
      window.kakao.maps.event.addListener(map, 'dragend', function() {
        // 지도 중심 좌표 업데이트
        centerRef.current = map.getCenter();
        console.log('지도 중심 변경:', centerRef.current.toString());
      });
      
      // 지도 확대/축소 이벤트 리스너 추가
      window.kakao.maps.event.addListener(map, 'zoom_changed', function() {
        // 지도 중심 좌표 업데이트
        centerRef.current = map.getCenter();
        console.log('지도 줌 변경:', centerRef.current.toString());
      });

      // 지도 클릭 이벤트 리스너 추가 (커스텀 핀 설정)
      window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        const clickPosition = mouseEvent.latLng;
        console.log('지도 클릭:', clickPosition.toString());
        
        // 커스텀 위치 마커 설정
        setCustomLocationMarker(clickPosition);
      });
      
      // 초기 중심 좌표 설정
      centerRef.current = map.getCenter();
      
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
            map.setLevel(5); // 250m 축척으로 지도 레벨 변경
              // 지도 중심 좌표 업데이트
            centerRef.current = currentPosition;
            
            // 현재 위치 마커 생성
            setCurrentLocationMarker(currentPosition);
            
            // 검색 중심을 현재 위치로 초기 설정
            setSearchCenter(currentPosition);
            
            // 검색어가 있다면 검색 실행
            // 검색어가 있다면 검색 실행
            // 검색은 useEffect에서 searchKeyword 변경 시 처리됩니다
            
            // 마커 초기화 완료 후 추가 작업이 필요하다면 이곳에 작성
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
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
      if (customLocationMarkerRef.current) {
        customLocationMarkerRef.current.setMap(null);
      }
      removeSearchMarkers();
    };
  }, []);

  // 거리 변경 시 지도 레벨 업데이트
  useEffect(() => {
    if (mapRef.current && window.kakao && window.kakao.maps) {
      // calculate map level based on distance
      let level = 3;
      if (distance <= 50) level = 3;
      else if (distance <= 100) level = 4;
      else if (distance <= 250) level = 5;
      else if (distance <= 500) level = 6;
      else if (distance <= 1000) level = 7;
      mapRef.current.setLevel(level);
    }
  }, [distance]);
  // 다중 장소 마커 업데이트 useEffect
  useEffect(() => {
    if (mapRef.current && places && places.length > 0 && window.kakao && window.kakao.maps) {
      console.log('다중 장소 마커 업데이트:', places);
      
      // 기존 검색 마커들은 유지하고, 장소별 마커만 관리
      // 여기서는 실제 검색 기능과 분리하여 장소 관리 기능만 구현
      // 실제 검색 결과는 searchPlaces 함수에서 처리됨
    }
  }, [places, activePlace]);

  return (
    <div className="map-container">
      {mapError && (
        <div className="map-error">
          <p>{mapError}</p>
        </div>
      )}
      
      {/* 지도 컨트롤 버튼들 */}
      <div className="map-controls">
        <button
          className="map-control-button reset"
          onClick={() => {
            if (currentPositionRef.current) {
              // 커스텀 마커 제거하고 현재 위치로 검색 중심 리셋
              if (customLocationMarkerRef.current) {
                customLocationMarkerRef.current.setMap(null);
                customLocationMarkerRef.current = null;
              }
              setSearchCenter(currentPositionRef.current);
              mapRef.current.setCenter(currentPositionRef.current);
              mapRef.current.setLevel(5);
            }
          }}
          title="현재 위치로 검색 중심 리셋"
        >
          📍 현재 위치로
        </button>
      </div>

      {/* 현재 검색 중심 정보 표시 */}
      {searchCenter && (
        <div className="map-location-info">
          <div className="location-type">
            {searchCenter === currentPositionRef.current ? '🔴 현재 위치 기준' : '🔵 선택한 위치 기준'}
          </div>
          <div className="location-coords">
            검색 중심으로 설정됨
          </div>
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
            // 마지막 검색어 초기화하여 같은 키워드로 다시 검색 가능하게 함
            lastSearchRef.current = "";
            // 현재 위치 기준으로 검색
            const effectiveKeyword = searchKeyword || '맛집';
            searchPlaces(effectiveKeyword, true); // true = 현재 위치 사용
          }
        }}
        style={{
          display: searchKeyword ? 'block' : 'none', // 검색어가 있을 때만 표시
        }}
      >
        현재 위치에서 검색
      </button>
    </div>
  );
}

export default KakaoMap;