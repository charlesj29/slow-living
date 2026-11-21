// Charles's portfolio, shown by the Developer's Studio's pieces in a panel.
// All facts come from his CV (Nov 2026); edit here to update the site.
// Images and the CV live in public/portfolio/ (paths relative to the site root).

export interface PortfolioLink {
  readonly label: string;
  readonly href: string;
  /** Offer the file as a download instead of opening it. */
  readonly download?: boolean;
}

export interface PortfolioImage {
  readonly src: string;
  readonly alt: string;
}

/** One page of a panel. */
export interface PortfolioPage {
  readonly title: string;
  /** A role, a place or a one-line description. */
  readonly subtitle?: string;
  readonly period?: string;
  readonly body?: string;
  readonly bullets?: readonly string[];
  readonly tags?: readonly string[];
  readonly image?: PortfolioImage;
  readonly links?: readonly PortfolioLink[];
}

export type PanelId =
  'about' | 'projects' | 'skills' | 'experience' | 'highlights' | 'education' | 'contact';

export interface PortfolioPanel {
  /** Shown at the top of the panel, e.g. "Projects". */
  readonly heading: string;
  readonly pages: readonly PortfolioPage[];
}

const EMAIL = 'chrlsjnthn@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/charles-jonathan-6710b0163';
const LINKEDIN_LINK: PortfolioLink = { label: 'LinkedIn', href: LINKEDIN };

