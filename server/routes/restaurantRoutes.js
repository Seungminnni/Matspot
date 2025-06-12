const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Python 크롤링 API 서버 주소
const PYTHON_CRAWLING_API = 'http://localhost:5001';

// 카카오 API 키 (환경변수에서 가져오거나 직접 설정)
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || 'c6d12eab1ef43ca9745a713e8669183b';
// 카카오 모빌리티 API 키
const KAKAO_MOBILITY_API_KEY = process.env.KAKAO_MOBILITY_API_KEY || '402798a9751102f837f8f9d70a7e8a35';

// SNS 맛집 스마트 매칭 API
router.post('/smart-match', async (req, res) => {
    try {
        const { mapRestaurants, searchArea } = req.body;

        console.log('매칭 요청 받음:', {
            맛집수: mapRestaurants?.length || 0,
            검색영역: searchArea?.center
        });

        // 입력 데이터 검증
        if (!mapRestaurants || mapRestaurants.length === 0) {
            return res.status(400).json({
                success: false,
                error: '매칭할 맛집 데이터가 없습니다.'
            });
        }

        // Python 크롤링 API에 매칭 요청
        const pythonResponse = await axios.post(`${PYTHON_CRAWLING_API}/smart-match`, {
            mapRestaurants: mapRestaurants,
            searchArea: searchArea
        }, {
            timeout: 30000, // 30초 타임아웃
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Python API 응답:', {
            성공: pythonResponse.data.success,
            매칭수: pythonResponse.data.matched_restaurants?.length || 0
        });

        // 매칭 결과 반환
        res.json({
            success: true,
            matched: pythonResponse.data.matched_restaurants || [],
            stats: {
                total: mapRestaurants.length,
                matched: pythonResponse.data.matched_restaurants?.length || 0,
                matchRate: pythonResponse.data.stats?.match_rate || 0
            }
        });

    } catch (error) {
        console.error('SNS 매칭 오류:', error.message);
        
        // Python API 서버 연결 오류 처리
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'SNS 데이터 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
            });
        }
        
        // 타임아웃 오류 처리
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                error: '요청 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'SNS 맛집 매칭에 실패했습니다.'
        });
    }
});

// 카카오 맵 API를 통한 주변 맛집 검색 (옵션)
router.post('/search-nearby', async (req, res) => {
    try {
        const { lat, lng, radius, keyword } = req.body;
        
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/category.json', {
            headers: {
                'Authorization': `KakaoAK ${KAKAO_API_KEY}`
            },
            params: {
                category_group_code: 'FD6', // 음식점
                x: lng,
                y: lat,
                radius: radius || 1000,
                size: 15,
                sort: 'distance'
            }
        });
        
        res.json({
            success: true,
            restaurants: response.data.documents,
            meta: response.data.meta
        });
        
    } catch (error) {
        console.error('카카오 맵 검색 오류:', error);
        res.status(500).json({
            success: false,
            error: '주변 맛집 검색에 실패했습니다.'
        });
    }
});

// Python API 서버 상태 확인
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_CRAWLING_API}/health`, {
            timeout: 5000
        });
        
        res.json({
            success: true,
            python_api: response.data,
            node_api: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        res.status(503).json({
            success: false,
            python_api: {
                status: 'unavailable',
                error: error.message
            },
            node_api: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            }
        });
    }
});

// SNS 맛집 데이터 목록 조회
router.get('/sns-list', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_CRAWLING_API}/restaurants`);
        
        res.json({
            success: true,
            restaurants: response.data.restaurants,
            count: response.data.count
        });
        
    } catch (error) {
        console.error('SNS 맛집 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: 'SNS 맛집 데이터를 불러올 수 없습니다.'
        });
    }
});

