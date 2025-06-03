import React, { useState, useEffect } from 'react';
import '../styles/RestaurantRecommendation.css';

const RestaurantRecommendation = () => {
    const [recommendations, setRecommendations] = useState([
        {
            id: 1,
            author: '맛집탐험가',
            restaurant: '돈카츠 파라다이스',
            recommendation: '혼밥하기 진짜 좋아요! 가격도 합리적이고 특히 정식이 맛있어요 👍',
            tags: ['혼밥맛집', '가성비'],
            likes: 5,
            createdAt: '2024-03-20'
        }
    ]);

    const [showRecommendModal, setShowRecommendModal] = useState(false);
    const [newRecommendation, setNewRecommendation] = useState({
        restaurant: '',
        recommendation: '',
        tags: ''
    });
    const [loading, setLoading] = useState(false);
    const [snsResults, setSnsResults] = useState([]);
    const [showSnsResults, setShowSnsResults] = useState(false);

    // SNS 맛집 데이터 불러오기 함수
    const fetchSnsRecommendations = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/sns-restaurants?limit=6');
            if (!response.ok) {
                throw new Error('SNS 맛집 데이터를 불러오는데 실패했습니다.');
            }
            const data = await response.json();
            console.log('SNS 맛집 데이터:', data);
            setSnsResults(data);
            setShowSnsResults(true);
        } catch (error) {
            console.error('SNS 맛집 추천 에러:', error);
            alert('SNS 맛집 데이터를 불러오는데 실패했습니다. API 서버가 실행 중인지 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const recommendation = {
            id: recommendations.length + 1,
            author: '사용자',
            ...newRecommendation,
            tags: newRecommendation.tags.split(',').map(tag => tag.trim()),
            likes: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };
        setRecommendations([recommendation, ...recommendations]);
        setShowRecommendModal(false);
        setNewRecommendation({
            restaurant: '',
            recommendation: '',
            tags: ''
        });
    };

    const handleLike = (id) => {
        setRecommendations(recommendations.map(rec => 
            rec.id === id ? {...rec, likes: rec.likes + 1} : rec
        ));
    };

    useEffect(() => {
        fetchSnsRecommendations();
    }, []);

    return (
        <div className="recommendation-section">
            <div className="recommendation-header">
                <h2>맛집 추천</h2>
                <div className="recommendation-actions">
                    <button 
                        className="sns-recommendation-btn"
                        onClick={fetchSnsRecommendations}
                        disabled={loading}
                    >
                        <i className="fas fa-fire"></i> SNS 인기 맛집 추천
                    </button>
                    <button 
                        className="add-recommendation-btn"
                        onClick={() => setShowRecommendModal(true)}
                    >
                        <i className="fas fa-plus"></i> 추천하기
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading-indicator">
                    <p>SNS 인기 맛집을 불러오는 중...</p>
                </div>
            )}

            {showSnsResults && snsResults.length > 0 && (
                <div className="sns-results-section">
                    <h3>SNS 인기 맛집</h3>
                    <div className="sns-results-grid">
                        {snsResults.map((restaurant, index) => (
                            <div key={index} className="sns-restaurant-card">
                                <div className="sns-restaurant-header">
                                    <h4>{restaurant.map_info.place_name}</h4>
                                    <span className="sns-rating">⭐ {restaurant.sns_info.rating}</span>
                                </div>
                                <p className="sns-address">{restaurant.map_info.address_name}</p>
                                <div className="sns-stats">
                                    <span>언급 횟수: {restaurant.sns_info.sns_mentions}회</span>
                                    <span>리뷰: {restaurant.sns_info.review_count}개</span>
                                </div>
                                <div className="sns-tags">
                                    {restaurant.sns_info.tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="sns-tag">#{tag}</span>
                                    ))}
                                </div>
                                <div className="sns-match-score">
                                    <span>매칭 점수: {(restaurant.match_score * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        className="close-sns-results-btn"
                        onClick={() => setShowSnsResults(false)}
                    >
                        사용자 추천 보기
                    </button>
                </div>
            )}

            {(!showSnsResults || snsResults.length === 0) && (
                <div className="recommendations-list">
                    {recommendations.map(rec => (
                        <div key={rec.id} className="recommendation-card">
                            <div className="recommendation-top">
                                <div className="user-info">
                                    <span className="author">{rec.author}</span>
                                    <span className="date">{rec.createdAt}</span>
                                </div>
                                <h3 className="restaurant-name">{rec.restaurant}</h3>
                            </div>
                            <p className="recommendation-text">{rec.recommendation}</p>
                            <div className="recommendation-bottom">
                                <div className="tags">
                                    {rec.tags.map((tag, index) => (
                                        <span key={index} className="tag">#{tag}</span>
                                    ))}
                                </div>
                                <button 
                                    className="like-button"
                                    onClick={() => handleLike(rec.id)}
                                >
                                    <i className="fas fa-heart"></i> {rec.likes}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showRecommendModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>맛집 추천하기</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>식당 이름</label>
                                <input
                                    type="text"
                                    value={newRecommendation.restaurant}
                                    onChange={(e) => setNewRecommendation({
                                        ...newRecommendation,
                                        restaurant: e.target.value
                                    })}
                                    placeholder="추천하고 싶은 식당 이름"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>추천 이유</label>
                                <textarea
                                    value={newRecommendation.recommendation}
                                    onChange={(e) => setNewRecommendation({
                                        ...newRecommendation,
                                        recommendation: e.target.value
                                    })}
                                    placeholder="이 식당의 어떤 점이 좋은가요?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>태그</label>
                                <input
                                    type="text"
                                    value={newRecommendation.tags}
                                    onChange={(e) => setNewRecommendation({
                                        ...newRecommendation,
                                        tags: e.target.value
                                    })}
                                    placeholder="태그를 쉼표로 구분해서 입력 (예: 혼밥맛집, 가성비)"
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="submit" className="submit-button">등록하기</button>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowRecommendModal(false)}
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantRecommendation;