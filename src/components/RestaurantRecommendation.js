import React, { useState } from 'react';
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

    return (
        <div className="recommendation-section">
            <div className="recommendation-header">
                <h2>맛집 추천</h2>
                <button 
                    className="add-recommendation-btn"
                    onClick={() => setShowRecommendModal(true)}
                >
                    <i className="fas fa-plus"></i> 추천하기
                </button>
            </div>

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