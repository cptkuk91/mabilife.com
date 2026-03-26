'use client';

export interface TinyMCEBlobInfo {
  blob: () => Blob;
  filename: () => string;
}

export interface TinyMCEEditor {
  getContent: () => string;
  setContent: (content: string) => void;
  destroy: () => void;
  on: (event: 'change' | 'keyup', handler: () => void) => void;
}

export interface TinyMCEInitOptions {
  target: HTMLTextAreaElement;
  base_url: string;
  height: number;
  menubar: boolean;
  plugins: string;
  toolbar: string | false;
  content_style: string;
  placeholder: string;
  branding: boolean;
  promotion: boolean;
  statusbar: boolean;
  resize: boolean;
  readonly: boolean;
  paste_as_text: boolean;
  paste_data_images: boolean;
  link_default_target: string;
  link_default_protocol: string;
  images_upload_handler: (blobInfo: TinyMCEBlobInfo) => Promise<string>;
  valid_elements: string;
  valid_styles: Record<string, string>;
  extended_valid_elements: string;
  invalid_elements: string;
  init_instance_callback: (editor: TinyMCEEditor) => void;
}

export interface TinyMCENamespace {
  get: (id: string) => TinyMCEEditor | null;
  init: (options: TinyMCEInitOptions) => Promise<TinyMCEEditor[]>;
}

declare global {
  interface Window {
    tinymce?: TinyMCENamespace;
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
