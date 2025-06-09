import React, { useState } from 'react';
import '../styles/Social.css';
import ChatRoom from '../components/ChatRoom';
import RestaurantRecommendation from '../components/RestaurantRecommendation';

const Social = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showChatRoom, setShowChatRoom] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('companion'); // 'companion' or 'recommendation'

    // 임시 데이터 (나중에 백엔드에서 가져올 예정)
    const [posts, setPosts] = useState([
        {
            id: 1,
            type: 'companion',
            restaurant: '맛있는 파스타',
            location: '서울시 강남구 역삼동',
            date: '2024-03-20',
            time: '18:30',
            maxPeople: 4,
            currentPeople: 1,
            description: '파스타 좋아하시는 분들과 함께 식사하고 싶어요!',
            author: '김맛집',
            participants: ['김맛집'],
            status: 'recruiting' // recruiting, full
        }
    ]);

    const [newPost, setNewPost] = useState({
        restaurant: '',
        location: '',
        date: '',
        time: '',
        maxPeople: 4,
        description: ''
    });

    const handleCreatePost = (e) => {
        e.preventDefault();
        const post = {
            id: posts.length + 1,
            type: 'companion',
            ...newPost,
            currentPeople: 1,
            author: '사용자',
            participants: ['사용자'],
            status: 'recruiting'
        };
        setPosts([post, ...posts]);
        setShowCreateModal(false);
        setNewPost({ 
            restaurant: '', 
            location: '',
            date: '', 
            time: '', 
            maxPeople: 4, 
            description: '' 
        });
    };

    const handleJoin = (post) => {
        if (post.currentPeople >= post.maxPeople) return;
        
        setPosts(posts.map(p => {
            if (p.id === post.id) {
                const newCurrentPeople = p.currentPeople + 1;
                return {
                    ...p,
                    currentPeople: newCurrentPeople,
                    participants: [...p.participants, '새참가자'],
                    status: newCurrentPeople >= p.maxPeople ? 'full' : 'recruiting'
                };
            }
            return p;
        }));

        // 채팅방 열기
        setSelectedPost(post);
        setShowChatRoom(true);
        setShowDetailModal(false);
    };

    const openDetailModal = (post) => {
        setSelectedPost(post);
        setShowDetailModal(true);
    };

    return (
        <div className="social-container">
            <div className="social-header">
                <h1>맛집 소셜</h1>
                <p>함께 맛있는 식사하실 분을 찾고, 맛집을 공유해보세요!</p>
            </div>
            
            <div className="social-tabs">
                <button 
                    className={`tab-button ${activeTab === 'companion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('companion')}
                >
                    동행자 찾기
                </button>
                <button 
                    className={`tab-button ${activeTab === 'recommendation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommendation')}
                >
                    맛집 추천
                </button>
            </div>

            <div className="social-content">
                {activeTab === 'companion' ? (
                    <>
                        <div className="social-actions">
                            <button 
                                className="create-post-btn"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <i className="fas fa-plus"></i> 동행자 모집하기
                            </button>
                        </div>

                        <div className="posts-grid">
                            {posts.map(post => (
                                <div key={post.id} className="post-card companion-post">
                                    <div className="post-header">
                                        <span className="restaurant-name">{post.restaurant}</span>
                                        <span className="post-location">{post.location}</span>
                                        <span className="post-date">{post.date} {post.time}</span>
                                    </div>
                                    <div className="post-info">
                                        <p className="post-description">{post.description}</p>
                                        <div className="participants-info">
                                            <span>모집 현황: {post.currentPeople}/{post.maxPeople}명</span>
                                        </div>
                                        <div className="post-actions">
                                            <button 
                                                className="detail-button"
                                                onClick={() => openDetailModal(post)}
                                            >
                                                상세 정보 보기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <RestaurantRecommendation />
                )}
            </div>

            {/* 새 글 작성 모달 */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>동행자 모집하기</h2>
                        <form onSubmit={handleCreatePost}>
                            <div className="form-group">
                                <label>식당 이름</label>
                                <input
                                    type="text"
                                    value={newPost.restaurant}
                                    onChange={(e) => setNewPost({...newPost, restaurant: e.target.value})}
                                    placeholder="식당 이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>위치</label>
                                <input
                                    type="text"
                                    value={newPost.location}
                                    onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                                    placeholder="식당 위치를 입력하세요"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>날짜</label>
                                <input
                                    type="date"
                                    value={newPost.date}
                                    onChange={(e) => setNewPost({...newPost, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>시간</label>
                                <input
                                    type="time"
                                    value={newPost.time}
                                    onChange={(e) => setNewPost({...newPost, time: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>최대 인원</label>
                                <select
                                    value={newPost.maxPeople}
                                    onChange={(e) => setNewPost({...newPost, maxPeople: Number(e.target.value)})}
                                >
                                    {[2,3,4,5,6].map(num => (
                                        <option key={num} value={num}>{num}명</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>설명</label>
                                <textarea
                                    value={newPost.description}
                                    onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                                    placeholder="함께 식사할 동행자를 모집해보세요!"
                                    required
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="submit" className="submit-button">등록하기</button>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 상세 정보 모달 */}
            {showDetailModal && selectedPost && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>동행자 모집 상세 정보</h2>
                        <div className="detail-content">
                            <div className="detail-item">
                                <label>식당</label>
                                <p>{selectedPost.restaurant}</p>
                            </div>
                            <div className="detail-item">
                                <label>위치</label>
                                <p>{selectedPost.location}</p>
                            </div>
                            <div className="detail-item">
                                <label>날짜 및 시간</label>
                                <p>{selectedPost.date} {selectedPost.time}</p>
                            </div>
                            <div className="detail-item">
                                <label>모집 현황</label>
                                <p>{selectedPost.currentPeople}/{selectedPost.maxPeople}명</p>
                            </div>
                            <div className="detail-item">
                                <label>참여자</label>
                                <div className="participants-list">
                                    {selectedPost.participants.map((participant, index) => (
                                        <span key={index} className="participant-tag">{participant}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label>설명</label>
                                <p>{selectedPost.description}</p>
                            </div>
                            <div className="modal-buttons">
                                <button 
                                    className={`join-button ${selectedPost.status === 'full' ? 'disabled' : ''}`}
                                    onClick={() => handleJoin(selectedPost)}
                                    disabled={selectedPost.status === 'full'}
                                >
                                    {selectedPost.status === 'full' ? '모집 완료' : '함께하기'}
                                </button>
                                <button 
                                    className="cancel-button"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 채팅방 */}
            {showChatRoom && selectedPost && (
                <ChatRoom 
                    post={selectedPost} 
                    onClose={() => setShowChatRoom(false)}
                />
            )}
        </div>
    );
};

export default Social; 