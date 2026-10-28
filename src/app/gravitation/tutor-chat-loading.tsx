import { es } from "@/content/es";
import { TutorGreeting } from "./tutor-greeting";
import { TutorInput } from "./tutor-input";
import { TutorNotice } from "./tutor-notice";

const { tutor } = es.gravitation;

interface Props {
  atCannon: boolean;
}

export function TutorChatLoading({ atCannon }: Props) {
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <section
        aria-label={tutor.conversation}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: as in TutorConversation, a scrolling region with nothing focusable in it must take focus (WCAG 2.1.1).
        tabIndex={0}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
      >
        <TutorGreeting atCannon={atCannon} />
      </section>
      <TutorNotice kind="checking" onRetry={undefined} />
      <TutorInput waiting unavailable onSend={rejectWhileLoading} />
    </div>
  );
}

function rejectWhileLoading(): never {
  throw new Error("the tutor's conversation is still loading");
}
