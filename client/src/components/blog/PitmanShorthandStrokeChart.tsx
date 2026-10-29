type Stroke = {
  name: string;
  sound: string;
  sample: string;
  direction: string;
  weight: 'light' | 'heavy';
  path: string;
  curved?: boolean;
};

const strokes: Stroke[] = [
  { name: 'Pee', sound: '/p/ as in pin', sample: 'P', direction: 'Down 45 degrees from vertical', weight: 'light', path: 'M7 12 L57 62' },
  { name: 'Bee', sound: '/b/ as in bin', sample: 'B', direction: 'Down 45 degrees from vertical', weight: 'heavy', path: 'M7 12 L57 62' },
  { name: 'Tee', sound: '/t/ as in tin', sample: 'T', direction: 'Down, vertical', weight: 'light', path: 'M32 10 L32 64' },
  { name: 'Dee', sound: '/d/ as in din', sample: 'D', direction: 'Down, vertical', weight: 'heavy', path: 'M32 10 L32 64' },
  { name: 'Chay', sound: '/tʃ/ as in chin', sample: 'CH', direction: 'Down 30° from vertical', weight: 'light', path: 'M47 12 L18 62' },
  { name: 'Jay', sound: '/dʒ/ as in gin', sample: 'J', direction: 'Down 30° from vertical', weight: 'heavy', path: 'M47 12 L18 62' },
  { name: 'Kay', sound: '/k/ as in kin', sample: 'K', direction: 'Left to right, horizontal', weight: 'light', path: 'M8 38 L56 38' },
  { name: 'Gay', sound: '/g/ as in go', sample: 'G', direction: 'Left to right, horizontal', weight: 'heavy', path: 'M8 38 L56 38' },
  { name: 'Eff', sound: '/f/ as in fan', sample: 'F', direction: 'Down 45° from vertical, curved', weight: 'light', path: 'M7 12 C31 14 52 38 57 62', curved: true },
  { name: 'Vee', sound: '/v/ as in van', sample: 'V', direction: 'Down 45° from vertical, curved', weight: 'heavy', path: 'M7 12 C31 14 52 38 57 62', curved: true },
  { name: 'Ith', sound: '/θ/ as in thin', sample: 'TH', direction: 'Down vertical, curved', weight: 'light', path: 'M32 12 C14 24 14 50 32 62', curved: true },
  { name: 'Thee', sound: '/ð/ as in then', sample: 'TH', direction: 'Down vertical, curved', weight: 'heavy', path: 'M32 12 C14 24 14 50 32 62', curved: true },
  { name: 'Ess', sound: '/s/ as in sip', sample: 'S', direction: 'Down vertical, curved', weight: 'light', path: 'M32 12 C50 24 50 50 32 62', curved: true },
  { name: 'Zee', sound: '/z/ as in zip', sample: 'Z', direction: 'Down vertical, curved', weight: 'heavy', path: 'M32 12 C50 24 50 50 32 62', curved: true },
  { name: 'Ish', sound: '/ʃ/ as in ship', sample: 'SH', direction: 'Down 45° from vertical, curved', weight: 'light', path: 'M57 12 C35 20 20 40 7 62', curved: true },
  { name: 'Zhee', sound: '/ʒ/ as in measure', sample: 'ZH', direction: 'Down 45° from vertical, curved', weight: 'heavy', path: 'M57 12 C35 20 20 40 7 62', curved: true },
  { name: 'Em', sound: '/m/ as in map', sample: 'M', direction: 'Left to right, horizontal curve', weight: 'light', path: 'M8 24 Q32 50 56 24', curved: true },
  { name: 'En', sound: '/n/ as in nap', sample: 'N', direction: 'Left to right, horizontal curve', weight: 'light', path: 'M8 50 Q32 24 56 50', curved: true },
  { name: 'Ing', sound: '/ŋ/ as in sing', sample: 'NG', direction: 'Left to right, horizontal curve', weight: 'light', path: 'M8 38 Q32 56 56 38', curved: true },
  { name: 'Ell', sound: '/l/ as in leg', sample: 'L', direction: 'Up 45 degrees from vertical', weight: 'light', path: 'M7 62 C14 38 34 17 57 12', curved: true },
  { name: 'Ar', sound: 'R sound, downward form', sample: 'R', direction: 'Down 45 degrees from vertical', weight: 'light', path: 'M7 12 C14 36 34 57 57 62', curved: true },
  { name: 'Ray', sound: 'R sound, upward form', sample: 'R', direction: 'Up 60° from vertical', weight: 'light', path: 'M7 62 L57 33' },
  { name: 'Way', sound: '/w/ as in wet', sample: 'W', direction: 'Up 60 degrees from vertical, with initial hook', weight: 'light', path: 'M57 62 Q49 59 55 54 L7 33' },
  { name: 'Yay', sound: '/j/ as in yet', sample: 'Y', direction: 'Up 60 degrees from vertical, with initial hook', weight: 'light', path: 'M57 62 Q63 55 57 54 L7 33' },
  { name: 'Hay (up)', sound: '/h/ as in hat', sample: 'H', direction: 'Up 60 degrees from vertical', weight: 'light', path: 'M57 62 C48 52 30 42 7 33', curved: true },
  { name: 'Hay (down)', sound: '/h/ as in hat', sample: 'H', direction: 'Down 30 degrees from vertical, curved', weight: 'light', path: 'M18 12 C20 30 34 50 47 62', curved: true },
];

