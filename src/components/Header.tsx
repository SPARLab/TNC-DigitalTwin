import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Palette, Check, ShoppingCart } from 'lucide-react';
import { THEMES, THEME_OPTIONS } from '../utils/themes';

interface HeaderProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  cartItemCount?: number;
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeChange, cartItemCount = 0, onCartClick }) => {
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isThemeDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeDropdownOpen]);

  const currentTheme = THEMES[theme] || THEMES.coastal;
  const isDarkTheme = currentTheme.header.includes('text-white');
  const borderClass = currentTheme.headerBorder || (isDarkTheme ? 'border-gray-600' : 'border-gray-200');

  return (
    <header id="main-header" className={`${currentTheme.header} border-b ${borderClass} transition-colors duration-200`}>
      <div id="header-container" className="px-page-x py-page-y">
        <div id="header-content" className="flex items-center justify-between h-full">
          <div id="header-left" className="flex items-center gap-gap-lg">
            <h1 id="site-title" className={`text-title-page ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Dangermond Preserve Data Catalog
            </h1>
            <nav id="main-navigation" className="hidden md:flex gap-section-sm">
              <a id="nav-browse" href="#" className={`text-body ${isDarkTheme ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                Browse
              </a>
              <a id="nav-saved-searches" href="#" className={`text-body ${isDarkTheme ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                Saved Searches
              </a>
              <a id="nav-export-queue" href="#" className={`text-body ${isDarkTheme ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                Export Queue
              </a>
            </nav>
          </div>

          <div id="header-right" className="flex items-center">
            {/* Theme Switcher Dropdown */}
            <div ref={themeDropdownRef} id="theme-switcher-container" className="relative">
              <button
                id="theme-switcher-button"
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className={`flex items-center gap-gap-default px-button-x py-button-sm-y rounded-button transition-colors ${
                  isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-100/50'
                }`}
                title="Change theme"
              >
                <Palette id="theme-icon" className={`w-4 h-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-600'}`} />
                <span id="theme-label" className={`text-body hidden sm:inline ${isDarkTheme ? 'text-gray-100' : 'text-gray-700'}`}>{currentTheme.name}</span>
                <ChevronDown 
                  id="theme-chevron" 
                  className={`w-3 h-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'} transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isThemeDropdownOpen && (
                <div id="theme-dropdown" className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-card shadow-lg z-50">
                  {THEME_OPTIONS.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      id={`theme-option-${themeOption.id}`}
                      onClick={() => {
                        onThemeChange(themeOption.id);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-button-x py-button-y text-body hover:bg-gray-50 first:rounded-t-card last:rounded-b-card flex items-center justify-between ${
                        theme === themeOption.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{themeOption.name}</span>
                      {theme === themeOption.id && (
                        <Check id={`theme-check-${themeOption.id}`} className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            {onCartClick && (
              <button
                id="shopping-cart-button"
                onClick={onCartClick}
                className={`relative p-button-y rounded-button transition-colors ${
                  isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
                aria-label={`Shopping cart with ${cartItemCount} items`}
                title="View shopping cart"
              >
                <ShoppingCart className={`w-5 h-5 ${isDarkTheme ? 'text-gray-200' : 'text-gray-600'}`} />
                {cartItemCount > 0 && (
                  <span 
                    id="cart-badge"
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-micro font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"
                    style={{ paddingTop: '1px' }}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
