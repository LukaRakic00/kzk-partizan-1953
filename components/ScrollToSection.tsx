'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ScrollToSection = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      const hash = window.location.hash;
      if (hash) {
        // Normalize hash: remove all # and add a single one at the start
        const normalizedHash = '#' + hash.replace(/^#+/, '');
        const scrollToElement = () => {
          const element = document.querySelector(normalizedHash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            // Retry if element not found yet (page still loading)
            setTimeout(scrollToElement, 100);
          }
        };
        // Wait a bit for page to render
        setTimeout(scrollToElement, 300);
      }
    }
  }, [pathname]);

  // Also listen for hash changes
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash) {
          // Normalize hash: remove all # and add a single one at the start
          const normalizedHash = '#' + hash.replace(/^#+/, '');
          const scrollToElement = () => {
            const element = document.querySelector(normalizedHash);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            } else {
              setTimeout(scrollToElement, 100);
            }
          };
          setTimeout(scrollToElement, 100);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [pathname]);

  return null;
};

export default ScrollToSection;
