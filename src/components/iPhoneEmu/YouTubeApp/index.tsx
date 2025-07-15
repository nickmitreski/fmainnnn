import React, { useState } from 'react';
import { motion } from 'framer-motion';
import YouTubeHeader from './YouTubeHeader';
import './YouTubeApp.css';

interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnail: string;
  uploaded: string;
}

interface YouTubeAppProps {
  onClose: () => void;
}

const YouTubeApp: React.FC<YouTubeAppProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const mockVideos: Video[] = [
    {
      id: '1',
      title: 'iPhone 1st Generation - Unboxing & Review',
      channel: 'TechReviewer',
      views: '2.1M views',
      duration: '12:34',
      thumbnail: '📱',
      uploaded: '2 weeks ago'
    },
    {
      id: '2',
      title: 'How to Use Your New iPhone',
      channel: 'Apple Support',
      views: '1.8M views',
      duration: '8:45',
      thumbnail: '🍎',
      uploaded: '1 month ago'
    },
    {
      id: '3',
      title: 'Top 10 iPhone Apps 2007',
      channel: 'AppGuru',
      views: '956K views',
      duration: '15:22',
      thumbnail: '📱',
      uploaded: '3 weeks ago'
    },
    {
      id: '4',
      title: 'iPhone vs Other Phones Comparison',
      channel: 'PhoneWars',
      views: '3.2M views',
      duration: '18:56',
      thumbnail: '⚔️',
      uploaded: '1 week ago'
    },
    {
      id: '5',
      title: 'iPhone Tips and Tricks',
      channel: 'TechTips',
      views: '1.4M views',
      duration: '10:15',
      thumbnail: '💡',
      uploaded: '2 months ago'
    },
    {
      id: '6',
      title: 'iPhone Camera Tutorial',
      channel: 'PhotoPro',
      views: '789K views',
      duration: '14:30',
      thumbnail: '📸',
      uploaded: '1 month ago'
    }
  ];

  const filteredVideos = mockVideos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleBackToList = () => {
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    return (
      <motion.div
        className="youtube-app"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <YouTubeHeader onClose={onClose} />
        
        <div className="youtube-content">
          <div className="video-player">
            <div className="video-placeholder">
              <div className="video-thumbnail-large">{selectedVideo.thumbnail}</div>
              <div className="play-button">▶️</div>
              <div className="video-duration">{selectedVideo.duration}</div>
            </div>
            
            <div className="video-info">
              <h2 className="video-title">{selectedVideo.title}</h2>
              <div className="video-stats">
                <span className="video-views">{selectedVideo.views}</span>
                <span className="video-uploaded">{selectedVideo.uploaded}</span>
              </div>
              <div className="channel-info">
                <span className="channel-name">{selectedVideo.channel}</span>
                <button className="subscribe-button">Subscribe</button>
              </div>
            </div>
            
            <div className="video-actions">
              <button className="action-button">
                <span className="action-icon">👍</span>
                <span>Like</span>
              </button>
              <button className="action-button">
                <span className="action-icon">👎</span>
                <span>Dislike</span>
              </button>
              <button className="action-button">
                <span className="action-icon">💬</span>
                <span>Comment</span>
              </button>
              <button className="action-button">
                <span className="action-icon">📤</span>
                <span>Share</span>
              </button>
            </div>
            
            <button className="back-button" onClick={handleBackToList}>
              ← Back to Videos
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="youtube-app"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <YouTubeHeader onClose={onClose} />
      
      <div className="youtube-content">
        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>
        </div>

        {/* Featured Section */}
        <div className="featured-section">
          <h3 className="section-title">Featured Videos</h3>
          <div className="featured-video">
            <div className="featured-thumbnail">📱</div>
            <div className="featured-info">
              <h4>iPhone 1st Generation - Unboxing & Review</h4>
              <p>TechReviewer • 2.1M views • 2 weeks ago</p>
            </div>
          </div>
        </div>

        {/* Video List */}
        <div className="videos-section">
          <h3 className="section-title">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Videos'}
          </h3>
          <div className="video-list">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="video-item"
                onClick={() => handleVideoClick(video)}
              >
                <div className="video-thumbnail">
                  <div className="thumbnail-icon">{video.thumbnail}</div>
                  <div className="video-duration">{video.duration}</div>
                </div>
                <div className="video-details">
                  <h4 className="video-title">{video.title}</h4>
                  <p className="channel-name">{video.channel}</p>
                  <p className="video-meta">
                    {video.views} • {video.uploaded}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="youtube-nav">
          <button className="nav-button active">
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </button>
          <button className="nav-button">
            <span className="nav-icon">🔥</span>
            <span>Trending</span>
          </button>
          <button className="nav-button">
            <span className="nav-icon">📺</span>
            <span>Subscriptions</span>
          </button>
          <button className="nav-button">
            <span className="nav-icon">📚</span>
            <span>Library</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default YouTubeApp; 