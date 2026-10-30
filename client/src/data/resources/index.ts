export type ResourcePageLink = { label: string; href: string };

export const RESOURCE_PAGE_LINKS: ResourcePageLink[] = [
  { label: 'Keyboard Downloads', href: '/resources/keyboard-downloads' },
  { label: 'Keyboard Layouts', href: '/resources/keyboard-layouts' },
  { label: 'Keyboard Shortcuts', href: '/resources/keyboard-shortcuts' },
  { label: 'Special Characters', href: '/resources/special-characters' },
];

export const KEYBOARD_DOWNLOADS = [
  { id: 'windows', language: 'Windows built-in layouts', native: '', nativeLanguageName: '', layoutName: 'Windows language and input layouts', type: 'Built-in keyboard', layoutType: 'Built-in keyboard', platforms: ['Windows'], supportedPlatforms: ['Windows'], description: 'Add a language or keyboard layout in Windows Settings. No third-party installer is needed.', provider: 'Microsoft Support', providerName: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows', downloadUrl: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows', sourceUrl: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows', previewImage: null, version: null, lastUpdated: '2026-10-30', status: 'verified', verificationStatus: 'verified' },
  { id: 'macos', language: 'macOS built-in layouts', native: '', nativeLanguageName: '', layoutName: 'macOS input sources', type: 'Built-in keyboard', layoutType: 'Built-in keyboard', platforms: ['macOS'], supportedPlatforms: ['macOS'], description: 'Add an input source in Keyboard settings. Available layouts vary by language and macOS version.', provider: 'Apple Support', providerName: 'Apple Support', url: 'https://support.apple.com/en-ie/guide/mac-help/mchlp1406/27/mac/27', downloadUrl: 'https://support.apple.com/en-ie/guide/mac-help/mchlp1406/27/mac/27', sourceUrl: 'https://support.apple.com/en-ie/guide/mac-help/mchlp1406/27/mac/27', previewImage: null, version: null, lastUpdated: '2026-10-30', status: 'verified', verificationStatus: 'verified' },
  { id: 'gboard', language: 'Gboard language keyboards', native: '', nativeLanguageName: '', layoutName: 'Gboard language keyboard', type: 'Mobile keyboard app', layoutType: 'Mobile keyboard app', platforms: ['Android'], supportedPlatforms: ['Android'], description: 'Use Gboard settings to add a supported language on Android.', provider: 'Google Gboard Help', providerName: 'Google Gboard Help', url: 'https://support.google.com/gboard/answer/7068494?hl=en', downloadUrl: 'https://support.google.com/gboard/answer/7068494?hl=en', sourceUrl: 'https://support.google.com/gboard/answer/7068494?hl=en', previewImage: null, version: null, lastUpdated: '2026-10-30', status: 'verified', verificationStatus: 'verified' },
  { id: 'ios', language: 'iPhone built-in keyboards', native: '', nativeLanguageName: '', layoutName: 'iPhone language keyboards', type: 'Built-in keyboard', layoutType: 'Built-in keyboard', platforms: ['iOS'], supportedPlatforms: ['iOS'], description: 'Add a supported language keyboard in Settings > General > Keyboard.', provider: 'Apple Support', providerName: 'Apple Support', url: 'https://support.apple.com/en-kw/guide/iphone/iph73b71eb/27/ios/27', downloadUrl: 'https://support.apple.com/en-kw/guide/iphone/iph73b71eb/27/ios/27', sourceUrl: 'https://support.apple.com/en-kw/guide/iphone/iph73b71eb/27/ios/27', previewImage: null, version: null, lastUpdated: '2026-10-30', status: 'verified', verificationStatus: 'verified' },
] as const;

export const AVAILABLE_LAYOUTS = [
  { id: 'english-us-qwerty', language: 'English', native: 'English', name: 'English US QWERTY', layoutName: 'English US QWERTY', variant: 'US (ANSI)', layoutVariant: 'US (ANSI)', type: 'QWERTY', layoutType: 'QWERTY', source: 'Microsoft United States keyboard layout', sourceName: 'Microsoft United States keyboard layout', sourceUrl: 'https://learn.microsoft.com/en-us/globalization/keyboards/kbdus', version: 'Windows US layout', lastUpdated: '2026-10-30', platforms: ['Windows'], supportedPlatforms: ['Windows'], status: 'verified', verificationStatus: 'verified' },
  { id: 'english-uk-qwerty', language: 'English', native: 'English', name: 'English UK QWERTY', layoutName: 'English UK QWERTY', variant: 'United Kingdom (ISO)', layoutVariant: 'United Kingdom (ISO)', type: 'QWERTY', layoutType: 'QWERTY', source: 'Microsoft United Kingdom keyboard layout (KLID 00000809)', sourceName: 'Microsoft United Kingdom keyboard layout (KLID 00000809)', sourceUrl: 'https://learn.microsoft.com/en-us/globalization/keyboards/kbduk', version: 'Windows UK layout', lastUpdated: '2026-10-30', platforms: ['Windows'], supportedPlatforms: ['Windows'], status: 'verified', verificationStatus: 'verified' },
  { id: 'urdu-phonetic-typeoye', language: 'Urdu', native: 'اردو', name: 'Typeoye Urdu Phonetic', layoutName: 'Typeoye Urdu Phonetic', variant: 'Typeoye app physical-key mapping', layoutVariant: 'Typeoye app physical-key mapping', type: 'Phonetic', layoutType: 'Phonetic', source: 'Typeoye Urdu typing engine', sourceName: 'Typeoye Urdu typing engine', sourceUrl: '/blog/urdu-phonetic-keyboard-layout', version: 'Current app mapping', lastUpdated: '2026-10-30', platforms: ['Typeoye Urdu typing tools'], supportedPlatforms: ['Typeoye Urdu typing tools'], status: 'verified', verificationStatus: 'verified' },
] as const;

export const LAYOUTS_COMING_SOON = ['Urdu Standard', 'Arabic 101', 'Persian Standard', 'Hindi InScript', 'Punjabi Gurmukhi', 'Punjabi Shahmukhi', 'Bengali', 'Pashto', 'Sindhi', 'Turkish', 'Russian'];

export const KEYBOARD_SHORTCUTS = [
  { category: 'Windows', name: 'Switch input language or keyboard layout', keys: 'Windows + Space', platforms: 'Windows 10 and 11', detail: 'Cycle through the keyboard layouts installed on your PC.', source: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows' },
  { category: 'Windows', name: 'Open the On-Screen Keyboard', keys: 'Windows + Ctrl + O', platforms: 'Windows', detail: 'Show or hide the Windows On-Screen Keyboard.', source: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/accessibility/use-the-on-screen-keyboard-osk-to-type' },
  { category: 'Windows', name: 'Copy', keys: 'Ctrl + C', platforms: 'Windows', detail: 'Copy selected text or an item.', source: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec' },
  { category: 'Windows', name: 'Paste', keys: 'Ctrl + V', platforms: 'Windows', detail: 'Paste copied or cut text or an item.', source: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec' },
  { category: 'macOS', name: 'Switch input source', keys: 'Control + Space', platforms: 'macOS', detail: 'Switch to the next input source configured in Keyboard settings.', source: 'Apple Support', url: 'https://support.apple.com/en-ie/guide/mac-help/mchlp1406/27/mac/27' },
  { category: 'macOS', name: 'Copy', keys: 'Command + C', platforms: 'macOS', detail: 'Copy selected text or an item.', source: 'Apple Support', url: 'https://support.apple.com/en-us/102650' },
  { category: 'macOS', name: 'Paste', keys: 'Command + V', platforms: 'macOS', detail: 'Paste copied or cut text or an item.', source: 'Apple Support', url: 'https://support.apple.com/en-us/102650' },
  { category: 'Browser', name: 'Find on page', keys: 'Ctrl + F / Command + F', platforms: 'Most desktop browsers', detail: 'Find text on the current page. The modifier depends on your operating system.', source: 'Chrome Help', url: 'https://support.google.com/chrome/answer/157179?hl=en' },
  { category: 'Text editing', name: 'Undo', keys: 'Ctrl + Z / Command + Z', platforms: 'Windows / macOS', detail: 'Undo the most recent editing action in apps that support it.', source: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec' },
] as const;

export const SPECIAL_CHARACTERS = [
  { char: '،', name: 'Arabic comma', code: 'U+060C', category: 'Arabic & Urdu', note: 'Arabic-script punctuation.' },
  { char: '؛', name: 'Arabic semicolon', code: 'U+061B', category: 'Arabic & Urdu', note: 'Arabic-script punctuation.' },
  { char: '؟', name: 'Arabic question mark', code: 'U+061F', category: 'Arabic & Urdu', note: 'Arabic-script punctuation.' },
  { char: '٫', name: 'Arabic decimal separator', code: 'U+066B', category: 'Arabic & Urdu', note: 'Used as a decimal separator in Arabic-script contexts.' },
  { char: '۔', name: 'Arabic full stop', code: 'U+06D4', category: 'Arabic & Urdu', note: 'Urdu full stop.' },
  { char: '€', name: 'Euro sign', code: 'U+20AC', category: 'Currency', note: 'Unicode currency symbol.' },
  { char: '£', name: 'Pound sign', code: 'U+00A3', category: 'Currency', note: 'Unicode currency symbol.' },
  { char: '¥', name: 'Yen sign', code: 'U+00A5', category: 'Currency', note: 'Unicode currency symbol.' },
  { char: '©', name: 'Copyright sign', code: 'U+00A9', category: 'Technical', note: 'Commonly used to mark copyright.' },
  { char: '°', name: 'Degree sign', code: 'U+00B0', category: 'Technical', note: 'Used with temperature and angle values.' },
  { char: '×', name: 'Multiplication sign', code: 'U+00D7', category: 'Mathematics', note: 'Multiplication operator.' },
  { char: '÷', name: 'Division sign', code: 'U+00F7', category: 'Mathematics', note: 'Division operator.' },
  { char: '±', name: 'Plus-minus sign', code: 'U+00B1', category: 'Mathematics', note: 'Indicates plus or minus.' },
  { char: '—', name: 'Em dash', code: 'U+2014', category: 'Punctuation', note: 'Long dash used as punctuation.' },
  { char: '…', name: 'Horizontal ellipsis', code: 'U+2026', category: 'Punctuation', note: 'Ellipsis character.' },
] as const;
