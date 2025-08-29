import React from 'react';

const Header: React.FC = () => {
  return (
    <header id="main-header" className="bg-white border-b border-gray-200 h-16">
      <div id="header-container" className="px-6 py-4">
        <div id="header-content" className="flex items-center justify-between">
          <div id="header-left" className="flex items-center space-x-6">
            <h1 id="site-title" className="text-xl font-semibold text-gray-900">
              Dangermond Preserve Data Catalog
            </h1>
            <nav id="main-navigation" className="flex space-x-6">
              <a id="nav-browse" href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Browse
              </a>
              <a id="nav-saved-searches" href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Saved Searches
              </a>
              <a id="nav-export-queue" href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Export Queue
              </a>
            </nav>
          </div>
          <div id="header-right" className="flex space-x-3">
            <button 
              id="sign-in-btn"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign In
            </button>
            <button 
              id="register-btn"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
