import React, { useState } from 'react';
import { Subtitle } from '../types';

interface GeminiImportProps {
  onImport: (subs: Subtitle[]) => void;
  onClose: () => void;
}

const promptParaGemini = `Olá! Por favor, atue como um mestre em acessibilidade e legendagem profissional (Padrão Netflix). 
Analise o áudio deste vídeo completo com calma e precisão para gerar legendas no idioma nativo do vídeo.

Regras de Ouro:
1. Máximo de 39 caracteres por linha (muito importante!).
2. Máximo de 95 caracteres por trecho de legenda.
3. Se a frase for longa, por favor, quebre-a em duas legendas separadas no tempo para manter o conforto visual.

Retorne APENAS um array JSON puro, sem textos explicativos, seguindo este formato exato:
[
  {"id": "1", "startTime": 0.5, "endTime": 3.2, "text": "Frase falada aqui\\nSegunda linha se houver"},
  {"id": "2", "startTime": 3.5, "endTime": 6.0, "text": "Próxima frase curta"}
]

Muito obrigado pelo seu esforço e precisão, seu trabalho é fundamental para este projeto!`;

export const GeminiImport: React.FC<GeminiImportProps> = ({ onImport, onClose }) => {
  const [rawJson, setRawJson] = useState('');

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptParaGemini);
    alert("Prompt copiado! Agora cole no Gemini junto com seu arquivo de áudio/vídeo.");
  };

  const handleImportJson = () => {
    try {
      const cleanJson = rawJson.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed)) {
        // Validate basic structure
        const validated = parsed.map((item: any, index: number) => ({
          id: item.id || `sub-${index}`,
          startTime: Number(item.startTime) || 0,
          endTime: Number(item.endTime) || 0,
          text: String(item.text || '')
        }));
        
        onImport(validated);
        setRawJson('');
      } else {
        throw new Error("Não é um array");
      }
    } catch (e) {
      alert("Erro no formato. Certifique-se de copiar o JSON completo gerado pela IA.");
    }
  };

  return (
    <div className="mb-6 p-6 bg-brand-900 border border-brand-500 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <svg className="text-brand-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> 
          Gerar com IA Externa
        </h2>
        <button onClick={onClose} className="text-brand-400 hover:text-white">&times;</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700">
          <span className="text-brand-500 font-black text-xl mb-2 block">1.</span>
          <p className="text-sm mb-3 text-gray-300">Copie o prompt configurado para o Gemini.</p>
          <button onClick={handleCopyPrompt} className="w-full py-2 bg-brand-700 hover:bg-brand-600 rounded text-xs font-bold transition text-white">
            COPIAR PROMPT
          </button>
        </div>

        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700">
          <span className="text-brand-500 font-black text-xl mb-2 block">2.</span>
          <p className="text-sm mb-3 text-gray-300">Vá ao Gemini e envie o vídeo/áudio com o prompt.</p>
          <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="block w-full py-2 bg-brand-700 hover:bg-brand-600 rounded text-xs font-bold text-center transition text-white">
            ABRIR GEMINI
          </a>
        </div>

        <div className="p-4 bg-brand-800 rounded-xl border border-brand-700">
          <span className="text-brand-500 font-black text-xl mb-2 block">3.</span>
          <p className="text-sm mb-3 text-gray-300">Cole o JSON gerado abaixo e confirme.</p>
          <textarea 
            className="w-full h-20 bg-brand-950 p-2 rounded border border-brand-600 text-[10px] font-mono text-gray-300"
            placeholder='Cole o [ { ... } ] aqui'
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
          />
        </div>
      </div>
      
      <button 
        onClick={handleImportJson}
        disabled={!rawJson}
        className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-30 rounded-xl font-bold transition shadow-lg shadow-brand-500/20 text-white"
      >
        GERAR LEGENDAS NA TIMELINE
      </button>
    </div>
  );
};