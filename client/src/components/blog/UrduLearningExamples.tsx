const EXAMPLES = [
  { label: 'Words', text: 'کتاب  قلم  گھر  دوست' },
  { label: 'Sentences', text: 'میں اردو سیکھ رہا ہوں۔\nآج میں ایک نیا سبق پڑھوں گا۔' },
  { label: 'Short paragraph', text: 'میں روزانہ تھوڑی دیر اردو ٹائپ کرنے کی مشق کرتا ہوں۔ پہلے میں درست حروف پر توجہ دیتا ہوں، پھر آہستہ آہستہ اپنی رفتار بہتر بناتا ہوں۔' },
];

export function UrduLearningExamples() {
  return (
    <div className="mt-5 space-y-4">
      {EXAMPLES.map(({ label, text }) => (
        <section key={label} className="rounded-xl border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-accent-text)' }}>{label}</h3>
          <p dir="rtl" lang="ur" className="mt-3 whitespace-pre-line text-right text-xl leading-[2.1] sm:text-2xl" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-urdu)' }}>{text}</p>
        </section>
      ))}
    </div>
  );
}
