export interface UrduConversionResult {
  text: string;
  cursor: number;
}

export class UrduConverter {
  insertText(text: string, cursor: number, selectionStart: number, selectionEnd: number, key: string): UrduConversionResult {
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    const urduChar = this.mapKey(key);
    const newText = text.substring(0, start) + urduChar + text.substring(end);
    const newCursor = start + urduChar.length;
    return { text: newText, cursor: newCursor };
  }

  handleKeyDown(text: string, cursor: number, selectionStart: number, selectionEnd: number, key: string): UrduConversionResult {
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    if (key === 'Backspace') {
      if (start !== end) {
        const newText = text.substring(0, start) + text.substring(end);
        return { text: newText, cursor: start };
      }
      if (cursor === 0) {
        return { text, cursor: 0 };
      }
      const newText = text.substring(0, cursor - 1) + text.substring(cursor);
      return { text: newText, cursor: cursor - 1 };
    }
    if (key === 'Delete') {
      if (start !== end) {
        const newText = text.substring(0, start) + text.substring(end);
        return { text: newText, cursor: start };
      }
      if (cursor >= text.length) {
        return { text, cursor };
      }
      const newText = text.substring(0, cursor) + text.substring(cursor + 1);
      return { text: newText, cursor };
    }
    if (key === 'ArrowLeft') {
      return { text, cursor: Math.max(0, cursor - 1) };
    }
    if (key === 'ArrowRight') {
      return { text, cursor: Math.min(text.length, cursor + 1) };
    }
    if (key === 'Home') {
      return { text, cursor: 0 };
    }
    if (key === 'End') {
      return { text, cursor: text.length };
    }
    if (key === 'Enter') {
      return { text: text + '\n', cursor: cursor + 1 };
    }
    if (key === 'Tab') {
      return { text, cursor };
    }
    if (key === 'Escape') {
      return { text, cursor };
    }
    return { text, cursor };
  }

  private mapKey(key: string): string {
    // Import dynamically not needed; inline simple map via require? but avoid. Use lookup.
    const map: Record<string, string> = (globalThis as any).__urduMap || this.buildMap();
    (globalThis as any).__urduMap = map;
    return map[key] || key;
  }

  private buildMap(): Record<string, string> {
    return {
      a: 'ا', b: 'ب', c: 'چ', d: 'د', e: 'ع', f: 'ف', g: 'گ', h: 'ح', i: 'ی', j: 'ج', k: 'ک', l: 'ل', m: 'م', n: 'ن', o: 'ہ', p: 'پ', q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'ء', v: 'ط', w: 'و', x: 'ش', y: 'ے', z: 'ز',
      A: 'آ', B: '.', C: 'ث', D: 'ڈ', E: 'ٰ', F: 'ّ', G: 'غ', H: 'ھ', I: 'ِ', J: 'ض', K: 'خ', L: 'ٔ', M: '٘', N: 'ں', O: 'ۃ', P: 'ُ', Q: 'ْ', R: 'ڑ', S: 'ص', T: 'ٹ', U: 'ئ', V: 'ظ', W: 'ّ', X: 'ژ', Y: 'َ', Z: 'ذ',
      ' ': ' ', '.': '۔', ',': '،', ';': '؛', ':': ':', '?': '؟', '!': '!', "'": "'", '"': '"', '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}', '-': '-', '_': '_', '+': '+', '=': '=', '/': '/', '\\': '\\', '|': '|', '': '', '~': '~', '<': '<', '>': '٫', '@': '@', '#': '#', '$': '$', '%': '%', '^': '^', '&': '&', '*': '*',
    };
  }
}

export const urduConverter = new UrduConverter();
