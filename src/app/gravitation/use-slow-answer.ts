import type { ChatStatus } from "ai";
import { useEffect, useState } from "react";
import { SLOW_ANSWER_MS } from "@/lib/tutor/limits";

export function useSlowAnswer(status: ChatStatus): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (status !== "submitted") {
      return;
    }

    const timer = setTimeout(() => setIsSlow(true), SLOW_ANSWER_MS);

    return () => {
      clearTimeout(timer);
      setIsSlow(false);
    };
  }, [status]);

  return isSlow;
}