// 카카오 모빌리티 길찾기 API
router.post('/directions', async (req, res) => {
    try {
        const { origin, destination, priority = 'RECOMMEND' } = req.body;

        console.log('경로 계산 요청:', { origin, destination, priority });

        // 입력 데이터 검증
        if (!origin || !destination || 
            typeof origin.x !== 'number' || typeof origin.y !== 'number' ||
            typeof destination.x !== 'number' || typeof destination.y !== 'number') {
            return res.status(400).json({
                success: false,
                error: '올바른 출발지와 도착지 좌표를 입력해주세요.'
            });
        }

        // 카카오 모빌리티 API 호출
        const response = await axios.post('https://apis-navi.kakaomobility.com/v1/directions', {
            origin: {
                x: origin.x,
                y: origin.y
            },
            destination: {
                x: destination.x,
                y: destination.y
            },
            priority: priority,
            car_fuel: "GASOLINE",
            car_hipass: false,
            alternatives: false,
            road_details: false
        }, {
            headers: {
                'Authorization': `KakaoAK ${KAKAO_MOBILITY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const summary = route.summary;
            
            // 경로 좌표들 추출
            const coordinates = [];
            if (route.sections && route.sections.length > 0) {
                route.sections.forEach(section => {
                    if (section.roads) {
                        section.roads.forEach(road => {
                            if (road.vertexes) {
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
                    { lng: origin.x, lat: origin.y },
                    { lng: destination.x, lat: destination.y }
                );
            }

            console.log('경로 계산 성공:', {
                distance: summary.distance,
                duration: summary.duration,
                toll: summary.fare?.toll || 0,
                coordinates: coordinates.length
            });

            res.json({
                success: true,
                route: {
                    distance: summary.distance,
                    duration: summary.duration,
                    toll: summary.fare?.toll || 0,
                    coordinates: coordinates,
                    isEstimated: false
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: '경로를 찾을 수 없습니다.'
            });
        }

    } catch (error) {
        console.error('카카오 모빌리티 API 오류:', error.response?.data || error.message);
        
        // API 호출 실패 시 직선거리 기반 예상 경로 반환
        const { origin, destination } = req.body;
        
        if (origin && destination) {
            const distance = calculateStraightDistance(origin.y, origin.x, destination.y, destination.x);
            const estimatedRoadDistance = distance * 1.3;
            const estimatedDuration = Math.round(estimatedRoadDistance / 25 * 3600);
            const estimatedToll = estimatedRoadDistance > 10 ? 1000 : 0;

            console.log('직선거리 기반 예상 경로로 폴백');

            res.json({
                success: true,
                route: {
                    distance: estimatedRoadDistance * 1000,
                    duration: estimatedDuration,
                    toll: estimatedToll,
                    coordinates: [
                        { lng: origin.x, lat: origin.y },
                        { lng: destination.x, lat: destination.y }
                    ],
                    isEstimated: true
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: '경로 계산 중 오류가 발생했습니다.'
            });
        }
    }
});

// 검색 결과 처리 엔드포인트 (로그용)
router.post('/process-search', async (req, res) => {
    try {
        const { searchResults, searchKeyword, searchLocation, timestamp } = req.body;

        console.log('검색 결과 수신:', {
            키워드: searchKeyword,
            결과수: searchResults?.length || 0,
            위치: searchLocation,
            시간: timestamp
        });

        // 검색 결과 로그 저장 (필요시 DB에 저장 가능)
        // 현재는 단순히 로그만 출력

        res.json({
            success: true,
            message: '검색 결과가 성공적으로 처리되었습니다.',
            processed_count: searchResults?.length || 0
        });

    } catch (error) {
        console.error('검색 결과 처리 오류:', error);
        res.status(500).json({
            success: false,
            error: '검색 결과 처리 중 오류가 발생했습니다.'
        });
    }
});

// 루트 저장 API
router.post('/save-route', authMiddleware, async (req, res) => {
    try {
        const { routeName, searchCenter, places, routeInfo } = req.body;
        const userId = req.user.id;

        // 입력 데이터 검증
        if (!routeName || !searchCenter || !places || places.length < 2) {
            return res.status(400).json({
                success: false,
                error: '루트 이름, 검색 중심, 최소 2개 장소가 필요합니다.'
            });
        }

        const db = require('../db');
        
        // routes 테이블이 없다면 생성
        await db.run(`
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                route_name TEXT NOT NULL,
                search_center_name TEXT NOT NULL,
                search_center_lat REAL NOT NULL,
                search_center_lng REAL NOT NULL,
                place1_name TEXT NOT NULL,
                place1_address TEXT NOT NULL,
                place1_lat REAL NOT NULL,
                place1_lng REAL NOT NULL,
                place2_name TEXT NOT NULL,
                place2_address TEXT NOT NULL,
                place2_lat REAL NOT NULL,
                place2_lng REAL NOT NULL,
                total_distance INTEGER,
                total_duration INTEGER,
                total_toll INTEGER,
                is_estimated BOOLEAN DEFAULT false,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // 루트 저장
        const result = await db.run(`
            INSERT INTO routes (
                user_id, route_name, search_center_name, search_center_lat, search_center_lng,
                place1_name, place1_address, place1_lat, place1_lng,
                place2_name, place2_address, place2_lat, place2_lng,
                total_distance, total_duration, total_toll, is_estimated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, routeName, searchCenter.place_name, searchCenter.lat, searchCenter.lng,
            places[0].place_name, places[0].address_name, parseFloat(places[0].y), parseFloat(places[0].x),
            places[1].place_name, places[1].address_name, parseFloat(places[1].y), parseFloat(places[1].x),
            routeInfo?.totalDistance || 0, routeInfo?.totalDuration || 0, routeInfo?.totalToll || 0,
            routeInfo?.isEstimated || false
        ]);

        res.json({
            success: true,
            message: '루트가 성공적으로 저장되었습니다.',
            routeId: result.lastID
        });

    } catch (error) {
        console.error('루트 저장 오류:', error);
        res.status(500).json({
            success: false,
            error: '루트 저장 중 오류가 발생했습니다.'
        });
    }
});

// 사용자의 저장된 루트 목록 조회 API
router.get('/my-routes', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = require('../db');

        const routes = await db.all(`
            SELECT 
                id, route_name, search_center_name, search_center_lat, search_center_lng,
                place1_name, place1_address, place1_lat, place1_lng,
                place2_name, place2_address, place2_lat, place2_lng,
                total_distance, total_duration, total_toll, is_estimated,
                created_at
            FROM routes 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);

        // 거리와 시간을 사용자 친화적 형태로 변환
        const formattedRoutes = routes.map(route => ({
            ...route,
            total_distance_km: route.total_distance ? (route.total_distance / 1000).toFixed(1) : '0.0',
            total_duration_min: route.total_duration ? Math.round(route.total_duration / 60) : 0,
            created_date: new Date(route.created_at).toLocaleDateString('ko-KR')
        }));

        res.json({
            success: true,
            routes: formattedRoutes
        });

    } catch (error) {
        console.error('루트 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '루트 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 저장된 루트 삭제 API
router.delete('/routes/:routeId', authMiddleware, async (req, res) => {
    try {
        const { routeId } = req.params;
        const userId = req.user.id;
        const db = require('../db');

        // 루트가 해당 사용자의 것인지 확인 후 삭제
        const result = await db.run(`
            DELETE FROM routes 
            WHERE id = ? AND user_id = ?
        `, [routeId, userId]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: '루트를 찾을 수 없거나 삭제 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '루트가 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('루트 삭제 오류:', error);
        res.status(500).json({
            success: false,
            error: '루트 삭제 중 오류가 발생했습니다.'
        });
    }
});

// 직선 거리 계산 함수 (Haversine formula)
function calculateStraightDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;
