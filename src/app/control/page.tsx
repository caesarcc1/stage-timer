"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStageTimer } from "@/hooks/useStageTimer";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Bell,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Clock,
} from "lucide-react";
import Link from "next/link";

function formatTime(totalSeconds: number): string {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  return `${isNegative ? "-" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PRESETS = [
  { label: "15 min", seconds: 15 * 60 },
  { label: "20 min", seconds: 20 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "60 min", seconds: 60 * 60 },
];

function StageControlContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentRoom = searchParams.get("room") || "palestra-01";
  const [roomInput, setRoomInput] = useState<string>(currentRoom);

  const {
    isConnected,
    roomState,
    displaySeconds,
    start,
    pause,
    reset,
    setTime,
    adjustTime,
    flash,
    setMessage,
  } = useStageTimer(currentRoom);

  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [customMsgInput, setCustomMsgInput] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    setRoomInput(currentRoom);
  }, [currentRoom]);

  const handleRoomChange = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomInput.trim().toLowerCase() || "palestra-01";
    router.push(`/control?room=${encodeURIComponent(clean)}`);
  };

  const handleCopyVisorLink = async () => {
    if (typeof window !== "undefined") {
      const visorUrl = `${window.location.origin}/?room=${encodeURIComponent(currentRoom)}`;
      try {
        await navigator.clipboard.writeText(visorUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        console.warn("Clipboard error:", err);
      }
    }
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      setTime(Math.round(mins * 60));
      setCustomMinutes("");
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(customMsgInput);
  };

  const isRunning = roomState.status === "running";
  const isWarning = displaySeconds <= 120 && displaySeconds > 0;
  const isZero = displaySeconds === 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col max-w-md mx-auto p-4 pb-12 font-sans selection:bg-neutral-800">
      {/* Top Header: Conexão e Sala */}
      <header className="flex items-center justify-between py-2 border-b border-neutral-800/80 mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Controle do Palco
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border ${
              isConnected
                ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-400"
                : "bg-red-950/50 border-red-800/50 text-red-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-400 animate-ping" : "bg-red-500"
              }`}
            />
            {isConnected ? "Conectado" : "Reconectando"}
          </div>

          <Link
            href={`/?room=${encodeURIComponent(currentRoom)}`}
            target="_blank"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Abrir Visor em nova aba"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Seleção de Sala & Compartilhar Link */}
      <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-3 mb-4 flex flex-col gap-2">
        <form onSubmit={handleRoomChange} className="flex gap-2 items-center">
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Nome da sala..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Trocar
          </button>
        </form>

        <button
          onClick={handleCopyVisorLink}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/40 text-xs text-neutral-300 font-medium transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link do visor copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar link do visor do palco</span>
            </>
          )}
        </button>
      </section>

      {/* DISPLAY SINCRONIZADO EM TEMPO REAL */}
      <section
        className={`rounded-3xl border p-6 mb-4 flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
          isZero
            ? "bg-red-950/40 border-red-800 text-red-500"
            : isWarning
            ? "bg-yellow-950/20 border-yellow-800/40 text-yellow-400"
            : "bg-neutral-900/90 border-neutral-800 text-white"
        }`}
      >
        <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Tempo Restante no Palco
        </div>

        <div className="font-mono font-black tabular-nums text-6xl md:text-7xl tracking-tighter my-2">
          {formatTime(displaySeconds)}
        </div>

        {/* Status atual */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold font-mono ${
              roomState.status === "running"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : roomState.status === "paused"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : roomState.status === "ended"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {roomState.status === "running" && "Em Execução"}
            {roomState.status === "paused" && "Pausado"}
            {roomState.status === "idle" && "Parado"}
            {roomState.status === "ended" && "Encerrado"}
          </span>

          <span className="text-xs text-neutral-500 font-mono">
            Total: {Math.round(roomState.totalSeconds / 60)} min
          </span>
        </div>
      </section>

      {/* BOTÕES PRINCIPAIS DE CONTROLE: PLAY / PAUSE / RESET */}
      <section className="grid grid-cols-3 gap-3 mb-4">
        {isRunning ? (
          <button
            onClick={pause}
            className="col-span-2 py-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform"
          >
            <Pause className="w-6 h-6 fill-current" />
            Pausar
          </button>
        ) : (
          <button
            onClick={start}
            className="col-span-2 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform"
          >
            <Play className="w-6 h-6 fill-current" />
            Iniciar
          </button>
        )}

        <button
          onClick={() => reset()}
          className="col-span-1 py-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] border border-neutral-800 text-neutral-300 hover:text-white font-bold text-sm flex flex-col items-center justify-center gap-1 transition-transform"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </section>

      {/* AJUSTES RÁPIDOS: +1 MIN, -1 MIN, +5 MIN, -5 MIN */}
      <section className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => adjustTime(-300)}
          className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-sm flex items-center justify-center gap-0.5 active:scale-95"
        >
          <Minus className="w-3 h-3" /> 5m
        </button>
        <button
          onClick={() => adjustTime(-60)}
          className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-sm flex items-center justify-center gap-0.5 active:scale-95"
        >
          <Minus className="w-3 h-3" /> 1m
        </button>
        <button
          onClick={() => adjustTime(60)}
          className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-sm flex items-center justify-center gap-0.5 active:scale-95"
        >
          <Plus className="w-3 h-3" /> 1m
        </button>
        <button
          onClick={() => adjustTime(300)}
          className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-sm flex items-center justify-center gap-0.5 active:scale-95"
        >
          <Plus className="w-3 h-3" /> 5m
        </button>
      </section>

      {/* PRESETS RÁPIDOS DE TEMPO */}
      <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Presets Rápidos de Palestra
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setTime(preset.seconds);
              }}
              className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-colors active:scale-95 ${
                roomState.totalSeconds === preset.seconds
                  ? "bg-white text-black font-black"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Minutos personalizados */}
        <form onSubmit={handleCustomTimeSubmit} className="flex gap-2 mt-3 pt-3 border-t border-neutral-800/60">
          <input
            type="number"
            step="1"
            min="1"
            max="300"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutos customizados (ex: 25)"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Definir
          </button>
        </form>
      </section>

      {/* ALERTAS & MENSAGEM PARA O PALCO */}
      <section className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Avisos para o Palestrante
          </h3>

          <button
            onClick={flash}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold active:scale-95 transition-transform"
          >
            <Bell className="w-3.5 h-3.5" />
            Piscar Tela
          </button>
        </div>

        {/* Mensagem na tela do palco */}
        <form onSubmit={handleMessageSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={customMsgInput}
              onChange={(e) => setCustomMsgInput(e.target.value)}
              placeholder="Ex: 5 MINUTOS RESTANTES, ENCERRAR..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Enviar
            </button>
          </div>

          {roomState.message && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-950/30 border border-yellow-800/40 text-yellow-400 text-xs">
              <span className="truncate">
                Visível no palco: <strong>&quot;{roomState.message}&quot;</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setCustomMsgInput("");
                }}
                className="underline text-[10px] text-yellow-300 ml-2"
              >
                Limpar
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

export default function StageControlPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center font-mono">
          Carregando controle...
        </div>
      }
    >
      <StageControlContent />
    </Suspense>
  );
}
