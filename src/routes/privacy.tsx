import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";

export const Route = createFileRoute("/privacy")({
  component: () => (
    <>
      <header className="w-full bg-white flex items-center justify-center pt-32 pb-16 md:pt-48 md:pb-24">
        <Link to="/">
          <Logo className="w-20 h-20" />
        </Link>
      </header>
      <main className="bg-white px-6 pb-32 md:px-12 md:pb-48">
        <article className="mx-auto max-w-2xl text-black/80 text-base leading-relaxed">
          <h1 className="font-serif text-4xl md:text-5xl text-black mb-16">
            Privacy Policy
          </h1>

          <Section title="Who we are">
            <p>
              Boring+Ordinary operates this website. When we say "we", "us", or
              "our", we mean Boring+Ordinary. For any privacy-related questions,
              reach us at{" "}
              <a
                href="mailto:privacy@boringordinary.com"
                className="underline hover:text-black transition-colors"
              >
                privacy@boringordinary.com
              </a>
              .
            </p>
          </Section>

          <Section title="What we collect">
            <p>
              We keep data collection to a minimum. When you visit this site, we
              may collect basic analytics data such as page views, referral
              source, and general geographic region. We do not collect personal
              information unless you provide it to us directly, for example by
              emailing us.
            </p>
          </Section>

          <Section title="Cookies and tracking">
            <p>
              We use analytics cookies to understand how visitors use this site
              — for example, which pages are visited and how users navigate
              between them. This helps us improve the experience. We do not use
              advertising cookies.
            </p>
          </Section>

          <Section title="Third parties">
            <p>
              We use third-party analytics services that process usage data on
              our behalf. We do not sell, trade, or otherwise transfer your
              personal information to third parties for their own purposes.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You may request access to, correction of, or deletion of any
              personal data we hold about you. Contact us at{" "}
              <a
                href="mailto:privacy@boringordinary.com"
                className="underline hover:text-black transition-colors"
              >
                privacy@boringordinary.com
              </a>{" "}
              and we will respond promptly.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We may update this policy from time to time. Changes will be
              posted on this page with an updated revision date.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  ),
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-xl md:text-2xl text-black mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
