"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStageTimer } from "@/hooks/useStageTimer";
import { useWakeLock } from "@/hooks/useWakeLock";
import { Maximize2, Minimize2, Settings, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

function formatTime(totalSeconds: number): { minutes: string; seconds: string; isNegative: boolean } {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  return {
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    isNegative,
  };
}

function StageVisorContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "palestra-01";

  const { isConnected, roomState, displaySeconds, isFlashing } = useStageTimer(room);
  const { isLocked, isSupported } = useWakeLock(true);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Toggle Fullscreen nativo
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn("Fullscreen request error:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn("Exit fullscreen error:", err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Determinação das cores de alerta:
  // - Vermelho piscando quando zerado (00:00)
  // - Amarelo nos últimos 2 minutos (<= 120s e > 0)
  // - Branco no tempo normal (> 120s)
  const isZero = displaySeconds === 0;
  const isWarning = displaySeconds <= 120 && displaySeconds > 0;

  let timerColorClass = "text-white";
  let bgAlertClass = "bg-black";

  if (isZero) {
    timerColorClass = "text-red-500 animate-pulse-fast";
    bgAlertClass = "bg-red-950/20";
  } else if (isWarning) {
    timerColorClass = "text-yellow-400";
    bgAlertClass = "bg-black";
  }

  const { minutes, seconds, isNegative } = formatTime(displaySeconds);

  return (
    <main
      className={`relative w-screen h-screen ${bgAlertClass} overflow-hidden flex flex-col items-center justify-center select-none transition-colors duration-500`}
      onMouseMove={() => {
        setShowControls(true);
        const timer = setTimeout(() => setShowControls(false), 3500);
        return () => clearTimeout(timer);
      }}
      onClick={() => setShowControls((prev) => !prev)}
    >
      {/* Efeito de Flash (Atenção disparado pelo controle) */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white/90 z-50 pointer-events-none animate-flash" />
      )}

      {/* Barra superior de status sutil */}
      <header
        className={`absolute top-0 inset-x-0 p-4 md:p-6 flex items-center justify-between text-neutral-500 text-xs md:text-sm transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-20 hover:opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Status de conexão */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-neutral-300 font-mono text-xs">Conectado</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-mono text-xs">Reconectando...</span>
              </>
            )}
          </div>

          {/* Nome da Sala */}
          <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider">
            Sala: {room}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status do Screen Wake Lock */}
          {isSupported && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                isLocked
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                  : "bg-neutral-900 border-neutral-800 text-neutral-500"
              }`}
              title={isLocked ? "Wake Lock Ativo: Tela não irá apagar" : "Wake Lock Inativo"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tela Ativa</span>
            </div>
          )}

          {/* Botão de Tela Cheia */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Atalho para Controle */}
          <Link
            href={`/control?room=${encodeURIComponent(room)}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Abrir Painel de Controle"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* NÚMEROS ULTRA-GRANDES DO CRONÔMETRO */}
      <div className="w-full flex items-center justify-center flex-1">
        <div
          className={`font-mono font-black tabular-nums tracking-tighter text-center select-none ${timerColorClass} transition-colors duration-300`}
          style={{
            fontSize: "clamp(4rem, 28vw, 36rem)",
            lineHeight: 0.9,
          }}
        >
          {isNegative && "-"}
          {minutes}:{seconds}
        </div>
      </div>

      {/* Mensagem customizada do organizador (se houver) */}
      {roomState.message && (
        <div className="absolute bottom-16 inset-x-8 flex justify-center z-20">
          <div className="bg-yellow-400 text-black font-black uppercase text-xl md:text-3xl px-8 py-3 rounded-2xl shadow-2xl border-4 border-yellow-300 tracking-wider animate-bounce">
            {roomState.message}
          </div>
        </div>
      )}

      {/* Barra de rodapé sutil indicando estado */}
      <footer
        className={`absolute bottom-3 inset-x-0 flex justify-center text-neutral-600 text-xs font-mono uppercase tracking-widest transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-10"
        }`}
      >
        <span>
          {roomState.status === "running" && "Palestra em andamento"}
          {roomState.status === "paused" && "Pausado"}
          {roomState.status === "idle" && "Aguardando início"}
          {roomState.status === "ended" && "Tempo Encerrado"}
        </span>
      </footer>
    </main>
  );
}

export default function StageVisorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center text-white font-mono text-2xl">
          00:00
        </div>
      }
    >
      <StageVisorContent />
    </Suspense>
  );
}
