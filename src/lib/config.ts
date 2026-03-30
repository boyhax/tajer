import { LocalizedString } from '../types';

export interface AppConfig {
  name: LocalizedString;
  description: LocalizedString;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  auth: {
    defaultCountryCode: string;
  };
  map: {
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
  };
  currency: {
    symbol: LocalizedString;
    code: string;
  };
  productCard: {
    variant: 'default' | 'local-delivery';
  };
}

export const config: AppConfig = {
  name: {
    en: 'Kuzama',
    ar: 'خوزاما',
  },
  description: {
    en: 'Local supermarket in Oman',
    ar: 'سوبر ماركت محلي في عمان',
  },
  theme: {
    primary: '#10b981', // Emerald green for fresh supermarket feel
    secondary: '#ffffff',
    accent: '#f3f4f6',
    background: '#ffffff',
    text: '#000000',
  },
  auth: {
    defaultCountryCode: '+968',
  },
  map: {
    defaultCenter: { lat: 22.45, lng: 58.80 }, // Bidiya, Oman
    defaultZoom: 13,
  },
  currency: {
    symbol: { en: 'OMR', ar: 'ر.ع.' },
    code: 'OMR',
  },
  productCard: {
    variant: 'local-delivery', // 'default' | 'local-delivery'
  },
};
