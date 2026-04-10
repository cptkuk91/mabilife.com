'use client';

import { useRef, useEffect, useState, memo, useId, useImperativeHandle, forwardRef } from 'react';
import { loadTinyMCE, type TinyMCEBlobInfo, type TinyMCEEditor } from '@/lib/tinymce-loader';
import { getPresignedUrlAction } from '@/actions/upload';
import { uploadFileWithPresignedUrl } from '@/lib/upload-client';

export interface RichTextEditorHandle {
  getContent: () => string;
}

interface RichTextEditorSimpleProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

const RichTextEditorSimple = forwardRef<RichTextEditorHandle, RichTextEditorSimpleProps>(function RichTextEditorSimple({
  value,
  onChange,
  placeholder = '내용을 입력해주세요...',
  height = 400,
  disabled = false,
}, ref) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const uniqueId = useId();
  const editorId = `tinymce-${uniqueId.replace(/:/g, '-')}`;
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tinymceRef = useRef<TinyMCEEditor | null>(null);
  const mountedRef = useRef(true);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  // Expose getContent method via ref
  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (tinymceRef.current) {
        return tinymceRef.current.getContent();
      }
      return value;
    }
  }), [value]);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    mountedRef.current = true;
    
    const initEditor = async () => {
      try {
        // Load TinyMCE script
        await loadTinyMCE();

        if (!mountedRef.current || !editorRef.current) return;

        // Check if TinyMCE is available
        if (!window.tinymce) {
          throw new Error('TinyMCE not available after loading');
        }

        // Remove any existing editor with same ID
        const existingEditor = window.tinymce.get(editorId);
        if (existingEditor) {
          existingEditor.destroy();
        }

        // Initialize editor
        const editors = await window.tinymce.init({
          target: editorRef.current,
          base_url: '/tinymce',
          height,
          menubar: false,
          plugins: 'lists link charmap anchor code help image',
          toolbar: disabled ? false : 
            'undo redo | blocks | ' +
            'bold italic forecolor | link unlink image | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
              font-size: 16px;
              line-height: 1.6;
              margin: 16px;
              color: #1D1D1F;
            }
            img { max-width: 100%; height: auto; border-radius: 8px; }
          `,
          placeholder,
          branding: false,
          promotion: false,
          statusbar: false,
          resize: false,
          readonly: disabled,
          paste_as_text: true,
          paste_data_images: true,
          link_default_target: '_blank',
          link_default_protocol: 'https',
          
          // Image Upload Handler
          images_upload_handler: async (blobInfo: TinyMCEBlobInfo) => {
            const file = blobInfo.blob();
            const fileName = blobInfo.filename();
            const contentType = file.type;

            try {
              // 1. Get Presigned URL from Server Action
              const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(
                fileName,
                contentType,
                file.size,
                "guide-content",
              );
              
              if (!success || !signedUrl || !publicUrl) {
                throw new Error(error || 'Failed to get upload URL');
              }

              // 2. Upload directly to S3 using Presigned URL
              await uploadFileWithPresignedUrl(signedUrl, file);

              // 3. Return the public URL to TinyMCE
              return publicUrl;
            } catch (error) {
              console.error('Image upload failed:', error);
              throw error;
            }
          },
          
          valid_elements: 'p[style],br,strong[style],em[style],u[style],span[style],ol,ul,li[style],a[href|target|style],h1[style],h2[style],h3[style],h4[style],h5[style],h6[style],img[src|alt|width|height|style]',
          valid_styles: {
            '*': 'color,text-align,background-color,font-size,font-weight,font-style,text-decoration,width,height,border-radius'
          },
          extended_valid_elements: 'span[style],img[src|alt|width|height|style]',
          invalid_elements: 'script,iframe,object,embed,form,input,button',
          init_instance_callback: (editor: TinyMCEEditor) => {
            if (!mountedRef.current) return;
            
            tinymceRef.current = editor;
            
            // Set initial content
            if (valueRef.current) {
              editor.setContent(valueRef.current);
            }
            
            // Mark as initialized
            setIsInitialized(true);
            
            // Setup change handlers
            if (!disabled) {
              let updateTimeout: NodeJS.Timeout;
              
              const handleChange = () => {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                  if (mountedRef.current && tinymceRef.current) {
                    const content = tinymceRef.current.getContent();
                    onChangeRef.current(content);
                  }
                }, 500);
              };
              
              editor.on('change', handleChange);
              editor.on('keyup', handleChange);
            }
          }
        });

        if (!mountedRef.current) return;

        if (editors && editors.length > 0) {
          tinymceRef.current = editors[0];
        }
      } catch (err) {
        console.error('Editor initialization error:', err);
        if (mountedRef.current) {
          setError('에디터 초기화에 실패했습니다.');
        }
      }
    };

    initEditor();

    return () => {
      mountedRef.current = false;
      
      if (tinymceRef.current) {
        try {
          tinymceRef.current.destroy();
          tinymceRef.current = null;
        } catch (e) {
          console.warn('Failed to destroy editor:', e);
        }
      }
    };
  }, [editorId, height, disabled, placeholder]);

  // Update content when value changes
  useEffect(() => {
    if (tinymceRef.current && isInitialized && mountedRef.current) {
      const currentContent = tinymceRef.current.getContent();
      if (currentContent !== value) {
        tinymceRef.current.setContent(value || '');
      }
    }
  }, [value, isInitialized]);

  if (error) {
    return (
      <div className="w-full">
        <div 
          className="border border-red-300 rounded-lg flex flex-col items-center justify-center bg-red-50"
          style={{ height: `${height}px` }}
        >
          <div className="text-red-600 text-center p-4">
            <div className="mb-2">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {!isInitialized && (
        <div 
          className="absolute inset-0 z-10 border border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50"
          style={{ height: `${height}px` }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="text-gray-500">에디터 로딩 중...</div>
          </div>
        </div>
      )}
      <textarea
        ref={editorRef}
        id={editorId}
        style={{ 
          visibility: !isInitialized ? 'hidden' : 'visible',
          position: !isInitialized ? 'absolute' : 'relative'
        }}
        disabled={disabled}
        defaultValue={value}
      />
    </div>
  );
});

export default memo(RichTextEditorSimple);
