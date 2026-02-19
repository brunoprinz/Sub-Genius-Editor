import React, { useRef, useEffect, useState } from 'react';
import { StyleConfig, Subtitle } from '../types';

interface PlayerProps {
  videoSrc: string | null;
  subtitles: Subtitle[];
  styleConfig: StyleConfig;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number, width: number, height: number) => void;
  isPlaying: boolean;
  onPlayToggle: (playing: boolean) => void;
}

export const Player: React.FC<PlayerProps> = ({
  videoSrc,
  subtitles,
  styleConfig,
  currentTime,
  onTimeUpdate,
  onLoadedMetadata,
  isPlaying,
  onPlayToggle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<Subtitle | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    // Sync external time changes (e.g. from timeline click) only if significant diff
    // to prevent loop
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
    
    // Find active subtitle
    const current = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    setActiveSubtitle(current || null);
  }, [currentTime, subtitles]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const getOutlineStyle = () => {
    const w = styleConfig.outlineWidth;
    const c = styleConfig.outlineColor;
    if (w === 0) return 'none';
    // Emulate strict border using text-shadow for preview
    return `
      ${w}px ${w}px 0 ${c},
      -${w}px ${w}px 0 ${c},
      ${w}px -${w}px 0 ${c},
      -${w}px -${w}px 0 ${c},
      0px ${w}px 0 ${c},
      0px -${w}px 0 ${c},
      ${w}px 0px 0 ${c},
      -${w}px 0px 0 ${c}
    `;
  };

  const getContainerPosition = () => {
    switch (styleConfig.verticalAlign) {
      case 'top': return { top: `${styleConfig.bottomMargin}px` };
      case 'center': return { top: '50%', transform: 'translateY(-50%)' };
      case 'bottom': default: return { bottom: `${styleConfig.bottomMargin}px` };
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    // alpha 0-255 in settings, css needs 0-1
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
  };

  if (!videoSrc) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center text-gray-500 border border-brand-800">
        <p>Selecione um vídeo para começar</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group border border-brand-800 shadow-2xl">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => onLoadedMetadata(e.currentTarget.duration, e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
        onClick={() => onPlayToggle(!isPlaying)}
      />
      
      {/* Subtitle Overlay */}
      {activeSubtitle && (
        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none px-8"
          style={getContainerPosition()}
        >
          <span
  style={{
    fontFamily: styleConfig.fontFamily,
    fontSize: `${styleConfig.fontSize}px`,
    color: styleConfig.color,
    textShadow: getOutlineStyle(),
    backgroundColor: styleConfig.backgroundOpacity > 0 ? hexToRgba(styleConfig.backgroundColor, styleConfig.backgroundOpacity) : 'transparent',
    padding: '4px 8px',
    borderRadius: '4px',
    textAlign: 'center',
    lineHeight: 1.2,
// ESTES SÃO OS AJUSTES CRÍTICOS:
    display: 'block',           // Mudamos de inline-block para block
    width: 'fit-content',       // Faz a tarja preta envolver apenas o texto
    maxWidth: '85%',            // Reduzimos um pouco para dar mais margem de segurança
    margin: '0 auto',           // Centraliza o bloco inteiro horizontalmente
    whiteSpace: 'pre-wrap',     // Mantém seus "Enters" manuais
    wordBreak: 'break-word',    // Força a quebra se uma palavra for gigante
    overflowWrap: 'anywhere',   // Garante que não escape de jeito nenhum
  }}
>
  {activeSubtitle.text}
</span>
        </div>
      )}

      {/* Custom Controls (Simple) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onPlayToggle(!isPlaying)}
          className="text-white hover:text-brand-400"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
};