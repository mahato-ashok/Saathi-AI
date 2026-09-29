import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, X, Send, Bot, User,
  Minimize2, ChevronDown, AlertCircle, Activity,
  WifiOff, Loader2, Sparkles, Shield, HeartHandshake
} from 'lucide-react';
import { cx, getRiskLevel } from '../../utils/helpers';
import { saveState } from '../../data/seedData';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// API — call backend /chat endpoint
// ─────────────────────────────────────────────────────────────────────────────
async function callChatAPI(messages, userContext = '') {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
      user_context: userContext,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json(); // { reply, emotions, distress_signal }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION STORAGE — persist chat across page refreshes (session scope)
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_KEY = 'saathi-chat-msgs-v3';

function loadMessages() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); }
  catch { return []; }
}
function saveMessages(msgs) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs.slice(-60))); } catch { }
}

const GREETING = "Hello. I'm Saathi, your confidential wellness companion. I'm here to listen, offer supportive perspective, and help you reflect on how you're feeling today. How are things going?";

const SUGGESTED_PROMPTS = [
  "I'm feeling quite overwhelmed today",
  "Having trouble sleeping and focusing",
  "Could use a quick calming technique",
  "Just want to talk through some stress",
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SaathiChatbot({ state, setState }) {
  const { user } = useAuth();
  const currentName = user?.full_name || state?.profile?.name || 'Beneficiary';
  const currentCaseRef = state?.profile?.caseRef || state?.cases?.find(c => c.name === currentName)?.id || (user?.email === 'ananya@example.com' ? 'ST-1042' : 'ST-XXXX');

  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = loadMessages();
    return saved.length ? saved : [{ role: 'bot', text: GREETING, id: 'g0' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isCreditsError, setIsCreditsError] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemini 3.8 Flash');
  const [unread, setUnread] = useState(0);
  const [lastDistressSignal, setLastDistressSignal] = useState(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // unread badge
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setUnread(n => n + 1), 5000);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // persist
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // user context string for the system prompt
  const userContext = state
    ? `Beneficiary Name: ${currentName}. Case Ref: ${currentCaseRef}. User risk level: ${state.checkins?.[0]?.level || 'Unknown'}. Last distress score: ${state.checkins?.[0]?.score ?? 'N/A'}.`
    : `Beneficiary Name: ${currentName}.`;

  async function handleSend(textOverride) {
    const text = (textOverride || input).trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', text, id: `u-${Date.now()}` };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsBackendDown(false);
    setIsCreditsError(false);

    try {
      const data = await callChatAPI(newMessages, userContext);

      // Handle graceful rate-limit fallback from backend (not a 5xx)
      if (data.rate_limited) {
        setIsCreditsError(true);
      } else {
        setIsCreditsError(false);
      }

      const botMsg = {
        role: 'bot',
        text: data.reply,
        id: `b-${Date.now()}`,
        emotions: data.emotions,
        distressSignal: data.distress_signal,
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      // Crisis keyword detection
      const CRISIS_WORDS = ['suicide', 'kill myself', 'end my life', 'self harm', 'hurt myself', 'want to die', 'no reason to live'];
      if (CRISIS_WORDS.some(w => text.toLowerCase().includes(w))) setIsCrisis(true);

      // Update stress score using emotion from chat
      if (data.distress_signal != null && setState && state) {
        setLastDistressSignal(data.distress_signal);
        nudgeDistressScore(data.distress_signal, data.emotions);
      }

    } catch (err) {
      console.error('Chat API error:', err);
      const errMsg = err.message || '';
      const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('credit');
      const isNetworkError = errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('networkerror') || errMsg.includes('api error 5');

      setIsBackendDown(isNetworkError && !isRateLimit);
      setIsCreditsError(isRateLimit);

      setMessages(prev => [...prev, {
        role: 'bot',
        text: isRateLimit
          ? "Gemini API free-tier quota window reset in progress. Please wait ~30 seconds and try again."
          : "Unable to reach the BytePulse AI engine. Please verify the backend service is running.",
        id: `err-${Date.now()}`,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  function nudgeDistressScore(distressSignal, emotions) {
    try {
      const latest = state.checkins[0];
      if (!latest) return;

      const checkinBase = state.profile?.checkinBaseScore ?? latest.score;
      const chatEmotionScore = Math.min(100, Math.round(distressSignal * 2.5));
      const blendedScore = Math.min(100, Math.max(0,
        Math.round(0.70 * checkinBase + 0.30 * chatEmotionScore)
      ));

      const level = getRiskLevel(blendedScore);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

      const updatedCheckins = state.checkins.map((c, i) =>
        i === 0
          ? { ...c, score: blendedScore, level, chatUpdated: true, chatUpdatedAt: timeStr }
          : c
      );

      const prevScore = latest.score;
      const newTrend = blendedScore > prevScore + 5 ? 'rising'
        : blendedScore < prevScore - 5 ? 'falling'
          : 'stable';

      const updatedCases = state.cases.map(c =>
        (c.id !== currentCaseRef && c.name !== currentName) ? c
          : { ...c, id: currentCaseRef, name: currentName, score: blendedScore, risk: level, trend: newTrend, updated: 'Just now (Saathi Chat)' }
      );

      let updatedAlerts = [...state.alerts];
      if (level === 'High' && prevScore < 75) {
        updatedAlerts = [{
          id: `al-chat-${Date.now()}`,
          caseId: currentCaseRef,
          name: currentName,
          type: 'High distress (Saathi Chat)',
          severity: 'critical',
          message: `Saathi Chat emotion analysis indicates high distress for ${currentName}. Blended score: ${blendedScore} (check-in base: ${checkinBase}, chat signal: ${chatEmotionScore}).`,
          time: 'Just now',
          read: false,
        }, ...updatedAlerts];
      }

      const nextState = { ...state, checkins: updatedCheckins, cases: updatedCases, alerts: updatedAlerts };
      setState(nextState);
      saveState(nextState, user?.email);
    } catch (e) { console.error('Distress nudge error:', e); }
  }

  const currentScore = state?.checkins?.[0]?.score;

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      <button
        id="saathi-chatbot-launcher"
        onClick={() => { setOpen(o => !o); setMinimised(false); }}
        aria-label="Open Saathi chat"
        className={cx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-200 active:scale-95 cursor-pointer',
          open
            ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20'
            : 'bg-teal-700 hover:bg-teal-800 shadow-teal-900/25 hover:shadow-2xl'
        )}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span>{open ? 'Close Chat' : 'Chat with Saathi'}</span>

        {!open && unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div
          id="saathi-chatbot-window"
          className={cx(
            'fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all duration-200 overflow-hidden',
            'w-[390px] max-w-[calc(100vw-2rem)]',
            minimised ? 'h-14' : 'h-[580px] max-h-[85vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-teal-800 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-teal-700/80 text-teal-100">
                <Bot size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight">Saathi AI</span>
                  <span className="flex items-center gap-1 text-[10px] text-teal-200/90 font-mono">
                    <span className={cx('size-1.5 rounded-full', isBackendDown ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse')} />
                    {isBackendDown ? 'Offline' : 'Online'}
                  </span>
                </div>
                <div className="text-[10px] text-teal-200/70">
                  {activeModel || 'Gemini 3.8 Flash'} · Clinical Companion
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {currentScore != null && (
                <div className="flex items-center gap-1.5 rounded-full bg-teal-900/60 border border-teal-700/60 px-2.5 py-0.5 text-[11px] font-mono font-medium text-teal-100 mr-1">
                  <Activity size={11} className="text-teal-300" />
                  <span>Score: {currentScore}</span>
                </div>
              )}
              <button
                onClick={() => setMinimised(m => !m)}
                className="grid size-7 place-items-center rounded-md text-teal-200 hover:bg-teal-700/60 hover:text-white transition cursor-pointer"
                title={minimised ? 'Maximize' : 'Minimize'}
              >
                {minimised ? <ChevronDown size={14} className="rotate-180" /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-md text-teal-200 hover:bg-teal-700/60 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages Area */}
              <div
                id="chatbot-messages"
                className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50"
              >
                {/* Clinical privacy notice */}
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 text-[11px] text-slate-500 shadow-xs">
                  <Shield size={14} className="text-teal-600 shrink-0" />
                  <span>Confidential distress support. Monitored for emotional risk patterns.</span>
                </div>

                {messages.map(msg => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2">
                    <div className="grid size-7 place-items-center rounded-full bg-teal-700 text-white shrink-0">
                      <Bot size={13} />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-slate-200/80 px-3.5 py-2.5">
                      <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1.5 rounded-full bg-slate-500 animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Crisis alert banner */}
              {isCrisis && (
                <div className="border-t border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-600 shrink-0" />
                    <span>Crisis Helpline: <strong>14416</strong> (Tele-MANAS)</span>
                  </div>
                  <a href="tel:14416" className="text-[11px] font-bold text-rose-700 underline">
                    Call Now
                  </a>
                </div>
              )}

              {/* Status warnings */}
              {isBackendDown && (
                <div className="border-t border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-800 flex items-center gap-2 shrink-0">
                  <WifiOff size={13} className="text-amber-600 shrink-0" />
                  <span>BytePulse engine offline. Please start the backend service.</span>
                </div>
              )}
              {isCreditsError && (
                <div className="border-t border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-800 flex items-center gap-2 shrink-0">
                  <AlertCircle size={13} className="text-amber-600 shrink-0" />
                  <span>Gemini quota pause (~30s). Please wait a moment.</span>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-slate-200 bg-white p-3 shrink-0">
                {/* Suggested prompt chips */}
                {messages.length <= 1 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {SUGGESTED_PROMPTS.map(p => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        className="rounded-full border border-teal-200/90 bg-teal-50/80 px-2.5 py-1 text-[11px] font-medium text-teal-800 hover:bg-teal-100 transition cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Share how you're feeling…"
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition max-h-24"
                  />
                  <button
                    id="chatbot-send-btn"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className={cx(
                      'grid size-9 shrink-0 place-items-center rounded-xl transition cursor-pointer',
                      input.trim() && !isLoading
                        ? 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-default'
                    )}
                    aria-label="Send"
                  >
                    {isLoading ? (
                      <Loader2 size={15} className="animate-spin text-slate-500" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isBot = msg.role === 'bot';

  return (
    <div
      className={cx(
        'flex items-end gap-2 text-xs sm:text-sm',
        isBot ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {isBot ? (
        <div className="grid size-7 place-items-center rounded-full bg-teal-700 text-white shrink-0 shadow-xs">
          <Bot size={13} />
        </div>
      ) : (
        <div className="grid size-7 place-items-center rounded-full bg-slate-200 text-slate-600 shrink-0">
          <User size={13} />
        </div>
      )}

      <div
        className={cx(
          'max-w-[82%] rounded-2xl p-3 leading-relaxed',
          isBot
            ? msg.isError
              ? 'rounded-bl-xs bg-amber-50 text-amber-900 border border-amber-200'
              : 'rounded-bl-xs bg-white text-slate-800 border border-slate-200/90 shadow-xs'
            : 'rounded-br-xs bg-teal-700 text-white shadow-xs'
        )}
      >
        <FormattedText text={msg.text} />

        {/* Emotion signals if available */}
        {msg.emotions && Object.keys(msg.emotions).length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
            {Object.entries(msg.emotions).slice(0, 3).map(([emotion, val]) => (
              <span
                key={emotion}
                className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize"
              >
                {emotion}: {Math.round(val * 100)}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedText({ text }) {
  const parts = (text || '').split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-line">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
