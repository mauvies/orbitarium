import { es } from "@/content/es";
import { TUTOR_BUBBLE } from "./chat-bubbles";

const { tutor } = es.gravitation;

interface Props {
  atCannon: boolean;
}

/**
 * The empty conversation's first message, fixed so opening the panel spends
 * no request; with the cannon at the top, it suggests asking for a launch
 * (spec 05, Decision 11).
 */
export function TutorGreeting({ atCannon }: Props) {
  return (
    <div className={TUTOR_BUBBLE}>
      <span className="sr-only">{tutor.tutor}</span>
      <p>{tutor.greeting}</p>
      {atCannon && <p>{tutor.greetingAtCannon}</p>}
    </div>
  );
}
