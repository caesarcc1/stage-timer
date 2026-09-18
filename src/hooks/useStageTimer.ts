"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";

export type TimerStatus = "idle" | "running" | "paused" | "ended";

export interface RoomState {
  room: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  endAt: number | null;
  message?: string;
  updatedAt: number;
}

export function useStageTimer(roomName: string = "palestra-01") {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomState>({
    room: roomName,
    totalSeconds: 20 * 60,
    remainingSeconds: 20 * 60,
    status: "idle",
    endAt: null,
    message: "",
    updatedAt: Date.now(),
  });

  const [displaySeconds, setDisplaySeconds] = useState<number>(20 * 60);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const roomRef = useRef<string>(roomName);
  roomRef.current = roomName;

  // Atualização em alta frequência do display local quando estiver rodando
  useEffect(() => {
    if (roomState.status === "running" && roomState.endAt) {
      const interval = setInterval(() => {
        const remainingMs = roomState.endAt! - Date.now();
        const sec = Math.max(0, Math.ceil(remainingMs / 1000));
        setDisplaySeconds(sec);
      }, 200);

      return () => clearInterval(interval);
    } else {
      setDisplaySeconds(roomState.remainingSeconds);
    }
  }, [roomState.status, roomState.endAt, roomState.remainingSeconds]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join-room", roomRef.current);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleRoomState = (state: RoomState) => {
      setRoomState(state);
      if (state.status !== "running") {
        setDisplaySeconds(state.remainingSeconds);
      }
    };

    const handleFlash = () => {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
      }, 3000);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-state", handleRoomState);
    socket.on("flash", handleFlash);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-state", handleRoomState);
      socket.off("flash", handleFlash);
    };
  }, [roomName]);

  // Ações do cronômetro
  const start = useCallback(() => {
    getSocket().emit("start", { room: roomRef.current });
  }, []);

  const pause = useCallback(() => {
    getSocket().emit("pause", { room: roomRef.current });
  }, []);

  const reset = useCallback((totalSeconds?: number) => {
    getSocket().emit("reset", { room: roomRef.current, totalSeconds });
  }, []);

  const setTime = useCallback((seconds: number) => {
    getSocket().emit("set-time", { room: roomRef.current, seconds });
  }, []);

  const adjustTime = useCallback((deltaSeconds: number) => {
    getSocket().emit("adjust-time", { room: roomRef.current, deltaSeconds });
  }, []);

  const flash = useCallback(() => {
    getSocket().emit("flash", { room: roomRef.current });
  }, []);

  const setMessage = useCallback((message: string) => {
    getSocket().emit("set-message", { room: roomRef.current, message });
  }, []);

  return {
    isConnected,
    roomState,
    displaySeconds,
    isFlashing,
    start,
    pause,
    reset,
    setTime,
    adjustTime,
    flash,
    setMessage,
  };
}
