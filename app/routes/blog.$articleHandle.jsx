import {useLoaderData} from 'react-router';
import journal from '~/data/journal.json';
import {JournalArticle} from '~/components/JournalArticle';

export async function loader({params, context}) {
  const article = journal.find((item) => item.handle === params.articleHandle);
  if (!article) throw new Response('Not found', {status: 404});
  const products = {};
  await Promise.all(
    (article.recommendations || []).map(async (item) => {
      try {
        const {product} = await context.storefront.query(PRODUCT_QUERY, {
          variables: {handle: item.handle, ...context.storefront.i18n},
        });
        if (product) products[item.handle] = product;
      } catch {
        // Keep editorial content readable when commerce is temporarily unavailable.
      }
    }),
  );
  return {article, products, editorial: true};
}

export default function Article() {
  const {article, products} = useLoaderData();
  return <JournalArticle article={article} products={products} />;
}

const PRODUCT_QUERY = `#graphql
  query JournalLinkedProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id handle availableForSale
      priceRange { minVariantPrice { amount currencyCode } }
    }
  }
`;
