const sources = [
  {
    title: 'Microsoft: Manage language and keyboard settings',
    detail: 'Official Windows 10 and Windows 11 instructions for adding layouts and switching input languages.',
    href: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/manage-the-language-and-keyboard-input-layout-settings-in-windows',
  },
  {
    title: 'Microsoft: Language packs for Windows',
    detail: 'Official Windows language installation guidance, including the distinction between a keyboard layout and display language.',
    href: 'https://support.microsoft.com/en-us/windows/hardware/input-devices/language-packs-for-windows',
  },
  {
    title: 'Keyman for Windows downloads',
    detail: 'Official download page for the Keyman application. The application is needed to use the Keyman phonetic keyboard package.',
    href: 'https://keyman.com/en/downloads/',
  },
  {
    title: 'Pak Urdu Phonetic keyboard on Keyman',
    detail: 'Official Keyman catalogue entry; lists the Windows package, stable status, and package details.',
    href: 'https://keyman.com/keyboards/pak_urdu_phonetic',
  },
  {
    title: 'Keyman: install the app on Windows',
    detail: 'Official Keyman instructions for downloading and installing Keyman for Windows.',
    href: 'https://help.keyman.com/products/windows/current-version/start/download-and-install-keyman',
  },
  {
    title: 'CLE Urdu Phonetic Keyboard v1.2',
    detail: 'University of Engineering and Technology Lahore’s Center for Language Engineering page. Its published notes explicitly state Windows 10 compatibility; Windows 11 is not confirmed on this page.',
    href: 'https://cle.org.pk/software/localization/keyboards/CLEphonetickbv1.2.html',
  },
];

export function WindowsUrduKeyboardSources() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {sources.map(({ title, detail, href }) => (
        <article key={title} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
          <a href={href} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--color-accent-text)' }}>
            {title}
          </a>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{detail}</p>
        </article>
      ))}
    </div>
  );
}
