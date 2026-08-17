export type ColorThemePaletteId = 'palette-1' | 'palette-2' | 'palette-3' | 'palette-4';

export interface ThemePaletteDefinition {
  id: ColorThemePaletteId;
  label: string;
  name: string;
  descriptionLight: string;
  descriptionDark: string;
  // Light mode 4-color palette
  lightColors: [string, string, string, string]; // [c1, c2, c3, c4]
  // Dark mode 4-color palette according to selection
  darkColors: [string, string, string, string]; // [c1, c2, c3, c4]
  
  // Semantic mapped colors for light mode
  light: {
    c1: string; // surface/bg
    c2: string; // border/subtle
    c3: string; // accent/secondary
    c4: string; // primary/header/text
    headerBg: string;
    surface: string;
    surfaceCard: string;
    border: string;
    primary: string;
    primaryHover: string;
    text: string;
    textMuted: string;
    activeTab: string;
  };

  // Semantic mapped colors for dark mode (using strictly the 4 dark colors)
  dark: {
    c1: string; // text/highlight
    c2: string; // accent/badge
    c3: string; // card/border/surface
    c4: string; // deep canvas/header/bg
    headerBg: string;
    surface: string;
    surfaceCard: string;
    border: string;
    primary: string;
    primaryHover: string;
    text: string;
    textMuted: string;
    activeTab: string;
  };
}

export const THEME_COLOR_PALETTES: ThemePaletteDefinition[] = [
  {
    id: 'palette-1',
    label: '1st Palette',
    name: 'Sage & Olive Harmony',
    descriptionLight: '#EEEEEE · #CBCBCB · #B7B89F · #777C6D',
    descriptionDark: '#9CB080 · #618764 · #2B5748 · #273338',
    lightColors: ['#EEEEEE', '#CBCBCB', '#B7B89F', '#777C6D'],
    darkColors: ['#9CB080', '#618764', '#2B5748', '#273338'],
    light: {
      c1: '#EEEEEE',
      c2: '#CBCBCB',
      c3: '#B7B89F',
      c4: '#777C6D',
      headerBg: '#777C6D',
      surface: '#EEEEEE',
      surfaceCard: '#FFFFFF',
      border: '#CBCBCB',
      primary: '#777C6D',
      primaryHover: '#626759',
      text: '#273338',
      textMuted: '#777C6D',
      activeTab: '#777C6D',
    },
    dark: {
      c1: '#9CB080',
      c2: '#618764',
      c3: '#2B5748',
      c4: '#273338',
      headerBg: '#273338',
      surface: '#273338',
      surfaceCard: '#2B5748',
      border: '#2B5748',
      primary: '#618764',
      primaryHover: '#9CB080',
      text: '#FFFFFF',
      textMuted: '#9CB080',
      activeTab: '#2B5748',
    },
  },
  {
    id: 'palette-2',
    label: '2nd Palette',
    name: 'Vanilla Cream & Forest Earth',
    descriptionLight: '#FFF8EC · #DCCCAC · #99AD7A · #546B41',
    descriptionDark: '#DFD0B8 · #948979 · #393E46 · #222831',
    lightColors: ['#FFF8EC', '#DCCCAC', '#99AD7A', '#546B41'],
    darkColors: ['#DFD0B8', '#948979', '#393E46', '#222831'],
    light: {
      c1: '#FFF8EC',
      c2: '#DCCCAC',
      c3: '#99AD7A',
      c4: '#546B41',
      headerBg: '#546B41',
      surface: '#FFF8EC',
      surfaceCard: '#FFFFFF',
      border: '#DCCCAC',
      primary: '#546B41',
      primaryHover: '#435634',
      text: '#222831',
      textMuted: '#546B41',
      activeTab: '#546B41',
    },
    dark: {
      c1: '#DFD0B8',
      c2: '#948979',
      c3: '#393E46',
      c4: '#222831',
      headerBg: '#222831',
      surface: '#222831',
      surfaceCard: '#393E46',
      border: '#393E46',
      primary: '#948979',
      primaryHover: '#DFD0B8',
      text: '#DFD0B8',
      textMuted: '#948979',
      activeTab: '#393E46',
    },
  },
  {
    id: 'palette-3',
    label: '3rd Palette',
    name: 'Indigo Dusk & Midnight Abyss',
    descriptionLight: '#E3E3E3 · #456882 · #234C6A · #1B3C53',
    descriptionDark: '#9290C3 · #7077A1 · #424769 · #070F2B',
    lightColors: ['#E3E3E3', '#456882', '#234C6A', '#1B3C53'],
    darkColors: ['#9290C3', '#7077A1', '#424769', '#070F2B'],
    light: {
      c1: '#E3E3E3',
      c2: '#456882',
      c3: '#234C6A',
      c4: '#1B3C53',
      headerBg: '#1B3C53',
      surface: '#E3E3E3',
      surfaceCard: '#FFFFFF',
      border: '#456882',
      primary: '#234C6A',
      primaryHover: '#1B3C53',
      text: '#1B3C53',
      textMuted: '#456882',
      activeTab: '#234C6A',
    },
    dark: {
      c1: '#9290C3',
      c2: '#7077A1',
      c3: '#424769',
      c4: '#070F2B',
      headerBg: '#070F2B',
      surface: '#070F2B',
      surfaceCard: '#424769',
      border: '#424769',
      primary: '#7077A1',
      primaryHover: '#9290C3',
      text: '#FFFFFF',
      textMuted: '#9290C3',
      activeTab: '#424769',
    },
  },
  {
    id: 'palette-4',
    label: '4th Palette',
    name: 'Espresso Amber & Dark Mocha',
    descriptionLight: '#FFF8F0 · #C08552 · #8C5A3C · #4B2E2B',
    descriptionDark: '#CAAA98 · #9A8678 · #3C2A21 · #1A120B',
    lightColors: ['#FFF8F0', '#C08552', '#8C5A3C', '#4B2E2B'],
    darkColors: ['#CAAA98', '#9A8678', '#3C2A21', '#1A120B'],
    light: {
      c1: '#FFF8F0',
      c2: '#C08552',
      c3: '#8C5A3C',
      c4: '#4B2E2B',
      headerBg: '#4B2E2B',
      surface: '#FFF8F0',
      surfaceCard: '#FFFFFF',
      border: '#C08552',
      primary: '#C08552',
      primaryHover: '#8C5A3C',
      text: '#4B2E2B',
      textMuted: '#8C5A3C',
      activeTab: '#C08552',
    },
    dark: {
      c1: '#CAAA98',
      c2: '#9A8678',
      c3: '#3C2A21',
      c4: '#1A120B',
      headerBg: '#1A120B',
      surface: '#1A120B',
      surfaceCard: '#3C2A21',
      border: '#3C2A21',
      primary: '#9A8678',
      primaryHover: '#CAAA98',
      text: '#CAAA98',
      textMuted: '#9A8678',
      activeTab: '#3C2A21',
    },
  },
];

