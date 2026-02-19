import React, { useState } from 'react';
import { Subtitle, StyleConfig, AppState } from './types';
import { Player } from './components/Player';
import { Editor } from './components/Editor';
import { StyleControls } from './components/StyleControls';
import { GeminiImport } from './components/GeminiImport';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// Fix: Add missing WebCodecs type definitions
declare global {
  class AudioEncoder {
    constructor(init: {
      output: (chunk: any, meta: any) => void;
      error: (e: any) => void;
    });
    configure(config: {
      codec: string;
      sampleRate: number;
      numberOfChannels: number;
      bitrate?: number;
    }): void;
    encode(data: AudioData): void;
    flush(): Promise<void>;
  }

  class AudioData {
    constructor(init: {
      format: string;
      sampleRate: number;
      numberOfFrames: number;
      numberOfChannels: number;
      timestamp: number;
      data: BufferSource;
    });
    close(): void;
  }
}

// Initial Style
const defaultStyle: StyleConfig = {
  fontSize: 24,
  fontFamily: 'Roboto',
  color: '#ffffff',
  outlineColor: '#000000',
  outlineWidth: 2,
  verticalAlign: 'bottom',
  bottomMargin: 30,
  backgroundColor: '#000000',
  backgroundOpacity: 0
  // ADICIONE ESTAS DUAS LINHAS ABAIXO:
  
maxCharsPerLine: 39,
  
maxCharsPerSubtitle: 95,
};

// Canvas Subtitle Renderer
const drawSubtitles = (ctx: CanvasRenderingContext2D, subtitles: Subtitle[], time: number, style: StyleConfig, width: number, height: number) => {
  const activeSubs = subtitles.filter(s => time >= s.startTime && time <= s.endTime);
  if (activeSubs.length === 0) return;

  ctx.save();
  ctx.textAlign = 'center';
  
  // Font Setup
  ctx.font = `bold ${style.fontSize}px ${style.fontFamily}, Arial, sans-serif`;
  
  // Calculate Base Y position
  let y = height - style.bottomMargin;
  let textBaseline: CanvasTextBaseline = 'bottom';

  if (style.verticalAlign === 'top') {
      textBaseline = 'top';
      y = style.bottomMargin;
  } else if (style.verticalAlign === 'center') {
      textBaseline = 'middle';
      y = height / 2;
  }
  ctx.textBaseline = textBaseline;

  // Render each subtitle
  activeSubs.forEach(sub => {
    const lines = sub.text.split('\n');
    const lineHeight = style.fontSize * 1.25;
    
    // Calculate vertical offset for multi-line text
    let startY = y;
    if (style.verticalAlign === 'bottom') {
       // Move up for each line above the bottom one
       startY = y - ((lines.length - 1) * lineHeight);
    } else if (style.verticalAlign === 'center') {
       // Center the block of text
       const totalHeight = (lines.length - 1) * lineHeight;
       startY = y - (totalHeight / 2);
    }
    
    lines.forEach((line, i) => {
        const lineY = startY + (i * lineHeight);
        
        // Background Box (if opacity > 0)
        if (style.backgroundOpacity > 0) {
           const metrics = ctx.measureText(line);
           const padding = 8;
           const bgH = style.fontSize * 1.2;
           // Estimate Y for rect based on baseline
           let rectY = lineY;
           if (textBaseline === 'bottom') rectY = lineY - bgH + (style.fontSize * 0.2);
           if (textBaseline === 'top') rectY = lineY - (style.fontSize * 0.1); // adjustment
           if (textBaseline === 'middle') rectY = lineY - bgH/2;

           ctx.fillStyle = `rgba(${parseInt(style.backgroundColor.slice(1,3),16)}, ${parseInt(style.backgroundColor.slice(3,5),16)}, ${parseInt(style.backgroundColor.slice(5,7),16)}, ${style.backgroundOpacity/255})`;
           ctx.fillRect((width/2) - metrics.width/2 - padding, rectY, metrics.width + padding*2, bgH);
        }

        // Stroke/Outline
        if (style.outlineWidth > 0) {
            ctx.strokeStyle = style.outlineColor;
            ctx.lineWidth = style.outlineWidth * 2;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, width / 2, lineY);
        }
        
        // Fill Text
        ctx.fillStyle = style.color;
        ctx.fillText(line, width / 2, lineY);
    });
  });

  ctx.restore();
};

