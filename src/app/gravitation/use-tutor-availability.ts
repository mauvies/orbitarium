import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import type { Availability } from "./notice-kind";

const TUTOR_ROUTE = "/api/tutor";

const availabilityAnswer = z.object({ available: z.boolean() });

/**
 * Whether the tutor is set up on the server (spec 05, Decision 12). It is
 * asked once, when the panel first opens, and the answer is kept until
 * reload; the guard is a ref, so a repeated effect cannot ask twice. A failed
 * check is shown, and `retry` asks again.
 */
export function useTutorAvailability(): {
  availability: Availability;
  askOnce: () => void;
  retry: () => void;
} {
  const [availability, setAvailability] = useState<Availability>("checking");
  const asked = useRef(false);

  const ask = useCallback(async () => {
    setAvailability("checking");
    try {
      const response = await fetch(TUTOR_ROUTE);
      if (!response.ok) {
        throw new Error(`GET ${TUTOR_ROUTE} answered ${response.status}`);
      }
      const { available } = availabilityAnswer.parse(await response.json());
      setAvailability(available ? "available" : "not-set");
    } catch (error) {
      console.error(error);
      setAvailability("failed");
    }
  }, []);

  const askOnce = useCallback(() => {
    if (!asked.current) {
      asked.current = true;
      void ask();
    }
  }, [ask]);

  return { availability, askOnce, retry: ask };
}
