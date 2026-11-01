import {useEffect, useState} from 'react';
import {
  Form,
  Link,
  useLocation,
  useNavigation,
  useRouteLoaderData,
  useSubmit,
} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {ProductItem} from './ProductItem';

export function FacetedCollection({collection, browse, searchMode = false}) {
  const {t, localize} = useLocale();
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => setFiltersOpen(!media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const location = useLocation();
  const navigation = useNavigation();
  const submit = useSubmit();
  const {localization} = useRouteLoaderData('root');
  const currency = localization.country.currency.isoCode;
  const connection = collection.products || {nodes: []};
  const facets = (connection.filters || []).filter(
    (f) => f.type !== 'PRICE_RANGE' && f.values.length,
  );
  const labels = {
    'filter.p.product_type': 'Product categories',
    'filter.p.vendor': 'Brand',
    'filter.p.m.custom.category_group': 'Category',
    'filter.p.m.custom.lead_time': 'Preparation time',
    'filter.p.m.custom.color': 'Color',
    'filter.p.m.custom.material': 'Material',
    'filter.p.m.custom.compatible_models': 'Compatible models',
    'filter.p.m.custom.customizable': 'Customization',
  };
  const clearUrl = searchMode
    ? `${localize('/search')}?q=${encodeURIComponent(browse.q)}`
    : localize(`/collections/${collection.handle}`);
  const selected = new Set(browse.selected);
  const href = (changes, remove = null) => {
    const p = new URLSearchParams(location.search);
    p.delete('cursor');
    p.delete('direction');
    if (remove) {
      const kept = p.getAll('filter').filter((v) => v !== remove);
      p.delete('filter');
      kept.forEach((v) => p.append('filter', v));
    }
    Object.entries(changes).forEach(([k, v]) =>
      v === null ? p.delete(k) : p.set(k, String(v)),
    );
    return `${location.pathname}?${p}`;
  };
  const pending = navigation.state !== 'idle';
  const active = facets.flatMap((f) =>
    f.values
      .filter((v) => selected.has(JSON.stringify(JSON.parse(v.input))))
      .map((v) => ({
        value: JSON.stringify(JSON.parse(v.input)),
        label: v.label,
      })),
  );
  return (
    <main className="browse-page">
      <nav className="browse-breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to={localize('/')}>{t('Home')}</Link>
        <span>/</span>
        <span>{t(collection.title)}</span>
      </nav>
      <header className="browse-heading">
        <div>
          <p className="eyebrow">
            {searchMode ? t('SEARCH SEINESHOP') : 'SEINESHOP COLLECTION'}
          </p>
          <h1>{t(collection.title)}</h1>
          <p>{t(collection.description)}</p>
        </div>
      </header>
      <Form
        method="get"
        key={location.search}
        className="browse-layout"
        aria-busy={pending}
      >
        <details
          className="browse-filters"
          open={filtersOpen}
          onToggle={(e) => setFiltersOpen(e.currentTarget.open)}
        >
          <summary>
            {t('Filters')}
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="browse-filter-body">
            {facets.map((f) => (
              <details className="browse-facet" key={f.id} open>
                <summary>{t(labels[f.id] || f.label)}</summary>
                <div className="browse-facet-values">
                  {f.values.map((v) => {
                    const input = JSON.stringify(JSON.parse(v.input));
                    return (
                      <label key={v.id}>
                        <input
                          type="checkbox"
                          name="filter"
                          value={input}
                          defaultChecked={selected.has(input)}
                          disabled={v.count === 0 && !selected.has(input)}
                        />
                        <span>
                          {t(
                            v.label === 'In stock'
                              ? 'Available to order'
                              : v.label,
                          )}
                        </span>
                        <small>{v.count}</small>
                      </label>
                    );
                  })}
                </div>
              </details>
            ))}
            <fieldset className="browse-price">
              <legend>
                {t('Price')} ({currency})
              </legend>
              <div>
                <label>
                  <span className="sr-only">{t('Minimum price')}</span>
                  <input
                    type="number"
                    name="min"
                    min="0"
                    step="any"
                    placeholder="Min"
                    defaultValue={browse.min}
                  />
                </label>
                <span>–</span>
                <label>
                  <span className="sr-only">{t('Maximum price')}</span>
                  <input
                    type="number"
                    name="max"
                    min="0"
                    step="any"
                    placeholder="Max"
                    defaultValue={browse.max}
                  />
                </label>
              </div>
            </fieldset>
            <button className="browse-apply" type="submit" disabled={pending}>
              {t(pending ? 'Loading...' : 'Apply filters')}
            </button>
            <Link className="browse-clear" to={clearUrl}>
              {t('Clear filters')}
            </Link>
          </div>
        </details>
        <section className="browse-results" aria-label={t('Products')}>
          <div className="browse-toolbar">
            {(searchMode || collection.handle === 'best-sellers') && (
              <div className="browse-search">
                <label className="sr-only" htmlFor="browse-query">
                  {t(searchMode ? 'Search products' : 'Search this collection')}
                </label>
                <input
                  id="browse-query"
                  name="q"
                  placeholder={t(
                    searchMode ? 'Search products' : 'Search this collection',
                  )}
                  defaultValue={browse.q}
                />
                <button type="submit">{t('Search')}</button>
              </div>
            )}
            <label className="browse-size">
              {t('Show')}
              <select
                name="size"
                defaultValue={browse.size}
                onChange={(e) => submit(e.currentTarget.form)}
              >
                {[24, 40, 80].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="browse-view" aria-label={t('View')}>
              <Link
                to={href({view: 'grid'})}
                aria-label={t('Grid view')}
                aria-current={browse.view === 'grid' ? 'true' : undefined}
              >
                ▦
              </Link>
              <Link
                to={href({view: 'list'})}
                aria-label={t('List view')}
                aria-current={browse.view === 'list' ? 'true' : undefined}
              >
                ☷
              </Link>
            </div>
            <input type="hidden" name="view" value={browse.view} />
          </div>
          <div className="browse-sort">
            <label>
              {t('Sort by')}
              <select
                name="sort"
                defaultValue={browse.sort}
                onChange={(e) => submit(e.currentTarget.form)}
              >
                <option value="featured">
                  {browse.q ? t('Relevance') : t('Featured')}
                </option>
                {!browse.q && (
                  <>
                    <option value="best-selling">{t('Best selling')}</option>
                    <option value="newest">{t('Newest')}</option>
                  </>
                )}
                <option value="price-asc">{t('Price: low to high')}</option>
                <option value="price-desc">{t('Price: high to low')}</option>
              </select>
            </label>
            <span role="status">
              {collection.searchTotal !== undefined
                ? `${collection.searchTotal} ${t('results')}`
                : `${connection.nodes.length} ${t('products on this page')}`}
            </span>
          </div>
          {(active.length > 0 || browse.min !== '' || browse.max !== '') && (
            <div className="browse-active">
              {active.map((a) => (
                <Link key={a.value} to={href({}, a.value)}>
                  {t(a.label)} ×
                </Link>
              ))}
              {(browse.min !== '' || browse.max !== '') && (
                <Link to={href({min: null, max: null})}>
                  {currency} {browse.min || 0} – {browse.max || '∞'} ×
                </Link>
              )}
            </div>
          )}
          <div className={`browse-grid browse-grid--${browse.view}`}>
            {connection.nodes.map((p, i) => (
              <article key={p.id}>
                <ProductItem
                  product={p}
                  searchTerm={searchMode ? browse.q : undefined}
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
                <p className="browse-card-category">
                  {t(p.productType || p.vendor)}
                </p>
              </article>
            ))}
          </div>
          {!connection.nodes.length && (
            <div className="browse-empty">
              <h2>{t('No matching products')}</h2>
              <p>{t('Try a different search or clear your filters.')}</p>
              <Link to={clearUrl}>{t('Clear filters')}</Link>
            </div>
          )}
          <nav className="browse-pagination" aria-label={t('Pagination')}>
            {connection.pageInfo?.hasPreviousPage && (
              <Link
                to={href({
                  cursor: connection.pageInfo.startCursor,
                  direction: 'previous',
                })}
              >
                ← {t('Previous')}
              </Link>
            )}
            {connection.pageInfo?.hasNextPage && (
              <Link
                to={href({
                  cursor: connection.pageInfo.endCursor,
                  direction: 'next',
                })}
              >
                {t('Next')} →
              </Link>
            )}
          </nav>
        </section>
      </Form>
    </main>
  );
}
