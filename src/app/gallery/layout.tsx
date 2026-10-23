import { GallerySessionProvider } from "@/gallery/gallery-session";

// The layout stays mounted while the reader moves between the gallery and its
// detail pages, so what it remembers survives that (spec 03, Decision 10).
export default function GalleryLayout({ children }: LayoutProps<"/gallery">) {
  return <GallerySessionProvider>{children}</GallerySessionProvider>;
}
