
import React, { useState, useRef, useEffect } from 'react';
import { ElementType, LogoStyle, DecorationType, FontType, GeneratorConfig, ChatMessage } from './types';
import { ELEMENTS, STYLES, DECORATIONS, FONTS } from './constants';
import { generateLogo, editLogo } from './services/gemini';
import Watermark from './components/Watermark';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [config, setConfig] = useState<GeneratorConfig>({
    serverName: '',
    element: ElementType.FIRE,
    font: FontType.GOTHIC,
    style: LogoStyle.EPIC_MEDIEVAL,
    decoration: DecorationType.SWORD,
  });
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      // Caso fora do AI Studio, assumimos que process.env.API_KEY está lá
      setHasKey(true);
    }
  };

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume sucesso conforme instruções para evitar race condition
    }
  };

  // Fix: Implemented handleFileChange to process user-uploaded reference images.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const downloadImage = () => {
    if (!logoUrl) return;
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = `${config.serverName.replace(/\s+/g, '_') || 'l2_logo'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!config.serverName) {
      setError("Por favor, digite o nome do seu servidor.");
      return;
    }
    setError(null);
    setLoading(true);
    setMessages([]); 
    try {
      const url = await generateLogo(config);
      setLogoUrl(url);
      setMessages([{
        role: 'assistant',
        text: `A forja materializou sua visão! Gostou do resultado? Se desejar, envie uma imagem de referência ou peça ajustes específicos na fonte e detalhes.`,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      if (err.message === 'REKEY_REQUIRED') {
        setError("Chave de API expirada ou inválida. Reconecte seu projeto.");
        setHasKey(false);
      } else {
        setError(err.message || "Erro na Forja. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const messageText = typeof e === 'string' ? e : chatInput;
    if ((!messageText.trim() && !selectedFile) || !logoUrl || isChatting) return;

    if (typeof e !== 'string') setChatInput('');
    
    const currentRefImage = selectedFile;
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages(prev => [...prev, { 
      role: 'user', 
      text: messageText + (currentRefImage ? " [Referência Visual Anexada]" : ""), 
      timestamp: Date.now() 
    }]);
    setIsChatting(true);

    try {
      const result = await editLogo(logoUrl, messageText, config, currentRefImage || undefined);
      setLogoUrl(result.imageUrl);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: result.assistantMessage, 
        timestamp: Date.now() 
      }]);
    } catch (err: any) {
      if (err.message === 'REKEY_REQUIRED') {
        setHasKey(false);
      }
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ Alerta da Forja: ${err.message}`, 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Tela de Boas-vindas / Conexão de API
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-amber-500 rounded-2xl flex items-center justify-center font-epic text-5xl font-bold text-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.4)] mb-8">L2</div>
        <h1 className="font-epic text-4xl text-white mb-4">LOGO <span className="text-amber-500">FORGE</span></h1>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          Para acessar a Forja Premium e utilizar os modelos Gemini 3 Pro, você precisa conectar seu projeto do Google Cloud com faturamento ativado.
        </p>
        <button 
          onClick={handleOpenKey}
          className="bg-amber-500 text-slate-950 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-400 transition-all shadow-2xl mb-6"
        >
          DESBLOQUEAR FORJA
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-amber-500/70 text-xs uppercase tracking-widest hover:text-amber-500 transition-colors border-b border-amber-500/20 pb-1"
        >
          Documentação de Faturamento e Chaves
        </a>
      </div>
    );
  }

  if (hasKey === null) return null; // Aguardando check inicial

  const commonSuggestions = [
    { label: 'Caligrafia Luxuosa', cmd: 'Redesenhe a tipografia com uma fonte cursiva extremamente luxuosa e conectada' },
    { label: 'Gótica Agressiva', cmd: 'Mude a fonte para um estilo gótico medieval Blackletter agressivo' },
    { label: 'Rúnico Ancestral', cmd: 'Transforme a tipografia em runas ancestrais esculpidas em pedra brilhante' },
    { label: 'Efeito de Fogo Azul', cmd: 'Mude a energia elemental para fogo azul místico com partículas elétricas' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-epic text-2xl font-bold text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              L2
            </div>
            <h1 className="font-epic text-2xl tracking-tight hidden sm:block">
              LOGO <span className="text-amber-500">FORGE</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-widest">SaaS Status</span>
              <span className={`text-sm font-bold ${isPremium ? 'text-amber-400' : 'text-slate-300'}`}>
                {isPremium ? '💎 Premium Active' : 'Basic Trial'}
              </span>
            </div>
            <button 
              onClick={() => setIsPremium(!isPremium)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isPremium 
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                : 'bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
            >
              {isPremium ? 'Downgrade' : 'Upgrade Premium - R$ 39,90'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-6 sticky top-28">
            <h2 className="text-xl font-epic text-amber-500 mb-4 flex items-center">
              <span className="mr-2">⚔️</span> Parâmetros Base
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-tighter">NOME DO SERVIDOR</label>
              <input 
                type="text"
                placeholder="Ex: GLORY, AVIONER..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-epic text-xl uppercase placeholder:text-slate-700"
                value={config.serverName}
                onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-tighter">Escolher ELEMENTO</label>
              <div className="grid grid-cols-5 gap-2">
                {ELEMENTS.map((el) => (
                  <button
                    key={el.id}
                    title={el.label}
                    onClick={() => setConfig({ ...config, element: el.id })}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                      config.element === el.id 
                      ? 'border-amber-500 bg-amber-500/20' 
                      : 'border-slate-800 bg-slate-950/50'
                    }`}
                  >
                    <span className="text-xl">{el.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-tighter">Escolher FONTE</label>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setConfig({ ...config, font: font.id })}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      config.font === font.id 
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-500'
                    }`}
                  >
                    <span className="text-lg mb-1">{font.icon}</span>
                    <span className="text-[9px] font-bold uppercase">{font.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-tighter">ESTILO VISUAL</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
                value={config.style}
                onChange={(e) => setConfig({ ...config, style: e.target.value as LogoStyle })}
              >
                {STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-tighter">DESTAQUE CENTRAL</label>
              <div className="grid grid-cols-1 gap-2">
                {DECORATIONS.map((dec) => (
                  <button
                    key={dec.id}
                    onClick={() => setConfig({ ...config, decoration: dec.id })}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all text-left ${
                      config.decoration === dec.id 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    {dec.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-epic text-lg tracking-widest transition-all ${
                loading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              {loading ? 'INVOCANDO GEMINI 3 PRO...' : 'FORJAR LOGO'}
            </button>

            {error && <p className="text-red-400 text-xs text-center font-semibold bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
          </section>
        </div>

        {/* Preview & Chat Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="w-full aspect-video md:aspect-square lg:aspect-video relative bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
            {logoUrl ? (
              <>
                <img 
                  src={logoUrl} 
                  alt="L2 Premium Logo Preview" 
                  className={`w-full h-full object-contain transition-opacity duration-500 ${loading || isChatting ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                />
                {!isPremium && <Watermark />}
                
                {(loading || isChatting) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-md z-10">
                    <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="font-epic text-2xl text-amber-400 animate-pulse uppercase tracking-widest text-center px-4 max-w-md">
                      {loading ? 'Consultando Mestre Designer...' : 'Processando Referência 3D...'}
                    </p>
                  </div>
                )}

                <div className="absolute top-6 right-6 flex space-x-2">
                   <span className="bg-slate-950/80 backdrop-blur border border-slate-800 px-4 py-1.5 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-xl">
                    {isPremium ? '💎 GEMINI 3 PRO HD' : 'PREVIEW QUALITY'}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPremium ? (
                    <button 
                      onClick={downloadImage}
                      className="bg-amber-500 text-slate-950 px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      DOWNLOAD PREMIUM
                    </button>
                  ) : (
                    <div className="bg-slate-950/90 backdrop-blur p-4 rounded-2xl border border-amber-500/40 shadow-2xl">
                       <p className="text-xs text-amber-200 font-bold uppercase tracking-widest">⚠️ Upgrade to remove Watermark</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-600 space-y-4">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center opacity-30 animate-pulse">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p className="font-epic text-xl uppercase tracking-widest text-slate-700 text-center">Aguardando Parâmetros da Forja</p>
              </div>
            )}
          </div>

          {/* Chat Refinement Section */}
          <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden flex flex-col transition-all duration-500 ${logoUrl ? 'h-[650px] opacity-100 shadow-2xl' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <h3 className="font-epic text-sm text-amber-500 uppercase tracking-widest">AI Master Refiner</h3>
              </div>
            </div>

            <div className="px-4 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-3 overflow-x-auto no-scrollbar">
               {commonSuggestions.map((sug, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSendMessage(sug.cmd)}
                   disabled={isChatting}
                   className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-1.5 rounded-full text-[10px] text-slate-300 font-semibold transition-all disabled:opacity-50"
                 >
                   {sug.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                    ? 'bg-amber-500 text-slate-950 font-semibold' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-5 bg-slate-950/70 border-t border-slate-800 space-y-4">
              {selectedFile && (
                <div className="flex items-center space-x-4 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
                  <img src={selectedFile} alt="Ref preview" className="w-16 h-16 object-cover rounded-xl border-2 border-amber-500/50" />
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 font-bold">REMOVER</button>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-800 text-slate-400 rounded-2xl border border-slate-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></button>

                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Refinar usando Gemini 3 Pro..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 pr-16 text-sm"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button type="submit" disabled={isChatting} className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-amber-500 text-slate-950 rounded-xl font-bold">FORJAR</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-12 bg-slate-950 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.5em] font-black">
            ⚔️ L2 LOGO FORGE PREMIUN SAAS ⚔️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
