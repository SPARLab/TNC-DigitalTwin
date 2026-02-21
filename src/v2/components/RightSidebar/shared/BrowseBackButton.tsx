import { ChevronLeft } from 'lucide-react';

interface BrowseBackButtonProps {
  id: string;
  label: string;
  onClick: () => void;
}

export function BrowseBackButton({ id, label, onClick }: BrowseBackButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800
                 transition-colors -ml-1"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
