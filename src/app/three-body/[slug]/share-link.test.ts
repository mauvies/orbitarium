import { describe, expect, it, vi } from "vitest";
import { type ShareTarget, shareLink } from "./share-link";

const LINK = {
  title: "Moth I",
  url: "https://orbitarium.example/three-body/moth-i",
};

function targetWith(share?: ShareTarget["share"]) {
  const writeText = vi.fn(async (_text: string) => {});

  return { target: { share, clipboard: { writeText } }, writeText };
}

// Spec 03, Decision 14.
describe("shareLink", () => {
  it("opens the share sheet with the title and URL when there is one", async () => {
    const share = vi.fn(async (_data: ShareData) => {});
    const { target, writeText } = targetWith(share);

    expect(await shareLink(target, LINK)).toBe("shared");
    expect(share).toHaveBeenCalledWith(LINK);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the URL when there is no share sheet", async () => {
    const { target, writeText } = targetWith();

    expect(await shareLink(target, LINK)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(LINK.url);
  });

  it("does nothing when the share sheet is dismissed", async () => {
    const { target, writeText } = targetWith(async () => {
      throw new DOMException("Share canceled", "AbortError");
    });

    expect(await shareLink(target, LINK)).toBe("dismissed");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the URL when the share sheet fails", async () => {
    const { target, writeText } = targetWith(async () => {
      throw new DOMException("Not allowed", "NotAllowedError");
    });

    expect(await shareLink(target, LINK)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(LINK.url);
  });

  it("lets a failed copy through", async () => {
    const target: ShareTarget = {
      clipboard: {
        writeText: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    };

    await expect(shareLink(target, LINK)).rejects.toThrow("Denied");
  });
});
