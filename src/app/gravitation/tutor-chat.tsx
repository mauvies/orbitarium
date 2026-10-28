import { useEffect } from "react";
import { createPortal } from "react-dom";
import { es } from "@/content/es";
import { useLessonControls } from "./lesson-provider";
import { TutorConversation } from "./tutor-conversation";
import { useTutorAvailability } from "./use-tutor-availability";
import { useTutorChat } from "./use-tutor-chat";

const { tutor } = es.gravitation;

interface Props {
  headerActions: HTMLElement | null;
  atCannon: boolean;
  onLoad: () => void;
}

export function TutorChat({ headerActions, atCannon, onLoad }: Props) {
  const controls = useLessonControls();
  const chat = useTutorChat(controls);
  const { availability, askOnce, retry } = useTutorAvailability();

  useEffect(() => {
    askOnce();
    onLoad();
  }, [askOnce, onLoad]);

  return (
    <>
      {headerActions !== null &&
        chat.messages.length > 0 &&
        createPortal(
          <button
            type="button"
            onClick={async () => {
              await chat.stop();
              chat.setMessages([]);
              chat.clearError();
            }}
            className="min-h-8 rounded-[10px] px-2 text-muted text-small hover:text-strong"
          >
            {tutor.newConversation}
          </button>,
          headerActions,
        )}
      <TutorConversation
        chat={chat}
        availability={availability}
        retryAvailability={retry}
        atCannon={atCannon}
      />
    </>
  );
}
