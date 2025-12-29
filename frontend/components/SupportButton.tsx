'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SupportButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href="/support"
      className="fixed bottom-6 right-6 z-50 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Main button */}
        <div className="w-14 h-14 bg-accent-yellow rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 relative overflow-hidden">
          {/* Background circle with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-yellow to-accent-yellow-dark rounded-full"></div>
          
          {/* Support icon - black color */}
          <img 
            src="/support-icon.png" 
            alt="Support" 
            className="w-8 h-8 relative z-10"
            style={{ 
              filter: 'brightness(0) saturate(100%)'
            }}
          />
        </div>

        {/* Tooltip on hover */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg whitespace-nowrap shadow-lg">
            Support
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        )}

        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-accent-yellow animate-ping opacity-20"></div>
      </div>
    </Link>
  );
}

