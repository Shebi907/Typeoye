import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Minimize2, Smile, Zap, Sticker, Send, X } from 'lucide-react';
import type { ChallengePlayerView } from '../../types/challenge';
import type { ChallengeChatMessage } from '../../types/chat';
import { CHAT_EMOJIS, CHAT_QUICK_REACTIONS, CHAT_STICKERS, ChallengeSticker } from '../../data/challengeChat';
import { challengeService } from '../../services/challenge.service';
import { getSocket, on, off, emit } from '../../services/challenge.socket';
import '../../styles/challenge-chat.css';

const CHAT_MAX_LENGTH = 300;

interface Floater {
  id: number;
  emoji: string;
}

interface ChallengeChatProps {
  code: string;
  round: number;
  me: ChallengePlayerView | null;
  opponent: ChallengePlayerView | null;
}

function onlineLabel(opponent: ChallengePlayerView | null): string {
  return opponent ? (opponent.connected ? 'Online' : 'Offline') : 'Waiting for opponent…';
}

export function ChallengeChat({ code, round, me, opponent }: ChallengeChatProps) {
  const [open, setOpen] = useState<boolean>(() => window.matchMedia('(min-width: 1024px)').matches);
  const [messages, setMessages] = useState<ChallengeChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [picker, setPicker] = useState<'emoji' | 'quick' | 'stickers' | null>(null);
  const [unread, setUnread] = useState(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);

  const roundRef = useRef(round);
  const openRef = useRef(open);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const loadSeqRef = useRef(0);
  const floaterIdRef = useRef(0);
  const mountedRef = useRef(true);

  roundRef.current = round;
  openRef.current = open;

  const myId = me?.userId ?? '';
  // Messages are only allowed while a real, connected opponent is seated — the
  // sender must never be the recipient's own slot. The parent unmounts the
  // widget when this is false; this guard is a second line of defense.
  const canSend = Boolean(
    code && round && opponent && opponent.connected && opponent.userId !== myId && getSocket()?.connected
  );

  function spawnFloater(emoji: string) {
    if (!mountedRef.current) return;
    const id = ++floaterIdRef.current;
    setFloaters((prev) => [...prev.slice(-5), { id, emoji }]);
    window.setTimeout(() => {
      if (mountedRef.current) setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1500);
  }

  const appendMessage = useCallback((msg: ChallengeChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  /* Incoming messages: the server broadcasts to the room except the sender, so
     everything the client receives here is an OPPONENT message (or our own from
     another tab). Round-scoped server-side; double-guard client-side so a late
     delivery from a previous round never leaks into the current one. */
  useEffect(() => {
    const handler = (msg: ChallengeChatMessage) => {
      if (!msg || typeof msg !== 'object') return;
      if (roundRef.current != null && msg.round !== roundRef.current) return;
      appendMessage(msg);
      if (msg.type !== 'text') spawnFloater(msg.type === 'sticker' ? stickerEmoji(msg.message) : msg.message);
      if (!openRef.current) setUnread((u) => u + 1);
    };
    on('challenge:chat', handler);
    return () => off('challenge:chat', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendMessage]);

  /* History reload + cleanup on every round change (rematch). */
  useEffect(() => {
    roundRef.current = round;
    const seq = ++loadSeqRef.current;
    setMessages([]);
    setUnread(0);
    setFloaters([]);
    if (!code || !round) return;
    challengeService
      .messages(code, round)
      .then((history) => {
        if (seq === loadSeqRef.current) setMessages(history);
      })
      .catch(() => {
        // history is best-effort; live socket messages carry the conversation
      });
  }, [code, round]);

  /* Reset the unread badge whenever the panel is opened. */
  useEffect(() => {
    if (open) {
      setUnread(0);
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      }, 30);
    }
  }, [open]);

  /* Stay pinned to the latest message while the panel is open. */
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, open]);

  function returnToEngine() {
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function send(type: 'text' | 'reaction' | 'sticker', content: string) {
    if (!opponent || !opponent.connected || opponent.userId === myId) {
      setSendError('No opponent is connected to this challenge.');
      return;
    }
    if (!canSend) {
      setSendError('Socket not connected.');
      return;
    }
    emit('challenge:chat', { code, round, type, message: content }, (res) => {
      const response = res as { ok?: boolean; error?: string; message?: ChallengeChatMessage };
      if (response?.ok && response.message) {
        appendMessage(response.message);
        if (type !== 'text') spawnFloater(type === 'sticker' ? stickerEmoji(content) : content);
        setSendError(null);
      } else {
        setSendError(response?.error ?? 'Could not send message.');
      }
    });
  }

  function sendText() {
    const text = draft.trim();
    if (!text) return;
    send('text', text);
    setDraft('');
    setPicker(null);
    returnToEngine();
  }

  function insertEmoji(emoji: string) {
    setDraft((prev) => (prev + emoji).slice(0, CHAT_MAX_LENGTH));
    inputRef.current?.focus();
  }

  function sendSticker(sticker: ChallengeSticker) {
    send('sticker', sticker.id);
    setPicker(null);
    returnToEngine();
  }

  /* Sticker packs referenced by id from broadcast payloads. */
  function stickerEmoji(id: string): string {
    return CHAT_STICKERS.find((s) => s.id === id)?.emoji ?? '🎨';
  }

  function stickerLabel(id: string): string {
    return CHAT_STICKERS.find((s) => s.id === id)?.label ?? '';
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.stopPropagation()}
        className="chat-pill"
        aria-label="Open challenge chat"
        title="Challenge chat"
      >
        <MessageSquare size={20} strokeWidth={2.4} />
        {unread > 0 && <span className="chat-unread-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
    );
  }

  return (
    <section
      className="chat-panel"
      onKeyDown={(e) => e.stopPropagation()}
      aria-label="Challenge chat"
    >
      <header className="chat-header" onKeyDown={(e) => e.stopPropagation()}>
        <div className="chat-header-brand">
          <span className="chat-header-icon">
            <MessageSquare size={15} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="chat-header-title">Challenge Chat</p>
            <p className="chat-header-sub">
              <span className={`chat-online-dot ${opponent?.connected ? 'chat-online-dot--on' : ''}`} />
              {opponent ? `${opponent.username} · ${onlineLabel(opponent)}` : onlineLabel(opponent)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chat-round-chip">#{round}</span>
          <button
            type="button"
            className="chat-icon-btn"
            onClick={() => {
              setOpen(false);
              returnToEngine();
            }}
            aria-label="Minimize chat"
          >
            <Minimize2 size={15} />
          </button>
        </div>
      </header>

      <div className="chat-floaters" aria-hidden="true">
        {floaters.map((f) => (
          <span key={f.id} className="chat-floater">
            {f.emoji}
          </span>
        ))}
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet — say hi to {opponent?.username ?? 'your opponent'} 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.senderId === myId;
          if (msg.type === 'sticker') {
            return (
              <div key={msg.id} className={`chat-sticker-row ${mine ? 'chat-sticker-row--own' : ''}`}>
                <div className={`chat-sticker ${mine ? 'chat-sticker--own' : ''}`}>
                  <span className="chat-sticker-emoji">{stickerEmoji(msg.message)}</span>
                  <span className="chat-sticker-label">{stickerLabel(msg.message)}</span>
                </div>
              </div>
            );
          }
          if (msg.type === 'reaction') {
            return (
              <div key={msg.id} className={`chat-reaction-row ${mine ? 'chat-reaction-row--own' : ''}`}>
                <span className="chat-reaction-bubble" title={`${mine ? 'You' : opponent?.username ?? 'Opponent'} reacted`}>
                  {msg.message}
                </span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`chat-msg-row ${mine ? 'chat-msg-row--own' : ''}`}>
              <div className={`chat-bubble ${mine ? 'chat-bubble--own' : ''}`}>
                {!mine && <span className="chat-bubble-sender">{opponent?.username ?? 'Opponent'}</span>}
                <span className="chat-bubble-text">{msg.message}</span>
              </div>
            </div>
          );
        })}
      </div>

      {sendError && (
        <p className="chat-send-error">
          <X size={12} /> {sendError}
        </p>
      )}

      {picker && (
        <div className="chat-picker">
          {picker === 'emoji' && (
            <div className="chat-picker-grid chat-picker-grid--emoji">
              {CHAT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="chat-emoji-cell"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {picker === 'quick' && (
            <div className="chat-picker-grid chat-picker-grid--emoji">
              {CHAT_QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="chat-emoji-cell"
                  title="Send instantly"
                  onClick={() => {
                    send('reaction', emoji);
                    setPicker(null);
                    returnToEngine();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {picker === 'stickers' && (
            <div className="chat-sticker-grid">
              {CHAT_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className="chat-sticker-picker"
                  onClick={() => sendSticker(sticker)}
                >
                  <span className="chat-sticker-picker-emoji">{sticker.emoji}</span>
                  <span className="chat-sticker-picker-label">{sticker.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="chat-composer">
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          maxLength={CHAT_MAX_LENGTH}
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendText();
            }
          }}
        />
        <div className="chat-toolbar">
          <button
            type="button"
            className={`chat-tool-btn ${picker === 'emoji' ? 'chat-tool-btn--active' : ''}`}
            onClick={() => {
              setPicker((p) => (p === 'emoji' ? null : 'emoji'));
              inputRef.current?.focus();
            }}
            aria-label="Emoji picker"
            title="Emoji"
          >
            <Smile size={17} />
          </button>
          <button
            type="button"
            className={`chat-tool-btn ${picker === 'quick' ? 'chat-tool-btn--active' : ''}`}
            onClick={() => {
              setPicker((p) => (p === 'quick' ? null : 'quick'));
              inputRef.current?.focus();
            }}
            aria-label="Quick reactions"
            title="Quick reactions"
          >
            <Zap size={17} />
          </button>
          <button
            type="button"
            className={`chat-tool-btn ${picker === 'stickers' ? 'chat-tool-btn--active' : ''}`}
            onClick={() => {
              setPicker((p) => (p === 'stickers' ? null : 'stickers'));
              inputRef.current?.focus();
            }}
            aria-label="Sticker picker"
            title="Stickers"
          >
            <Sticker size={17} />
          </button>
          <button
            type="button"
            className="chat-send-btn"
            onClick={sendText}
            disabled={!draft.trim()}
            aria-label="Send message"
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}

export default ChallengeChat;