function StrokeMark({ stroke }: { stroke: Stroke }) {
  const thick = stroke.weight === 'heavy';
  const color = thick ? '#5934d8' : '#2456d8';
  const startMatch = stroke.path.match(/^M\s*([\d.]+)\s+([\d.]+)/);
  const start = startMatch ? { x: Number(startMatch[1]), y: Number(startMatch[2]) } : { x: 18, y: 12 };
  return (
    <svg viewBox="0 0 64 76" role="img" aria-label={`${stroke.name} stroke, ${stroke.direction.toLowerCase()}`} className="h-16 w-16 shrink-0">
      <defs>
        <marker id={`arrow-${stroke.name.replace(/[^a-z]/gi, '')}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill={color} />
        </marker>
      </defs>
      {thick && stroke.curved && <path d={stroke.path} pathLength="100" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      <path d={stroke.path} fill="none" stroke={color} strokeWidth={thick && !stroke.curved ? 6 : 3} strokeDasharray={thick && stroke.curved ? '0 35 30 35 0' : undefined} pathLength={thick && stroke.curved ? 100 : undefined} strokeLinecap="round" strokeLinejoin="round" markerEnd={`url(#arrow-${stroke.name.replace(/[^a-z]/gi, '')})`} />
      {!thick && <circle cx={start.x} cy={start.y} r="2.6" fill="#0f172a" />}
    </svg>
  );
}

export function PitmanShorthandStrokeChart() {
  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="inline-flex items-center gap-2"><span className="h-1 w-6 rounded bg-[#2456d8]" /> Light stroke</span>
        <span className="inline-flex items-center gap-2"><span className="h-1.5 w-6 rounded bg-[#5934d8]" /> Heavy stroke</span>
        <span>Dots mark the start; arrowheads show writing direction.</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {strokes.map((stroke) => (
          <div key={stroke.name} className="flex min-w-0 items-center gap-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <StrokeMark stroke={stroke} />
            <div className="min-w-0">
              <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stroke.name} <span className="font-normal">({stroke.sample})</span></p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{stroke.sound}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stroke.direction} · {stroke.weight}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        This is a New Era Pitman beginner reference. The diagram shows isolated basic strokes; joins, stroke choice, line position, and vowel placement follow additional rules. R has two forms, and H has upward and downward forms. Use your course's specified Pitman edition consistently. For source descriptions of stroke direction and vowel placement, consult the <a className="font-semibold underline" href="https://www.long-live-pitmans-shorthand.org.uk/theory-1-strokes.htm" target="_blank" rel="noreferrer">New Era stroke reference</a> and its <a className="font-semibold underline" href="https://www.long-live-pitmans-shorthand.org.uk/theory-2-vowels.htm" target="_blank" rel="noreferrer">vowel reference</a>.
      </p>
    </div>
  );
}


