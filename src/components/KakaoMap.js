import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import '../styles/KakaoMap.css';

const KakaoMap = forwardRef(({ distance = 1000, searchKeyword = '', searchCount = 0, onSearchComplete = () => {}, places, activePlace, sortOption = 'distance', placeType }, ref) => {
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
  const singlePinMarkerRef = useRef(null); // 단일 핀 마커 참조
  // 부모 컴포넌트에서 호출할 수 있는 메서드들 정의
  useImperativeHandle(ref, () => ({
    showSinglePin: (restaurant) => {
      showSinglePin(restaurant);
    },
    showRoute: (startPlace, endPlace) => {
      return showRoute(startPlace, endPlace);
    },
    showMultiRoute: (searchCenter, places) => {
      return showMultiRoute(searchCenter, places);
    },
    getCenter: () => {
      return mapRef.current ? mapRef.current.getCenter() : null;
    },
    getSearchCenter: () => {
      return searchCenter;
    },
    setCenter: (position) => {
      if (mapRef.current && position) {
        mapRef.current.setCenter(position);
      }
    },
    clearRoute: () => {
      clearRoute();
    }
  }));

  // 경로 표시 관련 상태
  const routePolylineRef = useRef(null); // 경로 폴리라인 참조
  const routeMarkersRef = useRef([]); // 경로 마커들 참조

  // 단일 핀 표시 함수
  const showSinglePin = (restaurant) => {
    if (!mapRef.current || !restaurant) return;

    // 기존 검색 마커들 제거
    removeSearchMarkers();
    
    // 기존 단일 핀 제거
    if (singlePinMarkerRef.current) {
      singlePinMarkerRef.current.setMap(null);
    }

    // 레스토랑 위치 좌표 생성
    const position = new window.kakao.maps.LatLng(restaurant.y, restaurant.x);
    
    // 빨간색 마커 이미지 설정
    const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
    const imageSize = new window.kakao.maps.Size(36, 40);
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

    // 단일 핀 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage
    });
    marker.setMap(mapRef.current);
    singlePinMarkerRef.current = marker;

    // 인포윈도우 생성
    const infoContent = `
      <div style="padding:10px;font-size:12px;max-width:200px;">
        <strong>${restaurant.place_name}</strong><br/>
        ${restaurant.address_name}<br/>
        ${restaurant.phone || ''}
      </div>
    `;
    
    const infowindow = new window.kakao.maps.InfoWindow({
      content: infoContent
    });

    // 마커 클릭 시 인포윈도우 표시
    window.kakao.maps.event.addListener(marker, 'click', function() {
      infowindow.open(mapRef.current, marker);
    });

    // 지도 중심을 선택된 레스토랑으로 이동
    mapRef.current.setCenter(position);
    mapRef.current.setLevel(3); // 더 가까이 줌인
  };
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

  // 장소 유형에 따른 카테고리 코드 반환 함수
  const getCategoryCode = (placeType) => {
    switch (placeType) {
      case 'restaurant':
        return ['FD6']; // 음식점
      case 'cafe':
        return ['CE7', 'CS2']; // 카페 + 편의점/간식
      default:
        return null; // 카테고리 필터 없음
    }
  };

  // 다중 카테고리 검색 함수
  const searchMultipleCategories = async (keyword, searchOptions, categoryCodes, useCurrentPosition) => {
    const allResults = [];
    const bounds = new window.kakao.maps.LatLngBounds();
    const seenPlaceIds = new Set(); // 중복 제거를 위한 Set

    console.log('다중 카테고리 검색 시작:', categoryCodes);

    for (const categoryCode of categoryCodes) {
      try {
        console.log(`카테고리 ${categoryCode} 검색 중...`);
        const categoryResults = await searchSingleCategoryWithPagination(keyword, {
          ...searchOptions,
          category_group_code: categoryCode
        });

        // 중복 제거하면서 결과 추가
        categoryResults.forEach((place) => {
          if (!seenPlaceIds.has(place.id)) {
            seenPlaceIds.add(place.id);
            allResults.push(place);
          }
        });

        console.log(`카테고리 ${categoryCode}: ${categoryResults.length}개 결과, 총 ${allResults.length}개`);
        
        // 카테고리 간 요청 간격
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`카테고리 ${categoryCode} 검색 오류:`, error);
      }
    }

    // 마커 생성
    allResults.forEach((place) => {
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

    console.log(`다중 카테고리 검색 완료: 총 ${allResults.length}개 결과 수집`);

    // 검색 결과 처리
    if (allResults.length > 0) {
      // 지도 중심 조정
      if (useCurrentPosition) {
        mapRef.current.setBounds(bounds);
      }
      mapRef.current.setLevel(Math.min(mapRef.current.getLevel(), 7));
      
      // 백엔드로 데이터 전송 (기존 로그용)
      await sendSearchResultsToBackend(allResults, keyword, searchOptions.location);
      
      // 정렬 옵션에 따라 추천 백엔드와 통신하여 재정렬
      const finalResults = await fetchRecommendedResults(allResults, sortOption);
      
      // 최종 결과를 콜백으로 전달
      onSearchComplete(finalResults);
    } else {
      const locationMessage = useCurrentPosition ? '현재 위치' : searchCenter ? '선택한 위치' : '현재 지도 화면';
      const distanceKm = distance >= 1000 ? `${distance/1000}km` : `${distance}m`;
      setMapError(`'${keyword}' 검색 결과가 ${locationMessage} 기준 ${distanceKm} 내에 존재하지 않습니다.`);
      onSearchComplete([]);
    }
  };

  // 단일 카테고리 페이지네이션 검색 함수
  const searchSingleCategoryWithPagination = async (keyword, searchOptions) => {
    const allResults = [];
    let hasMorePages = true;
    let currentPage = 1;
    const maxPages = 2; // 카테고리별 최대 2페이지 (총 30개)

    while (hasMorePages && currentPage <= maxPages) {
      try {
        const pageResults = await searchSinglePage(keyword, searchOptions, currentPage);
        
        if (pageResults.length === 0) {
          hasMorePages = false;
          break;
        }

        allResults.push(...pageResults);

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

    return allResults;
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
    
    // 장소 유형에 따른 카테고리 필터 추가
    const categoryCodes = getCategoryCode(placeType);
    if (categoryCodes && categoryCodes.length > 0) {
      if (categoryCodes.length === 1) {
        // 단일 카테고리인 경우
        searchOptions.category_group_code = categoryCodes[0];
        console.log(`카테고리 필터 적용: ${placeType} (${categoryCodes[0]})`);
        searchWithPagination(keyword, searchOptions, useCurrentPosition);
      } else {
        // 여러 카테고리인 경우 각각 검색해서 결과 합치기
        console.log(`다중 카테고리 필터 적용: ${placeType} (${categoryCodes.join(', ')})`);
        searchMultipleCategories(keyword, searchOptions, categoryCodes, useCurrentPosition);
      }
    } else {
      // 카테고리 필터 없이 검색
      searchWithPagination(keyword, searchOptions, useCurrentPosition);
    }
  }, [distance, onSearchComplete, searchCenter, placeType]);

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
      
      // 백엔드로 데이터 전송 (기존 로그용)
      await sendSearchResultsToBackend(allResults, keyword, searchOptions.location);
      
      // 정렬 옵션에 따라 추천 백엔드와 통신하여 재정렬
      const finalResults = await fetchRecommendedResults(allResults, sortOption);
      
      // 최종 결과를 콜백으로 전달
      onSearchComplete(finalResults);
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

      const response = await fetch('http://localhost:5001/api/restaurants/process-search', {
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

  // SNS 인기순으로 검색 결과 재정렬 (추천 백엔드와 통신)
  const fetchRecommendedResults = async (searchResults, sortOption = 'distance') => {
    // 거리순인 경우에만 백엔드 통신 없이 원본 반환
    if (sortOption === 'distance') {
      return searchResults;
    }

    try {
      console.log('추천 백엔드 통신 시작:', { sortOption, count: searchResults.length });
      
      // 추천 백엔드 URL
      const backendUrl = 'http://localhost:8000/recommend';
      
      // 정렬 옵션을 백엔드 형식으로 변환
      let rankingPreference = 'distance';
      if (sortOption === 'sns') {
        rankingPreference = 'instagram';
      } else if (sortOption === 'rating') {
        rankingPreference = 'reviews';
      } else if (sortOption === 'balanced') {
        rankingPreference = 'balanced';
      }

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          places: searchResults.map(place => ({
            id: place.id,
            place_name: place.place_name,
            category_name: place.category_name,
            phone: place.phone || '',
            address_name: place.address_name,
            road_address_name: place.road_address_name,
            x: place.x,
            y: place.y,
            place_url: place.place_url,
            distance: place.distance
          })),
          ranking_preference: rankingPreference
        }),
      });

      if (!response.ok) {
        throw new Error(`백엔드 추천 API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('추천 백엔드 응답:', data);
      
      // 백엔드에서 받은 점수 정보를 포함한 결과를 반환
      return data.recommended_places.map(place => ({
        ...place,
        score: place.score,
        instagram_mentions: place.instagram_mentions,
        review_count: place.review_count
      }));
    } catch (error) {
      console.error('추천 시스템 오류:', error);
      alert('SNS 인기순 정렬 중 오류가 발생했습니다. 기본 검색 결과를 표시합니다.');
      // 추천 시스템 실패시 원본 결과 반환
      return searchResults;
    }
  };
  
  // 검색 키워드가 변경될 때 검색 실행 (한 번만 수행)
  useEffect(() => {
    // 무한루프 방지: searchKeyword가 비어있지 않고, searchCount가 0보다 클 때만 검색
    if (
      mapRef.current &&
      searchKeyword &&
      searchCount > 0 &&
      lastSearchRef.current !== `${searchKeyword}_${searchCount}_${sortOption}`
    ) {
      setMapError(null);
      const effectiveKeyword = searchKeyword || '맛집';
      searchPlaces(effectiveKeyword, false);
      lastSearchRef.current = `${searchKeyword}_${searchCount}_${sortOption}`;
    }
  }, [searchKeyword, searchCount, sortOption, searchPlaces]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // 카카오맵 초기화 함수
    const initializeKakaoMap = () => {
      try {
        // 카카오맵 객체 확인
        if (!window.kakao) {
          console.error('카카오맵 스크립트가 로드되지 않았습니다.');
          setMapError('카카오맵 스크립트를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }

        if (!window.kakao.maps) {
          console.error('카카오맵 라이브러리가 로드되지 않았습니다.');
          setMapError('카카오맵 라이브러리를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }

        // 카카오맵 라이브러리 로드 및 지도 생성
        window.kakao.maps.load(() => {
          console.log('카카오맵 라이브러리 로드 완료');
          createMap();
        });

      } catch (error) {
        console.error('카카오맵 초기화 오류:', error);
        setMapError(`카카오맵 초기화 실패: ${error.message}`);
      }
    };

    // 카카오맵이 이미 로드되어 있으면 바로 초기화
    if (window.kakao && window.kakao.maps) {
      initializeKakaoMap();
    } else {
      // 카카오맵 스크립트가 로드될 때까지 대기
      const checkKakaoMap = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakaoMap);
          initializeKakaoMap();
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkKakaoMap);
        if (!window.kakao || !window.kakao.maps) {
          setMapError('카카오맵 로드 타임아웃. 네트워크 연결을 확인하고 페이지를 새로고침해주세요.');
        }
      }, 10000);
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
      if (singlePinMarkerRef.current) {
        singlePinMarkerRef.current.setMap(null);
      }
      clearRoute();
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

  // 경로 표시 함수
  const showRoute = async (startPlace, endPlace) => {
    if (!mapRef.current || !startPlace || !endPlace) return null;

    console.log('경로 표시 요청:', { startPlace, endPlace });

    try {
      // 기존 경로 제거
      clearRoute();
      
      // 기존 검색 마커들 제거
      removeSearchMarkers();

      // 경로 계산
      const routeData = await calculateRoute(startPlace, endPlace);
      
      if (routeData) {
        // 지도에 경로 표시
        displayRouteOnMap(routeData, startPlace, endPlace);
        
        // 경로 정보 반환 (isEstimated 정보도 포함)
        return {
          distance: routeData.distance,
          duration: routeData.duration,
          toll: routeData.toll || 0,
          isEstimated: routeData.isEstimated || false
        };
      }
    } catch (error) {
      console.error('경로 표시 오류:', error);
      setMapError('경로를 찾을 수 없습니다.');
      return null;
    }

    return null;
  };

  // 다중 경로 표시 함수 (검색위치 → 1번장소 → 2번장소)
  const showMultiRoute = async (searchCenter, places) => {
    if (!mapRef.current || !searchCenter || places.length < 2) return null;

    console.log('다중 경로 표시 요청:', { searchCenter, places });

    try {
      // 기존 경로 제거
      clearRoute();
      
      // 기존 검색 마커들 제거
      removeSearchMarkers();

      // 경로 계산할 지점들 정의
      const startPoint = {
        x: searchCenter.getLng(),
        y: searchCenter.getLat(),
        place_name: '검색 위치'
      };
      
      const waypoint1 = places[0]; // 1번째 장소
      const waypoint2 = places[1]; // 2번째 장소

      // 각 구간별 경로 계산
      console.log('구간별 경로 계산 시작...');
      
      // 구간 1: 검색위치 → 1번장소
      const route1Data = await calculateRoute(startPoint, waypoint1);
      
      // 구간 2: 1번장소 → 2번장소  
      const route2Data = await calculateRoute(waypoint1, waypoint2);

      if (route1Data && route2Data) {
        // 지도에 다중 경로 표시
        displayMultiRouteOnMap([route1Data, route2Data], [startPoint, waypoint1, waypoint2]);
        
        // 경로 정보 반환
        const totalDistance = route1Data.distance + route2Data.distance;
        const totalDuration = route1Data.duration + route2Data.duration;
        const totalToll = (route1Data.toll || 0) + (route2Data.toll || 0);
        const isEstimated = route1Data.isEstimated || route2Data.isEstimated;

        return {
          totalDistance,
          totalDuration,
          totalToll,
          isEstimated,
          segments: [
            {
              from: startPoint.place_name,
              to: waypoint1.place_name,
              distance: route1Data.distance,
              duration: route1Data.duration,
              toll: route1Data.toll || 0,
              isEstimated: route1Data.isEstimated
            },
            {
              from: waypoint1.place_name,
              to: waypoint2.place_name,
              distance: route2Data.distance,
              duration: route2Data.duration,
              toll: route2Data.toll || 0,
              isEstimated: route2Data.isEstimated
            }
          ]
        };
      }
    } catch (error) {
      console.error('다중 경로 표시 오류:', error);
      setMapError('경로를 찾을 수 없습니다.');
      return null;
    }

    return null;
  };  // 카카오 모빌리티 API를 사용한 실제 경로 계산
  const calculateRoute = async (startPlace, endPlace) => {
    const startX = parseFloat(startPlace.x);
    const startY = parseFloat(startPlace.y);
    const endX = parseFloat(endPlace.x);
    const endY = parseFloat(endPlace.y);

    // 카카오 모빌리티 API 키
    const KAKAO_MOBILITY_API_KEY = '402798a9751102f837f8f9d70a7e8a35';

    try {
      console.log('카카오 모빌리티 API 호출 시도...');
      
      // GET 방식으로 쿼리 파라미터 구성
      const params = new URLSearchParams({
        origin: `${startX},${startY}`,
        destination: `${endX},${endY}`,
        priority: 'RECOMMEND',
        car_fuel: 'GASOLINE',
        car_hipass: 'false',
        alternatives: 'false',
        road_details: 'false'
      });

      // 카카오 모빌리티 길찾기 API 호출 (GET 방식)
      const response = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${KAKAO_MOBILITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('카카오 모빌리티 API 호출 성공!', data);

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const summary = route.summary;

          // 실제 경로 좌표들 (더 상세한 경로 표시를 위해)
          const coordinates = [];
          if (route.sections && route.sections.length > 0) {
            route.sections.forEach(section => {
              if (section.roads) {
                section.roads.forEach(road => {
                  if (road.vertexes) {
                    // vertexes는 [lng, lat, lng, lat, ...] 형태
                    for (let i = 0; i < road.vertexes.length; i += 2) {
                      coordinates.push({
                        lng: road.vertexes[i],
                        lat: road.vertexes[i + 1]
                      });
                    }
                  }
                });
              }
            });
          }

          // 좌표가 없으면 시작점과 끝점만 사용
          if (coordinates.length === 0) {
            coordinates.push(
              { lng: startX, lat: startY },
              { lng: endX, lat: endY }
            );
          }

          console.log('실제 경로 계산 성공:', {
            distance: summary.distance,
            duration: summary.duration,
            toll: summary.fare?.toll || 0,
            coordinates: coordinates.length
          });

          return {
            distance: summary.distance, // 미터 단위
            duration: summary.duration, // 초 단위
            toll: summary.fare?.toll || 0, // 원 단위
            coordinates: coordinates,
            isEstimated: false // 실제 경로임을 표시
          };
        }
      } else {
        console.error('카카오 모빌리티 API 응답 오류:', response.status, response.statusText);
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
    } catch (error) {
      console.error('카카오 모빌리티 API 호출 실패:', error.message);
      console.log('실패 원인:', error.name === 'TypeError' ? 'CORS 또는 네트워크 오류' : error.message);
      
      // API 호출 실패 시 알림 표시 후 직선거리 기반 계산으로 폴백
      alert('실제 경로 계산에 실패했습니다.\n직선거리 기준 예상 경로로 표시됩니다.');
      
      console.log('직선거리 기반 예상 경로로 폴백합니다.');
      
      const distance = calculateStraightDistance(startY, startX, endY, endX);
      const estimatedRoadDistance = distance * 1.3; // 직선거리의 1.3배로 도로거리 추정
      const estimatedDuration = Math.round(estimatedRoadDistance / 25 * 3600); // 25km/h 평균속도로 시간 계산
      const estimatedToll = estimatedRoadDistance > 10 ? 1000 : 0; // 10km 이상시 톨게이트 비용 추정

      return {
        distance: estimatedRoadDistance * 1000, // 미터 단위로 변환
        duration: estimatedDuration, // 초 단위
        toll: estimatedToll, // 원 단위
        coordinates: [
          { lng: startX, lat: startY },
          { lng: endX, lat: endY }
        ],
        isEstimated: true // 예상 경로임을 표시
      };
    }
  };

  // 직선 거리 계산 (Haversine formula)
  const calculateStraightDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 지도에 경로 표시
  const displayRouteOnMap = (routeData, startPlace, endPlace) => {
    if (!mapRef.current || !routeData.coordinates) return;

    // 경로 좌표를 카카오맵 LatLng 객체로 변환
    const path = routeData.coordinates.map(coord => 
      new window.kakao.maps.LatLng(coord.lat, coord.lng)
    );

    // 폴리라인 생성
    const polyline = new window.kakao.maps.Polyline({
      path: path,
      strokeWeight: 5,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });

    // 지도에 폴리라인 표시
    polyline.setMap(mapRef.current);
    routePolylineRef.current = polyline;

    // 시작점과 끝점 마커 생성
    createRouteMarkers(startPlace, endPlace);

    // 지도 화면을 경로에 맞게 조정
    const bounds = new window.kakao.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    mapRef.current.setBounds(bounds);
  };

  // 다중 경로를 지도에 표시
  const displayMultiRouteOnMap = (routeDataArray, places) => {
    if (!mapRef.current || routeDataArray.length === 0) return;

    const allCoordinates = [];
    const bounds = new window.kakao.maps.LatLngBounds();

    // 각 구간별로 다른 색상의 폴리라인 생성
    const colors = ['#FF0000', '#0000FF']; // 빨강, 파랑
    
    routeDataArray.forEach((routeData, index) => {
      if (routeData.coordinates) {
        const path = routeData.coordinates.map(coord => 
          new window.kakao.maps.LatLng(coord.lat, coord.lng)
        );

        // 폴리라인 생성 (구간별 다른 색상)
        const polyline = new window.kakao.maps.Polyline({
          path: path,
          strokeWeight: 5,
          strokeColor: colors[index] || '#FF0000',
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });

        // 지도에 폴리라인 표시
        polyline.setMap(mapRef.current);
        
        // 폴리라인 참조 저장 (배열로 관리)
        if (!routePolylineRef.current) {
          routePolylineRef.current = [];
        }
        if (Array.isArray(routePolylineRef.current)) {
          routePolylineRef.current.push(polyline);
        } else {
          routePolylineRef.current = [routePolylineRef.current, polyline];
        }

        // 바운드 확장
        path.forEach(point => bounds.extend(point));
        allCoordinates.push(...routeData.coordinates);
      }
    });

    // 다중 경로 마커 생성
    createMultiRouteMarkers(places);

    // 지도 화면을 모든 경로에 맞게 조정
    if (allCoordinates.length > 0) {
      mapRef.current.setBounds(bounds);
    }
  };

  // 경로 마커 생성
  const createRouteMarkers = (startPlace, endPlace) => {
    // 시작점 마커 (녹색)
    const startPosition = new window.kakao.maps.LatLng(startPlace.y, startPlace.x);
    const startMarker = new window.kakao.maps.Marker({
      position: startPosition,
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png',
        new window.kakao.maps.Size(36, 37)
      )
    });
    startMarker.setMap(mapRef.current);

    // 시작점 인포윈도우
    const startInfoWindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:10px;font-size:12px;"><strong>출발지</strong><br/>${startPlace.place_name}</div>`
    });
    
    window.kakao.maps.event.addListener(startMarker, 'click', function() {
      startInfoWindow.open(mapRef.current, startMarker);
    });

    // 도착점 마커 (빨간색)
    const endPosition = new window.kakao.maps.LatLng(endPlace.y, endPlace.x);
    const endMarker = new window.kakao.maps.Marker({
      position: endPosition,
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_red.png',
        new window.kakao.maps.Size(36, 37)
      )
    });
    endMarker.setMap(mapRef.current);

    // 도착점 인포윈도우
    const endInfoWindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:10px;font-size:12px;"><strong>도착지</strong><br/>${endPlace.place_name}</div>`
    });
    
    window.kakao.maps.event.addListener(endMarker, 'click', function() {
      endInfoWindow.open(mapRef.current, endMarker);
    });

    // 마커 참조 저장
    routeMarkersRef.current = [startMarker, endMarker];
  };

  // 다중 경로 마커 생성
  const createMultiRouteMarkers = (places) => {
    const markers = [];
    const markerImages = [
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png', // 검색위치 - 별 모양
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png', // 1번장소 - 파란색
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_red.png'   // 2번장소 - 빨간색
    ];

    places.forEach((place, index) => {
      const position = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({
        position: position,
        image: new window.kakao.maps.MarkerImage(
          markerImages[index],
          new window.kakao.maps.Size(36, 37)
        )
      });
      marker.setMap(mapRef.current);

      // 인포윈도우 생성
      let content = '';
      if (index === 0) {
        content = `<div style="padding:10px;font-size:12px;"><strong>출발지</strong><br/>${place.place_name}</div>`;
      } else if (index === 1) {
        content = `<div style="padding:10px;font-size:12px;"><strong>1번째 장소</strong><br/>${place.place_name}</div>`;
      } else if (index === 2) {
        content = `<div style="padding:10px;font-size:12px;"><strong>2번째 장소</strong><br/>${place.place_name}</div>`;
      }

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: content
      });
      
      window.kakao.maps.event.addListener(marker, 'click', function() {
        infoWindow.open(mapRef.current, marker);
      });

      markers.push(marker);
    });

    // 마커 참조 저장
    routeMarkersRef.current = markers;
  };

  // 경로 정리 함수
  const clearRoute = () => {
    // 폴리라인 제거 (단일 또는 다중)
    if (routePolylineRef.current) {
      if (Array.isArray(routePolylineRef.current)) {
        // 다중 폴리라인 제거
        routePolylineRef.current.forEach(polyline => {
          if (polyline) polyline.setMap(null);
        });
      } else {
        // 단일 폴리라인 제거
        routePolylineRef.current.setMap(null);
      }
      routePolylineRef.current = null;
    }
    
    // 경로 마커들 제거
    if (routeMarkersRef.current.length > 0) {
      routeMarkersRef.current.forEach(marker => marker.setMap(null));
      routeMarkersRef.current = [];
    }
  };
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
});

export default KakaoMap;