export const getThemePalette = (paletteId?: string): ThemePaletteDefinition => {
  if (!paletteId) return THEME_COLOR_PALETTES[0];
  const found = THEME_COLOR_PALETTES.find(p => p.id === paletteId);
  return found || THEME_COLOR_PALETTES[0];
};

/**
 * Apply the selected color theme palette to document root via CSS custom properties
 */
export const applyThemePaletteToDom = (paletteId: ColorThemePaletteId | undefined, isDark: boolean) => {
  const palette = getThemePalette(paletteId || 'palette-1');
  const root = document.documentElement;

  root.setAttribute('data-theme-palette', palette.id);

  const colors = isDark ? palette.dark : palette.light;
  const currentSet = isDark ? palette.darkColors : palette.lightColors;

  // Set CSS variables
  root.style.setProperty('--theme-c1', currentSet[0]);
  root.style.setProperty('--theme-c2', currentSet[1]);
  root.style.setProperty('--theme-c3', currentSet[2]);
  root.style.setProperty('--theme-c4', currentSet[3]);

  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-primary-hover', colors.primaryHover);
  root.style.setProperty('--theme-header-bg', colors.headerBg);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-card', colors.surfaceCard);
  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-text', colors.text);
  root.style.setProperty('--theme-text-muted', colors.textMuted);
  root.style.setProperty('--theme-active-tab', colors.activeTab);
};
