
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
  
  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setError("⚔️ O nome do servidor é obrigatório para a invocação.");
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
        text: `O Mestre da Forja materializou sua visão! Se precisar de ajustes finos ou quiser que eu me inspire em uma imagem, basta enviar agora.`,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      setError(err.message || "Erro místico na Forja. Verifique as configurações.");
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
      text: messageText + (currentRefImage ? " [Analisando Referência Visual...]" : ""), 
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ Alerta da Forja: ${err.message}`, 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  const commonSuggestions = [
    { label: 'Caligrafia Luxuosa', cmd: 'Refine a tipografia para um estilo cursivo luxuoso e fluido com fios dourados' },
    { label: 'Gótica Brutal', cmd: 'Altere a fonte para um estilo gótico brutalista, pesado e agressivo' },
    { label: 'Rúnico Antigo', cmd: 'Transforme o texto em runas antigas esculpidas em pedra com brilho interno' },
    { label: 'Efeito Elétrico', cmd: 'Adicione raios e faíscas elétricas azuis ao redor de todo o logo' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center font-epic text-3xl font-black text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]">L2</div>
            <h1 className="font-epic text-2xl tracking-tight uppercase">LOGO <span className="text-amber-500">FORGE</span></h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Forge Status</span>
              <span className="text-sm font-bold text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Online</span>
            </div>
            <button 
              onClick={() => setIsPremium(!isPremium)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                isPremium 
                ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                : 'bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              }`}
            >
              {isPremium ? 'SaaS Active' : 'Upgrade Premium'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Parameters */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-8 sticky top-28 backdrop-blur-sm">
            <h2 className="text-xl font-epic text-amber-500 flex items-center uppercase tracking-widest">
              <span className="mr-3 text-2xl">⚡</span> Forja Principal
            </h2>
            
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Nome do Servidor</label>
              <input 
                type="text"
                placeholder="Ex: ADEN, GLORY..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-epic text-2xl uppercase placeholder:text-slate-800"
                value={config.serverName}
                onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Elemento Base</label>
              <div className="grid grid-cols-5 gap-2">
                {ELEMENTS.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setConfig({ ...config, element: el.id })}
                    className={`aspect-square flex items-center justify-center text-2xl rounded-xl border transition-all ${
                      config.element === el.id 
                      ? 'border-amber-500 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'
                    }`}
                  >
                    {el.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Anatomia da Fonte</label>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setConfig({ ...config, font: font.id })}
                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-tighter transition-all ${
                      config.font === font.id 
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400' 
                      : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-epic text-xl tracking-[0.2em] transition-all shadow-2xl ${
                loading 
                ? 'bg-slate-800 text-slate-600 cursor-wait' 
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-amber-500/20'
              }`}
            >
              {loading ? 'FORJANDO...' : 'INICIAR FORJA'}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview & Chat */}
        <div className="lg:col-span-8 space-y-10">
          <div className="w-full aspect-video relative bg-slate-900 rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center group">
            {logoUrl ? (
              <>
                <img 
                  src={logoUrl} 
                  alt="L2 Premium Logo" 
                  className={`w-full h-full object-contain transition-all duration-700 ${loading || isChatting ? 'opacity-20 blur-xl scale-95' : 'opacity-100 scale-100'}`}
                />
                {!isPremium && <Watermark />}
                
                {(loading || isChatting) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10">
                    <div className="w-24 h-24 border-b-4 border-amber-500 rounded-full animate-spin mb-8"></div>
                    <p className="font-epic text-2xl text-amber-400 animate-pulse uppercase tracking-[0.3em]">
                      {loading ? 'Invocando o Mestre...' : 'Refinando Anatomia...'}
                    </p>
                  </div>
                )}

                <div className="absolute top-8 right-8 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-5 py-2 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest shadow-2xl">
                    High-End Render
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  <button 
                    onClick={downloadImage}
                    className="bg-amber-500 text-slate-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_15px_30px_rgba(245,158,11,0.4)]"
                  >
                    Baixar Arquivo Final
                  </button>
                  {!isPremium && (
                    <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-amber-500/30">
                       <p className="text-[10px] text-amber-200 font-bold uppercase tracking-widest">Remover Marca d'água 💎</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center opacity-20">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <p className="font-epic text-2xl uppercase tracking-[0.4em] text-slate-800">Santuário da Forja</p>
              </div>
            )}
          </div>

          {/* AI Chat Section */}
          <div className={`bg-slate-900/40 border border-slate-800 rounded-[40px] overflow-hidden flex flex-col transition-all duration-700 shadow-2xl ${logoUrl ? 'h-[700px] opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                <h3 className="font-epic text-sm text-amber-500 uppercase tracking-widest">Designer AI (Cérebro da Forja)</h3>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950/20 border-b border-slate-800 flex items-center space-x-3 overflow-x-auto no-scrollbar">
               {commonSuggestions.map((sug, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSendMessage(sug.cmd)}
                   disabled={isChatting}
                   className="whitespace-nowrap bg-slate-800/50 hover:bg-amber-500/10 border border-slate-700 px-5 py-2 rounded-full text-[10px] text-slate-400 font-bold uppercase transition-all disabled:opacity-50"
                 >
                   {sug.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 px-6 py-4 rounded-3xl border border-slate-700">
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

            <form onSubmit={handleSendMessage} className="p-8 bg-slate-950/60 border-t border-slate-800 space-y-6">
              {selectedFile && (
                <div className="flex items-center space-x-5 bg-amber-500/10 p-4 rounded-3xl border border-amber-500/30">
                  <div className="relative w-20 h-20">
                    <img src={selectedFile} alt="Ref preview" className="w-full h-full object-cover rounded-2xl border-2 border-amber-500/50" />
                    <button type="button" onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                  <div>
                    <p className="text-xs text-amber-500 font-black uppercase tracking-widest">Referência Ativa</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">O Mestre vai extrair o estilo desta imagem para o seu logo.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-5 bg-slate-800 text-slate-400 rounded-3xl border border-slate-700 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-xl"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>

                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Refinar usando Inteligência MMORPG..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-3xl px-8 py-5 pr-20 text-sm focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button type="submit" disabled={isChatting} className="absolute right-3 top-3 bottom-3 px-6 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 disabled:opacity-50 shadow-xl">Refinar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-16 bg-slate-950 mt-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p className="text-slate-700 text-[10px] uppercase tracking-[0.8em] font-black">L2 LOGO FORGE PREMIUN SAAS</p>
          <p className="text-slate-800 text-[9px] uppercase font-bold tracking-widest">Powered by Gemini 2.5 Flash for private server owners</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
