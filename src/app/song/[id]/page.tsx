"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import NavTabs from "@/components/mobile/NavTabs";

type Song = any;

function guessAudioMimeType(url?: string | null) {
  if (!url) return "audio/mpeg";
  const base = url.split("?")[0]?.toLowerCase() ?? "";
  if (base.endsWith(".m3u8") || base.endsWith(".m3u")) return "application/vnd.apple.mpegurl";
  if (base.endsWith(".aac")) return "audio/aac";
  if (base.endsWith(".wav")) return "audio/wav";
  if (base.endsWith(".ogg") || base.endsWith(".oga")) return "audio/ogg";
  if (base.endsWith(".webm")) return "audio/webm";
  if (base.endsWith(".mp4") || base.endsWith(".m4a")) return "audio/mp4";
  return "audio/mpeg";
}

function parseCallbackTracks(song: any) {
  if (!song?.callbackData) return [] as any[];
  try {
    const parsed = JSON.parse(song.callbackData);
    const raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return (raw || []).map((track: any, index: number) => ({
      key: track.trackId || track.track_id || `${song.id}-cb-${index}`,
      trackId: track.trackId || track.track_id || `${song.id}-cb-${index}`,
      title: track.title || `${song.title} – variant ${index + 1}`,
      playbackUrl: track.streamAudioUrl || track.stream_audio_url || track.audioUrl || track.audio_url || track.sourceStreamAudioUrl || track.source_stream_audio_url || track.sourceAudioUrl || track.source_audio_url || null,
      imageUrl: track.imageUrl || track.image_url || song.imageUrl || null,
      duration: typeof track.durationSeconds === 'number' ? track.durationSeconds : (typeof track.duration === 'number' ? track.duration : null),
      model: track.modelName || track.model_name || song.modelName || null,
      sourceAudioUrl: track.sourceAudioUrl || track.source_audio_url || null,
      audioUrl: track.audioUrl || track.audio_url || null,
      order: index,
    }));
  } catch {
    return [] as any[];
  }
}

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const songId = (params?.id as string) || "";

  const { data, isLoading, error } = db.useQuery({
    songs: {
      $: { where: { id: songId }, limit: 1 } as any,
      variants: { $: { order: { order: 'asc' } } },
    },
  });

  const song: Song | undefined = data?.songs?.[0];
  const relationVariants = useMemo(() => {
    const arr = Array.isArray((song as any)?.variants) ? ((song as any).variants as Array<any>) : [];
    return arr.map((v: any, index: number) => ({
      key: v.id || `${songId}-rel-${index}`,
      trackId: v.trackId || v.id || `${songId}-rel-${index}`,
      title: v.title || `${song?.title} – versie ${index + 1}`,
      playbackUrl: v.streamAudioUrl || v.audioUrl || v.sourceStreamAudioUrl || v.sourceAudioUrl || null,
      imageUrl: v.imageUrl || song?.imageUrl || null,
      duration: v.durationSeconds ?? song?.durationSeconds ?? null,
      model: v.modelName || song?.modelName || null,
      sourceAudioUrl: v.sourceAudioUrl || null,
      audioUrl: v.audioUrl || null,
      order: v.order ?? index,
    }));
  }, [songId, song?.variants, song?.imageUrl, song?.modelName, song?.durationSeconds, song?.title]);

  const callbackVariants = useMemo(() => parseCallbackTracks(song), [song?.callbackData]);
  const basePlaybackUrl = song?.streamAudioUrl || song?.audioUrl || song?.sourceStreamAudioUrl || song?.sourceAudioUrl || null;

  const mergedVariants = useMemo(() => {
    const map = new Map<string, any>();
    relationVariants.forEach((v) => map.set(v.trackId || v.key, v));
    callbackVariants.forEach((t: any) => {
      const key = t.trackId || t.key;
      const ex = map.get(key) || t;
      map.set(key, {
        ...ex,
        title: t.title || ex.title,
        playbackUrl: t.playbackUrl || ex.playbackUrl || basePlaybackUrl,
        imageUrl: t.imageUrl || ex.imageUrl,
        duration: typeof t.duration === 'number' ? t.duration : ex.duration,
        model: t.model || ex.model,
        audioUrl: t.audioUrl || ex.audioUrl,
        sourceAudioUrl: t.sourceAudioUrl || ex.sourceAudioUrl,
        order: typeof t.order === 'number' ? t.order : ex.order,
      });
    });
    if (!map.size && song) {
      const key = song.sunoTrackId || song.id;
      map.set(key, {
        key,
        trackId: key,
        title: song.title,
        playbackUrl: basePlaybackUrl,
        imageUrl: song.imageUrl,
        duration: song.durationSeconds,
        model: song.modelName,
        audioUrl: song.audioUrl,
        sourceAudioUrl: song.sourceAudioUrl,
        order: 0,
      });
    }
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [relationVariants, callbackVariants, basePlaybackUrl, song]);

  const playable = mergedVariants.filter((v) => v.playbackUrl || v.audioUrl || v.sourceAudioUrl);
  const showAB = playable.length === 2;

  if (isLoading) {
    return (
      <>
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <div className="surface-card px-8 py-6 text-sm text-[rgba(31,27,45,0.6)]">Laden...</div>
        </div>
        <NavTabs />
      </>
    );
  }

  if (error || !song) {
    return (
      <>
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <div className="surface-card px-8 py-6 text-sm text-rose-600">Kon lied niet laden</div>
        </div>
        <NavTabs />
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-20 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="rounded-full border border-[#7f5af0]/30 px-3 py-1.5 text-xs font-semibold text-[#7f5af0] hover:bg-[#7f5af0]/10">← Terug</Link>
        <div className="text-xs text-[rgba(31,27,45,0.55)]">v{song.version}</div>
      </div>
      <h1 className="text-3xl font-semibold leading-tight">{song.title}</h1>
      <p className="mt-1 text-sm text-[rgba(31,27,45,0.58)]">{song.musicStyle}</p>

      <div className="mt-6">
        {showAB ? (
          <DetailABCompare variants={playable.slice(0, 2)} cover={song.imageUrl} title={song.title} />
        ) : (
          <div className="space-y-4">
            {mergedVariants.map((v: any, index: number) => {
              const playbackUrl = v.playbackUrl || v.audioUrl || v.sourceAudioUrl || null;
              const type = guessAudioMimeType(playbackUrl || v.audioUrl || v.sourceAudioUrl);
              return (
                <div key={v.key} className="space-y-2 rounded-2xl border border-white/50 bg-white/85 p-4">
                  <div className="flex items-center justify-between text-xs text-[rgba(31,27,45,0.55)]">
                    <span className="font-semibold text-[rgba(31,27,45,0.8)]">{v.title}</span>
                    {v.duration && <span>{`${Math.floor(v.duration/60)}:${String(Math.round(v.duration%60)).padStart(2,'0')}`}</span>}
                  </div>
                  {v.imageUrl && <img src={v.imageUrl} alt="cover" className="h-40 w-full rounded-xl object-cover" />}
                  {playbackUrl ? (
                    <audio controls preload="metadata" className="w-full rounded-xl">
                      <source src={playbackUrl} type={type} />
                    </audio>
                  ) : (
                    <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs text-[rgba(31,27,45,0.45)]">Audio nog niet beschikbaar.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {song.lyrics && (
        <div className="mt-8 rounded-2xl border border-white/50 bg-white/80 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(31,27,45,0.55)]">Lyrics</div>
          <div className="lyrics-scroll mt-2 max-h-[400px] overflow-y-auto whitespace-pre-wrap pr-2 text-sm leading-relaxed text-[rgba(31,27,45,0.85)]">{song.lyrics}</div>
        </div>
      )}
      <NavTabs />
    </div>
  );
}

function DetailABCompare({ variants, cover, title }: { variants: Array<any>; cover?: string | null; title?: string | null }) {
  const audioRefs = [useRef<HTMLAudioElement | null>(null), useRef<HTMLAudioElement | null>(null)];
  const canvasRefs = [useRef<HTMLCanvasElement | null>(null), useRef<HTMLCanvasElement | null>(null)];
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Array<AnalyserNode | null>>([null, null]);
  const sourcesRef = useRef<Array<MediaElementAudioSourceNode | null>>([null, null]);
  const [active, setActive] = useState<0 | 1>(0);
  const [progress, setProgress] = useState<[number, number]>([0, 0]);
  const [durations, setDurations] = useState<[number, number]>([0, 0]);
  const labels: [string, string] = ['A', 'B'];

  function handlePlay(idx: 0 | 1) {
    const current = audioRefs[idx].current;
    const other = audioRefs[idx === 0 ? 1 : 0].current;
    if (!current) return;
    if (other && !other.paused) other.pause();
    setActive(idx);
    if (current.paused) current.play().catch(() => {}); else current.pause();
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    variants.slice(0, 2).forEach((_v, idx) => {
      const el = audioRefs[idx].current;
      if (!el) return;
      if (!sourcesRef.current[idx]) {
        try {
          const src = ctx.createMediaElementSource(el);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          src.connect(analyser);
          sourcesRef.current[idx] = src;
          analysersRef.current[idx] = analyser;
        } catch {}
      }
    });
    let rafId: number;
    const draw = () => {
      variants.slice(0, 2).forEach((_v, idx) => {
        const cvs = canvasRefs[idx].current;
        const analyser = analysersRef.current[idx];
        if (!cvs || !analyser) return;
        const width = cvs.width;
        const height = cvs.height;
        const g = cvs.getContext('2d');
        if (!g) return;
        const len = analyser.fftSize;
        const data = new Uint8Array(len);
        analyser.getByteTimeDomainData(data);
        g.clearRect(0, 0, width, height);
        g.lineWidth = 2; g.strokeStyle = '#7f5af0'; g.beginPath();
        const step = width / len; let x = 0;
        for (let i = 0; i < len; i++) { const v = data[i] / 128.0; const y = (v * height) / 2; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); x += step; }
        g.lineTo(width, height/2); g.stroke();
      });
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [variants[0]?.key, variants[1]?.key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (isTyping) return;
      if (e.key === '1') { e.preventDefault(); handlePlay(0); }
      else if (e.key === '2') { e.preventDefault(); handlePlay(1); }
      else if (e.key === ' ') {
        e.preventDefault();
        const el = audioRefs[active].current; if (!el) return; if (el.paused) el.play().catch(() => {}); else el.pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  function onTime(idx: 0 | 1) {
    const a = audioRefs[idx].current; if (!a) return;
    setProgress((p) => { const next: [number, number] = [...p] as any; next[idx] = a.currentTime || 0; return next; });
  }
  function onLoaded(idx: 0 | 1) {
    const a = audioRefs[idx].current; if (!a) return;
    setDurations((d) => { const next: [number, number] = [...d] as any; next[idx] = a.duration || 0; return next; });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.32em] text-[rgba(31,27,45,0.55)]">Vergelijk varianten</div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs text-[rgba(31,27,45,0.7)]">Actief: <span className="font-semibold text-[#7f5af0]">{labels[active]}</span></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {variants.slice(0, 2).map((v, idx) => {
          const playbackUrl = v.playbackUrl || v.audioUrl || v.sourceAudioUrl || null;
          const isActive = active === idx;
          const pct = durations[idx] ? Math.min(100, (progress[idx] / durations[idx]) * 100) : 0;
          return (
            <div key={v.key} className={`relative overflow-hidden rounded-2xl border p-4 ${isActive ? 'border-[#7f5af0]/60 bg-white' : 'border-white/50 bg-white/80'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${isActive ? 'bg-[#7f5af0] text-white' : 'bg-[#7f5af0]/15 text-[#7f5af0]'}`}>{labels[idx]}</span>
                  <span className="font-semibold text-[rgba(31,27,45,0.8)]">{v.title || `${title} – ${labels[idx]}`}</span>
                </div>
                <div className="text-xs text-[rgba(31,27,45,0.55)]">{Math.floor(progress[idx]/60)}:{String(Math.floor(progress[idx]%60)).padStart(2,'0')} / {Math.floor(durations[idx]/60)}:{String(Math.floor(durations[idx]%60)).padStart(2,'0')}</div>
              </div>
              {v.imageUrl && <img src={v.imageUrl} alt="cover" className="mt-3 h-48 w-full rounded-xl object-cover" />}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(31,27,45,0.08)]"><div className="h-2 rounded-full bg-gradient-to-r from-[#7f5af0] to-[#ff6aa2]" style={{width: `${pct}%`}} /></div>
              <div className="mt-2 h-16 w-full overflow-hidden rounded-lg bg-white/60"><canvas ref={canvasRefs[idx]} width={800} height={64} className="h-16 w-full" /></div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handlePlay(idx as 0 | 1)} className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-[#7f5af0] text-white shadow-md shadow-[#7f5af0]/30' : 'bg-[#7f5af0]/10 text-[#7f5af0] hover:bg-[#7f5af0]/15'}`}>{audioRefs[idx].current && !audioRefs[idx].current?.paused ? 'Pauzeer' : 'Speel af'}</button>
                <a href={v.audioUrl || v.sourceAudioUrl || undefined} download={Boolean(v.audioUrl || v.sourceAudioUrl) || undefined} className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${(v.audioUrl || v.sourceAudioUrl) ? 'bg-[#ff6aa2]/15 text-[#ff3f87] hover:bg-[#ff6aa2]/20' : 'cursor-not-allowed bg-white/60 text-[rgba(31,27,45,0.45)]'}`} onClick={(e) => { if (!(v.audioUrl || v.sourceAudioUrl)) e.preventDefault(); }}>Download</a>
              </div>
              {playbackUrl && (<audio ref={audioRefs[idx]} src={playbackUrl} preload="metadata" onTimeUpdate={() => onTime(idx as 0 | 1)} onLoadedMetadata={() => onLoaded(idx as 0 | 1)} className="hidden" />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

