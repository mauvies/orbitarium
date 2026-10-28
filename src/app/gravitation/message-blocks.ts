import type { TutorMessage } from "@/lib/tutor/tools";
import { type ToolResult, toolLine } from "./tool-lines";

export type MessageBlock = {
  /** Stable while the message grows, so React keeps each block. */
  readonly key: string;
  readonly kind: "text" | "action";
  readonly text: string;
};

type Part = TutorMessage["parts"][number];

/**
 * A message as the panel shows it: consecutive text joined into one block,
 * and one line for each action the tutor finished (spec 05, Decisions 8 and
 * 11). Actions still under way, and parts that are neither, show nothing.
 */
export function messageBlocks(message: TutorMessage): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let after = "start";

  for (const part of message.parts) {
    const last = blocks.at(-1);

    if (part.type === "text") {
      if (last?.kind === "text") {
        blocks[blocks.length - 1] = { ...last, text: last.text + part.text };
      } else {
        blocks.push({
          key: `${message.id}-text-${after}`,
          kind: "text",
          text: part.text,
        });
      }

      continue;
    }

    const result = finishedToolResult(part);

    if (result !== null && "toolCallId" in part) {
      blocks.push({
        key: part.toolCallId,
        kind: "action",
        text: toolLine(result),
      });

      after = part.toolCallId;
    }
  }

  return blocks;
}

function finishedToolResult(part: Part): ToolResult | null {
  if (!("state" in part) || part.state !== "output-available") {
    return null;
  }

  switch (part.type) {
    case "tool-setCannon":
      return { tool: "setCannon", output: part.output };
    case "tool-launchCannon":
      return { tool: "launchCannon", output: part.output };
    case "tool-goToSection":
      return { tool: "goToSection", output: part.output };
    default:
      return null;
  }
}
