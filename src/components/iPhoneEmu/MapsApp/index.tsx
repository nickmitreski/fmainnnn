import React from 'react';
import { motion } from 'framer-motion';
import { Map, Marker } from 'pigeon-maps';
import MapsHeader from './MapsHeader';
import './MapsApp.css';

const MELBOURNE: [number, number] = [-37.8136, 144.9631];

interface MapsAppProps {
  onClose: () => void;
}

const MapsApp: React.FC<MapsAppProps> = ({ onClose }) => {
  return (
    <motion.div
      className="maps-app"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <MapsHeader onClose={onClose} />
      <div className="maps-content">
        <div className="map-container">
          <Map height={350} defaultCenter={MELBOURNE} defaultZoom={13}>
            <Marker width={40} anchor={MELBOURNE} />
          </Map>
        </div>
        <div className="maps-controls">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search for a place or address"
              className="search-input"
            />
            <button className="search-button">Search</button>
          </div>
          <div className="map-buttons">
            <button className="map-button">
              <span className="button-icon">📍</span>
              My Location
            </button>
            <button className="map-button">
              <span className="button-icon">🚗</span>
              Directions
            </button>
            <button className="map-button">
              <span className="button-icon">⭐</span>
              Favorites
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapsApp; 