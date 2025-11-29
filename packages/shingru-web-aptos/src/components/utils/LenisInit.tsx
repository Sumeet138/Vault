import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

export default function LenisInit() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
