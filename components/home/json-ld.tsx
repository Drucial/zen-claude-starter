import { FAQ } from "./constants/faq";
import { GITHUB_URL } from "./constants/links";
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "./constants/site";

const AUTHOR_ID = `${SITE_URL}/#author`;

// No aggregateRating: inventing one to chase a star snippet is the kind of
// markup that earns a manual action.
const GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": AUTHOR_ID,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      sameAs: [AUTHOR_URL, GITHUB_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": AUTHOR_ID },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${SITE_URL}/#source`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      codeRepository: GITHUB_URL,
      programmingLanguage: ["TypeScript", "TSX"],
      runtimePlatform: "Next.js 16",
      license: "https://opensource.org/licenses/MIT",
      author: { "@id": AUTHOR_ID },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS, Linux, Windows",
      softwareRequirements: "Node.js 20+, pnpm",
      downloadUrl: GITHUB_URL,
      author: { "@id": AUTHOR_ID },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

// The graph is a module constant, but SITE_URL comes from the environment, so
// escape the one sequence that could close the script tag early.
const serialized = JSON.stringify(GRAPH).replace(/</g, "\\u003c");

export function JsonLd() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serialized }}
      type="application/ld+json"
    />
  );
}
