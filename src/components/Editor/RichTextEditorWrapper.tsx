'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import type { RichTextEditorHandle } from './RichTextEditorSimple';

// TinyMCE 컴포넌트를 동적으로 로드 (SSR 비활성화)
const RichTextEditorSimple = dynamic(() => import('./RichTextEditorSimple'), {
  ssr: false,
  loading: () => (
    <div className="w-full">
      <div
        className="border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
        style={{ height: '400px' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-500">에디터 준비 중...</div>
        </div>
      </div>
    </div>
  ),
});

interface RichTextEditorWrapperProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export type { RichTextEditorHandle };

const RichTextEditorWrapper = forwardRef<RichTextEditorHandle, RichTextEditorWrapperProps>(
  function RichTextEditorWrapper(props, ref) {
    return <RichTextEditorSimple ref={ref} {...props} />;
  }
);

export default RichTextEditorWrapper;