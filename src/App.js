import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import KeywordFilter from './components/KeywordFilter';
import PlaceTypeSelector from './components/PlaceTypeSelector';
import Banner from './components/Banner';
import Footer from './components/Footer';
import RestaurantList from './components/RestaurantList';
import NearbyPage from './components/NearbyPage';
import Social from './pages/Social';
import MyPage from './pages/MyPage';
import Auth from './pages/Auth';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const MainContent = () => (
    <>
      <Banner />
      <CategoryFilter />
      <PlaceTypeSelector />
      <KeywordFilter />
      <RestaurantList />
    </>
  );

  return (
    <Router>
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
    </Router>
  );
}

export default App;
