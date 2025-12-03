import React from 'react';

interface LidarIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom LiDAR icon representing a 3D isometric point cloud cube.
 * Created in Figma, exported as SVG.
 */
const LidarIcon: React.FC<LidarIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-2 -2 26 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 3D isometric point cloud cube */}
      {/* Corner/edge points - lighter */}
      <circle cx="6" cy="4" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="6" cy="16" r="1.1" fill="currentColor" opacity="0.25" />
      <circle cx="16" cy="16" r="1.1" fill="currentColor" opacity="0.25" />
      <circle cx="6" cy="10" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="6" cy="22" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="4" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="22" r="1.5" fill="currentColor" opacity="0.4" />
      
      {/* Mid points - medium */}
      <circle cx="11" cy="7" r="1.1" fill="currentColor" opacity="0.25" />
      <circle cx="11" cy="19" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="1" cy="13" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="21" cy="13" r="1.5" fill="currentColor" opacity="0.4" />
      
      {/* Key vertices - full opacity */}
      <circle cx="1" cy="7" r="2" fill="currentColor" />
      <circle cx="1" cy="19" r="2" fill="currentColor" />
      <circle cx="21" cy="7" r="2" fill="currentColor" />
      <circle cx="21" cy="19" r="2" fill="currentColor" />
      <circle cx="11" cy="1" r="2" fill="currentColor" />
      <circle cx="11" cy="13" r="2" fill="currentColor" />
      <circle cx="11" cy="25" r="2" fill="currentColor" />
    </svg>
  );
};

export default LidarIcon;

