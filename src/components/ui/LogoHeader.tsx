import React from 'react';
import { FileText } from 'lucide-react';

interface LogoHeaderProps {
  onClick?: () => void;
  minimal?: boolean;
}

const LogoHeader: React.FC<LogoHeaderProps> = ({ onClick, minimal = false }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${onClick ? 'cursor-pointer' : ''}`}
    >
      <FileText className="h-8 w-8 text-blue-600 mr-3" />
      {!minimal && (
        <h1 className="text-xl font-semibold text-gray-900">writing.humans</h1>
      )}
    </div>
  );
};

export default LogoHeader; 