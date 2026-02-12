// ============================================================================
// LucideIcon — Dynamic Lucide icon by name string
// Avoids importing every icon individually in data-driven components.
// ============================================================================

import type { FC } from 'react';
import {
  Camera, Leaf, Bird, Flame, Droplets, Thermometer, Plane, Scan,
  Square, Satellite, Mountain, Route, TreePine, Waves, Layers,
  AlertTriangle, CloudSun, BookOpen, PawPrint, HelpCircle,
  // Icons for dynamic catalog categories + subcategories
  Map, MapPin, Wheat, Sprout, Anchor, Trees, Building, Settings,
  ShieldAlert, Clock, Folder,
} from 'lucide-react';

const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  Camera, Leaf, Bird, Flame, Droplets, Thermometer, Plane, Scan,
  Square, Satellite, Mountain, Route, TreePine, Waves, Layers,
  AlertTriangle, CloudSun, BookOpen, PawPrint, HelpCircle,
  Map, MapPin, Wheat, Sprout, Anchor, Trees, Building, Settings,
  ShieldAlert, Clock, Folder,
};

interface LucideIconProps {
  name: string;
  className?: string;
}

export function LucideIcon({ name, className }: LucideIconProps) {
  const Icon = ICON_MAP[name] ?? HelpCircle;
  return <Icon className={className} />;
}
