import React from 'react';
import { ArrowLeft, LayoutGrid } from 'lucide-react';

interface DataTypeBackHeaderProps {
  onBack: () => void;
}

/**
 * Distinct header bar for navigating back to the Data Types catalog.
 * Visually differentiated from internal navigation buttons to prevent confusion.
 */
const DataTypeBackHeader: React.FC<DataTypeBackHeaderProps> = ({ onBack }) => {
  return (
    <button
      id="back-to-data-types"
      onClick={onBack}
      className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      {/* <LayoutGrid className="w-4 h-4" /> */}
      <span>Back to Data Types</span>
    </button>
  );
};

export default DataTypeBackHeader;

