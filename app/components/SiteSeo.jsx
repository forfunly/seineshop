import {useLocale} from '~/lib/i18n';
import {stripLocale, localizePath, LOCALES} from '~/lib/locale';
import {
  useLocation,
  useMatches,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router';
import {useNonce} from '@shopify/hydrogen';
import {
  canonicalUrl,
  plainText,
  jsonLd,
  pageTitle,
  searchSnippet,
  commerceMetadata,
  isJournalPath,
} from '~/lib/seo';

export function SiteSeo() {
  const location = useLocation();
  const {locale, t, localize} = useLocale();
  const pathname = stripLocale(location.pathname);
  // Route loaders expose different content shapes to this shared head component.
  const matches =
    /** @type {Array<{id: string, data?: Record<string, any>}>} */ (
      useMatches()
    );
  const error = useRouteError();
  const nonce = useNonce();
  const root = Object(matches.find((m) => m.id === 'root')?.data);
  const data = Object([...matches].reverse().find((m) => m.data)?.data);
  const settings = root?.seoSettings || {
    origin: 'http://localhost:3000',
    indexable: false,
  };
  const content =
    data.product ||
    data.collection ||
    data.article ||
    data.blog ||
    data.page ||
    data.policy;
  const labels = {
    '/': 'Mobile Accessories, Wholesale & Custom Orders',
    '/collections': 'Shop Collections',
    '/collections/all': 'Shop All Accessories',
    '/search': 'Search',
    '/cart': 'Your Shopping Bag',
    '/policies': 'Store Policies',
    '/support': 'Support & Product Help',
    '/blogs': 'Journal',
    '/discover/b20a': 'B-20A 3-in-1 Wireless Charging Station',
  };
  const descriptions = {
    '/': 'Shop phone cases, screen protectors, chargers and mobile accessories at SeineShop. Order online or request wholesale pricing and OEM/ODM customization.',
    '/support':
      'Get help with SeineShop product compatibility, orders, delivery and store policies. Contact our team with your product or order questions.',
    '/collections':
      'Browse SeineShop collections of phone accessories, protective cases, screen protection and everyday charging essentials.',
    '/collections/all':
      'Explore all available SeineShop accessories. Compare features, prices and exact device compatibility before choosing.',
    '/policies':
      'Find the published SeineShop store policies and information for your shopping experience.',
    '/blogs':
      'Read the latest published stories and accessory guides from SeineShop.',
    '/discover/b20a':
      'Explore the B-20A foldable 3-in-1 charging station for compatible phones, wireless earbuds and Samsung Galaxy Watch models.',
  };
  const commerce = data.product ? commerceMetadata(data.product, 'product') : data.collection ? commerceMetadata(data.collection, 'collection') : null;
  const baseTitle =
    commerce?.title || content?.seo?.title || content?.title || labels[pathname] || 'SeineShop';
  const pageNumber = new URLSearchParams(location.search).get('page');
  const title = error
    ? `${isRouteErrorResponse(error) ? error.status : 'Error'} | SeineShop`
    : pageTitle(t(baseTitle), pageNumber);
  const description = searchSnippet(
    t(
      commerce?.description || content?.seo?.description ||
        content?.description ||
        content?.excerpt ||
        content?.body ||
        content?.contentHtml ||
        descriptions[pathname] ||
        'Discover phone cases, screen protection, wireless charging and everyday smart essentials at SeineShop.',
    ),
  );
  const canonical = canonicalUrl(
    settings.origin,
    localizePath(pathname, locale),
    location.search,
  );
  const params = new URLSearchParams(location.search);
  const utility = /^\/(account|cart|search|preview)(\/|$)/.test(pathname);
  const filtered =
    [
      'q',
      'type',
      'brand',
      'sort',
      'sort_by',
      'filter',
      'min',
      'max',
      'size',
      'view',
    ].some((key) => params.has(key)) ||
    [...params.keys()].some((key) => key.startsWith('filter.'));
  const noindex =
    (!settings.indexable &&
      !(settings.journalIndexable && isJournalPath(pathname))) ||
    utility ||
    filtered ||
    data.preview ||
    data.collection?.products?.nodes?.length === 0 ||
    Boolean(error);
  const image =
    content?.featuredImage?.url ||
    content?.image?.url ||
    data.product?.selectedOrFirstAvailableVariant?.image?.url;
  const structured = [];
  if (!error && pathname === '/') {
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SeineShop',
      url: settings.origin,
    });
  }
  if (!error && data.collection && !data.preview) {
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: settings.origin},
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Collections',
          item: `${settings.origin}/collections`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: data.collection.title,
          item: canonical,
        },
      ],
    });
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: (data.collection.products?.nodes || []).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${settings.origin}/products/${p.handle}`,
        name: p.title,
      })),
    });
  }
  if (!error && data.product && !data.preview) {
    const p = data.product,
      v = p.selectedOrFirstAvailableVariant;
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      description: plainText(p.description),
      ...(image ? {image: [image]} : {}),
      ...(v?.sku ? {sku: v.sku} : {}),
      ...(v?.price
        ? {
            offers: {
              '@type': 'Offer',
              url: canonical,
              price: v.price.amount,
              priceCurrency: v.price.currencyCode,
              availability: `https://schema.org/${v.availableForSale ? 'InStock' : 'OutOfStock'}`,
            },
          }
        : {}),
    });
  }
  if (!error && data.blog && !data.article) {
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: baseTitle,
      description,
      url: canonical,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: (data.articles || data.blog.articles?.nodes || []).map(
          (article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: article.title,
            url: `${settings.origin}/blog/${article.handle}`,
          }),
        ),
      },
    });
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: settings.origin},
        {
          '@type': 'ListItem',
          position: 2,
          name: data.blog.title,
          item: data.tag
            ? `${settings.origin}/blogs`
            : `${settings.origin}/blogs/${data.blog.handle}`,
        },
        ...(data.tag
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: data.tag.title,
                item: canonical,
              },
            ]
          : []),
      ],
    });
  }
  if (!error && data.article) {
    const a = data.article;
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      headline: a.title,
      articleSection: 'Buying guides',
      keywords: (a.tags || []).map((tag) => tag.title).join(', '),
      ...(a.recommendations
        ? {
            about: {
              '@type': 'ItemList',
              name: 'Cases compared in this guide',
              itemListElement: a.recommendations.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: product.name,
                url: `${canonical}#${product.id}`,
              })),
            },
          }
        : {}),
      description,
      mainEntityOfPage: {'@type': 'WebPage', '@id': canonical},
      url: canonical,
      inLanguage: locale.code,
      datePublished: a.publishedAt,
      dateModified: a.updatedAt || a.publishedAt,
      ...(image ? {image: [image]} : {}),
      author: {
        '@type': data.editorial ? 'Organization' : 'Person',
        name: a.author?.name || 'SeineShop Editorial',
        url: new URL(a.author?.url || '/support', settings.origin).href,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SeineShop',
        url: settings.origin,
      },
    });
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: settings.origin},
        {
          '@type': 'ListItem',
          position: 2,
          name: a.blog?.title || 'Journal',
          item: `${settings.origin}/blogs/${a.blog?.handle || 'journal'}`,
        },
        {'@type': 'ListItem', position: 3, name: a.title, item: canonical},
      ],
    });
  }
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {!noindex &&
        LOCALES.map((item) => (
          <link
            key={item.code}
            rel="alternate"
            hrefLang={item.code}
            href={canonicalUrl(
              settings.origin,
              localizePath(pathname, item),
              location.search,
            )}
          />
        ))}
      {!noindex && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={canonicalUrl(settings.origin, pathname, location.search)}
        />
      )}
      <meta
        property="og:locale"
        content={
          locale.code === 'ja'
            ? 'ja_JP'
            : locale.code === 'de'
              ? 'de_DE'
              : 'en_US'
        }
      />
      <meta
        name="robots"
        content={
          noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'
        }
      />
      <meta property="og:site_name" content="SeineShop" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta
        property="og:type"
        content={
          data.article ? 'article' : data.product ? 'product' : 'website'
        }
      />
      <meta
        name="twitter:card"
        content={image ? 'summary_large_image' : 'summary'}
      />
      {data.article && (
        <meta
          property="article:published_time"
          content={data.article.publishedAt}
        />
      )}
      {data.article && (
        <meta
          property="article:modified_time"
          content={data.article.updatedAt || data.article.publishedAt}
        />
      )}
      {image && <meta property="og:image" content={image} />}
      {image && (
        <meta
          property="og:image:alt"
          content={content?.image?.altText || baseTitle}
        />
      )}
      {image && <meta name="twitter:image" content={image} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            JSON.parse(
              JSON.stringify(structured, (key, value) => {
                if (typeof value !== 'string') return value;
                if (
                  ['url', 'item', '@id'].includes(key) &&
                  value.startsWith(settings.origin)
                )
                  return (
                    settings.origin +
                    localize(value.slice(settings.origin.length) || '/')
                  );
                return ['name', 'headline', 'description'].includes(key)
                  ? t(value)
                  : value;
              }),
            ),
          ),
        }}
      />
    </>
  );
}
