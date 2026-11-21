import type { JSX } from 'react';
import type { PortfolioLink, PortfolioPage } from '../core/content/portfolio';

/** Site-relative files (images, the CV) resolve against the app's base URL. */
function resolveHref(href: string): string {
  return /^[a-z]+:/i.test(href) ? href : `${import.meta.env.BASE_URL}${href}`;
}

function LinkButton({ link }: { readonly link: PortfolioLink }): JSX.Element {
  const href = resolveHref(link.href);
  const external = /^https?:/i.test(href);
  return (
    <a
      className="portfolio-link"
      href={href}
      {...(link.download ? { download: '' } : {})}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  );
}

/** One page of a portfolio panel: title, details, screenshot and links. */
export function PortfolioPageView({ page }: { readonly page: PortfolioPage }): JSX.Element {
  return (
    <article className="portfolio-page">
      <h2 className="portfolio-title">{page.title}</h2>
      {(page.subtitle ?? page.period) && (
        <p className="portfolio-meta">
          {page.subtitle && <span>{page.subtitle}</span>}
          {page.period && <span className="portfolio-period">{page.period}</span>}
        </p>
      )}
      {page.body && <p className="portfolio-body">{page.body}</p>}
      {page.bullets && (
        <ul className="portfolio-bullets">
          {page.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
      {page.image && (
        <a
          className="portfolio-shot"
          href={resolveHref(page.image.src)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open the full-size image"
        >
          <img src={resolveHref(page.image.src)} alt={page.image.alt} loading="lazy" />
        </a>
      )}
      {page.tags && (
        <ul className="portfolio-tags" aria-label="Technologies">
          {page.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      {page.links && (
        <div className="portfolio-links">
          {page.links.map((link) => (
            <LinkButton key={link.href} link={link} />
          ))}
        </div>
      )}
    </article>
  );
}
