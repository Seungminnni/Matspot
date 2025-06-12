import React from 'react';
import '../styles/KeywordFilter.css';

// 임시 장소 유형 목록 (이모지 추가)
const placeTypes = [
    { id: 'restaurant', name: '식당', emoji: '🍽️' },
    { id: 'cafe', name: '카페', emoji: '☕' },
];

const KeywordFilter = ({ place, updatePlace, onSearch }) => {
    // 키워드 매핑
    const keywordMap = {
        'western': '양식',
        'chinese': '중식',
        'japanese': '일식',
        'korean': '한식',
        'dessert': '디저트'
    };

    const keywords = [
        { id: 'western', name: '양식', emoji: '🍝' },
        { id: 'chinese', name: '중식', emoji: '🥢' },
        { id: 'japanese', name: '일식', emoji: '🍣' },
        { id: 'korean', name: '한식', emoji: '🍚' },
        { id: 'dessert', name: '디저트', emoji: '🍰' }
    ];

    // 장소 유형에 따른 키워드 필터링
    const getAvailableKeywords = () => {
        if (place.placeType === 'cafe') {
            // 카페인 경우 디저트만 표시
            return keywords.filter(keyword => keyword.id === 'dessert');
        } else if (place.placeType === 'restaurant') {
            // 식당인 경우 디저트 제외하고 표시
            return keywords.filter(keyword => keyword.id !== 'dessert');
        } else {
            // 장소 유형이 선택되지 않은 경우 모든 키워드 표시
            return keywords;
        }
    };

    const sortOptions = [
        { id: 'distance', name: '거리순', emoji: '📍' },
        { id: 'sns', name: 'SNS 인기순', emoji: '📱' },
        { id: 'rating', name: '리뷰수', emoji: '📝' }
    ];

    // 장소 유형 변경 함수
    const handlePlaceTypeChange = (type) => {
        // 장소 유형 변경 시 키워드 자동 조정
        let newKeywords = [];
        
        if (type === 'cafe') {
            // 카페 선택 시 디저트 자동 선택 (이미 디저트가 선택되어 있다면 유지)
            if (place.selectedKeywords.includes('dessert')) {
                newKeywords = ['dessert'];
            } else {
                newKeywords = ['dessert']; // 디저트 자동 선택
            }
        } else if (type === 'restaurant') {
            // 식당 선택 시 디저트가 선택되어 있다면 제거
            newKeywords = place.selectedKeywords.filter(keyword => keyword !== 'dessert');
        } else {
            // 장소 유형 해제 시 기존 키워드 유지
            newKeywords = place.selectedKeywords;
        }
        
        updatePlace(place.id, { 
            placeType: type,
            selectedKeywords: newKeywords
        });
    };

    // 키워드1 단일 선택 함수 (중복 선택 불가)
    const selectKeyword = (keywordId) => {
        // 이미 선택된 키워드를 다시 클릭하면 선택 해제, 다른 키워드 클릭하면 단일 선택
        const newKeywords = place.selectedKeywords.includes(keywordId) 
            ? [] 
            : [keywordId];
        updatePlace(place.id, { selectedKeywords: newKeywords });
    };

    // 키워드2 선택 함수
    const selectSortOption = (optionId) => {
        updatePlace(place.id, { selectedSortOption: optionId });
    };

    return (
        <div className="filters-container">
            <div className="filter-group">
                <h3 className="group-number-heading">{place.name}</h3>

                <div className="filter-section-wrapper">
                    <div className="place-type-filter">
                         <h4 className="section-title">장소 유형</h4>
                         <div className="keyword-grid">
                            {placeTypes.map(type => (
                                <button
                                    key={type.id}
                                    className={`keyword-button ${place.placeType === type.id ? 'selected' : ''}`}
                                    onClick={() => handlePlaceTypeChange(type.id)}
                                >
                                    {type.emoji && <span className="keyword-emoji">{type.emoji}</span>}
                                    <span className="keyword-name">{type.name}</span>
                                </button>
                            ))}
                         </div>
                    </div>

                    <div className="keyword-filter">
                        <h4 className="section-title">키워드 1 (음식 종류)</h4>
                        <div className="keyword-grid">
                            {getAvailableKeywords().map(keyword => (
                                <button
                                    key={keyword.id}
                                    className={`keyword-button ${place.selectedKeywords.includes(keyword.id) ? 'selected' : ''}`}
                                    onClick={() => selectKeyword(keyword.id)}
                                >
                                    {keyword.emoji && <span className="keyword-emoji">{keyword.emoji}</span>}
                                    <span className="keyword-name">{keyword.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sort-filter">
                       <h4 className="section-title">키워드 2 (정렬)</h4>
                       <div className="sort-options">
                           {sortOptions.map(option => (
                               <button
                                   key={option.id}
                                   className={`sort-button ${place.selectedSortOption === option.id ? 'selected' : ''}`}
                                   onClick={() => selectSortOption(option.id)}
                               >
                                   <span className="keyword-emoji">{option.emoji}</span>
                                   <span className="keyword-name">{option.name}</span>
                               </button>
                           ))}
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeywordFilter;