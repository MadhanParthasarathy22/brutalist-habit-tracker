export type ColorSchemeId = 'white' | 'blue' | 'green' | 'purple'

export interface ColorScheme {
  id: ColorSchemeId
  name: string
  bands: {
    1: string // Band 1 color
    2: string // Band 2 color
    3: string // Band 3 color
    4: string // Band 4 color
    5: string // Band 5 color
    6: string // Band 6 color
  }
  primary: string // Primary text color (band 6)
  secondary: string // Secondary text color (band 3)
  swatch: string // Color for the picker UI swatch
}

export const colorSchemes: Record<ColorSchemeId, ColorScheme> = {
  white: {
    id: 'white',
    name: 'White',
    bands: {
      1: '#262626',
      2: '#4e4e4e',
      3: '#757575',
      4: '#b9b9b9',
      5: '#fdfdfd',
      6: '#ffffff',
    },
    primary: '#ffffff', // Band 6 - White for habit name
    secondary: '#757575', // Band 3 - Medium gray for current streak
    swatch: '#ffffff',
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    bands: {
      1: '#25273F',
      2: '#313566',
      3: '#3D448C',
      4: '#4952B2',
      5: '#5560D9',
      6: '#616EFF',
    },
    primary: '#616EFF', // Band 6 - Brightest blue for habit name
    secondary: '#3D448C', // Band 3 - Medium blue for current streak
    swatch: '#616EFF',
  },
  green: {
    id: 'green',
    name: 'Green',
    bands: {
      1: '#253F26',
      2: '#316634',
      3: '#3D8C41',
      4: '#49B24E',
      5: '#55D95C',
      6: '#61FF69',
    },
    primary: '#61FF69', // Band 6 - Brightest green for habit name
    secondary: '#3D8C41', // Band 3 - Medium green for current streak
    swatch: '#61FF69',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    bands: {
      1: '#362E3F',
      2: '#534466',
      3: '#705A8C',
      4: '#8D6FB2',
      5: '#AA85D9',
      6: '#C79AFF',
    },
    primary: '#C79AFF', // Band 6 - Brightest purple for habit name
    secondary: '#705A8C', // Band 3 - Medium purple for current streak
    swatch: '#C79AFF',
  },
}

export function getColorScheme(id: ColorSchemeId): ColorScheme {
  return colorSchemes[id] || colorSchemes.white
}

