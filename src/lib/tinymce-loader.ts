'use client';

declare global {
  interface Window {
    tinymce: any;
    tinymceLoading?: Promise<void>;
    tinymceLoaded?: boolean;
  }
}

let loadingPromise: Promise<void> | null = null;

export const loadTinyMCE = (): Promise<void> => {
  // If already loaded, return resolved promise
  if (typeof window !== 'undefined' && window.tinymceLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    // Check if already loaded
    if (window.tinymce) {
      window.tinymceLoaded = true;
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="/tinymce/tinymce.min.js"]');
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => {
        window.tinymceLoaded = true;
        resolve();
      });
      existingScript.addEventListener('error', () => {
        loadingPromise = null;
        reject(new Error('Failed to load TinyMCE'));
      });
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = '/tinymce/tinymce.min.js';
    script.async = true;

    script.onload = () => {
      window.tinymceLoaded = true;
      resolve();
    };

    script.onerror = () => {
      console.error('Failed to load TinyMCE script');
      loadingPromise = null;
      reject(new Error('Failed to load TinyMCE'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const isTinyMCELoaded = (): boolean => {
  return typeof window !== 'undefined' && window.tinymceLoaded === true;
};