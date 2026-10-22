import { CODE_TO_BASE, CODE_TO_SHIFT, isCombiningMark, URDU_DIGIT_MAP, URDU_PHONETIC_MAP } from '../../utils/urduPhonetic';
import { Link } from 'react-router-dom';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const SYMBOL_KEYS = [' ', ...Object.keys(CODE_TO_BASE)];

function mapped(key: string): string {
  return URDU_PHONETIC_MAP[key] ?? key;
}

function Glyph({ value }: { value: string }) {
  const shown = isCombiningMark(value) ? `◌${value}` : value === ' ' ? 'Space' : value;
  return <span dir="rtl" lang="ur" className="font-[var(--font-urdu)] text-lg">{shown}</span>;
}

function MappingTable({ rows, label }: { rows: { key: string; value: string }[]; label: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full min-w-[22rem] border-collapse text-sm" aria-label={label}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-accent-light)' }}>
            <th scope="col" className="px-4 py-3 text-left font-bold" style={{ color: 'var(--color-text-primary)' }}>English key</th>
            <th scope="col" className="px-4 py-3 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>Urdu output</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, value }) => (
            <tr key={key} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
              <th scope="row" className="px-4 py-2.5 text-left font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                {key === ' ' ? 'Space' : key}
              </th>
              <td className="px-4 py-2.5 text-right" style={{ color: 'var(--color-text-primary)' }}><Glyph value={value} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UrduKeyboardGuide() {
  const lowerRows = LETTERS.map((key) => ({ key, value: mapped(key) }));
  const shiftedLetters = LETTERS.map((letter) => {
    const key = letter.toUpperCase();
    return { key: `Shift + ${letter}`, value: mapped(key) };
  });
  const baseSymbols = SYMBOL_KEYS.map((code) => {
    const key = code === ' ' ? ' ' : CODE_TO_BASE[code]!;
    return { key: code === ' ' ? 'Space' : key, value: mapped(key) };
  });
  const shiftedSymbols = Object.entries(CODE_TO_SHIFT).map(([code, key]) => ({
    key: `Shift + ${CODE_TO_BASE[code] ?? code}`,
    value: mapped(key),
  }));
  const digits = Object.entries(URDU_DIGIT_MAP).map(([key, value]) => ({ key, value }));

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Lowercase letters — normal keys</h3>
        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Press a letter without Shift to produce its mapped Urdu character.</p>
        <MappingTable rows={lowerRows} label="Lowercase English key to Urdu character mapping" />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Shift + letter — uppercase layer</h3>
        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Hold Shift while pressing a letter to produce the uppercase mapping. This layer includes Urdu letters that need distinct keys as well as vowel marks and other combining characters. The dotted circle shown before a combining mark is only a reading aid; it is not typed.</p>
        <MappingTable rows={shiftedLetters} label="Shift plus letter key to Urdu character mapping" />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Punctuation and symbol keys</h3>
        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>These outputs follow the physical key and Shift state. A key not specially translated is passed through as typed.</p>
        <MappingTable rows={baseSymbols} label="Punctuation and symbol key mappings" />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Shift + punctuation keys</h3>
        <MappingTable rows={shiftedSymbols} label="Shift plus punctuation key mappings" />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Number row</h3>
        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Urdu Learn enables Urdu numerals on the number row. Urdu Typing Test and Urdu Practice currently leave those digit keys as 0–9. Shift does not change number-row digits.</p>
        <MappingTable rows={digits} label="Number row key to Urdu numeral mapping used by Urdu Learn" />
      </section>

    </div>
  );
}

export function UrduTypingLinks() {
  return (
    <aside className="mt-6 rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Start typing Urdu on Typeoye</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>Use the same phonetic mapping in the Urdu typing tools, then build confidence with structured lessons.</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        <Link to="/urdu-lessons" className="rounded-lg px-3 py-2 text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)' }}>Urdu Learn</Link>
        <Link to="/urdu-typing-test/setup" className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent-text)' }}>Urdu Typing Test</Link>
        <Link to="/urdu-practice" className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent-text)' }}>Urdu Practice</Link>
      </div>
    </aside>
  );
}
