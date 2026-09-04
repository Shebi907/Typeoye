import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, padding = 'md', onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card',
        hover && 'card-hover cursor-pointer',
        paddingClass[padding],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
