import React, { useState } from 'react';
import '../styles/KeywordFilter.css';

const KeywordFilter = () => {
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [selectedSortOption, setSelectedSortOption] = useState(null);

    const keywords = [
        { id: 'price', name: '가성비', emoji: '💰' },
        { id: 'taste', name: '맛있는', emoji: '😋' },
        { id: 'atmosphere', name: '분위기 좋은', emoji: '✨' },
        { id: 'clean', name: '깔끔한', emoji: '✨' },
        { id: 'large-portion', name: '양 많은', emoji: '🍽️' },
        { id: 'quiet', name: '조용한', emoji: '🤫' }
    ];

    const sortOptions = [
        { id: 'distance', name: '거리순', emoji: '📍' },
        { id: 'sns', name: 'SNS 인기순', emoji: '📱' },
        { id: 'rating', name: '평점순', emoji: '⭐' }
    ];

    const toggleKeyword = (keywordId) => {
        setSelectedKeywords(prev => {
            if (prev.includes(keywordId)) {
                return prev.filter(id => id !== keywordId);
            } else {
                return [...prev, keywordId];
            }
        });
    };

    return (
        <div className="filters-container">
            <div className="keyword-filter">
                <h2 className="section-title">키워드 1</h2>
                <div className="keyword-grid">
                    {keywords.map(keyword => (
                        <button
                            key={keyword.id}
                            className={`keyword-button ${selectedKeywords.includes(keyword.id) ? 'selected' : ''}`}
                            onClick={() => toggleKeyword(keyword.id)}
                        >
                            <span className="keyword-emoji">{keyword.emoji}</span>
                            <span className="keyword-name">{keyword.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="sort-filter">
                <h2 className="section-title">키워드 2</h2>
                <div className="sort-options">
                    {sortOptions.map(option => (
                        <button
                            key={option.id}
                            className={`sort-button ${selectedSortOption === option.id ? 'selected' : ''}`}
                            onClick={() => setSelectedSortOption(option.id)}
                        >
                            <span className="keyword-emoji">{option.emoji}</span>
                            <span className="keyword-name">{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="route-button-container">
                <button className="route-button">
                    루트 생성하기
                </button>
            </div>
        </div>
    );
};

export default KeywordFilter; 