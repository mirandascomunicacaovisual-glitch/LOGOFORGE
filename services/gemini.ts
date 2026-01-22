
import { GoogleGenAI } from "@google/genai";
import { GeneratorConfig } from "../types";
import { ELEMENTS, STYLES, DECORATIONS, FONTS } from "../constants";

const getSystemPrompt = (config: GeneratorConfig) => `
    You are a World-Class Graphic Designer specializing in High-End MMORPG branding, specifically for Lineage 2.
    SERVER NAME: "${config.serverName}". 
    Your goal is to create a legendary, premium 3D logo.
    CORE VISUALS: Deep 3D metallic bevels, cinematic rim lighting, volumetric particles, and high-fidelity textures (scratched steel, polished gold, weathered obsidian).
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
    ACT AS THE MASTER FORGE.
    TYPOGRAPHY STYLE: ${font?.prompt}.
    ELEMENTAL THEME: ${element?.prompt}.
    VISUAL STYLE: ${style?.prompt}.
    DECORATIVE ACCENT: ${decoration?.prompt}.
    
    COMPOSITION: Centralized, balanced, epic symmetry.
    BACKGROUND: Dark, atmospheric, with subtle fog and energy particles.
    OUTPUT: A high-resolution, professional 3D logo for "${config.serverName}".
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
    throw new Error("O Mestre da Forja não conseguiu materializar a imagem. Tente novamente.");
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};

export const editLogo = async (
  currentImageBase64: string, 
  instruction: string, 
  config: GeneratorConfig,
  userReferenceImageBase64?: string
): Promise<EditResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const parts: any[] = [
    {
      inlineData: {
        data: base64Data,
        mimeType: 'image/png'
      }
    }
  ];

  if (userReferenceImageBase64) {
    const userRefData = userReferenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({
      inlineData: {
        data: userRefData,
        mimeType: 'image/png'
      }
    });
  }

  const prompt = `
    INSTRUÇÃO DO USUÁRIO: "${instruction}".
    NOME DO SERVIDOR: "${config.serverName}".
    
    CONTEXTO: Você é um Designer Sênior de Logos Premium. A primeira imagem é o LOGO ATUAL. ${userReferenceImageBase64 ? "A segunda imagem é uma REFERÊNCIA DE INSPIRAÇÃO enviada pelo cliente." : ""}
    
    MISSÃO:
    Analise profundamente a instrução e ${userReferenceImageBase64 ? "extraia o estilo, anatomia da fonte, layout e cores da IMAGEM DE REFERÊNCIA" : "aplique as mudanças no LOGO ATUAL"}.
    
    REGRAS CRÍTICAS DE EXECUÇÃO:
    1. INTELIGÊNCIA DE ESTILO: Se o cliente enviar uma referência com fonte cursiva, rúnica ou agressiva, você DEVE replicar exatamente essa estrutura óssea das letras, mas mantendo a renderização 3D metálica premium.
    2. NOME DO SERVIDOR: O nome "${config.serverName}" deve permanecer perfeitamente legível e central.
    3. QUALIDADE PROFISSIONAL: Use efeitos de oclusão de ambiente, reflexos de Ray Tracing simulados, e partículas mágicas de alta definição.
    4. SUBSTITUIÇÃO DE ELEMENTOS: Se solicitado para trocar um elemento (ex: trocar espada por dragão), faça a integração perfeita na cena 3D.
    
    OBRIGATÓRIO: 
    - Você DEVE retornar uma nova versão da imagem editada.
    - Você DEVE retornar uma mensagem curta e profissional em PORTUGUÊS confirmando as mudanças técnicas realizadas.
    
    Exemplo de Confirmação: "Forja concluída! Analisei sua referência e redesenhei a tipografia para o estilo [estilo], aplicando texturas de [material] e reforçando o glow [cor]. A composição agora segue o padrão épico solicitado."
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

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("A Forja está instável. Tente novamente.");

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        assistantMessage = part.text;
      }
    }

    if (!imageUrl) {
      // If the model only replied with text, it failed our instruction to provide an image.
      throw new Error("O Mestre da Forja apenas descreveu a mudança mas não conseguiu forjar a imagem. Por favor, tente descrever de outra forma ou envie a imagem novamente.");
    }
    
    if (!assistantMessage) {
      assistantMessage = "Refinamento épico concluído com sucesso!";
    }

    return { imageUrl, assistantMessage };
  } catch (error: any) {
    console.error("Error editing logo:", error);
    throw new Error(error.message || "Falha na comunicação com a Forja Arpiana.");
  }
};
