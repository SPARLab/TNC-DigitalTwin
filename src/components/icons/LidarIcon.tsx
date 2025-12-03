import React from 'react';

interface LidarIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom LiDAR icon representing a 3D point cloud cube pattern.
 * Inspired by the Apple LiDAR Scanner icon aesthetic.
 */
const LidarIcon: React.FC<LidarIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 3D point cloud cube pattern - dots arranged in a perspective cube shape */}
      
      {/* Back face (smaller dots, lighter) */}
      <circle cx="8" cy="6" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="6" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.4" />
      
      {/* Middle layer */}
      <circle cx="6" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="6" cy="13" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="13" r="1.2" fill="currentColor" opacity="0.6" />
      
      {/* Front face (larger dots, full opacity) */}
      <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="10" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="5" cy="17" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="10" cy="17" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="15" cy="17" r="1.5" fill="currentColor" opacity="0.9" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="19" cy="17" r="1.5" fill="currentColor" opacity="0.9" />
      
      {/* Bottom edge points */}
      <circle cx="7.5" cy="20" r="1.3" fill="currentColor" />
      <circle cx="12" cy="20" r="1.3" fill="currentColor" />
      <circle cx="16.5" cy="20" r="1.3" fill="currentColor" />
    </svg>
  );
};

export default LidarIcon;

