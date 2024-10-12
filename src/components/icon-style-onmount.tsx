"use client"

import React, { useEffect } from 'react';

const IconStyleInitializer = () => {
  useEffect(() => {
    // This effect runs only on the client side after the component mounts
    if (typeof window !== 'undefined') {
      const storedStyle = localStorage.getItem('character_icon_style');
      if (storedStyle === null) {
        localStorage.setItem('character_icon_style', 'circle');
      }
      // If a value already exists, we do nothing
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // This component doesn't render anything
  return null;
};

export default IconStyleInitializer;