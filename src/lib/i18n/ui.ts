export type UILanguage = 'nl' | 'en';

type NavTranslations = {
  chat: string;
  library: string;
  settings: string;
};

type ParameterTranslations = {
  heading: string;
  description: string;
  titleLabel: string;
  titlePlaceholder: string;
  templateHeading: string;
  instrumentalLabel: string;
  voiceHeading: string;
  languageLabel: string;
  vocalGenderLabel: string;
  vocalAgeLabel: string;
  vocalGenderOptions: Record<'female' | 'male' | 'neutral', string>;
  vocalAgeOptions: {
    none: string;
    young: string;
    mature: string;
    deep: string;
  };
  advancedHeading: string;
  styleWeight: string;
  weirdnessConstraint: string;
  audioWeight: string;
  cancel: string;
  confirm: string;
};

type LanguageToggleTranslations = {
  label: string;
  switchToDutch: string;
  switchToEnglish: string;
};

type UITokens = {
  nav: NavTranslations;
  parameters: ParameterTranslations;
  languageToggle: LanguageToggleTranslations;
};

export const uiStrings: Record<UILanguage, UITokens> = {
  nl: {
    nav: {
      chat: 'Chat',
      library: 'Bibliotheek',
      settings: 'Instellingen',
    },
    parameters: {
      heading: 'Parameters',
      description: 'Stel je voorkeuren in voordat we de muziek genereren.',
      titleLabel: 'Titel',
      titlePlaceholder: 'bijv. Ons liefdeslied',
      templateHeading: 'Template',
      instrumentalLabel: 'Instrumentaal',
      voiceHeading: 'Stem',
      languageLabel: 'Taal',
      vocalGenderLabel: 'Vocaal geslacht',
      vocalAgeLabel: 'Vocale leeftijd/klank',
      vocalGenderOptions: {
        female: 'Vrouw',
        male: 'Man',
        neutral: 'Neutraal',
      },
      vocalAgeOptions: {
        none: 'Geen voorkeur',
        young: 'Jong',
        mature: 'Volwassen',
        deep: 'Diep',
      },
      advancedHeading: 'Geavanceerd',
      styleWeight: 'Style Weight',
      weirdnessConstraint: 'Weirdness Constraint',
      audioWeight: 'Audio Weight',
      cancel: 'Annuleren',
      confirm: 'Bevestigen',
    },
    languageToggle: {
      label: 'Taal',
      switchToDutch: 'Schakel naar Nederlands',
      switchToEnglish: 'Switch to English',
    },
  },
  en: {
    nav: {
      chat: 'Chat',
      library: 'Library',
      settings: 'Settings',
    },
    parameters: {
      heading: 'Parameters',
      description: 'Adjust your preferences before we generate the music.',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g. Our Love Song',
      templateHeading: 'Template',
      instrumentalLabel: 'Instrumental',
      voiceHeading: 'Voice',
      languageLabel: 'Language',
      vocalGenderLabel: 'Vocal Gender',
      vocalAgeLabel: 'Vocal Age/Timbre',
      vocalGenderOptions: {
        female: 'Female',
        male: 'Male',
        neutral: 'Neutral',
      },
      vocalAgeOptions: {
        none: 'No preference',
        young: 'Young',
        mature: 'Mature',
        deep: 'Deep',
      },
      advancedHeading: 'Advanced',
      styleWeight: 'Style Weight',
      weirdnessConstraint: 'Weirdness Constraint',
      audioWeight: 'Audio Weight',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    languageToggle: {
      label: 'Language',
      switchToDutch: 'Switch to Dutch',
      switchToEnglish: 'Switch to English',
    },
  },
};

export type UIStrings = UITokens;
