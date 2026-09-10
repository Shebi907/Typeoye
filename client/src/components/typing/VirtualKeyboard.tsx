import React from 'react';
import { cn } from '../../utils/cn';

const ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['a','s','d','f','g','h','j','k','l',';','\''],
  ['z','x','c','v','b','n','m',',','.','/'],
];

// Finger zones for color coding (left pinky→index, right index→pinky)
const FINGER_COLORS: Record<string, string> = {
  // Left pinky
  '`':'#e2e8f0','1':'#e2e8f0','q':'#e2e8f0','a':'#e2e8f0','z':'#e2e8f0',
  // Left ring
  '2':'#dbeafe','w':'#dbeafe','s':'#dbeafe','x':'#dbeafe',
  // Left middle
  '3':'#d1fae5','e':'#d1fae5','d':'#d1fae5','c':'#d1fae5',
  // Left index
  '4':'#fef3c7','r':'#fef3c7','f':'#fef3c7','v':'#fef3c7',
  '5':'#fef3c7','t':'#fef3c7','g':'#fef3c7','b':'#fef3c7',
  // Right index
  '6':'#ede9fe','y':'#ede9fe','h':'#ede9fe','n':'#ede9fe',
  '7':'#ede9fe','u':'#ede9fe','j':'#ede9fe','m':'#ede9fe',
  // Right middle
  '8':'#d1fae5','i':'#d1fae5','k':'#d1fae5',',':'#d1fae5',
  // Right ring
  '9':'#dbeafe','o':'#dbeafe','l':'#dbeafe','.':'#dbeafe',
  // Right pinky
  '0':'#e2e8f0','p':'#e2e8f0',';':'#e2e8f0','/':'#e2e8f0',
  '-':'#e2e8f0','[':'#e2e8f0','\'':'#e2e8f0',
  '=':'#e2e8f0',']':'#e2e8f0','\\':'#e2e8f0',
};

interface VirtualKeyboardProps {
  currentKey?: string;
  errorKey?: string;
  highlightKeys?: string[];
  /** 'premium' = the redesigned Typing Test look; default keeps the classic
   *  finger-zone styling used by Practice and Lesson Player. */
  variant?: 'default' | 'premium';
}

const PREMIUM_KEY_BG = 'var(--color-card)';
const PREMIUM_KEY_TEXT = 'var(--color-text-secondary)';
const PREMIUM_KEY_BORDER = 'var(--color-border)';
const PREMIUM_KEY_SHADOW =
  '0 1px 0 rgba(15, 23, 42, 0.04), 0 2px 6px rgba(15, 23, 42, 0.08), inset 0 -2px 0 rgba(15, 23, 42, 0.05)';
const PREMIUM_KEY_SIZE = 'clamp(17px, 5.4vw, 34px)';

export function VirtualKeyboard({ currentKey, errorKey, highlightKeys = [], variant = 'default' }: VirtualKeyboardProps) {
  const premium = variant === 'premium';

  const keySize = premium ? PREMIUM_KEY_SIZE : 'clamp(17px, 4.6vw, 30px)';
  const keyFont = premium ? '0.68rem' : '0.65rem';
  const keyRadius = premium ? '8px' : undefined;

  return (
    <div
      className={`w-full mx-auto mt-4 px-2 ${premium ? 'kbd-premium' : ''}`}
      aria-label="Virtual keyboard"
      aria-hidden="true"
    >
      {ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={premium ? 'flex justify-center gap-[5px] mb-[5px]' : 'flex justify-center gap-[3px] mb-[3px]'}
          style={{ paddingLeft: `${rowIdx * (premium ? 14 : 10)}px` }}
        >
          {row.map((key) => {
            const isActive = currentKey?.toLowerCase() === key;
            const isError = errorKey?.toLowerCase() === key;
            const fingerColor = FINGER_COLORS[key] ?? '#e2e8f0';
            const isRelevant = highlightKeys.some((highlight) => highlight.toLowerCase() === key);

            return (
              <div
                key={key}
                className={cn(
                  'key-base select-none',
                  isActive && 'scale-95',
                  premium && !keyRadius && 'rounded-lg'
                )}
                style={{
                  flexGrow: 1,
                  flexBasis: '0%',
                  height: keySize,
                  fontSize: keyFont,
                  fontWeight: 600,
                  borderRadius: keyRadius,
                  backgroundColor: isError
                    ? premium
                      ? 'rgba(239, 68, 68, 0.14)'
                      : 'rgba(239,68,68,0.25)'
                    : isActive
                    ? 'var(--color-accent)'
                    : premium
                    ? PREMIUM_KEY_BG
                    : fingerColor,
                  color: isActive
                    ? 'white'
                    : isError
                    ? 'var(--color-error)'
                    : premium
                    ? PREMIUM_KEY_TEXT
                    : '#374151',
                  borderColor: isRelevant && !isActive && !isError
                    ? 'var(--color-accent)'
                    : isActive
                    ? 'var(--color-accent-hover)'
                    : isError
                    ? 'var(--color-error)'
                    : premium
                    ? PREMIUM_KEY_BORDER
                    : 'rgba(0,0,0,0.12)',
                  boxShadow: isActive
                    ? '0 2px 10px rgba(67,97,238,0.4), inset 0 -2px 0 rgba(255,255,255,0.25)'
                    : premium
                    ? PREMIUM_KEY_SHADOW
                    : '0 1px 2px rgba(0,0,0,0.08)',
                  transition: 'all 0.08s ease',
                }}
              >
                {key.toUpperCase()}
              </div>
            );
          })}
        </div>
      ))}

      {/* Spacebar row */}
      <div className={premium ? 'flex justify-center gap-[5px] mt-[5px]' : 'flex justify-center gap-[3px] mt-[3px]'}>
        {['Alt', 'Cmd', '', 'Space', '', 'Cmd', 'Alt'].map((k, i) => (
          <div
            key={i}
            className="key-base"
            style={{
              flexGrow: k === 'Space' ? 3 : 1,
              flexBasis: '0%',
              height: premium ? '28px' : '28px',
              fontSize: '0.55rem',
              borderRadius: premium ? '8px' : undefined,
              backgroundColor:
                k === 'Space' && currentKey === ' '
                  ? 'var(--color-accent)'
                  : premium
                  ? PREMIUM_KEY_BG
                  : '#e2e8f0',
              color:
                k === 'Space' && currentKey === ' '
                  ? 'white'
                  : premium
                  ? PREMIUM_KEY_TEXT
                  : '#6b7280',
              borderColor: premium ? PREMIUM_KEY_BORDER : 'rgba(0,0,0,0.1)',
              boxShadow: premium ? PREMIUM_KEY_SHADOW : undefined,
            }}
          >
            {k === 'Space' ? '' : k}
          </div>
        ))}
      </div>
    </div>
  );
}
