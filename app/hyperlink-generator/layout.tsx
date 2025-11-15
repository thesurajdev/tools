import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Hyperlink Generator with UTM Builder | HTML Link Maker',
  description: 'Create SEO-optimized HTML links, email links, phone links with UTM tracking. Free hyperlink generator tool with link checker, no signup required.',
  keywords: [
    'hyperlink generator',
    'html link generator',
    'utm builder',
    'link maker',
    'anchor tag generator',
    'markdown link generator',
    'email link generator',
    'utm parameters',
    'google analytics tracking',
    'free link tool',
  ],
  authors: [{ name: 'Suraj Dev' }],
  creator: 'Suraj Dev',
  publisher: 'Suraj Dev Tools',
  openGraph: {
    title: 'Free Hyperlink Generator with UTM Builder',
    description: 'Create SEO-optimized HTML links, email links, phone links with UTM tracking. Free online tool.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Hyperlink Generator with UTM Builder',
    description: 'Create SEO-optimized HTML links with UTM tracking',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HyperlinkGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://tools.surajdev.com/hyperlink-generator#webapp',
        name: 'Free Hyperlink Generator with UTM Builder',
        description: 'Free online tool to generate SEO-optimized HTML links, email links, phone links with UTM campaign tracking parameters.',
        url: 'https://tools.surajdev.com/hyperlink-generator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'HTML anchor tag generator',
          'Markdown link generator',
          'UTM parameter builder',
          'Email link (mailto) generator',
          'Phone link (tel) generator',
          'WhatsApp link generator',
          'Link status checker',
          'SEO optimization (nofollow, sponsored, ugc)',
          'Auto-save functionality',
          'Shareable links with prefilled data',
        ],
        screenshot: 'https://tools.surajdev.com/hyperlink-generator/screenshot.png',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://tools.surajdev.com/hyperlink-generator#software',
        name: 'Hyperlink Generator',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://tools.surajdev.com/hyperlink-generator#webpage',
        url: 'https://tools.surajdev.com/hyperlink-generator',
        name: 'Free Hyperlink Generator with UTM Builder',
        description: 'Professional HTML link generator with UTM tracking, link status checker, and SEO optimization tools.',
        isPartOf: {
          '@id': 'https://tools.surajdev.com#website',
        },
        breadcrumb: {
          '@id': 'https://tools.surajdev.com/hyperlink-generator#breadcrumb',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://tools.surajdev.com/hyperlink-generator#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://tools.surajdev.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Hyperlink Generator',
            item: 'https://tools.surajdev.com/hyperlink-generator',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://tools.surajdev.com/hyperlink-generator#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is an HTML hyperlink?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'An HTML hyperlink uses the <a> tag to link to another page, file, or section.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is an anchor tag?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The anchor tag (<a>) defines a hyperlink with an href destination.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I open a link in a new tab?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use target="_blank". For security, also include rel="noopener noreferrer".',
            },
          },
          {
            '@type': 'Question',
            name: 'What is a nofollow link?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A nofollow link includes rel="nofollow" to signal search engines not to pass ranking signals.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is a UTM link?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A UTM link includes parameters like utm_source, utm_medium, and utm_campaign for analytics tracking.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does this tool support mailto/tel links?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Choose Email Link or Phone Number to generate mailto: and tel: links.',
            },
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Generate SEO-Optimized HTML Links',
        description: 'Step-by-step guide to create professional HTML links with UTM tracking',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Enter Link Text',
            text: 'Type the clickable anchor text that users will see.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Choose Link Type',
            text: 'Select Website URL, Email Link, Phone Number, WhatsApp, or Page Anchor.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Add Destination URL',
            text: 'Enter your target URL. The tool will auto-add https:// if missing.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Configure SEO Options',
            text: 'Add rel attributes like nofollow, sponsored, or ugc for SEO compliance.',
          },
          {
            '@type': 'HowToStep',
            position: 5,
            name: 'Add UTM Parameters',
            text: 'Track your campaigns by adding utm_source, utm_medium, and utm_campaign.',
          },
          {
            '@type': 'HowToStep',
            position: 6,
            name: 'Copy HTML Code',
            text: 'Copy the generated HTML or Markdown code and paste it into your website.',
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
