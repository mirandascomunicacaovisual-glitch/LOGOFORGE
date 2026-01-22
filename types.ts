
export enum ElementType {
  FIRE = 'FIRE',
  ICE = 'ICE',
  LIGHTNING = 'LIGHTNING',
  ARCANE = 'ARCANE',
  SHADOWS = 'SHADOWS'
}

export enum LogoStyle {
  EPIC_MEDIEVAL = 'EPIC_MEDIEVAL',
  DARK_FANTASY = 'DARK_FANTASY',
  HIGH_FANTASY = 'HIGH_FANTASY',
  DEMONIC = 'DEMONIC',
  CELESTIAL = 'CELESTIAL'
}

export enum DecorationType {
  SWORD = 'SWORD',
  GEM = 'GEM',
  WINGS = 'WINGS',
  DRAGON = 'DRAGON',
  EMBLEM = 'EMBLEM'
}

export enum FontType {
  GOTHIC = 'GOTHIC',
  CURSIVE = 'CURSIVE',
  RUNIC = 'RUNIC',
  AGGRESSIVE = 'AGGRESSIVE',
  ROYAL = 'ROYAL',
  MODERN = 'MODERN'
}

export interface GeneratorConfig {
  serverName: string;
  element: ElementType;
  font: FontType;
  style: LogoStyle;
  decoration: DecorationType;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface UserState {
  isPremium: boolean;
}
