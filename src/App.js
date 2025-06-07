import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import KeywordFilter from './components/KeywordFilter';
import Banner from './components/Banner';
import Footer from './components/Footer';
import NearbyPage from './components/NearbyPage';
import RouteCreationPage from './components/RouteCreationPage';
import Social from './pages/Social';
import MyPage from './pages/MyPage';
import Auth from './pages/Auth';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const MainContent = () => (
    <>
      <Banner />
      <KeywordFilter />
      <RouteCreationPage />
    </>
  );

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <>
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<MainContent />} />
                  <Route path="/nearby" element={<NearbyPage />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/auth" element={<Auth />} />
                </Routes>
              </main>
              <Footer />
            </>
          )}
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
