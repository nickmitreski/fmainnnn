import React, { memo } from 'react';

const MSPaint: React.FC = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <iframe 
        src="/jspaint-main/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#c0c0c0'
        }}
        title="JS Paint"
        allow="fullscreen"
      />
    </div>
  );
};

export default memo(MSPaint);