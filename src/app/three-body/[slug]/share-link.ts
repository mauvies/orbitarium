export type ShareTarget = {
  readonly share?: (data: ShareData) => Promise<void>;
  readonly clipboard: Pick<Clipboard, "writeText">;
};

export type ShareOutcome = "shared" | "copied" | "dismissed";

export async function shareLink(
  target: ShareTarget,
  link: { title: string; url: string },
): Promise<ShareOutcome> {
  if (target.share !== undefined) {
    try {
      await target.share(link);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "dismissed";
      }
    }
  }
  await target.clipboard.writeText(link.url);

  return "copied";
}
