import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { WordState, CharState, TypingPhase, EngineResult } from '../types';
import { computeWpm, computeAccuracy } from '../utils/wpm';

function buildWordStates(text: string): WordState[] {
  return text.trim().split(/\s+/).filter(Boolean).map((word) => ({
    word,
    typed: '',
    status: 'pending' as const,
    chars: word.split('').map((char) => ({ char, status: 'pending' as const })),
  }));
}

function charStates(word: string, typed: string, active: boolean): CharState[] {
  const result: CharState[] = [];
  for (let i = 0; i < Math.max(word.length, typed.length); i++) {
    if (i >= word.length) {
      result.push({ char: typed[i], status: 'extra' });
    } else if (typed[i] === undefined) {
      result.push({ char: word[i], status: active && i === typed.length ? 'current' : 'pending' });
    } else {
      result.push({ char: word[i], status: typed[i] === word[i] ? 'correct' : 'error' });
    }
  }
  return result;
}

function markActive(words: WordState[], index: number): WordState[] {
  if (!words[index]) return words;
  const updated = [...words];
  const active = { ...updated[index], status: 'active' as const };
  active.chars = charStates(active.word, '', true);
  updated[index] = active;
  return updated;
}

interface State {
  phase: TypingPhase;
  wordStates: WordState[];
  currentWordIndex: number;
  currentInput: string;
  liveWpm: number;
  liveAccuracy: number;
  elapsed: number;
  startTime: number | null;
  correctWordsCount: number;
  attemptedWordsCount: number;
  errorOccurred: boolean;
  errorWordIndex: number;
}

type Action =
  | { type: 'KEY'; key: string; now: number }
  | { type: 'TICK'; elapsed: number }
  | { type: 'FINISH'; elapsed: number; error?: boolean; errorWordIndex?: number }
  | { type: 'RESET'; words: WordState[] };

function computeStats(correct: number, attempted: number, elapsed: number) {
  return {
    liveWpm: computeWpm(correct, elapsed),
    liveAccuracy: computeAccuracy(correct, attempted),
  };
}

function reducer(state: State, action: Action): State {
  if (action.type === 'RESET') {
    return {
      phase: 'idle',
      wordStates: action.words,
      currentWordIndex: 0,
      currentInput: '',
      liveWpm: 0,
      liveAccuracy: 100,
      elapsed: 0,
      startTime: null,
      correctWordsCount: 0,
      attemptedWordsCount: 0,
      errorOccurred: false,
      errorWordIndex: -1,
    };
  }
  if (action.type === 'TICK') {
    return state.phase === 'running'
      ? { ...state, elapsed: action.elapsed, ...computeStats(state.correctWordsCount, state.attemptedWordsCount, action.elapsed) }
      : state;
  }
  if (action.type === 'FINISH') {
    if (state.phase === 'finished') return state;
    return {
      ...state,
      phase: 'finished',
      elapsed: action.elapsed,
      errorOccurred: action.error ?? false,
      errorWordIndex: action.errorWordIndex ?? -1,
      ...computeStats(state.correctWordsCount, state.attemptedWordsCount, action.elapsed),
    };
  }
  // KEY
  if (state.phase === 'finished' || !state.wordStates[state.currentWordIndex]) return state;
  const now = action.now;
  const startTime = state.startTime ?? now;
  const phase: TypingPhase = state.phase === 'idle' ? 'running' : state.phase;
  const elapsed = (now - startTime) / 1000;

  if (action.key === 'Backspace') {
    if (!state.currentInput) return { ...state, phase, startTime };
    const currentInput = state.currentInput.slice(0, -1);
    const wordStates = [...state.wordStates];
    const word = { ...wordStates[state.currentWordIndex], typed: currentInput };
    word.chars = charStates(word.word, currentInput, true);
    wordStates[state.currentWordIndex] = word;
    return { ...state, phase, startTime, currentInput, wordStates, elapsed, ...computeStats(state.correctWordsCount, state.attemptedWordsCount, elapsed) };
  }

  if (action.key === ' ') {
    // Commit current word — if incorrect, this is the error that ends the game
    if (!state.currentInput) return state;
    const wordStates = [...state.wordStates];
    const completed = { ...wordStates[state.currentWordIndex] };
    const correct = completed.word === state.currentInput;
    completed.typed = state.currentInput;
    completed.status = correct ? 'correct' : 'error';
    completed.timeTakenMs = completed.startTime ? now - completed.startTime : 0;
    completed.chars = charStates(completed.word, state.currentInput, false);
    wordStates[state.currentWordIndex] = completed;

    if (!correct) {
      // Error on commit — end the game
      return {
        ...state,
        phase: 'finished',
        wordStates,
        currentInput: '',
        startTime,
        elapsed,
        errorOccurred: true,
        errorWordIndex: state.currentWordIndex,
        attemptedWordsCount: state.attemptedWordsCount + 1,
        ...computeStats(state.correctWordsCount, state.attemptedWordsCount + 1, elapsed),
      };
    }

    const correctWordsCount = state.correctWordsCount + 1;
    const attemptedWordsCount = state.attemptedWordsCount + 1;
    const nextIndex = state.currentWordIndex + 1;

    if (nextIndex >= wordStates.length) {
      return {
        ...state,
        phase: 'finished',
        wordStates,
        currentWordIndex: nextIndex,
        currentInput: '',
        startTime,
        elapsed,
        correctWordsCount,
        attemptedWordsCount,
        ...computeStats(correctWordsCount, attemptedWordsCount, elapsed),
      };
    }

    const next = markActive(wordStates, nextIndex);
    return {
      ...state,
      phase,
      wordStates: next,
      currentWordIndex: nextIndex,
      currentInput: '',
      startTime,
      elapsed,
      correctWordsCount,
      attemptedWordsCount,
      ...computeStats(correctWordsCount, attemptedWordsCount, elapsed),
    };
  }

  if (action.key.length !== 1) return state;

  const currentInput = state.currentInput + action.key;
  const wordStates = [...state.wordStates];
  const active = { ...wordStates[state.currentWordIndex], status: 'active' as const, startTime: wordStates[state.currentWordIndex].startTime ?? now, typed: currentInput };
  active.chars = charStates(active.word, currentInput, true);
  wordStates[state.currentWordIndex] = active;
  return { ...state, phase, startTime, currentInput, wordStates, elapsed, ...computeStats(state.correctWordsCount, state.attemptedWordsCount, elapsed) };
}

