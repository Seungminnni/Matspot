import React, { useState } from 'react';
import '../styles/KeywordFilter.css';

// 임시 장소 유형 목록 (이모지 추가)
const placeTypes = [
    { id: 'restaurant', name: '식당', emoji: '🍽️' },
    { id: 'cafe', name: '카페', emoji: '☕' },
];

const KeywordFilter = ({ onCreateRoute, onSearch }) => {
    // 각 필터 그룹의 상태를 관리하는 배열
    const [filterGroups, setFilterGroups] = useState([
        { id: Date.now(), placeType: '', selectedKeywords: [], selectedSortOption: null }
    ]);

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

    const sortOptions = [
        { id: 'distance', name: '거리순', emoji: '📍' },
        { id: 'sns', name: 'SNS 인기순', emoji: '📱' },
        { id: 'rating', name: '평점순', emoji: '⭐' }
    ];

    // 새로운 필터 그룹 추가 함수
    const addFilterGroup = () => {
        // 필터 그룹이 3개 미만일 때만 추가
        if (filterGroups.length < 3) {
            setFilterGroups(prevGroups => [
                ...prevGroups,
                { id: Date.now(), placeType: '', selectedKeywords: [], selectedSortOption: null }
            ]);
        }
    };

    // 특정 필터 그룹 삭제 함수
    const removeFilterGroup = (id) => {
        setFilterGroups(prevGroups => prevGroups.filter(group => group.id !== id));
    };

    // 특정 필터 그룹의 장소 유형 변경 함수
    const handlePlaceTypeChange = (id, type) => {
        setFilterGroups(prevGroups => prevGroups.map(group =>
            group.id === id ? { ...group, placeType: type } : group
        ));
    };

    // 특정 필터 그룹의 키워드1 토글 함수
    const toggleKeyword = (groupId, keywordId) => {
        setFilterGroups(prevGroups => prevGroups.map(group => {
            if (group.id === groupId) {
                const newKeywords = group.selectedKeywords.includes(keywordId)
                    ? group.selectedKeywords.filter(id => id !== keywordId)
                    : [...group.selectedKeywords, keywordId];
                return { ...group, selectedKeywords: newKeywords };
            } else {
                return group;
            }
        }));
    };    // 특정 필터 그룹의 키워드2 선택 함수
    const selectSortOption = (groupId, optionId) => {
        setFilterGroups(prevGroups => prevGroups.map(group => {
            if (group.id === groupId) {
                const updatedGroup = { ...group, selectedSortOption: optionId };
                
                // SNS 인기순이나 평점순 선택 시 알림
                if (optionId === 'sns' || optionId === 'rating') {
                    alert(`${optionId === 'sns' ? 'SNS 인기순' : '평점순'}은 아직 구현되지 않았습니다. 거리순을 선택해주세요.`);
                    return group; // 선택을 취소하고 이전 상태 유지
                }
                  // 거리순 선택 시 자동 검색을 제거하고 "루트 생성하기" 버튼을 통해서만 검색 실행
                // 자동 검색 로직 제거
                
                return updatedGroup;
            } else {
                return group;
            }
        }));
    };    // 루트 생성 버튼 클릭 핸들러
    const handleCreateRoute = () => {
        console.log('KeywordFilter: handleCreateRoute function called');
        console.log('루트 생성 요청:', filterGroups);
        
        // 거리순이 선택된 그룹들만 필터링
        const distanceGroups = filterGroups.filter(group => 
            group.placeType === 'restaurant' && 
            group.selectedKeywords.length > 0 && 
            group.selectedSortOption === 'distance'
        );
        
        if (distanceGroups.length === 0) {
            alert('거리순으로 선택된 식당이 없습니다. SNS 인기순과 평점순은 아직 구현되지 않았습니다.');
            return;
        }
        
        // prop으로 전달받은 함수 호출
        if (onCreateRoute) {
            onCreateRoute(distanceGroups);
        }
    };

    return (
        <div className="filters-container">
            {filterGroups.map((group, index) => (
                <div key={group.id} className="filter-group">
                    {/* 순서 표시 */}
                    <h3 className="group-number-heading">{index + 1}번째 장소</h3>

                    {/* 장소 유형 선택 - 버튼 형태 */}
                    <div className="place-type-filter">
                         <h4 className="section-title">장소 유형</h4>
                         <div className="keyword-grid"> {/* 재활용 className */}
                            {placeTypes.map(type => (
                                <button
                                    key={type.id}
                                    className={`keyword-button ${group.placeType === type.id ? 'selected' : ''}`}
                                    onClick={() => handlePlaceTypeChange(group.id, type.id)}
                                >
                                    {type.emoji && <span className="keyword-emoji">{type.emoji}</span>}
                                    <span className="keyword-name">{type.name}</span>
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* 필터 그룹 삭제 버튼 */}
                    {filterGroups.length > 1 && (
                        <button className="remove-group-button" onClick={() => removeFilterGroup(group.id)}>삭제</button>
                    )}

                    {/* 장소 유형이 선택되었을 때만 키워드 필터 표시 */}
                    {group.placeType && (
                        <>
                            {/* 키워드 1 (음식 종류) 필터 */}
                            <div className="keyword-filter">
                                <h4 className="section-title">키워드 1 (음식 종류)</h4>
                                <div className="keyword-grid">
                                    {keywords.map(keyword => (
                                        <button
                                            key={keyword.id}
                                            className={`keyword-button ${group.selectedKeywords.includes(keyword.id) ? 'selected' : ''}`}
                                            onClick={() => toggleKeyword(group.id, keyword.id)}
                                        >
                                            {keyword.emoji && <span className="keyword-emoji">{keyword.emoji}</span>}
                                            <span className="keyword-name">{keyword.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 키워드 2 (정렬) 필터 */}
                            <div className="sort-filter">
                               <h4 className="section-title">키워드 2 (정렬)</h4>
                               <div className="sort-options">
                                   {sortOptions.map(option => (
                                       <button
                                           key={option.id}
                                           className={`sort-button ${group.selectedSortOption === option.id ? 'selected' : ''}`}
                                           onClick={() => selectSortOption(group.id, option.id)}
                                       >
                                           <span className="keyword-emoji">{option.emoji}</span>
                                           <span className="keyword-name">{option.name}</span>
                                       </button>
                                   ))}
                               </div>
                            </div>
                            <hr/> {/* 그룹 구분을 위한 구분선 */}
                        </>
                    )}
                </div>
            ))}

            {/* 필터 그룹 추가 버튼 (3개 미만일 때만 표시) */}
            {filterGroups.length < 3 && (
                <button className="add-group-button" onClick={addFilterGroup}>+ 장소 추가</button>
            )}

            {/* 루트 생성 버튼 */}
            <div className="route-button-container">
                <button className="route-button" onClick={handleCreateRoute}>
                    루트 생성하기
                </button>
            </div>
        </div>
    );
};

export default KeywordFilter;