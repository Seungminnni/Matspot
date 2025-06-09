import React, { useState } from 'react';
import KakaoMap from '../components/KakaoMap';
import '../styles/Nearby.css';

const Nearby = () => {
    const [places, setPlaces] = useState([
        { id: 1, name: '첫번째 장소', keywords: [] }
    ]);
    const [activePlace, setActivePlace] = useState(1);
    const [showKeywordModal, setShowKeywordModal] = useState(false);

    const handleAddPlace = () => {
        const newPlace = {
            id: places.length + 1,
            name: `${places.length + 1}번째 장소`,
            keywords: []
        };
        setPlaces([...places, newPlace]);
        setActivePlace(newPlace.id);
    };

    const handleKeywordSelect = (keyword) => {
        setPlaces(places.map(place => {
            if (place.id === activePlace) {
                return {
                    ...place,
                    keywords: place.keywords.includes(keyword)
                        ? place.keywords.filter(k => k !== keyword)
                        : [...place.keywords, keyword]
                };
            }
            return place;
        }));
    };

    return (
        <div className="nearby-page">
            <div className="places-sidebar">
                <div className="places-tabs">
                    {places.map(place => (
                        <button
                            key={place.id}
                            className={`place-tab ${activePlace === place.id ? 'active' : ''}`}
                            onClick={() => setActivePlace(place.id)}
                        >
                            {place.name}
                        </button>
                    ))}
                    <button className="add-place-btn" onClick={handleAddPlace}>
                        <i className="fas fa-plus"></i> 장소 추가
                    </button>
                </div>
                <div className="keywords-section">
                    <h3>키워드 선택</h3>
                    <div className="keywords-grid">
                        {['한식', '중식', '일식', '양식', '카페', '디저트', '분식', '치킨', '피자', '햄버거'].map(keyword => (
                            <button
                                key={keyword}
                                className={`keyword-btn ${
                                    places.find(p => p.id === activePlace)?.keywords.includes(keyword) ? 'selected' : ''
                                }`}
                                onClick={() => handleKeywordSelect(keyword)}
                            >
                                {keyword}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="map-container">
                <KakaoMap places={places} activePlace={activePlace} />
            </div>
        </div>
    );
};

export default Nearby; 