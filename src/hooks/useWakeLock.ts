"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useWakeLock(autoRequest: boolean = true) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      setIsSupported(false);
      return false;
    }

    try {
      const lock = await (navigator as any).wakeLock.request("screen");
      wakeLockRef.current = lock;
      setIsLocked(true);

      lock.addEventListener("release", () => {
        setIsLocked(false);
        wakeLockRef.current = null;
      });

      console.log("[WakeLock] Tela travada com sucesso para não apagar.");
      return true;
    } catch (err: any) {
      console.warn("[WakeLock] Falha ao solicitar bloqueio de tela:", err?.message);
      setIsLocked(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn("[WakeLock] Falha ao liberar:", err);
      }
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setIsSupported(true);

      if (autoRequest) {
        requestWakeLock();
      }

      // Re-requisita quando o usuário volta para a aba
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && autoRequest) {
          requestWakeLock();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        releaseWakeLock();
      };
    }
  }, [autoRequest, requestWakeLock, releaseWakeLock]);

  return { isSupported, isLocked, requestWakeLock, releaseWakeLock };
}
