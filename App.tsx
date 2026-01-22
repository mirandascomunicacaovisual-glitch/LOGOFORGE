
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
        text: `A forja concluiu sua obra inicial para o servidor **${config.serverName.toUpperCase()}**! O que achou? Se precisar de ajustes finos, como mudar a curvatura da fonte ou adicionar detalhes específicos, basta me dizer ou enviar uma referência.`,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      setError(err.message || "Falha ao gerar o logo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
      text: messageText + (currentRefImage ? " [Enviando Imagem de Referência...]" : ""), 
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
      console.error("Chat edit error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ Erro na Forja: ${err.message}`, 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  const commonSuggestions = [
    { label: 'Caligrafia Luxuosa', cmd: 'Redesenhe a tipografia com uma fonte cursiva extremamente luxuosa e conectada, como caligrafia de alta classe' },
    { label: 'Gótica Agressiva', cmd: 'Mude a fonte para um estilo gótico medieval Blackletter com traços agressivos e robustos' },
    { label: 'Rúnico Ancestral', cmd: 'Transforme a tipografia em runas ancestrais esculpidas em pedra brilhante' },
    { label: 'Efeito de Fogo Azul', cmd: 'Mude a energia elemental para fogo azul místico com partículas elétricas' },
    { label: 'Substituir por Dragão', cmd: 'Substitua o elemento central por um dragão 3D majestoso em posição de ataque' },
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
              <span className="text-xs text-slate-400 uppercase tracking-widest">Plano Atual</span>
              <span className={`text-sm font-bold ${isPremium ? 'text-amber-400' : 'text-slate-300'}`}>
                {isPremium ? '💎 Premium' : 'Gratuito'}
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
              {isPremium ? 'Desativar Assinatura' : 'Ativar Premium - R$ 39,90'}
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
              {loading ? 'CONECTANDO À FORJA...' : 'FORJAR LOGO'}
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
                      {loading ? 'Invocando o Mestre da Forja...' : 'Refinando Anatomia e Texturas...'}
                    </p>
                    <p className="text-slate-400 text-xs mt-4 uppercase tracking-[0.3em]">Isso pode levar alguns segundos</p>
                  </div>
                )}

                <div className="absolute top-6 right-6 flex space-x-2">
                   <span className="bg-slate-950/80 backdrop-blur border border-slate-800 px-4 py-1.5 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-xl">
                    {isPremium ? '💎 RENDER HD' : 'PREVIEW'}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPremium ? (
                    <button 
                      onClick={downloadImage}
                      className="bg-amber-500 text-slate-950 px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all flex items-center shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      BAIXAR ARQUIVO FINAL
                    </button>
                  ) : (
                    <div className="bg-slate-950/90 backdrop-blur p-4 rounded-2xl border border-amber-500/40 shadow-2xl">
                       <p className="text-xs text-amber-200 font-bold uppercase tracking-widest">⚠️ Assine Premium para baixar em Alta Resolução</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-600 space-y-4">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center opacity-30 animate-pulse">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p className="font-epic text-xl uppercase tracking-widest text-slate-700 text-center">Aguardando Invocação da Forja</p>
              </div>
            )}
          </div>

          {/* Chat Refinement Section */}
          <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden flex flex-col transition-all duration-500 ${logoUrl ? 'h-[650px] opacity-100 shadow-2xl' : 'h-0 opacity-0 pointer-events-none'}`}>
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <h3 className="font-epic text-sm text-amber-500 uppercase tracking-widest">Mestre Designer Arpiano</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Sessão de Refinamento</span>
            </div>

            {/* Suggestions Bar */}
            <div className="px-4 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-3 overflow-x-auto no-scrollbar">
               <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap mr-2">Ações Rápidas:</span>
               {commonSuggestions.map((sug, i) => (
                 <button 
                   key={i}
                   onClick={() => handleSendMessage(sug.cmd)}
                   disabled={isChatting}
                   className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-1.5 rounded-full text-[10px] text-slate-300 font-semibold transition-all hover:border-amber-500/30 disabled:opacity-50"
                 >
                   {sug.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-br from-amber-600 to-amber-500 text-slate-950 rounded-tr-none font-semibold shadow-lg' 
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700 shadow-md backdrop-blur-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 px-5 py-3 rounded-2xl rounded-tl-none border border-slate-700">
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
              {/* Image Preview */}
              {selectedFile && (
                <div className="flex items-center space-x-4 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 animate-in fade-in slide-in-from-bottom-2">
                  <div className="relative w-16 h-16 shadow-2xl">
                    <img src={selectedFile} alt="Ref preview" className="w-full h-full object-cover rounded-xl border-2 border-amber-500/50" />
                    <button 
                      type="button"
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">Referência Ativa</p>
                    <p className="text-[10px] text-slate-400">O Mestre analisará esta imagem para capturar o DNA visual.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isChatting}
                  title="Anexar Referência de Estilo"
                  className="p-4 bg-slate-800 text-slate-400 rounded-2xl border border-slate-700 hover:border-amber-500/50 hover:text-amber-500 transition-all disabled:opacity-50 shadow-lg group"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>

                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Descreva a mudança ou use as referências..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-sm placeholder:text-slate-600 shadow-inner"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button 
                    type="submit"
                    disabled={isChatting || (!chatInput.trim() && !selectedFile)}
                    className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 text-center uppercase tracking-[0.3em] font-bold">O Mestre da Forja possui inteligência avançada para ler seus comandos.</p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 bg-slate-950 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.5em] font-black">
            ⚔️ EXCLUSIVAMENTE PARA GUERREIROS DE ELMOREADEN ⚔️
          </p>
          <p className="text-slate-800 text-[9px] mt-4 font-bold uppercase tracking-widest">Logo Forge - Software de Branding Premium para Private Servers</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
