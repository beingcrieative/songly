"use client";
import { useEffect, useRef, useState } from 'react';

export default function AudioRecorder({ onComplete }: { onComplete: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => onComplete(new Blob(chunks, { type: 'audio/webm' }));
      rec.start();
      setRecording(true);
      timerRef.current = window.setTimeout(() => stop(), 15000);
    } catch (e: any) {
      setError(e?.message || 'Microfoon niet beschikbaar');
    }
  };

  const stop = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const rec = mediaRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setRecording(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="flex items-center gap-2">
      {!recording ? (
        <button className="px-3 py-1 border rounded" onClick={start}>Opnemen (15s)</button>
      ) : (
        <button className="px-3 py-1 border rounded" onClick={stop}>Stop</button>
      )}
      {error ? <span className="text-red-600 text-sm">{error}</span> : null}
    </div>
  );
}

