import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="bg-white border-t border-gray-200 px-page-base lg:px-page-lg xl:px-page-xl 2xl:px-page-2xl py-page-y-base lg:py-page-y-lg xl:py-page-y-xl 2xl:py-page-y-2xl">
      <div id="footer-content" className="flex items-center justify-between">
        <div id="footer-copyright" className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500">
          © 2024 Dangermond Preserve Digital Twin • Data provided by multiple research institutions
        </div>
        <div id="footer-links" className="flex gap-gap-section-base lg:gap-gap-section-lg xl:gap-gap-section-xl 2xl:gap-gap-section-2xl">
          <a id="footer-terms-link" href="#" className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 hover:text-gray-700">
            Terms of Use
          </a>
          <a id="footer-privacy-link" href="#" className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 hover:text-gray-700">
            Privacy Policy
          </a>
          <a id="footer-contact-link" href="#" className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 hover:text-gray-700">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
