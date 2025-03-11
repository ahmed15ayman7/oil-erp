import { useEffect, useRef } from 'react';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: string) => void;
}

export function useWebSocket({ url, onMessage }: UseWebSocketProps) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // إنشاء اتصال WebSocket
    ws.current = new WebSocket(url);

    // معالجة الأحداث
    ws.current.onopen = () => {
      console.log('تم الاتصال بنجاح');
    };

    ws.current.onmessage = (event) => {
      onMessage(event.data);
    };

    ws.current.onerror = (error) => {
      console.error('خطأ في اتصال WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('تم إغلاق الاتصال');
      // محاولة إعادة الاتصال بعد 5 ثواني
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          useWebSocket({ url, onMessage });
        }
      }, 5000);
    };

    // تنظيف عند إزالة المكون
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  return ws.current;
} 