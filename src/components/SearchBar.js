import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            // 부모 컴포넌트로 검색어 전달
            onSearch(searchTerm);
            setHasSearched(true);
            console.log('Searching for:', searchTerm);
        }
    };

    return (
        <div className="search-container">
            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="맛집을 검색해보세요"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setHasSearched(false);
                        }}
                    />
                </div>
                <button type="submit" className="search-button">
                    {hasSearched ? '재검색' : '검색'}
                </button>
            </form>
        </div>
    );
};

export default SearchBar;