export type CountryCallingCodeOption = {
  iso2: string;
  country: string;
  dialCode: string;
  flagUrl: string;
};

export const COUNTRY_CALLING_CODE_OPTIONS: CountryCallingCodeOption[] = [
  { iso2: 'us', country: 'Estados Unidos', dialCode: '+1', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { iso2: 'br', country: 'Brasil', dialCode: '+55', flagUrl: 'https://flagcdn.com/w20/br.png' },
  { iso2: 'ca', country: 'Canada', dialCode: '+1', flagUrl: 'https://flagcdn.com/w20/ca.png' },
  { iso2: 'pt', country: 'Portugal', dialCode: '+351', flagUrl: 'https://flagcdn.com/w20/pt.png' },
  { iso2: 'gb', country: 'Reino Unido', dialCode: '+44', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { iso2: 'ie', country: 'Irlanda', dialCode: '+353', flagUrl: 'https://flagcdn.com/w20/ie.png' },
  { iso2: 'es', country: 'Espanha', dialCode: '+34', flagUrl: 'https://flagcdn.com/w20/es.png' },
  { iso2: 'it', country: 'Italia', dialCode: '+39', flagUrl: 'https://flagcdn.com/w20/it.png' },
  { iso2: 'fr', country: 'Franca', dialCode: '+33', flagUrl: 'https://flagcdn.com/w20/fr.png' },
  { iso2: 'de', country: 'Alemanha', dialCode: '+49', flagUrl: 'https://flagcdn.com/w20/de.png' },
  { iso2: 'nl', country: 'Holanda', dialCode: '+31', flagUrl: 'https://flagcdn.com/w20/nl.png' },
  { iso2: 'ch', country: 'Suica', dialCode: '+41', flagUrl: 'https://flagcdn.com/w20/ch.png' },
  { iso2: 'au', country: 'Australia', dialCode: '+61', flagUrl: 'https://flagcdn.com/w20/au.png' },
  { iso2: 'jp', country: 'Japao', dialCode: '+81', flagUrl: 'https://flagcdn.com/w20/jp.png' },
  { iso2: 'ae', country: 'Emirados Arabes', dialCode: '+971', flagUrl: 'https://flagcdn.com/w20/ae.png' },
];

export const DEFAULT_COUNTRY_CALLING_CODE = COUNTRY_CALLING_CODE_OPTIONS[0];

const sortByDialCodeLength = [...COUNTRY_CALLING_CODE_OPTIONS].sort(
  (left, right) => right.dialCode.length - left.dialCode.length,
);

export const findCountryByIso2 = (iso2?: string | null) =>
  COUNTRY_CALLING_CODE_OPTIONS.find((option) => option.iso2 === iso2) || DEFAULT_COUNTRY_CALLING_CODE;

export const splitPhoneNumber = (phone?: string | null) => {
  const normalizedPhone = (phone || '').trim();

  if (!normalizedPhone) {
    return {
      country: DEFAULT_COUNTRY_CALLING_CODE,
      localNumber: '',
    };
  }

  const matchedCountry = sortByDialCodeLength.find((option) =>
    normalizedPhone.startsWith(option.dialCode),
  );

  if (!matchedCountry) {
    return {
      country: DEFAULT_COUNTRY_CALLING_CODE,
      localNumber: normalizedPhone,
    };
  }

  return {
    country: matchedCountry,
    localNumber: normalizedPhone.slice(matchedCountry.dialCode.length).trim(),
  };
};
