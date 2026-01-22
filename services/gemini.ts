
import { GoogleGenAI } from "@google/genai";
import { GeneratorConfig } from "../types";
import { ELEMENTS, STYLES, DECORATIONS, FONTS } from "../constants";

const getSystemPrompt = (config: GeneratorConfig) => `
    VOCÊ É O MESTRE DA FORJA ARPIANA - O maior designer de logos para Lineage 2 do mundo.
    CONTEXTO TÉCNICO: Logos 3D Premium, Chanfrados Metálicos, Iluminação Cinematográfica, Partículas Volumétricas.
    NOME DO SERVIDOR: "${config.serverName}".
`;

export interface EditResult {
  imageUrl: string;
  assistantMessage: string;
}

export const generateLogo = async (config: GeneratorConfig): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const element = ELEMENTS.find(e => e.id === config.element);
  const style = STYLES.find(s => s.id === config.style);
  const decoration = DECORATIONS.find(d => d.id === config.decoration);
  const font = FONTS.find(f => f.id === config.font);

  const prompt = `
    ${getSystemPrompt(config)}
    MISSÃO: Forjar um logo lendário para "${config.serverName}".
    TIPOGRAFIA: ${font?.prompt}.
    ELEMENTO: ${element?.prompt}.
    ESTILO: ${style?.prompt}.
    DECORAÇÃO: ${decoration?.prompt}.
    
    DETALHES OBRIGATÓRIOS: 
    - Renderização 3D de altíssima fidelidade.
    - Acabamento em metal escovado ou ouro polido.
    - Fundo épico com névoa e luzes de fundo.
    - Centralização perfeita.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("A Forja não respondeu. Verifique se a API_KEY está configurada no Vercel.");
  } catch (error: any) {
    console.error("Logo generation error:", error);
    throw new Error(error.message || "Falha na materialização do logo.");
  }
};

export const editLogo = async (
  currentImageBase64: string, 
  instruction: string, 
  config: GeneratorConfig,
  userReferenceImageBase64?: string
): Promise<EditResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const currentLogoData = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const parts: any[] = [
    {
      inlineData: {
        data: currentLogoData,
        mimeType: 'image/png'
      }
    }
  ];

  if (userReferenceImageBase64) {
    const refData = userReferenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({
      inlineData: {
        data: refData,
        mimeType: 'image/png'
      }
    });
  }

  const prompt = `
    ${getSystemPrompt(config)}
    COMANDO DO GUERREIRO: "${instruction}".
    
    INSTRUÇÃO DE INTELIGÊNCIA SUPERIOR:
    ${userReferenceImageBase64 ? 
      "ANALISE A SEGUNDA IMAGEM (REFERÊNCIA). EXTRAIA A ANATOMIA DA FONTE, AS CORES E O ESTILO 3D. APLIQUE ESSE DNA AO NOME '" + config.serverName + "'." : 
      "MODIFIQUE O LOGO ATUAL CONFORME A INSTRUÇÃO."}
    
    REGRAS DE OURO:
    1. Se houver imagem de referência, priorize o estilo visual dela acima de tudo.
    2. Mantenha a legibilidade absoluta do nome "${config.serverName}".
    3. Adicione efeitos de faíscas, brilho intenso e texturas MMORPG de elite.
    4. NÃO RESPONDA APENAS COM TEXTO. VOCÊ DEVE GERAR A IMAGEM.
    
    CONFIRMAÇÃO (EM PORTUGUÊS): Explique brevemente o que foi alterado na técnica de forja.
  `.trim();

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let imageUrl = '';
    let assistantMessage = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        assistantMessage = part.text;
      }
    }

    if (!imageUrl) throw new Error("O Mestre não conseguiu gerar a nova versão.");
    
    return { 
      imageUrl, 
      assistantMessage: assistantMessage || "O logo foi refinado com sucesso nas chamas da forja!" 
    };
  } catch (error: any) {
    console.error("Edit logo error:", error);
    throw new Error(error.message || "Erro no refinamento da imagem.");
  }
};
