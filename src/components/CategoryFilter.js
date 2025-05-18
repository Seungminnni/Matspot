import React, { useState } from 'react';
import '../styles/CategoryFilter.css';

const CategoryFilter = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        { id: 'western', name: '양식', emoji: '🍝' },
        { id: 'chinese', name: '중식', emoji: '🥢' },
        { id: 'japanese', name: '일식', emoji: '🍱' },
        { id: 'korean', name: '한식', emoji: '🍚' },
        { id: 'dessert', name: '디저트', emoji: '🍰' }
    ];

    return (
        <div className="category-section">
            <div className="category-header">
                <span className="filter-label">필터</span>
                <div className="category-filter">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`category-button ${selectedCategory === category.id ? 'selected' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <span className="category-emoji">{category.emoji}</span>
                            <span className="category-name">{category.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryFilter; 