import {useLocale} from '~/lib/i18n';
import {Form, Link} from 'react-router';
import {categories} from '~/data/navigation';
import {ProductItem} from './ProductItem';
import {PaginatedResourceSection} from './PaginatedResourceSection';

/**
 * @param {{collection: {title: string, handle: string, description: string, products?: any}, preview?: boolean, items?: Array<{id: string, title: string, image: string, type: string, price: string}>, total?: number, page?: number, pages?: number, filters?: {type?: string, q?: string, sort?: string}, types?: string[]}} props
 */
export function CollectionTemplate({
  collection,
  preview = false,
  items,
  total,
  page = 1,
  pages = 1,
  filters = {
    type: '',
    q: '',
    sort: 'featured',
  },
  types,
}) {
  const {t, localize} = useLocale();
  const category = categories.find((c) => c.handle === collection.handle);
  const parent = categories.find((c) =>
    c.children.some((child) => child.handle === collection.handle),
  );
  const pageHref = (n) => {
    const p = new URLSearchParams();
    for (const key of ['type', 'q', 'sort'])
      if (filters[key] && filters[key] !== 'featured') p.set(key, filters[key]);
    if (n > 1) p.set('page', String(n));
    return `?${p}`;
  };
  return (
    <main className="catalog-page">
      <nav aria-label={t('Breadcrumb')} className="catalog-breadcrumb">
        <Link to={localize('/')}>{t('Home')}</Link>
        <span>/</span>
        <Link to={localize('/collections')}>{t('Collections')}</Link>
        <span>/</span>
        {parent && (
          <>
            <Link to={localize(parent.url)}>{t(parent.title)}</Link>
            <span>/</span>
          </>
        )}
        <span>{t(collection.title)}</span>
      </nav>
      <section className="catalog-hero">
        <div>
          <p className="eyebrow">{t('THE EVERYDAY COLLECTION')}</p>
          <h1>{t(collection.title)}</h1>
          <p>{t(collection.description)}</p>
          <div className="catalog-hero-notes">
            <span>{t('Everyday essentials')}</span>
            <span>{t('Thoughtful choices')}</span>
            <span>{t('Details that matter')}</span>
          </div>
        </div>
        <div className="catalog-hero-art" aria-hidden="true">
          <span>
            {t(collection.handle === 'iphone-18-pro-max' ? '18' : 'S')}
          </span>
          <p>
            {t(
              collection.handle === 'iphone-18-pro-max'
                ? 'PRO MAX'
                : 'SEINESHOP',
            )}
            <br />
            {t('CHOOSE YOUR EVERYDAY.')}
          </p>
        </div>
      </section>
      {category && (
        <nav
          className="collection-subcategories"
          aria-label={t('Subcategories')}
        >
          {category.children.map((child) => (
            <Link key={child.handle} to={localize(child.url)}>
              {t(child.title)}
            </Link>
          ))}
        </nav>
      )}
      {preview && (
        <p className="catalog-preview-note">
          {t(
            'Collection preview \xB7 Products are being prepared. Ordering is not available yet.',
          )}
        </p>
      )}
      <div className="catalog-layout">
        <div role="complementary" className="catalog-sidebar">
          <p className="eyebrow">{t('FIND YOUR FIT')}</p>
          <h2>{t('Made for your everyday.')}</h2>
          <p>
            {t(
              'Start with the right model, then choose the materials and features you use most.',
            )}
          </p>
          {
            <Form method="get" className="catalog-filter">
              <label htmlFor="category">{t('Category')}</label>
              <select id="category" name="type" defaultValue={filters.type}>
                <option value="">{t('All products')}</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {t(type)}
                  </option>
                ))}
              </select>
              {preview && (
                <>
                  <label htmlFor="catalog-query">
                    {t('Search this collection')}
                  </label>
                  <input
                    id="catalog-query"
                    name="q"
                    defaultValue={filters.q}
                    placeholder={t('Search by feature or material…')}
                  />
                </>
              )}
              <label htmlFor="catalog-sort">{t('Sort by')}</label>
              <select id="catalog-sort" name="sort" defaultValue={filters.sort}>
                <option value="featured">{t('Featured')}</option>
                <option value="price-asc">{t('Price: low to high')}</option>
                <option value="price-desc">{t('Price: high to low')}</option>
              </select>
              <button className="seine-button" type="submit">
                {t('Apply filters')}
              </button>
              <Link to={localize(`/collections/${collection.handle}`)}>
                {t('Clear filters')}
              </Link>
            </Form>
          }
          <div className="catalog-fit-note">
            <strong>{t('A note on fit')}</strong>
            <p>
              {t(
                'Similar model names do not guarantee the same fit. Check the product\u2019s listed device model, camera cutouts and dimensions before ordering.',
              )}
            </p>
          </div>
        </div>
        <section aria-label={t('Products')} className="catalog-results">
          <div className="catalog-toolbar">
            <h2>{t('Explore the collection')}</h2>
            <span>
              {t(
                preview
                  ? `${total.toLocaleString('en-US')} styles · Page ${page} of ${pages}`
                  : 'Available products',
              )}
            </span>
          </div>
          {t(
            preview ? (
              <>
                <div className="catalog-grid">
                  {items.map((p, i) => (
                    <Link
                      className="catalog-card"
                      to={localize(`/preview/products/${p.id}`)}
                      key={p.id}
                    >
                      <div className="catalog-card-image">
                        <img
                          src={p.image}
                          alt={t(p.title)}
                          width="400"
                          height="400"
                          loading={i < 4 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                        <span>{t('COMING SOON')}</span>
                      </div>
                      <p className="catalog-card-type">{t(p.type)}</p>
                      <h3>{t(p.title)}</h3>
                      <p className="catalog-card-price">
                        ${t(p.price)} <small>{t('USD')}</small>
                      </p>
                    </Link>
                  ))}
                </div>
                {items.length === 0 && (
                  <p className="catalog-empty">
                    {t(
                      'No products match these filters. Try a different search or clear the filters.',
                    )}
                  </p>
                )}
                <nav
                  className="catalog-pagination"
                  aria-label={t('Pagination')}
                >
                  {page > 1 && (
                    <Link to={localize(pageHref(page - 1))} rel="prev">
                      {t('\u2190 Previous')}
                    </Link>
                  )}
                  <span>
                    {t('Page')}
                    {t(page)}
                    {t('of')}
                    {t(pages)}
                  </span>
                  {page < pages && (
                    <Link to={localize(pageHref(page + 1))} rel="next">
                      {t('Next \u2192')}
                    </Link>
                  )}
                </nav>
              </>
            ) : collection.products?.nodes.length ? (
              <PaginatedResourceSection
                connection={collection.products}
                resourcesClassName="catalog-grid"
              >
                {({node, index}) => (
                  <ProductItem
                    key={node.id}
                    product={node}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                )}
              </PaginatedResourceSection>
            ) : (
              <p className="catalog-empty">
                {t(
                  'This collection is coming soon. Our products will appear here when they are ready to order.',
                )}
              </p>
            ),
          )}
        </section>
      </div>
      <section className="catalog-guide">
        <p className="eyebrow">{t('A LITTLE HELP CHOOSING')}</p>
        <h2>{t('Find what works for you.')}</h2>
        <div>
          <article>
            <h3>{t('Compare the details')}</h3>
            <p>
              {t(
                'Review materials, dimensions and features in the product specifications.',
              )}
            </p>
          </article>
          <article>
            <h3>{t('Check compatibility')}</h3>
            <p>
              {t(
                'For device accessories, match the exact model, connector and power requirements.',
              )}
            </p>
          </article>
          <article>
            <h3>{t('Review the contents')}</h3>
            <p>
              {t(
                'Check what is included, then confirm availability and delivery details before ordering.',
              )}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
