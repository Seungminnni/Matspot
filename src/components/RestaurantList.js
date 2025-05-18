import React from 'react';
import '../styles/RestaurantList.css';

const RestaurantList = () => {
    // 임시 데이터
    const restaurants = [
        {
            id: 1,
            name: '맛있는 파스타',
            category: '양식',
            rating: 4.5,
            distance: '0.3km',
            reviewCount: 128,
            image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80',
            tags: ['분위기좋은', '데이트']
        },
        {
            id: 2,
            name: '황금 돈까스',
            category: '일식',
            rating: 4.8,
            distance: '0.5km',
            reviewCount: 256,
            image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80',
            tags: ['가성비', '양많은']
        },
        {
            id: 3,
            name: '서울 김밥',
            category: '한식',
            rating: 4.3,
            distance: '0.2km',
            reviewCount: 92,
            image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=400&q=80',
            tags: ['깔끔한', '혼밥가능']
        }
    ];

    return (
        <div className="restaurant-list-container">
            <h2 className="list-title">추천 맛집</h2>
            <div className="restaurant-list">
                {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
                        <div className="restaurant-image">
                            <img src={restaurant.image} alt={restaurant.name} />
                        </div>
                        <div className="restaurant-info">
                            <div className="restaurant-header">
                                <h3 className="restaurant-name">{restaurant.name}</h3>
                                <span className="restaurant-category">{restaurant.category}</span>
                            </div>
                            <div className="restaurant-details">
                                <span className="rating">⭐ {restaurant.rating}</span>
                                <span className="review-count">리뷰 {restaurant.reviewCount}</span>
                                <span className="distance">{restaurant.distance}</span>
                            </div>
                            <div className="restaurant-tags">
                                {restaurant.tags.map(tag => (
                                    <span key={tag} className="tag">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantList; 