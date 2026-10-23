import { es } from "@/content/es";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-4xl font-semibold text-strong">
        {es.home.title}
      </h1>
      <p className="mt-4 text-lg">{es.home.lead}</p>
    </main>
  );
}