export const PORTFOLIO: Readonly<Record<PanelId, PortfolioPanel>> = {
  about: {
    heading: 'About me',
    pages: [
      {
        title: 'Charles Jonathan',
        subtitle: 'Software Engineer · Flutter',
        body:
          'I have four years of experience developing Flutter applications for e-commerce, logistics and fintech. ' +
          'I am currently responsible for the Tokoplas customer app, its internal Seller and Driver apps, ' +
          'and Poly, an LLM-based customer assistant. ' +
          'I hold a BSc in Mathematics from Institut Teknologi Bandung and have published research in numerical modelling.',
        links: [LINKEDIN_LINK],
      },
    ],
  },
  // One page per framed phone on the wall, in the same order (left to right).
  projects: {
    heading: 'Projects',
    pages: [
      {
        title: 'Tokoplas',
        subtitle: 'E-commerce app for resin products (Android, iOS)',
        body: 'I develop and maintain the Tokoplas customer app, including the payment flow and the customer loyalty programme.',
        bullets: [
          'Shopping for resin products from many sellers and brands',
          'Payment flow and order history',
          'Loyalty programme: member levels, coins and a reward store',
        ],
        tags: ['Flutter', 'Dart', 'Android', 'iOS'],
        image: {
          src: 'portfolio/tokoplas-app.webp',
          alt: 'Three screens of the Tokoplas app: the home page, the cart and the loyalty rewards',
        },
        links: [
          {
            label: 'Google Play',
            href: 'https://play.google.com/store/apps/details?id=com.tokoplas',
          },
          {
            label: 'App Store',
            href: 'https://apps.apple.com/us/app/tokoplas-1-resin-shop/id1493901663',
          },
        ],
      },
      {
        title: 'Poly',
        subtitle: 'LLM-based assistant inside the Tokoplas app',
        body: 'I designed and developed Poly, an assistant that customers can chat with inside the Tokoplas app.',
        bullets: [
          'Answers FAQs and reward enquiries',
          'Tracks orders',
          'Recommends products',
          'Summarises the resin market',
          'Takes quotation requests',
        ],
        tags: ['Flutter', 'LLM integration'],
        image: {
          src: 'portfolio/poly.webp',
          alt: 'Poly answering a question about the polyethylene market with a summary of recent prices',
        },
      },
      {
        title: 'Tokoplas Seller',
        subtitle: 'Internal app for sellers',
        body: 'An internal app I developed for managing inventory and seeing customer purchase history.',
        bullets: [
          'Products, price history, stock reports and stock movement',
          'Orders and quotations',
          'Opening and closing the store',
        ],
        tags: ['Flutter', 'Dart'],
        image: {
          src: 'portfolio/seller-app.webp',
          alt: 'Three screens of the Seller app: the dashboard, the orders list and the store profile',
        },
      },
      {
        title: 'Tokoplas Driver',
        subtitle: 'Internal app for delivery drivers',
        body: 'An internal app I developed for delivery assignments, procedural guidance and order-tracking updates.',
        bullets: [
          'Daily delivery tasks by date',
          'Delivery history',
          'Pickup and drop-off details for each order',
        ],
        tags: ['Flutter', 'Dart'],
        image: {
          src: 'portfolio/driver-app.webp',
          alt: 'Three screens of the Driver app: the day’s tasks, the delivery history and a delivery’s details',
        },
      },
      {
        title: 'klikUMKM',
        subtitle: 'Peer-to-peer lending app (PT Pinjaman Kemakmuran Rakyat)',
        body: 'A peer-to-peer lending app I developed, giving small and medium enterprises mobile access to financing.',
        tags: ['Flutter', 'Fintech'],
      },
    ],
  },
  skills: {
    heading: 'Skills',
    pages: [
      {
        title: 'Skills and tools',
        bullets: [
          'Mobile development: Flutter, Dart, GetX, Provider, RESTful APIs',
          'Programming languages: Dart, Go, JavaScript, SQL',
          'AI and data: LLM integration, data analytics',
          'Tools: Git',
          'Languages: Indonesian (native), English (professional working proficiency)',
        ],
        tags: ['Flutter', 'Dart', 'GetX', 'Provider', 'Go', 'JavaScript', 'SQL', 'LLM', 'Git'],
      },
    ],
  },
  experience: {
    heading: 'Experience',
    pages: [
      {
        title: 'Software Engineer',
        subtitle: 'PT Tokoplas Ecommerce Indonesia',
        period: 'Dec 2022 – Present',
        bullets: [
          'Designed and developed Poly, an LLM-based assistant within the Tokoplas app that handles FAQs, order tracking, reward enquiries, product recommendations, market summaries and quotation requests.',
          'Develop and maintain the Tokoplas e-commerce app for resin products, including the payment flow and customer loyalty programme (Android, iOS).',
          'Developed two internal apps: a Seller app for inventory management and customer purchase history, and a Driver app for delivery assignments, procedural guidance and order-tracking updates.',
          'Work closely with product, backend and design teams from feature planning through to release.',
        ],
      },
      {
        title: 'Mobile Developer',
        subtitle: 'PT Pinjaman Kemakmuran Rakyat',
        period: 'May 2022 – Dec 2022',
        bullets: [
          'Developed klikUMKM, a peer-to-peer lending app giving small and medium enterprises mobile access to financing.',
          'Contributed to the development of the SCBD mobile app as part of the engineering team.',
        ],
      },
      {
        title: 'Laboratory Assistant',
        subtitle: 'Institut Teknologi Bandung',
        period: '2019',
        bullets: ['Conducted laboratory sessions and evaluated student performance.'],
      },
    ],
  },
  highlights: {
    heading: 'Highlights',
    pages: [
      {
        title: 'Highlights',
        bullets: [
          'Four years building Flutter apps for e-commerce, logistics and fintech',
          'Designed and built Poly, an LLM-based assistant inside the Tokoplas app',
          'Responsible for a customer app and two internal apps at Tokoplas',
          'Honours graduate of the Hacktiv8 Full-Stack JavaScript Program',
          'Published research in numerical modelling (International Journal of GEOMATE, 2020)',
        ],
      },
    ],
  },
  education: {
    heading: 'Education',
    pages: [
      {
        title: 'Bachelor of Science in Mathematics',
        subtitle: 'Institut Teknologi Bandung',
        period: '2015 – 2019',
      },
      {
        title: 'Full-Stack JavaScript Program, Honours Graduate',
        subtitle: 'Hacktiv8 Indonesia',
        period: '2020',
      },
      {
        title: 'Publication',
        subtitle: 'International Journal of GEOMATE, 2020',
        body: 'Numerical Model for Dam Break Over a Movable Bed Using Finite Volume Method.',
      },
    ],
  },
  contact: {
    heading: 'Contact',
    pages: [
      {
        title: 'Get in touch',
        body: 'Reach me by email or on LinkedIn, or download my CV.',
        links: [
          { label: EMAIL, href: `mailto:${EMAIL}` },
          LINKEDIN_LINK,
          { label: 'Download CV (PDF)', href: 'portfolio/charles-jonathan-cv.pdf', download: true },
        ],
      },
    ],
  },
};
