import type { CSSProperties } from 'react';

interface CertificatePreviewProps {
  name: string;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
}

const PRIMARY = '#4263F5';
const SECONDARY = '#6C63FF';
const NAVY = '#1B2340';
const MUTED = '#69708F';
const LAVENDER = '#EEF0FF';
const CARD_BORDER = '#DDE2FB';

function Laurel({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 52"
      style={{ width: '2.6cqw', height: '5.6cqw', transform: flip ? 'scaleX(-1)' : undefined, flexShrink: 0 }}
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 48 C 12 36, 16 24, 18 6" stroke={SECONDARY} strokeWidth="1.6" strokeLinecap="round" />
      {[
        [7, 40, -50], [11, 30, -62], [14, 20, -74], [16, 12, -86], [17.5, 5, -96],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="6.4" ry="2.6" fill={SECONDARY} opacity="0.85" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '2.4cqw', height: '2.4cqw' }} fill="none" aria-hidden="true">
      <path d="M4.6 17 A 8.6 8.6 0 1 1 19.4 17" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 L 16.6 8.6" stroke={PRIMARY} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="13.4" r="1.5" fill={PRIMARY} />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '2.4cqw', height: '2.4cqw' }} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={PRIMARY} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke={PRIMARY} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.6" fill={PRIMARY} />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '2.4cqw', height: '2.4cqw' }} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={PRIMARY} strokeWidth="2" />
      <path d="M12 6.8 V 12 L 15.4 14.2" stroke={PRIMARY} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '1.5cqw', height: '1.5cqw' }} fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke={MUTED} strokeWidth="1.8" />
      <path d="M3.5 10 H 20.5 M 8 3 V 6.4 M 16 3 V 6.4" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: '1.5cqw', height: '1.5cqw' }} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="10" rx="2" stroke={NAVY} strokeWidth="1.8" />
      <circle cx="7.4" cy="12" r="1.4" fill={NAVY} />
    </svg>
  );
}

function Seal() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '12.5cqw', height: '12.5cqw' }} aria-hidden="true">
      {[...Array(28)].map((_, i) => {
        const a = (i / 28) * Math.PI * 2;
        return <circle key={i} cx={50 + Math.cos(a) * 47} cy={50 + Math.sin(a) * 47} r="1" fill={PRIMARY} opacity="0.65" />;
      })}
      <circle cx="50" cy="50" r="43" stroke={PRIMARY} strokeWidth="2.4" fill="none" />
      <circle cx="50" cy="50" r="39" stroke={SECONDARY} strokeWidth="1" fill="none" />
      <circle cx="50" cy="50" r="34" fill={PRIMARY} />
      <path d="M38 33 L47 42 L63 26" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="50" y="53" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#fff" letterSpacing="0.6">ONLINE TYPING PLATFORM</text>
      <line x1="38" y1="58" x2="62" y2="58" stroke="#fff" strokeWidth="0.9" opacity="0.7" />
      <text x="50" y="68" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="#fff" letterSpacing="1">SERVER VERIFIED</text>
    </svg>
  );
}

