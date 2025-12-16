/**
 * CompanyLogo Component
 * Displays a company logo with fallback to a placeholder
 */

import React, { useState } from 'react';

interface CompanyLogoProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function CompanyLogo({ src, alt, className = '' }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  // Show fallback if no src or if image failed to load
  if (!src || hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center flex-shrink-0 ${className}`}>
        <svg 
          className="w-1/2 h-1/2 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover flex-shrink-0 ${className}`}
    />
  );
}
