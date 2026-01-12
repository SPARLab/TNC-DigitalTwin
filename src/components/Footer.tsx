import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="bg-white border-t border-gray-200 px-page-x py-page-y">
      <div id="footer-content" className="flex items-center justify-between">
        <div id="footer-copyright" className="text-body text-gray-500">
          © 2024 Dangermond Preserve Digital Twin • Data provided by multiple research institutions
        </div>
        <div id="footer-links" className="flex space-x-6">
          <a id="footer-terms-link" href="#" className="text-body text-gray-500 hover:text-gray-700">
            Terms of Use
          </a>
          <a id="footer-privacy-link" href="#" className="text-body text-gray-500 hover:text-gray-700">
            Privacy Policy
          </a>
          <a id="footer-contact-link" href="#" className="text-body text-gray-500 hover:text-gray-700">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
