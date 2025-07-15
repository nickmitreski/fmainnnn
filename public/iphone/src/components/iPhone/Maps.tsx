import React, { useEffect, useState } from 'react';
import { Map, Marker } from 'pigeon-maps';

const MELBOURNE: [number, number] = [-37.8136, 144.9631];

const Maps: React.FC = () => {
  const [center, setCenter] = useState<[number, number]>(MELBOURNE);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
        <Map height={"100%" as any} center={center} defaultZoom={13} boxClassname="w-full h-full">
          <Marker width={40} anchor={center} />
        </Map>
      </div>
    </div>
  );
};

export default Maps; 