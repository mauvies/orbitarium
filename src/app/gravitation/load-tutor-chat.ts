/** The tutor's conversation, with the AI SDK it brings, as a chunk of its own. */
export function loadTutorChat(): Promise<typeof import("./tutor-chat")> {
  return import("./tutor-chat");
}

/** Starts loading the conversation when the reader is about to open the panel. */
export function preloadTutorChat(): void {
  void loadTutorChat();
}