function App() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(defaultStyle);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDims, setVideoDims] = useState({ w: 1280, h: 720 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSubtitles([]);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleMetadata = (dur: number, w: number, h: number) => {
    setDuration(dur);
    setVideoDims({ w, h });
  };

  // --- NATIVE WEBCODECS EXPORT (NO FFMPEG) ---
  const exportVideo = async () => {
    if (!videoFile) return;
    
    // Feature detection
    if (typeof VideoEncoder === 'undefined') {
        alert("Seu navegador não suporta exportação nativa (WebCodecs). Por favor, use uma versão recente do Chrome, Edge ou Firefox.");
        return;
    }

    setAppState(AppState.PROCESSING);
    setProgress(0);
    setLogs([]);
    setStatusMsg('Inicializando exportação nativa...');
    
    // Create an invisible video element for frame extraction
    const videoEl = document.createElement('video');
    videoEl.src = URL.createObjectURL(videoFile);
    videoEl.muted = true;
    videoEl.playsInline = true;
    
    await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => resolve();
    });

    try {
        const width = videoDims.w;
        const height = videoDims.h;
        // Ensure dimensions are even (requirement for many codecs)
        const safeWidth = width % 2 === 0 ? width : width - 1;
        const safeHeight = height % 2 === 0 ? height : height - 1;

        // 1. Configure Muxer
        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: {
                codec: 'avc', // H.264
                width: safeWidth,
                height: safeHeight
            },
            audio: {
                codec: 'aac',
                numberOfChannels: 2,
                sampleRate: 44100
            },
            fastStart: 'in-memory'
        });

        // 2. Configure Video Encoder
        const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (e) => { console.error(e); throw e; }
        });

        const bitrate = safeWidth * safeHeight * 2; // Approximate bitrate calculation
        videoEncoder.configure({
            codec: 'avc1.42E028', // Baseline profile
            width: safeWidth,
            height: safeHeight,
            bitrate: bitrate, 
            framerate: 30
        });

        // 3. Configure Audio Encoder
        const audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => { console.error(e); throw e; }
        });
        audioEncoder.configure({
            codec: 'mp4a.40.2', // AAC
            numberOfChannels: 2,
            sampleRate: 44100,
            bitrate: 128000
        });

        // 4. Process Audio
        setStatusMsg('Processando áudio...');
        const audioCtx = new AudioContext({ sampleRate: 44100 });
        const fileBuffer = await videoFile.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(fileBuffer);
        
        // Feed audio data to encoder
        const numberOfChannels = 2;
        const totalSamples = audioBuffer.length;
        const sampleRate = 44100;
        const data = new Float32Array(totalSamples * numberOfChannels);
        
        // Interleave audio channels
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
        for (let i = 0; i < totalSamples; i++) {
            data[i * 2] = left[i];
            data[i * 2 + 1] = right[i];
        }

        const audioData = new AudioData({
            format: 'f32', // Interleaved Float32
            sampleRate,
            numberOfFrames: totalSamples,
            numberOfChannels,
            timestamp: 0,
            data
        });
        audioEncoder.encode(audioData);
        audioData.close();

        // 5. Process Video Frames
        setStatusMsg('Renderizando vídeo e legendas...');
        const canvas = document.createElement('canvas');
        canvas.width = safeWidth;
        canvas.height = safeHeight;
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;

        const fps = 30;
        const duration = videoEl.duration;
        const totalFrames = Math.floor(duration * fps);
        const msPerFrame = 1000 / fps;

        for (let i = 0; i < totalFrames; i++) {
            const time = i / fps;
            videoEl.currentTime = time;
            
            // Wait for seek
            await new Promise<void>(r => {
                const onSeek = () => {
                    videoEl.removeEventListener('seeked', onSeek);
                    r();
                };
                videoEl.addEventListener('seeked', onSeek);
            });

            // Draw video
            ctx.drawImage(videoEl, 0, 0, safeWidth, safeHeight);
            
            // Draw subtitles
            drawSubtitles(ctx, subtitles, time, styleConfig, safeWidth, safeHeight);

            // Create frame
            const frame = new VideoFrame(canvas, { timestamp: i * 1000000 / fps }); // micros
            
            // Manage backpressure
            if (videoEncoder.encodeQueueSize > 2) {
                await videoEncoder.flush();
            }

            videoEncoder.encode(frame, { keyFrame: i % 60 === 0 });
            frame.close();

            // Progress
            if (i % 15 === 0) {
                const pct = Math.round((i / totalFrames) * 100);
                setProgress(pct);
                setLogs(prev => [`Renderizando frame ${i}/${totalFrames}`, ...prev.slice(0, 10)]);
            }
        }

        setStatusMsg('Finalizando arquivo MP4...');
        await videoEncoder.flush();
        await audioEncoder.flush();
        muxer.finalize();

        const { buffer } = muxer.target;
        const blob = new Blob([buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_legendado_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setAppState(AppState.READY);
        audioCtx.close();

    } catch (e: any) {
        console.error(e);
        setStatusMsg(`Erro fatal: ${e.message}`);
        setAppState(AppState.ERROR);
    } finally {
        // Cleanup
        videoEl.src = '';
        videoEl.load();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-brand-800 bg-brand-900 px-6 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
           <h1 className="font-bold text-xl tracking-tight text-white">SubGenius <span className="text-brand-400 font-normal text-sm">AI Editor</span></h1>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer px-4 py-2 bg-brand-800 hover:bg-brand-700 rounded text-sm font-semibold transition border border-brand-600">
            Abrir Vídeo
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>
          <button 
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded text-sm font-bold transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            IA Mágica
          </button>
          <button 
            onClick={exportVideo}
            disabled={!videoSrc || subtitles.length === 0 || appState === AppState.PROCESSING}
            className={`px-6 py-2 rounded text-sm font-bold transition shadow-lg ${
              !videoSrc || subtitles.length === 0 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
            }`}
          >
            {appState === AppState.PROCESSING ? 'Processando...' : 'Exportar MP4'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Player & Styles */}
        <div className="flex-[2] flex flex-col p-6 gap-6 overflow-y-auto">
          
          {showImport && (
            <GeminiImport 
              onImport={(subs) => {
                setSubtitles(subs);
                setShowImport(false);
              }} 
              onClose={() => setShowImport(false)} 
            />
          )}

          <Player 
            videoSrc={videoSrc}
            subtitles={subtitles}
            styleConfig={styleConfig}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onLoadedMetadata={handleMetadata}
            isPlaying={isPlaying}
            onPlayToggle={setIsPlaying}
          />

          <div className="bg-brand-900 border border-brand-800 rounded-lg p-1 shadow-xl">
             <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Estilização</div>
             <StyleControls config={styleConfig} onChange={setStyleConfig} />
          </div>
        </div>

        {/* Right Column: Subtitle List */}
        <div className="flex-1 p-6 pl-0 min-w-[350px]">
          <Editor 
            subtitles={subtitles}
            currentTime={currentTime}
            onSeek={(t) => {
              setCurrentTime(t);
            }}
            onAddSubtitle={() => {
               const newSub: Subtitle = {
                 id: Date.now().toString(),
                 startTime: currentTime,
                 endTime: currentTime + 3,
                 text: "Nova legenda"
               };
               setSubtitles([...subtitles, newSub].sort((a,b) => a.startTime - b.startTime));
            }}
            onDeleteSubtitle={(id) => {
              setSubtitles(subtitles.filter(s => s.id !== id));
            }}
            onUpdateSubtitle={(id, updates) => {
              setSubtitles(subtitles.map(s => s.id === id ? { ...s, ...updates } : s).sort((a,b) => a.startTime - b.startTime));
            }}
          />
        </div>
      </main>

      {/* Overlay Modal for Processing */}
      {(appState === AppState.PROCESSING || appState === AppState.ERROR) && (
        <div className="fixed inset-0 bg-brand-950/90 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-brand-900 border border-brand-700 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center relative flex flex-col max-h-[80vh]">
            
            {appState === AppState.ERROR && (
               <button onClick={() => setAppState(AppState.IDLE)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            )}

            {appState === AppState.PROCESSING ? (
               <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shrink-0"></div>
            ) : (
               <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 text-red-500">✕</div>
            )}
            
            <h2 className="text-2xl font-bold text-white mb-2 shrink-0">
               {appState === AppState.PROCESSING ? 'Renderizando Vídeo' : 'Falha na Exportação'}
            </h2>
            <p className={`mb-6 shrink-0 text-sm ${appState === AppState.ERROR ? 'text-red-300' : 'text-brand-300'}`}>{statusMsg}</p>
            
            {appState === AppState.PROCESSING && (
              <>
                <div className="w-full bg-brand-950 rounded-full h-4 overflow-hidden border border-brand-800 shrink-0">
                  <div 
                    className="bg-brand-500 h-full transition-all duration-300 striped-bar"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-400 mt-2 shrink-0">{progress}%</p>
              </>
            )}
            
            {/* Logs Area for Debugging */}
            <div className="mt-6 bg-black/50 rounded p-2 text-left overflow-y-auto flex-1 border border-brand-800 min-h-[100px]">
               <p className="text-[10px] font-mono text-gray-500 mb-1 border-b border-brand-800 pb-1">LOGS DO SISTEMA:</p>
               {logs.map((log, i) => (
                  <p key={i} className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap font-thin border-b border-gray-800/20">{log}</p>
               ))}
            </div>

            {appState === AppState.PROCESSING && (
               <p className="text-xs text-yellow-500/80 mt-6 bg-yellow-900/20 p-3 rounded border border-yellow-900/50 shrink-0">
               ⚠️ Mantenha esta aba aberta para o processamento não parar.
               </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;