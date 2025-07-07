
import React from 'react';
import { Building2 } from 'lucide-react';

interface ClientLogoProps {
  clientName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ClientLogo = ({ clientName, size = 'md', className = '' }: ClientLogoProps) => {
  // Generate a consistent color based on client name
  const generateColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const initials = clientName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const backgroundColor = generateColor(clientName);

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-semibold 
        text-white 
        shadow-md 
        ${className}
      `}
      style={{ backgroundColor }}
      title={clientName}
    >
      {initials || <Building2 size={iconSizes[size]} />}
    </div>
  );
};

export default ClientLogo;
