const examples = [
  ['mera naam Ali hai', 'میرا نام علی ہے'],
  ['aap kaise hain', 'آپ کیسے ہیں'],
  ['mujhe Urdu likhni hai', 'مجھے اردو لکھنی ہے'],
  ['Assalam-o-alaikum', 'السلام علیکم'],
  ['shukriya', 'شکریہ'],
  ['kal milte hain', 'کل ملتے ہیں'],
  ['aap ka naam kya hai', 'آپ کا نام کیا ہے'],
  ['mujhe pani chahiye', 'مجھے پانی چاہیے'],
];

export function RomanUrduExamples() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[var(--color-card)]">
            <th scope="col" className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-primary)' }}>Roman Urdu</th>
            <th scope="col" className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>Urdu script</th>
          </tr>
        </thead>
        <tbody>
          {examples.map(([roman, urdu]) => (
            <tr key={roman} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
              <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{roman}</td>
              <td lang="ur" dir="rtl" className="px-4 py-3 text-right text-lg" style={{ color: 'var(--color-text-primary)' }}>{urdu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
