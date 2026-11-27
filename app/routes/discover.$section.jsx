import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {DISCOVERY_SECTIONS} from '~/data/discovery-navigation';
import {CollectionCardsProvider, CollectionProductCard} from '~/components/BestSellerQuickView';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export async function loader({context, params, request}) {
  const section = DISCOVERY_SECTIONS.find(({handle}) => handle === params.section);
  if (!section) throw new Response('Section not found', {status: 404});
  const {products} = section.handle === 'new-arrivals'
    ? await context.storefront.query(NEW_PRODUCTS, {variables: getPaginationVariables(request, {pageBy: 24})})
    : {products: null};
  return {
    section,
    products,
    preview: !products?.nodes.length,
    page: {title: section.title, description: section.description, seo: {title: section.title, description: section.description}},
  };
}

export default function DiscoverySection() {
  const {section, products} = useLoaderData();
  const {localize, t} = useLocale();
  return <section className="store-discovery">
    <nav aria-label={t('Breadcrumb')} className="ipc-crumbs"><Link to={localize('/')}>{t('Home')}</Link><span aria-current="page">{t(section.title)}</span></nav>
    <header><h1>{t(section.title)}</h1><p>{t(section.description)}</p></header>
    {products?.nodes.length ? <CollectionCardsProvider>
      <PaginatedResourceSection connection={products} resourcesClassName="browse-grid browse-grid--grid collection-card-grid" ariaLabel={t(section.title)}>
        {({node, index}) => <CollectionProductCard key={node.id} product={node} loading={index < 5 ? 'eager' : 'lazy'} />}
      </PaginatedResourceSection>
    </CollectionCardsProvider> : <div className="store-discovery-empty">
      <h2>{t(section.kind === 'brands' ? 'Brand directory' : 'Product listings')}</h2>
      <p>{t(section.empty || 'There are no new arrivals to show yet.')}</p>
      <Link to={localize('/collections')}>{t('Browse collections')} <span aria-hidden="true">→</span></Link>
    </div>}
  </section>;
}

const NEW_PRODUCTS = `#graphql
  query DiscoveryNewArrivals($first: Int, $last: Int, $startCursor: String, $endCursor: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id title handle availableForSale
        featuredImage { id altText url width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      pageInfo { hasPreviousPage hasNextPage startCursor endCursor }
    }
  }
`;
