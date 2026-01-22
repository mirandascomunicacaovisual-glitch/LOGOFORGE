
import { GoogleGenAI } from "@google/genai";
import { GeneratorConfig } from "../types";
import { ELEMENTS, STYLES, DECORATIONS, FONTS } from "../constants";

// Função para garantir a criação da instância apenas quando necessária
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("A chave de API não foi configurada no servidor (Environment Variable API_KEY faltando).");
  }
  return new GoogleGenAI({ apiKey });
};

const getSystemPrompt = (config: GeneratorConfig) => `
    VOCÊ É O MESTRE DA FORJA DE ADEN.
    ESPECIALIDADE: Logos 3D Premium para Lineage 2 (Private Servers).
    ESTILO: Tipografia 3D metálica pesada, chanfrada, com iluminação dinâmica (rim lighting), Unreal Engine 5 render style.
    NOME DO SERVIDOR: "${config.serverName}".
`;

export interface EditResult {
  imageUrl: string;
  assistantMessage: string;
}

export const generateLogo = async (config: GeneratorConfig): Promise<string> => {
  const ai = getAiClient();
  
  const element = ELEMENTS.find(e => e.id === config.element);
  const font = FONTS.find(f => f.id === config.font);
  const style = STYLES.find(s => s.id === config.style);
  const decoration = DECORATIONS.find(d => d.id === config.decoration);

  const prompt = `
    ${getSystemPrompt(config)}
    MISSÃO: Gerar um logo centralizado com o texto "${config.serverName.toUpperCase()}".
    ANATOMIA DA FONTE: ${font?.prompt}.
    ATMOSFERA MÁGICA: ${element?.prompt}.
    ESTILO DE ARTE: ${style?.prompt}.
    ELEMENTO DE FUNDO: ${decoration?.prompt}.
    
    DETALHES TÉCNICOS:
    - O texto deve ser o foco principal em 3D.
    - Textura de metal escovado, ouro ou prata rúnica.
    - Partículas de energia e faíscas ao redor.
    - Fundo escuro épico (cinematic fog).
    - Alta resolução, qualidade de agência de publicidade.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("A forja falhou em materializar a imagem. Tente novamente.");
  } catch (error: any) {
    console.error("Erro na geração:", error);
    throw error;
  }
};

export const editLogo = async (
  currentImageBase64: string, 
  instruction: string, 
  config: GeneratorConfig,
  userReferenceImageBase64?: string
): Promise<EditResult> => {
  const ai = getAiClient();
  const currentLogoData = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const parts: any[] = [
    { inlineData: { data: currentLogoData, mimeType: 'image/png' } }
  ];

  if (userReferenceImageBase64) {
    const refData = userReferenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({ inlineData: { data: refData, mimeType: 'image/png' } });
  }

  const prompt = `
    ${getSystemPrompt(config)}
    PEDIDO DO CLIENTE: "${instruction}".
    
    ${userReferenceImageBase64 ? 
      "USE A SEGUNDA IMAGEM COMO REFERÊNCIA DE ESTILO. Aplique as cores, o tipo de letra e a aura dessa referência no novo logo para '" + config.serverName + "'." : 
      "Modifique o logo atual seguindo as instruções do cliente."}
    
    RESPOSTA: Gere a imagem editada e uma breve confirmação técnica em português.
  `.trim();

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
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

    if (!imageUrl) throw new Error("Não foi possível processar a edição.");
    
    return { imageUrl, assistantMessage: assistantMessage || "O logo foi refinado com sucesso!" };
  } catch (error: any) {
    console.error("Erro na edição:", error);
    throw error;
  }
};
