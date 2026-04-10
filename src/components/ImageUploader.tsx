'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface ImageUploaderProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export default function ImageUploader({ imageUrl, onImageChange }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.imageUrl) onImageChange(data.imageUrl);
      else alert(data.error || '업로드 실패');
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  }, [onImageChange]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await uploadFile(file);
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-[var(--muted)]">배경 이미지</label>

      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent-light)]/30 text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent)]" />
            업로드 중...
          </div>
        ) : (
          <>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
              <button
                onClick={() => fileRef.current?.click()}
                className="font-semibold text-[var(--accent)] hover:text-blue-700"
              >
                파일 선택
              </button>
              {' / 드래그 앤 드롭 / '}
              <span className="font-semibold text-[var(--accent)]">Cmd+V</span>
              {' 붙여넣기'}
            </p>
            <p className="text-[10px] text-gray-400">
              Instagram 사진: 우클릭 &rarr; 이미지 복사 &rarr; 여기서 Cmd+V
            </p>
          </>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]">
          이미지 URL 직접 입력
        </summary>
        <input
          type="url"
          value={imageUrl.startsWith('/') ? '' : imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="input mt-2"
        />
      </details>

      {imageUrl && (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
          <img
            src={imageUrl}
            alt="배경 미리보기"
            className="h-32 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            onClick={() => { onImageChange(''); if (fileRef.current) fileRef.current.value = ''; }}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white hover:bg-black/70"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            제거
          </button>
        </div>
      )}
    </div>
  );
}
