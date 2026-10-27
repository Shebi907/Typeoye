const phrases = [
  'السلام علیکم۔',
  'آپ کیسے ہیں؟',
  'میرا نام علی ہے۔',
  'میں اردو میں لکھنا سیکھ رہا ہوں۔',
];

export function GoogleDocsUrduExamples() {
  return (
    <div className="mt-5 space-y-5">
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {phrases.map((phrase) => (
            <li key={phrase} lang="ur" dir="rtl" className="px-5 py-3 text-right text-xl leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {phrase}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Practice paragraph</h3>
        <p lang="ur" dir="rtl" className="mt-2 text-xl leading-[1.9]" style={{ color: 'var(--color-text-secondary)' }}>
          میرا نام علی ہے۔ میں لاہور میں رہتا ہوں۔ مجھے اردو میں لکھنا پسند ہے۔ میں روزانہ تھوڑی دیر مشق کرتا ہوں۔
        </p>
      </div>
    </div>
  );
}