function CornerTicks() {
  const base: CSSProperties = { position: 'absolute', width: '2.6cqw', height: '2.6cqw', borderColor: PRIMARY };
  return (
    <>
      <span style={{ ...base, top: '4%', left: '4%', borderTopWidth: 2, borderLeftWidth: 2, borderTopStyle: 'solid', borderLeftStyle: 'solid', borderTopLeftRadius: 8 }} />
      <span style={{ ...base, top: '4%', right: '4%', borderTopWidth: 2, borderRightWidth: 2, borderTopStyle: 'solid', borderRightStyle: 'solid', borderTopRightRadius: 8 }} />
      <span style={{ ...base, bottom: '4%', left: '4%', borderBottomWidth: 2, borderLeftWidth: 2, borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderBottomLeftRadius: 8 }} />
      <span style={{ ...base, bottom: '4%', right: '4%', borderBottomWidth: 2, borderRightWidth: 2, borderBottomStyle: 'solid', borderRightStyle: 'solid', borderBottomRightRadius: 8 }} />
    </>
  );
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${mins}m ${rest}s` : `${mins} min`;
}

/** On-screen replica of the printed Typeoye certificate (scales with container). */
export default function CertificatePreview({ name, wpm, accuracy, durationSeconds }: CertificatePreviewProps) {
  const issued = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const displayName = name.trim() || 'Your Name';

  return (
    <div
      className="certificate-print"
      style={{
        containerType: 'inline-size',
        width: '100%',
        aspectRatio: '297 / 210',
        borderRadius: '1.6cqw',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 55%, #eef0ff 100%)',
        boxShadow: '0 10px 30px rgba(66, 99, 245, 0.16)',
        border: `1px solid ${CARD_BORDER}`,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: NAVY,
      }}
    >
      {/* Decorative corner shapes */}
      <div style={{ position: 'absolute', top: '-12%', left: '-6%', width: '22cqw', height: '22cqw', borderRadius: '50%', background: SECONDARY, opacity: 0.05 }} />
      <div style={{ position: 'absolute', bottom: '-14%', right: '-6%', width: '26cqw', height: '26cqw', borderRadius: '50%', background: SECONDARY, opacity: 0.05 }} />
      <div style={{ position: 'absolute', top: '-10%', right: '8%', width: '16cqw', height: '16cqw', borderRadius: '50%', background: SECONDARY, opacity: 0.04 }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '8%', width: '14cqw', height: '14cqw', borderRadius: '50%', background: SECONDARY, opacity: 0.04 }} />

      {/* Flowing waves */}
      <svg viewBox="0 0 140 120" preserveAspectRatio="none" style={{ position: 'absolute', left: '2%', top: '32%', width: '13cqw', height: '26cqw', opacity: 0.1 }} aria-hidden="true">
        <path d="M5 20 C 45 0, 85 40, 125 20" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
        <path d="M10 55 C 50 35, 90 75, 130 55" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
        <path d="M15 90 C 55 70, 95 110, 135 90" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
      </svg>
      <svg viewBox="0 0 140 120" preserveAspectRatio="none" style={{ position: 'absolute', right: '2%', top: '32%', width: '13cqw', height: '26cqw', transform: 'scaleX(-1)', opacity: 0.1 }} aria-hidden="true">
        <path d="M5 20 C 45 0, 85 40, 125 20" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
        <path d="M10 55 C 50 35, 90 75, 130 55" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
        <path d="M15 90 C 55 70, 95 110, 135 90" stroke={PRIMARY} strokeWidth="1.4" fill="none" />
      </svg>

      {/* Premium border */}
      <div style={{ position: 'absolute', inset: '2.6%', borderRadius: '1.2cqw', border: `1.5px solid ${PRIMARY}`, boxShadow: `0 0 0 0.35cqw rgba(66,99,245,0.10)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '4.2%', borderRadius: '0.9cqw', border: `1px solid ${CARD_BORDER}`, pointerEvents: 'none' }} />
      <CornerTicks />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4.6% 8%' }}>
        <div style={{ fontSize: '1.9cqw', fontWeight: 700, letterSpacing: '0.42em', color: PRIMARY, marginTop: '0.6cqw' }}>TYPEOYE</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600, fontSize: '5cqw', lineHeight: 1.15, margin: '0.8cqw 0 0' }}>
          Certificate of Achievement
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2cqw', marginTop: '1.4cqw' }} aria-hidden="true">
          <span style={{ display: 'inline-block', width: '10cqw', height: 1, background: PRIMARY, opacity: 0.75 }} />
          <span style={{ display: 'inline-block', width: '0.7cqw', height: '0.7cqw', background: PRIMARY, transform: 'rotate(45deg)' }} />
          <span style={{ display: 'inline-block', width: '10cqw', height: 1, background: PRIMARY, opacity: 0.75 }} />
        </div>

        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '1.65cqw', color: MUTED, margin: '1.6cqw 0 0' }}>
          This certificate is proudly presented to
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.6cqw', marginTop: '0.4cqw', maxWidth: '78%' }}>
          <Laurel />
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '5.6cqw',
              lineHeight: 1.25,
              color: NAVY,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <Laurel flip />
        </div>

        <p style={{ fontSize: '1.6cqw', color: '#3c4257', margin: '1cqw 0 0' }}>
          for outstanding typing performance in a {fmtDuration(durationSeconds)} typing test on the{' '}
          <span style={{ color: PRIMARY, fontWeight: 600 }}>Typeoye</span> platform.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2.2cqw', marginTop: '1.8cqw' }}>
          {[
            { icon: <GaugeIcon />, value: String(Math.round(wpm * 10) / 10), label: 'WORDS PER MINUTE' },
            { icon: <TargetIcon />, value: `${Math.round(accuracy * 10) / 10}%`, label: 'ACCURACY' },
            { icon: <ClockIcon />, value: fmtDuration(durationSeconds), label: 'DURATION' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                width: '19cqw',
                padding: '1.4cqw 1cqw 1.2cqw',
                borderRadius: '1.1cqw',
                background: LAVENDER,
                border: `1px solid ${CARD_BORDER}`,
                boxShadow: '0 0.4cqw 1.2cqw rgba(27,35,64,0.07)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.55cqw',
              }}
            >
              {stat.icon}
              <div style={{ fontSize: '3.1cqw', fontWeight: 800, color: PRIMARY, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '0.95cqw', fontWeight: 700, letterSpacing: '0.18em', color: MUTED }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', left: '6.5%', right: '6.5%', bottom: '5.2%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.7cqw' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6cqw', fontSize: '1.25cqw', color: MUTED }}>
            <CalendarIcon /> Date Issued: {issued}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6cqw', fontSize: '1.25cqw', fontWeight: 700, letterSpacing: '0.14em', color: NAVY }}>
            <TagIcon /> CERTIFICATE ID
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Great Vibes', 'Segoe Script', cursive", fontSize: '3.4cqw', color: NAVY, lineHeight: 1 }}>Typeoye Team</div>
          <div style={{ width: '12cqw', height: 1, background: CARD_BORDER, margin: '0.5cqw auto 0.4cqw' }} />
          <div style={{ fontSize: '1.3cqw', fontWeight: 700, color: PRIMARY }}>Typeoye Team</div>
          <div style={{ fontSize: '0.98cqw', color: MUTED, marginTop: '0.25cqw' }}>Thank you for being part of our community!</div>
        </div>

        <Seal />
      </div>
    </div>
  );
}
