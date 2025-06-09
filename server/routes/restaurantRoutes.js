const express = require('express');
const axios = require('axios');
const router = express.Router();

// Python 크롤링 API 서버 주소
const PYTHON_CRAWLING_API = 'http://localhost:5001';

// 카카오 API 키 (환경변수에서 가져오거나 직접 설정)
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || 'c6d12eab1ef43ca9745a713e8669183b';

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

module.exports = router;
