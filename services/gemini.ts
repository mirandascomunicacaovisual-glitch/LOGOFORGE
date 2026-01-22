
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
  // Criar instância sempre no momento do uso para capturar a chave de API atualizada
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
      model: 'gemini-3-pro-image-preview', // Upgrade para Pro Image
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K" // Qualidade Premium Base
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("O Mestre da Forja não conseguiu materializar a imagem. Verifique se sua chave de API tem permissões para o modelo Imagen/Gemini 3.");
  } catch (error: any) {
    console.error("Error generating logo:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("REKEY_REQUIRED");
    }
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
    
    OBRIGATÓRIO: 
    - Você DEVE retornar uma nova versão da imagem editada.
    - Você DEVE retornar uma mensagem curta e profissional em PORTUGUÊS confirmando as mudanças técnicas realizadas.
  `.trim();

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let imageUrl = '';
    let assistantMessage = '';

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("A Forja está instável.");

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        assistantMessage = part.text;
      }
    }

    if (!imageUrl) throw new Error("O Mestre não conseguiu gerar a imagem.");
    
    return { imageUrl, assistantMessage: assistantMessage || "Refinamento épico concluído!" };
  } catch (error: any) {
    console.error("Error editing logo:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("REKEY_REQUIRED");
    }
    throw error;
  }
};
