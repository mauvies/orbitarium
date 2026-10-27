import { describe, expect, it } from "vitest";
import { MAX_CONVERSATION_MESSAGES } from "@/lib/tutor/limits";
import { type NoticeSituation, noticeKind } from "./notice-kind";

const ALL_WELL: NoticeSituation = {
  availability: "available",
  errorMessage: undefined,
  messageCount: 2,
};

describe("noticeKind", () => {
  it("is nothing when the tutor is set up and nothing has failed", () => {
    expect(noticeKind(ALL_WELL)).toBeNull();
  });

  it("says the tutor is not set up before anything else", () => {
    expect(
      noticeKind({
        ...ALL_WELL,
        availability: "not-set",
        errorMessage: "rate-limited",
      }),
    ).toBe("not-set");
  });

  it("says the tutor is unavailable when the check itself failed", () => {
    expect(noticeKind({ ...ALL_WELL, availability: "failed" })).toBe(
      "unavailable",
    );
  });

  it("says it is checking until the answer arrives", () => {
    expect(noticeKind({ ...ALL_WELL, availability: "checking" })).toBe(
      "checking",
    );
  });

  it("reads the code of a failed request", () => {
    expect(noticeKind({ ...ALL_WELL, errorMessage: "daily-limit" })).toBe(
      "daily-limit",
    );
  });

  it("takes the message of any other failure as unavailable", () => {
    expect(noticeKind({ ...ALL_WELL, errorMessage: "Failed to fetch" })).toBe(
      "unavailable",
    );
  });

  it("is too-long when the next message would pass the cap", () => {
    expect(
      noticeKind({ ...ALL_WELL, messageCount: MAX_CONVERSATION_MESSAGES }),
    ).toBe("too-long");
  });

  it("is not too-long while the next message still fits", () => {
    expect(
      noticeKind({ ...ALL_WELL, messageCount: MAX_CONVERSATION_MESSAGES - 1 }),
    ).toBeNull();
  });

  it("shows a failed request before the cap", () => {
    expect(
      noticeKind({
        ...ALL_WELL,
        errorMessage: "rate-limited",
        messageCount: MAX_CONVERSATION_MESSAGES,
      }),
    ).toBe("rate-limited");
  });
});
