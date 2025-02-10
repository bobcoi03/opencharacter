'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface ConditionalAdsenseProps {
  isPro?: boolean;
}

export function ConditionalAdsense({ isPro = false }: ConditionalAdsenseProps) {
  const [shouldShowAds, setShouldShowAds] = useState(false);

  useEffect(() => {
    // Only show ads for non-pro users
    setShouldShowAds(!isPro);
  }, [isPro]);

  if (!shouldShowAds) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9079424754244668"
      crossOrigin="anonymous"
    />
  );
} 