import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useState } from "react";
import type { TutorMessage } from "@/lib/tutor/tools";
import type { LessonControls } from "./lesson-controls";
import {
  runGoToSection,
  runLaunchCannon,
  runSetCannon,
} from "./run-tutor-tool";
import { tutorContext } from "./tutor-context";

const TUTOR_ROUTE = "/api/tutor";

/**
 * The conversation with the tutor. Each request carries the context read at
 * that moment, and each tool call runs through the lesson's controls; once
 * every call has its result, the conversation is sent again so the tutor can
 * explain it (spec 05, Decisions 4, 6 and 7).
 */
export function useTutorChat(
  controls: LessonControls,
): UseChatHelpers<TutorMessage> {
  const [transport] = useState(
    () =>
      new DefaultChatTransport<TutorMessage>({
        api: TUTOR_ROUTE,
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, context: tutorContext(controls) },
        }),
      }),
  );
  const chat = useChat<TutorMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      // The route offers only the three tools, so another name is a bug.
      if (toolCall.dynamic) {
        throw new Error(
          `the tutor called an unknown tool, ${toolCall.toolName}`,
        );
      }
      const { toolCallId } = toolCall;
      switch (toolCall.toolName) {
        case "setCannon":
          chat.addToolOutput({
            tool: "setCannon",
            toolCallId,
            output: runSetCannon(controls, toolCall.input),
          });
          break;
        case "launchCannon":
          chat.addToolOutput({
            tool: "launchCannon",
            toolCallId,
            output: runLaunchCannon(controls, toolCall.input),
          });
          break;
        case "goToSection":
          chat.addToolOutput({
            tool: "goToSection",
            toolCallId,
            output: runGoToSection(controls, toolCall.input),
          });
          break;
      }
    },
  });
  return chat;
}
