import React, { useState } from 'react';
import '../styles/ChatRoom.css';

const ChatRoom = ({ post, onClose }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        // 임시 데이터
        {
            id: 1,
            sender: '김맛집',
            text: '안녕하세요! 다들 몇 시까지 도착하실 수 있나요?',
            time: '14:30'
        },
        {
            id: 2,
            sender: '새참가자',
            text: '저는 6시까지 도착할 수 있습니다!',
            time: '14:32'
        }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            sender: '나',
            text: message,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>{post.restaurant} 모임 채팅방</h3>
                <div className="chat-info">
                    <span>{post.date} {post.time}</span>
                    <span>참여자 {post.participants.length}명</span>
                </div>
                <button className="close-button" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <div className="participants-bar">
                <div className="participants-list">
                    {post.participants.map((participant, index) => (
                        <span key={index} className="participant-tag">
                            {participant}
                        </span>
                    ))}
                </div>
            </div>

            <div className="chat-messages">
                {messages.map(msg => (
                    <div 
                        key={msg.id} 
                        className={`message ${msg.sender === '나' ? 'my-message' : ''}`}
                    >
                        <div className="message-info">
                            <span className="sender">{msg.sender}</span>
                            <span className="time">{msg.time}</span>
                        </div>
                        <div className="message-bubble">
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                />
                <button type="submit">
                    <i className="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    );
};

export default ChatRoom; 