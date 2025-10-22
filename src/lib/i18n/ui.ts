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

type StudioTranslations = {
  welcomeTitle: string;
  welcomeDescription: string;
  userLabel: string;
  assistantLabel: string;
};

type LibraryTranslations = {
  title: string;
  description: string;
  tabSongs: string;
  tabConversations: string;
  loading: string;
  searchSongsPlaceholder: string;
  searchConversationsPlaceholder: string;
  emptySongs: string;
  emptyConversations: string;
  statusAll: string;
  statusReady: string;
  statusGenerating: string;
  statusFailed: string;
  phaseAll: string;
  phaseGathering: string;
  phaseGenerating: string;
  phaseRefining: string;
  phaseComplete: string;
  sortRecent: string;
  sortAZ: string;
  sortPlayed: string;
};

type UITokens = {
  nav: NavTranslations;
  parameters: ParameterTranslations;
  languageToggle: LanguageToggleTranslations;
  studio: StudioTranslations;
  library: LibraryTranslations;
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
    studio: {
      welcomeTitle: 'Welkom bij je liefdesliedje studio!',
      welcomeDescription: 'Begin een gesprek en ik help je een persoonlijk liefdesliedje te maken.',
      userLabel: 'Gebruiker',
      assistantLabel: 'Muziekgeneratie',
    },
    library: {
      title: 'Je bibliotheek',
      description: 'Herbeluister je liedjes en open eerdere gesprekken om verder te verfijnen.',
      tabSongs: 'Liedjes',
      tabConversations: 'Gesprekken',
      loading: 'Bibliotheek laden…',
      searchSongsPlaceholder: 'Zoek op titel of lyrics',
      searchConversationsPlaceholder: 'Zoek naar concept lyrics',
      emptySongs: 'Nog geen liedjes opgeslagen',
      emptyConversations: 'Nog geen gesprekken opgeslagen',
      statusAll: 'Alle statussen',
      statusReady: 'Klaar',
      statusGenerating: 'Bezig',
      statusFailed: 'Mislukt',
      phaseAll: 'Alle fases',
      phaseGathering: 'Context',
      phaseGenerating: 'Genereren',
      phaseRefining: 'Verfijnen',
      phaseComplete: 'Afgerond',
      sortRecent: 'Laatst bijgewerkt',
      sortAZ: 'Naam A-Z',
      sortPlayed: 'Recent afgespeeld',
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
    studio: {
      welcomeTitle: 'Welcome to your love song studio!',
      welcomeDescription: 'Start a conversation and I\'ll help you create a personalized love song.',
      userLabel: 'User',
      assistantLabel: 'Music Generation',
    },
    library: {
      title: 'Your library',
      description: 'Replay your songs and open previous conversations to refine further.',
      tabSongs: 'Songs',
      tabConversations: 'Conversations',
      loading: 'Loading library…',
      searchSongsPlaceholder: 'Search by title or lyrics',
      searchConversationsPlaceholder: 'Search concept lyrics',
      emptySongs: 'No songs saved yet',
      emptyConversations: 'No conversations saved yet',
      statusAll: 'All statuses',
      statusReady: 'Ready',
      statusGenerating: 'In Progress',
      statusFailed: 'Failed',
      phaseAll: 'All phases',
      phaseGathering: 'Context',
      phaseGenerating: 'Generating',
      phaseRefining: 'Refining',
      phaseComplete: 'Complete',
      sortRecent: 'Recently updated',
      sortAZ: 'Name A-Z',
      sortPlayed: 'Recently played',
    },
  },
};

export type UIStrings = UITokens;
