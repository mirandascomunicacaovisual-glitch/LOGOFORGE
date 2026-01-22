
import { ElementType, LogoStyle, DecorationType, FontType } from './types';

export const ELEMENTS = [
  { id: ElementType.FIRE, label: 'Fogo', icon: '🔥', prompt: 'intense fire energy, burning flames, glowing embers, orange and red aura' },
  { id: ElementType.ICE, label: 'Gelo', icon: '❄️', prompt: 'frozen ice crystals, frost aura, cold blue smoke, crystalline textures' },
  { id: ElementType.LIGHTNING, label: 'Raio', icon: '⚡', prompt: 'electric sparks, lightning bolts, powerful blue and white energy discharge' },
  { id: ElementType.ARCANE, label: 'Arcano', icon: '🌌', prompt: 'mystical purple energy, magical runes, stardust particles, ethereal glow' },
  { id: ElementType.SHADOWS, label: 'Sombras', icon: '🌑', prompt: 'dark void energy, purple and black mist, shadow wisps, abyssal atmosphere' },
];

export const FONTS = [
  { id: FontType.GOTHIC, label: 'Gótica', icon: '📜', prompt: 'Gothic Medieval Blackletter typography, sharp strokes, ornate and majestic' },
  { id: FontType.CURSIVE, label: 'Cursiva', icon: '✒️', prompt: 'Elegant flowing cursive calligraphy, script style with connected letters, like "Faith" or "Chandia" fonts' },
  { id: FontType.RUNIC, icon: 'ᚠ', label: 'Rúnica', prompt: 'Ancient runic alphabet style, carved stone appearance, ancestral fantasy' },
  { id: FontType.AGGRESSIVE, icon: '⚔️', label: 'Agressiva', prompt: 'Aggressive jagged fantasy font, sharp points, heavy metal style anatomy' },
  { id: FontType.ROYAL, icon: '👑', label: 'Real', prompt: 'Majestic classic serif typography, clean lines, royal and balanced' },
  { id: FontType.MODERN, icon: '💎', label: 'Moderna', prompt: 'Clean high-end modern sans-serif, premium minimalist feel' },
];

export const STYLES = [
  { id: LogoStyle.EPIC_MEDIEVAL, label: 'Medieval Épico', prompt: 'traditional royal medieval, gold and silver polished metal, majestic heraldry' },
  { id: LogoStyle.DARK_FANTASY, label: 'Dark Fantasy', prompt: 'gritty and dark, weathered metal, blood-red accents, gothic horror elements' },
  { id: LogoStyle.HIGH_FANTASY, label: 'High Fantasy', prompt: 'majestic and bright, crystal-like materials, divine light beams, ethereal beauty' },
  { id: LogoStyle.DEMONIC, label: 'Demoníaco', prompt: 'hellish lava, scorched obsidian, sharp jagged edges, demonic horns and skulls' },
  { id: LogoStyle.CELESTIAL, label: 'Celestial', prompt: 'divine holy light, golden halo effects, pure white marble and gold filigree' },
];

export const DECORATIONS = [
  { id: DecorationType.SWORD, label: 'Espada Central', prompt: 'a legendary enchanted 3D sword placed vertically at the center behind the text' },
  { id: DecorationType.GEM, label: 'Gema Mágica', prompt: 'a large radiant glowing gemstone embedded at the center of the logo' },
  { id: DecorationType.WINGS, label: 'Asas Épicas', prompt: 'majestic detailed wings (heavenly or demonic) spreading wide behind the server name' },
  { id: DecorationType.DRAGON, label: 'Dragão', prompt: 'a ferocious fantasy dragon silhouette or 3D emblem integrated into the logo design' },
  { id: DecorationType.EMBLEM, label: 'Emblema Simples', prompt: 'a clean yet detailed heraldic shield emblem as a background' },
];
