
import React, { useState, useRef, useEffect } from 'react';
import { ElementType, LogoStyle, DecorationType, FontType, GeneratorConfig, ChatMessage } from './types';
import { ELEMENTS, STYLES, DECORATIONS, FONTS } from './constants';
import { generateLogo, editLogo } from './services/gemini';
import Watermark from './components/Watermark';

const App: React.FC = () => {
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatting]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!config.serverName) {
      setError("⚔️ O nome do servidor é obrigatório!");
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
        text: `Saudações! O logo para ${config.serverName} foi forjado. Deseja fazer algum ajuste na fonte ou nas cores?`,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      setError(err.message || "A forja está instável. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !selectedFile) || !logoUrl || isChatting) return;

    const text = chatInput;
    const ref = selectedFile;
    setChatInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    setIsChatting(true);

    try {
      const result = await editLogo(logoUrl, text, config, ref || undefined);
      setLogoUrl(result.imageUrl);
      setMessages(prev => [...prev, { role: 'assistant', text: result.assistantMessage, timestamp: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Erro: ${err.message}`, timestamp: Date.now() }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      {/* Header Estilo SaaS Premium */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-epic text-2xl font-black text-black">L2</div>
            <h1 className="font-epic text-xl tracking-tight hidden sm:block">LOGO <span className="text-amber-500">FORGE</span></h1>
          </div>
          
          <button 
            onClick={() => setIsPremium(!isPremium)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              isPremium ? 'bg-white/5 text-slate-500' : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isPremium ? 'SaaS Ativo' : 'Upgrade Premium'}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Painel de Configurações */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[32px] space-y-8 backdrop-blur-sm">
            <h2 className="text-amber-500 font-epic text-sm uppercase tracking-[0.2em] flex items-center">
              <span className="mr-2">⚡</span> Configuração da Forja
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome do Servidor</label>
              <input 
                type="text"
                placeholder="Ex: ADEN WORLD..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 font-epic text-xl focus:ring-2 focus:ring-amber-500/20 transition-all outline-none uppercase placeholder:text-slate-800"
                value={config.serverName}
                onChange={(e) => setConfig({...config, serverName: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estilo da Fonte</label>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setConfig({...config, font: f.id})}
                    className={`p-3 rounded-lg border text-[9px] font-black uppercase transition-all ${
                      config.font === f.id ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/5 bg-white/5 text-slate-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-epic text-xl tracking-widest transition-all ${
                loading ? 'bg-white/5 text-slate-700 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
              }`}
            >
              {loading ? 'FORJANDO...' : 'FORJAR LOGO'}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Visualização e Chat */}
        <div className="lg:col-span-8 space-y-10">
          <div className="relative aspect-video bg-black rounded-[40px] overflow-hidden border border-white/5 shadow-2xl flex items-center justify-center group">
            {logoUrl ? (
              <>
                <img 
                  src={logoUrl} 
                  className={`w-full h-full object-contain transition-all duration-700 ${loading || isChatting ? 'opacity-20 blur-xl scale-95' : 'opacity-100 scale-100'}`} 
                  alt="Logo" 
                />
                {!isPremium && <Watermark />}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = logoUrl;
                      a.download = `${config.serverName}_logo.png`;
                      a.click();
                    }}
                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                   >
                     Download 4K
                   </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 opacity-10">
                <div className="w-20 h-20 mx-auto border-2 border-white rounded-full flex items-center justify-center">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <p className="font-epic text-2xl uppercase tracking-[0.5em]">Aguardando Ordem</p>
              </div>
            )}
          </div>

          {/* Chat de Refinamento */}
          <div className={`bg-slate-900/40 border border-white/5 rounded-[40px] flex flex-col transition-all duration-500 shadow-xl ${logoUrl ? 'h-[600px] opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="p-6 border-b border-white/5 bg-slate-950/40 flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arquiteto de Logos AI</span>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 border border-white/5 text-slate-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 animate-pulse text-slate-500 italic text-xs">
                    Refinando a forja mágica...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-8 bg-slate-950/60 border-t border-white/5">
              <div className="flex space-x-3">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all ${selectedFile ? 'text-amber-500 border-amber-500/50' : 'text-slate-400'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
                <input 
                  type="text"
                  placeholder="Peça alterações (ex: 'Mude para fogo azul', 'Use fonte cursiva')..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatting}
                />
                <button 
                  type="submit" 
                  disabled={isChatting}
                  className="px-8 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 disabled:opacity-20 transition-all"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-[10px] text-slate-700 font-black uppercase tracking-[1em]">L2 Logo Forge - High End SaaS</p>
      </footer>
    </div>
  );
};

export default App;
