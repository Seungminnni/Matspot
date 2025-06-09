import React, { useState } from 'react';
import '../styles/ReviewSection.css';

const ReviewSection = () => {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newReview, setNewReview] = useState({
        restaurant: '',
        rating: 5,
        visitDate: '',
        content: '',
        images: []
    });

    // 임시 데이터
    const [reviews, setReviews] = useState([
        {
            id: 1,
            author: '김맛집',
            restaurant: '맛있는 파스타',
            rating: 4.5,
            visitDate: '2024-03-15',
            content: '동행자 분들과 함께 가서 더 맛있게 먹었어요! 파스타가 정말 맛있었고, 분위기도 좋았습니다.',
            images: ['https://via.placeholder.com/150'],
            createdAt: '2024-03-16'
        }
    ]);

    const handleSubmitReview = (e) => {
        e.preventDefault();
        const review = {
            id: reviews.length + 1,
            author: '사용자',
            ...newReview,
            createdAt: new Date().toISOString().split('T')[0]
        };
        setReviews([review, ...reviews]);
        setShowReviewModal(false);
        setNewReview({
            restaurant: '',
            rating: 5,
            visitDate: '',
            content: '',
            images: []
        });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        // 실제로는 이미지 업로드 처리가 필요합니다.
        // 여기서는 임시로 URL만 생성합니다.
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setNewReview({
            ...newReview,
            images: [...newReview.images, ...imageUrls]
        });
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <i 
                key={index}
                className={`fas fa-star ${index < rating ? 'filled' : ''}`}
            />
        ));
    };

    return (
        <div className="review-section">
            <div className="review-header">
                <h2>방문 후기</h2>
                <button 
                    className="write-review-btn"
                    onClick={() => setShowReviewModal(true)}
                >
                    <i className="fas fa-pencil-alt"></i> 후기 작성하기
                </button>
            </div>

            <div className="reviews-grid">
                {reviews.map(review => (
                    <div key={review.id} className="review-card">
                        <div className="review-card-header">
                            <div className="review-info">
                                <span className="restaurant-name">{review.restaurant}</span>
                                <div className="rating">
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                            <div className="review-meta">
                                <span className="author">{review.author}</span>
                                <span className="date">{review.visitDate} 방문</span>
                            </div>
                        </div>
                        <p className="review-content">{review.content}</p>
                        {review.images.length > 0 && (
                            <div className="review-images">
                                {review.images.map((image, index) => (
                                    <img 
                                        key={index} 
                                        src={image} 
                                        alt={`리뷰 이미지 ${index + 1}`} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showReviewModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>후기 작성하기</h2>
                        <form onSubmit={handleSubmitReview}>
                            <div className="form-group">
                                <label>방문한 식당</label>
                                <input
                                    type="text"
                                    value={newReview.restaurant}
                                    onChange={(e) => setNewReview({...newReview, restaurant: e.target.value})}
                                    placeholder="식당 이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>평점</label>
                                <div className="rating-input">
                                    {[5,4,3,2,1].map(num => (
                                        <label key={num}>
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={num}
                                                checked={newReview.rating === num}
                                                onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                                            />
                                            {num}점
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>방문 날짜</label>
                                <input
                                    type="date"
                                    value={newReview.visitDate}
                                    onChange={(e) => setNewReview({...newReview, visitDate: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>후기 내용</label>
                                <textarea
                                    value={newReview.content}
                                    onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                                    placeholder="방문 후기를 작성해주세요"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>사진 첨부</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="file-input"
                                />
                                {newReview.images.length > 0 && (
                                    <div className="image-preview">
                                        {newReview.images.map((image, index) => (
                                            <img 
                                                key={index} 
                                                src={image} 
                                                alt={`미리보기 ${index + 1}`} 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-buttons">
                                <button type="submit" className="submit-button">등록하기</button>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowReviewModal(false)}
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

export default ReviewSection; 