export type LanguageCode = 
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa'; // Punjabi

export interface SupportedLanguage {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  script: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    script: 'Latin',
    region: 'National / Official',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    script: 'Devanagari',
    region: 'North & Central India',
  },
  {
    code: 'bn',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    script: 'Bengali',
    region: 'West Bengal & Tripura',
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    script: 'Devanagari',
    region: 'Maharashtra',
  },
  {
    code: 'te',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    script: 'Telugu',
    region: 'Andhra Pradesh & Telangana',
  },
  {
    code: 'ta',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    script: 'Tamil',
    region: 'Tamil Nadu & Puducherry',
  },
  {
    code: 'gu',
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    script: 'Gujarati',
    region: 'Gujarat',
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    script: 'Kannada',
    region: 'Karnataka',
  },
  {
    code: 'ml',
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    script: 'Malayalam',
    region: 'Kerala & Lakshadweep',
  },
  {
    code: 'pa',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    script: 'Gurmukhi',
    region: 'Punjab',
  },
];
