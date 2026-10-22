"""Build the featured graphic for the Urdu online typing blog from the live map."""

from html import escape
import ast
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
MAP_SOURCE = ROOT / "src" / "utils" / "urduPhonetic.ts"
OUTPUT = ROOT / "public" / "assets" / "blog" / "urdu-online-typing-keyboard.svg"


def extract_lowercase_map() -> dict[str, str]:
    source = MAP_SOURCE.read_text(encoding="utf-8")
    block = re.search(r"export const URDU_PHONETIC_MAP[^=]*=\s*\{(.*?)\n\};", source, re.S)
    if not block:
        raise RuntimeError("Could not find URDU_PHONETIC_MAP")
    mapping = dict(re.findall(r"^\s*([a-z]):\s*'([^']*)',", block.group(1), re.M))
    if set(mapping) != set("abcdefghijklmnopqrstuvwxyz"):
        raise RuntimeError("The source map did not contain all 26 lowercase letter keys")
    return mapping


def extract_symbol_map() -> dict[str, str]:
    source = MAP_SOURCE.read_text(encoding="utf-8")
    block = re.search(r"export const URDU_PHONETIC_MAP[^=]*=\s*\{(.*?)\n\};", source, re.S)
    assert block
    token = r"(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")"
    entries = re.findall(rf"^\s*({token})\s*:\s*({token})\s*,?", block.group(1), re.M)
    return {ast.literal_eval(key): ast.literal_eval(value) for key, value in entries}


def mapped_text(text: str, mapping: dict[str, str]) -> str:
    return "".join(mapping.get(char, char) for char in text)


def keycap(label: str, output: str, x: float, y: float, width: float = 92, height: float = 72) -> str:
    return f'''<g transform="translate({x:.1f} {y:.1f})">
  <rect x="0" y="4" width="{width}" height="{height}" rx="12" fill="#cbd3e8" opacity=".75"/>
  <rect x="0" y="0" width="{width}" height="{height}" rx="12" fill="#fff" stroke="#d8deed" stroke-width="2"/>
  <text x="{width / 2:.1f}" y="24" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="19" font-weight="700" fill="#27314f">{escape(label)}</text>
  <text x="{width / 2:.1f}" y="54" text-anchor="middle" dominant-baseline="middle" direction="rtl" unicode-bidi="plaintext" font-family="'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif" font-size="28" fill="#5140bd">{escape(output)}</text>
</g>'''


def keyboard_row(labels: str, mapping: dict[str, str], y: float, canvas_width: int = 1600, extra: dict[str, str] | None = None) -> str:
    key_width, gap = 92, 12
    total_width = len(labels) * key_width + (len(labels) - 1) * gap
    x = (canvas_width - total_width) / 2
    return "\n".join(keycap(char, mapping.get(char, (extra or {}).get(char, char)), x + i * (key_width + gap), y) for i, char in enumerate(labels))


def main() -> None:
    mapping = extract_lowercase_map()
    examples = [("slam", mapped_text("slam", mapping)), ("ktab", mapped_text("ktab", mapping))]
    if examples != [("slam", "سلام"), ("ktab", "کتاب")]:
        raise RuntimeError(f"Example output differs from expected converter result: {examples!r}")

    punctuation = {"`": "`", "-": "-", "=": "=", "[": "[", "]": "]", "\\": "\\", ";": "؛", "'": "'", ",": "،", ".": "۔", "/": "/"}
    symbol_map = extract_symbol_map()
    if any(symbol_map.get(key, key) != output for key, output in punctuation.items()):
        raise RuntimeError("Punctuation mapping does not match the Urdu conversion map")

    number_map = {digit: digit for digit in "1234567890"}
    top_map = {**number_map, **punctuation}
    keyboard = [
        keyboard_row("`1234567890-=", top_map, 442),
        keyboard_row("qwertyuiop[]\\", mapping, 520, extra=punctuation),
        keyboard_row("asdfghjkl;'", mapping, 598, extra=punctuation),
        keyboard_row("zxcvbnm,./", mapping, 676, extra=punctuation),
    ]
    keyboard.append(keycap("Space", "␠", 522, 754, 556))

    input_lines = "\n".join(
        f'''<text x="460" y="{217 + index * 83}" font-family="JetBrains Mono, monospace" font-size="46" font-weight="600" fill="#27314f">{escape(source)}</text>
<text x="1050" y="{217 + index * 83}" text-anchor="middle" dominant-baseline="middle" direction="rtl" unicode-bidi="plaintext" font-family="'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif" font-size="57" fill="#27314f">{escape(output)}</text>'''
        for index, (source, output) in enumerate(examples)
    )

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title description">
<title id="title">How to type Urdu online using an English keyboard</title>
<desc id="description">A regular English QWERTY keyboard with Urdu characters mapped from its lowercase letters and punctuation, plus the exact Typeoye outputs for slam and ktab.</desc>
<defs><linearGradient id="brand" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4361ee"/><stop offset="1" stop-color="#7c3aed"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="13" flood-color="#27314f" flood-opacity=".12"/></filter></defs>
<rect width="1600" height="900" fill="#f5f7fc"/>
<circle cx="1455" cy="120" r="170" fill="#4361ee" opacity=".055"/><circle cx="110" cy="805" r="190" fill="#7c3aed" opacity=".045"/>
<rect x="80" y="42" width="66" height="8" rx="4" fill="url(#brand)"/>
<text x="80" y="88" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#202a48">Type Urdu with your English keyboard</text>
<text x="80" y="122" font-family="Inter, Arial, sans-serif" font-size="18" fill="#5b647e">Type the phonetic keys · Typeoye maps each lowercase key to Urdu</text>
<rect x="80" y="150" width="1440" height="250" rx="24" fill="#fff" stroke="#e0e5f1" stroke-width="2" filter="url(#shadow)"/>
<rect x="80" y="150" width="1440" height="50" rx="24" fill="#202a48"/><rect x="80" y="177" width="1440" height="23" fill="#202a48"/>
<circle cx="111" cy="175" r="7" fill="#ff7d87"/><circle cx="137" cy="175" r="7" fill="#ffd166"/><circle cx="163" cy="175" r="7" fill="#65d6a6"/>
<text x="800" y="182" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" fill="#fff">Phonetic typing · English input → Urdu output</text>
<text x="175" y="234" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.2" fill="#737d96">TYPE THESE ENGLISH KEYS</text>
<text x="900" y="234" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.2" fill="#737d96">TYPEOYE OUTPUT</text>
{input_lines}
<path d="M760 282h76m-15-13 15 13-15 13" fill="none" stroke="url(#brand)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="80" y="417" width="1440" height="438" rx="24" fill="#e9edf7" stroke="#d9dfed" stroke-width="2"/>
<text x="800" y="414" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#59627c">NORMAL KEY MAPPINGS · LOWERCASE LETTERS AND PUNCTUATION</text>
{''.join(keyboard)}
<text x="800" y="879" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" fill="#69738d">Examples use direct letter mappings · Number keys pass through as 0–9 in Urdu Test and Practice</text>
</svg>'''

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(svg, encoding="utf-8")
    print(f"Generated {OUTPUT} ({OUTPUT.stat().st_size:,} bytes) from URDU_PHONETIC_MAP")


if __name__ == "__main__":
    main()
