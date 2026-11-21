// The portfolio as static HTML and structured data, written into index.html at
// build time (vite.config.ts) so search engines and visitors without
// JavaScript can read it. Same content as the studio and the Résumé.
import { PORTFOLIO, type PortfolioLink, type PortfolioPage } from './portfolio';

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escape = (text: string): string => text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

function linkHtml(link: PortfolioLink): string {
  const href = 'copy' in link ? `mailto:${link.copy}` : link.href;
  const label = 'copy' in link ? link.copy : link.label;
  return `<a href="${escape(href)}">${escape(label)}</a>`;
}

function pageHtml(page: PortfolioPage): string {
  const parts = [`<h3>${escape(page.title)}</h3>`];
  const meta = [page.subtitle, page.period].filter((part) => part !== undefined);
  if (meta.length > 0) parts.push(`<p>${meta.map(escape).join(' · ')}</p>`);
  if (page.body) parts.push(`<p>${escape(page.body)}</p>`);
  if (page.bullets) {
    parts.push(`<ul>${page.bullets.map((b) => `<li>${escape(b)}</li>`).join('')}</ul>`);
  }
  if (page.tags) parts.push(`<p>${page.tags.map(escape).join(', ')}</p>`);
  if (page.links) parts.push(`<p>${page.links.map(linkHtml).join(' · ')}</p>`);
  return parts.join('');
}

/** The whole portfolio as plain, semantic HTML (no styling). */
export function portfolioHtml(): string {
  const [intro] = PORTFOLIO.about.pages;
  const head = intro
    ? `<h1>${escape(intro.title)}</h1><p>${escape(intro.subtitle ?? '')}</p><p>${escape(intro.body ?? '')}</p>`
    : '';
  const sections = (['contact', 'projects', 'experience', 'skills', 'education'] as const).map(
    (id) =>
      `<section><h2>${escape(PORTFOLIO[id].heading)}</h2>${PORTFOLIO[id].pages.map(pageHtml).join('')}</section>`,
  );
  return `<main>${head}${sections.join('')}</main>`;
}

/** schema.org Person data for search engines (JSON, safe inside a script tag). */
export function personJsonLd(): string {
  const [intro] = PORTFOLIO.about.pages;
  const contact = PORTFOLIO.contact.pages.flatMap((page) => page.links ?? []);
  const email = contact.find((link) => 'copy' in link);
  const [job] = PORTFOLIO.experience.pages;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: intro?.title,
    jobTitle: 'Software Engineer',
    description: intro?.body,
    ...(email && 'copy' in email ? { email: `mailto:${email.copy}` } : {}),
    ...(job?.subtitle ? { worksFor: { '@type': 'Organization', name: job.subtitle } } : {}),
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Institut Teknologi Bandung' },
    knowsAbout: PORTFOLIO.skills.pages[0]?.tags ?? [],
  };
  // "<" can't appear raw inside a script element.
  return JSON.stringify(person).replace(/</g, '\\u003c');
}
