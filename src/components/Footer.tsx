import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          © 2024 Dangermond Preserve Digital Twin • Data provided by multiple research institutions
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Terms of Use
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
