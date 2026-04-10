/**
 * 클라이언트에서 SVG 문자열을 PNG data URL로 변환
 * data URI 방식 사용 (Blob URL보다 브라우저 호환성 높음)
 */
export function svgToPng(svgString: string, width = 1080, height = 1350): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 생성 실패'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(new Error('Canvas 렌더링 실패: ' + String(err)));
      }
    };
    img.onerror = (e) => {
      reject(new Error('SVG 이미지 로드 실패: ' + String(e)));
    };

    // data URI 방식 — Blob URL보다 호환성 좋음
    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    img.src = encoded;
  });
}
