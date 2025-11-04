import React, { useState } from 'react';
import { Database, Radio } from 'lucide-react';

// Helper component for icons with fallback
const IconWithFallback: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string;
  fallbackSvg: React.ReactNode;
}> = ({ src, alt, className, fallbackSvg }) => {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <>{fallbackSvg}</>;
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setImgError(true)}
    />
  );
};

// eBird Icon - using official brand color (#00AEEF)
export const EBirdIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#00AEEF"/>
      <path d="M9 10c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2v-4z" fill="white"/>
      <path d="M15 10c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2v-4z" fill="white"/>
    </svg>
  );
  
  return (
    <IconWithFallback 
      src="https://www.ebird.org/favicon.ico"
      alt="eBird"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// iNaturalist Icon - using official brand color (#74AC00)
export const INaturalistIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#74AC00"/>
      <circle cx="12" cy="8" r="2" fill="white"/>
      <path d="M8 14c0-2 1.79-3.5 4-3.5s4 1.5 4 3.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M10 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  
  return (
    <IconWithFallback 
      src="https://www.inaturalist.org/favicon.ico"
      alt="iNaturalist"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// TNC Icon - ArcGIS Hub favicon for TNC ArcGIS Hub
export const TNCIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#70C240"/>
      <path d="M12 6c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2s2-.9 2-2c0-1.1-.9-2-2-2z" fill="white" opacity="0.7"/>
    </svg>
  );
  
  return (
    <IconWithFallback 
      src="https://hubcdn.arcgis.com/opendata-ui/assets/assets/images/favicon-45a5f6cdc7f23c52b20204d54a7d9ca2.ico"
      alt="TNC ArcGIS Hub"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// CalFlora Icon - official logo (green circle with two white leaves)
export const CalFloraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2E7D32"/>
      <path d="M8 10C8 8 9 7 10 8C10.5 8.5 10.5 9.5 10 10C9 11 8 10 8 10Z" fill="white"/>
      <path d="M16 10C16 8 15 7 14 8C13.5 8.5 13.5 9.5 14 10C15 11 16 10 16 10Z" fill="white"/>
    </svg>
  );
  
  return (
    <IconWithFallback 
      src="https://www.calflora.org/favicon.ico"
      alt="CalFlora"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// LiDAR Icon - ArcGIS Hub favicon (LiDAR data is also from ArcGIS Hub)
export const LiDARIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <Database className={className} />
  );
  
  return (
    <IconWithFallback 
      src="https://hubcdn.arcgis.com/opendata-ui/assets/assets/images/favicon-45a5f6cdc7f23c52b20204d54a7d9ca2.ico"
      alt="LiDAR"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// Dendra Icon - official logo
export const DendraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const fallback = (
    <Radio className={className} />
  );
  
  return (
    <IconWithFallback 
      src="https://dendra.science/favicon.ico"
      alt="Dendra"
      className={className}
      fallbackSvg={fallback}
    />
  );
};

// Map data source names to their icon components
// Handles both full names (e.g., 'iNaturalist (Public API)') and lowercase identifiers (e.g., 'inaturalist')
export const getDataSourceIcon = (source: string, className?: string): React.ReactElement | null => {
  const iconProps = { className: className || 'w-4 h-4' };
  const sourceLower = source.toLowerCase();
  
  // Handle lowercase identifiers (used in cart items)
  if (sourceLower === 'inaturalist' || source.includes('iNaturalist')) {
    return <INaturalistIcon {...iconProps} />;
  } else if (sourceLower === 'ebird' || source === 'eBird') {
    return <EBirdIcon {...iconProps} />;
  } else if (sourceLower.includes('tnc') || source.includes('TNC')) {
    return <TNCIcon {...iconProps} />;
  } else if (sourceLower === 'calflora' || source.includes('CalFlora')) {
    return <CalFloraIcon {...iconProps} />;
  } else if (sourceLower === 'lidar' || source === 'LiDAR') {
    return <LiDARIcon {...iconProps} />;
  } else if (sourceLower === 'dendra' || source === 'Dendra Stations') {
    return <DendraIcon {...iconProps} />;
  }
  
  // Default fallback
  return <Database className={className || 'w-4 h-4'} />;
};

// Helper to get icon for the selected source (for button display)
export const getSelectedSourceIcon = (source: string | undefined): React.ReactElement => {
  if (!source) {
    return <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  }
  
  const icon = getDataSourceIcon(source, 'w-4 h-4 flex-shrink-0');
  if (!icon) {
    return <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  }
  
  return icon;
};
