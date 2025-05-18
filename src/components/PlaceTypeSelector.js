import React, { useState } from 'react';
import '../styles/PlaceTypeSelector.css';

const PlaceTypeSelector = () => {
    const [selectedType, setSelectedType] = useState(null);

    const placeTypes = [
        { id: 'restaurant', name: '식당', emoji: '🍽️' },
        { id: 'cafe', name: '카페', emoji: '☕' }
    ];

    return (
        <div className="place-type-section">
            <h2 className="section-title">장소 유형</h2>
            <div className="place-type-selector">
                {placeTypes.map(type => (
                    <button
                        key={type.id}
                        className={`place-type-button ${selectedType === type.id ? 'selected' : ''}`}
                        onClick={() => setSelectedType(type.id)}
                    >
                        <span className="place-type-emoji">{type.emoji}</span>
                        <span className="place-type-name">{type.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PlaceTypeSelector; 