interface Options {
  text: string;
  onComplete: (result: EngineResult) => void;
}

interface Return {
  phase: TypingPhase;
  wordStates: WordState[];
  currentWordIndex: number;
  liveWpm: number;
  liveAccuracy: number;
  elapsed: number;
  correctWordsCount: number;
  errorOccurred: boolean;
  errorWordIndex: number;
  resetEngine: (text?: string) => void;
}

export function useAccuracyEngine({ text, onComplete }: Options): Return {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: 'idle' as TypingPhase,
    wordStates: markActive(buildWordStates(text), 0),
    currentWordIndex: 0,
    currentInput: '',
    liveWpm: 0,
    liveAccuracy: 100,
    elapsed: 0,
    startTime: null,
    correctWordsCount: 0,
    attemptedWordsCount: 0,
    errorOccurred: false,
    errorWordIndex: -1,
  }));

  const ref = useRef(state);
  ref.current = state;
  const done = useRef(onComplete);
  done.current = onComplete;
  const previous = useRef(text);

  useEffect(() => {
    if (text !== previous.current) {
      previous.current = text;
      handled.current = false;
      dispatch({ type: 'RESET', words: markActive(buildWordStates(text), 0) });
    }
  }, [text]);

  // Tick timer
  useEffect(() => {
    if (state.phase !== 'running' || !state.startTime) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - ref.current.startTime!) / 1000;
      dispatch({ type: 'TICK', elapsed });
    }, 100);
    return () => window.clearInterval(id);
  }, [state.phase, state.startTime]);

  // Keyboard listener
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
      if (event.key === ' ' || event.key === 'Backspace') event.preventDefault();
      dispatch({ type: 'KEY', key: event.key, now: Date.now() });
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // Fire onComplete once on finish
  const handled = useRef(false);
  useEffect(() => {
    if (state.phase !== 'finished' || handled.current) return;
    handled.current = true;
    const completed = state.wordStates
      .filter((w) => w.status === 'correct' || w.status === 'error')
      .map((w) => ({ word: w.word, typed: w.typed, correct: w.word === w.typed, timeTakenMs: w.timeTakenMs ?? 0 }));
    const start = state.startTime ?? Date.now();
    done.current({
      typedWords: completed,
      durationSeconds: state.elapsed,
      startTime: new Date(start).toISOString(),
      endTime: new Date(start + state.elapsed * 1000).toISOString(),
      clientWpm: computeWpm(completed.filter((w) => w.correct).length, state.elapsed),
      clientAccuracy: computeAccuracy(completed.filter((w) => w.correct).length, completed.length),
    });
  }, [state]);

  const resetEngine = useCallback(
    (nextText?: string) => {
      handled.current = false;
      dispatch({ type: 'RESET', words: markActive(buildWordStates(nextText ?? text), 0) });
    },
    [text],
  );

  return {
    phase: state.phase,
    wordStates: state.wordStates,
    currentWordIndex: state.currentWordIndex,
    liveWpm: state.liveWpm,
    liveAccuracy: state.liveAccuracy,
    elapsed: state.elapsed,
    correctWordsCount: state.correctWordsCount,
    errorOccurred: state.errorOccurred,
    errorWordIndex: state.errorWordIndex,
    resetEngine,
  };
}
