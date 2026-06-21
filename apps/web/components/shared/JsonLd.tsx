import { SITE, SITE_URL } from '@/lib/site'
import { FAQ_ITEMS } from '@/lib/faq'

/**
 * Structured data (schema.org JSON-LD) for the home page:
 *  - SoftwareApplication describing Grove
 *  - FAQPage built from the shared FAQ items
 *
 * Rendered as a server component; the JSON is injected verbatim into a
 * <script type="application/ld+json"> tag for crawlers / rich results.
 */
export function JsonLd() {
  const graph = [
    {
      '@type': 'SoftwareApplication',
      name: SITE.name,
      description: SITE.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS',
      url: SITE_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.content,
        },
      })),
    },
  ]

  const data = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user input is interpolated.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
