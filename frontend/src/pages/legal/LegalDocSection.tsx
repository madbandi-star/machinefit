import { GuideProse } from '@/components/content/GuideProse/GuideProse';

export function LegalDocSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="legal-doc__section">
      <h2>{title}</h2>
      <GuideProse text={body} />
    </section>
  );
}
