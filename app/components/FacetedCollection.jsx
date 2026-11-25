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
import {
  CatalogIcon,
  CollectionCardsProvider,
  CollectionProductCard,
} from './BestSellerQuickView';

const bestSellerFacetOrder = [
  'filter.p.m.custom.category_group',
  'filter.p.product_type',
  'filter.p.m.custom.lead_time',
  'price',
  'filter.p.vendor',
  'filter.p.m.custom.compatible_models',
  'filter.p.m.custom.material',
  'filter.p.m.custom.color',
];

const bestSellerCategoryOrder = [
  'Cell Phone Accessories',
  'Lenovo Accessories',
  'OPPO Accessories',
  'Samsung Accessories',
  'Apple Accessories',
  'Honor Accessories',
  'OnePlus Accessories',
  'Huawei Accessories',
  'Xiaomi Accessories',
  'Other Phone Accessories',
  'Motorola Accessories',
  'Cell Phone Cases',
  'Cell Phone Parts',
  'Photo & Video',
  'Consumer Electronics',
  'Computer & Networking',
  'Sports & Outdoors',
  'Home & Garden',
  'Car Accessories',
  'Smartwatch Accessories',
];

function orderedCategories(values) {
  const positions = new Map(
    bestSellerCategoryOrder.map((label, index) => [label, index]),
  );
  const rank = (label) => positions.get(label) ?? positions.size;
  return [...values].sort((a, b) => rank(a.label) - rank(b.label));
}

export function FacetedCollection(props) {
  return props.searchMode ? (
    <FacetedCollectionContent {...props} />
  ) : (
    <CollectionCardsProvider key={props.collection.handle}>
      <FacetedCollectionContent {...props} />
    </CollectionCardsProvider>
  );
}

function FacetedCollectionContent({collection, browse, searchMode = false}) {
  const {t, localize} = useLocale();
  const bestSellers = !searchMode && collection.handle === 'best-sellers';
  const [expandedFacets, setExpandedFacets] = useState({});
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
    (f) =>
      f.type !== 'PRICE_RANGE' &&
      f.values.length &&
      !(
        collection.handle === 'iphone-duo' &&
        [
          'filter.p.m.custom.category_group',
          'filter.p.m.custom.lead_time',
          'filter.p.m.custom.color',
          'filter.p.m.custom.customizable',
        ].includes(f.id)
      ),
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
  if (
    collection.handle === 'iphone-duo' &&
    !facets.some((facet) => facet.id === 'filter.p.product_type')
  ) {
    facets.unshift({
      id: 'filter.p.product_type',
      label: 'Product categories',
      type: 'LIST',
      values: [
        'iPhone Duo Cases',
        'iPhone Duo Screen Protectors',
        'iPhone Duo Camera Lens Protectors',
        'iPhone Duo Back Protectors',
        'Phone Pouches',
      ].map((label) => ({
        id: label,
        label,
        input: JSON.stringify({productType: label}),
      })),
    });
  }
  const bestSellerFacets = bestSellers
    ? [...facets, {id: 'price'}].sort((a, b) => {
        const rank = (id) =>
          bestSellerFacetOrder.includes(id)
            ? bestSellerFacetOrder.indexOf(id)
            : bestSellerFacetOrder.length;
        return rank(a.id) - rank(b.id);
      })
    : facets;
  const availability = connection.filters?.find(
    (facet) => facet.id === 'filter.v.availability',
  );
  const resultCount =
    collection.searchTotal ??
    (availability
      ? availability.values.reduce((sum, value) => sum + (value.count ?? 0), 0)
      : undefined);
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
  const currentSort = new URLSearchParams(location.search).get('sort');
  const matchedSort =
    bestSellers && !currentSort && !browse.q ? 'best-selling' : browse.sort;
  const sortOptions = [
    [
      'featured',
      browse.q || collection.usesSearch
        ? 'Relevance'
        : bestSellers
          ? 'Popularity'
          : 'Featured',
    ],
    ['price-asc', bestSellers ? 'Price Low to High' : 'Price: low to high'],
    ['price-desc', bestSellers ? 'Price High to Low' : 'Price: high to low'],
    ...(!(browse.q || collection.usesSearch)
      ? [
          ['newest', 'Newest'],
          ['best-selling', bestSellers ? 'Best Sellers' : 'Best selling'],
        ]
      : []),
  ];
  const price = (
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
        {bestSellers && (
          <button type="submit" disabled={pending}>
            {t('OK')}
          </button>
        )}
      </div>
    </fieldset>
  );
  const heading = (
    <header className="browse-heading">
      {!bestSellers && (
        <p className="eyebrow">
          {searchMode ? t('SEARCH SEINESHOP') : 'SEINE SHOP COLLECTION'}
        </p>
      )}
      <h1>
        {t(collection.title)}{' '}
        {resultCount !== undefined && (
          <small>
            ({resultCount} {t(bestSellers ? 'Group Items' : 'products')})
          </small>
        )}
      </h1>
      {!bestSellers && <p>{t(collection.description)}</p>}
    </header>
  );
  return (
    <div
      className={`browse-page ${collection.handle === 'iphone-duo' ? 'browse-page--catalog' : ''} ${bestSellers ? 'browse-page--best-sellers' : ''}`}
    >
      <nav className="browse-breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to={localize('/')}>{t('Home')}</Link>
        <span aria-hidden="true">{bestSellers ? '›' : '/'}</span>
        <span>{t(collection.title)}</span>
      </nav>
      {!bestSellers &&
        facets.find((facet) => facet.id === 'filter.p.product_type') && (
          <nav
            className="browse-category-links"
            aria-label={t('Product categories')}
          >
            <Link to={clearUrl}>{t('All products')}</Link>
            {facets
              .find((facet) => facet.id === 'filter.p.product_type')
              .values.map((value) => (
                <Link key={value.id} to={href({filter: value.input})}>
                  {t(value.label)}{' '}
                  {value.count !== undefined && <small>({value.count})</small>}
                </Link>
              ))}
          </nav>
        )}
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
            {bestSellerFacets.map((f) => {
              if (f.id === 'price') return <div key={f.id}>{price}</div>;
              const category = [
                'filter.p.m.custom.category_group',
                'filter.p.product_type',
              ].includes(f.id);
              const expandable =
                bestSellers && !category && f.values.length > 5;
              const expanded = Boolean(expandedFacets[f.id]);
              const values =
                bestSellers && category
                  ? orderedCategories(f.values)
                  : f.values;
              return (
                <details
                  className="browse-facet"
                  key={f.id}
                  open={
                    !bestSellers ||
                    bestSellerFacetOrder.includes(f.id) ||
                    f.values.some((v) =>
                      selected.has(JSON.stringify(JSON.parse(v.input))),
                    )
                  }
                >
                  <summary>
                    {t(
                      bestSellers && f.id === 'filter.p.m.custom.category_group'
                        ? 'Product Categories'
                        : bestSellers && f.id === 'filter.p.m.custom.lead_time'
                          ? 'Estimated Lead Time'
                          : bestSellers &&
                              f.id === 'filter.p.m.custom.compatible_models'
                            ? 'Model'
                            : labels[f.id] || f.label,
                    )}
                  </summary>
                  <div className="browse-facet-values">
                    {values.map((v, index) => {
                      const input = JSON.stringify(JSON.parse(v.input));
                      return (
                        <label
                          key={v.id}
                          hidden={
                            expandable &&
                            !expanded &&
                            index >= 5 &&
                            !selected.has(input)
                          }
                        >
                          <input
                            type="checkbox"
                            name="filter"
                            value={input}
                            defaultChecked={selected.has(input)}
                            onChange={
                              bestSellers
                                ? (event) =>
                                    submit(event.currentTarget.form, {
                                      preventScrollReset: true,
                                    })
                                : undefined
                            }
                            disabled={v.count === 0 && !selected.has(input)}
                          />
                          <span>
                            {t(
                              v.label === 'In stock'
                                ? 'Available to order'
                                : v.label,
                            )}
                          </span>
                          {v.count !== undefined && (
                            <small>
                              {bestSellers ? `[${v.count}]` : v.count}
                            </small>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {expandable && (
                    <button
                      className="browse-view-more"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedFacets((state) => ({
                          ...state,
                          [f.id]: !expanded,
                        }))
                      }
                    >
                      {t(expanded ? 'View Less' : 'View More')}{' '}
                      {expanded ? '⌃' : '⌄'}
                    </button>
                  )}
                </details>
              );
            })}
            {!bestSellers && price}
            <button className="browse-apply" type="submit" disabled={pending}>
              {t(pending ? 'Loading...' : 'Apply filters')}
            </button>
            <Link className="browse-clear" to={clearUrl}>
              {t('Clear filters')}
            </Link>
          </div>
        </details>
        <section className="browse-results" aria-label={t('Products')}>
          {!bestSellers && heading}
          <div className="browse-toolbar">
            {bestSellers && heading}
            {(searchMode || collection.scopedSearch ||
              ['best-sellers', 'iphone-duo'].includes(collection.handle)) && (
              <div className="browse-search">
                {collection.scopedSearch && <input type="hidden" name="scope" value="collection" />}
                <label className="sr-only" htmlFor="browse-query">
                  {t(
                    searchMode
                      ? 'Search products'
                      : bestSellers
                        ? 'Search in results'
                        : 'Search this collection',
                  )}
                </label>
                <input
                  id="browse-query"
                  name="q"
                  placeholder={t(
                    searchMode
                      ? 'Search products'
                      : bestSellers
                        ? 'Search in results'
                        : 'Search this collection',
                  )}
                  defaultValue={browse.q}
                />
                <button type="submit" aria-label={t('Search')}>
                  {bestSellers ? <CatalogIcon name="search" /> : t('Search')}
                </button>
              </div>
            )}
            <label className="browse-size">
              {t('Show')}
              <select
                name="size"
                defaultValue={browse.size}
                onChange={(e) => submit(e.currentTarget.form)}
              >
                {(bestSellers && browse.size !== 24
                  ? [40, 60, 80]
                  : [24, 40, 60, 80]
                ).map((n) => (
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
                {bestSellers ? <CatalogIcon name="grid" /> : '▦'}
              </Link>
              <Link
                to={href({view: 'list'})}
                aria-label={t('List view')}
                aria-current={browse.view === 'list' ? 'true' : undefined}
              >
                {bestSellers ? <CatalogIcon name="list" /> : '☷'}
              </Link>
            </div>
            <input type="hidden" name="view" value={browse.view} />
          </div>
          <nav className="browse-sort-tabs" aria-label={t('Sort products')}>
            {bestSellers && <strong>{t('Sort by')}:</strong>}
            {sortOptions.map(([value, label]) => (
              <Link
                key={value}
                to={href({sort: value})}
                aria-current={matchedSort === value ? 'true' : undefined}
              >
                {t(label)}
              </Link>
            ))}
          </nav>
          {bestSellers && currentSort && (
            <input type="hidden" name="sort" value={currentSort} />
          )}
          {!bestSellers && (
            <div className="browse-sort">
              <label>
                {t('Sort by')}
                <select
                  name="sort"
                  defaultValue={browse.sort}
                  onChange={(e) => submit(e.currentTarget.form)}
                >
                  <option value="featured">
                    {browse.q || collection.usesSearch
                      ? t('Relevance')
                      : t('Featured')}
                  </option>
                  {!(browse.q || collection.usesSearch) && (
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
          )}
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
          <div className={`browse-grid browse-grid--${browse.view}${searchMode ? '' : ' collection-card-grid'}`}>
            {connection.nodes.map((p, i) =>
              !searchMode ? (
                <CollectionProductCard
                  key={p.id}
                  product={p}
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
              ) : (
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
              ),
            )}
          </div>
          {!connection.nodes.length && (
            <div className="browse-empty">
              {collection.catalogSection && !browse.q && !browse.filters.length ? (
                <>
                  <h2>{t('No products in this section yet')}</h2>
                  <Link to={localize('/collections')}>{t('Browse collections')}</Link>
                </>
              ) : (
                <>
                  <h2>{t('No matching products')}</h2>
                  <p>{t('Try a different search or clear your filters.')}</p>
                  <Link to={clearUrl}>{t('Clear filters')}</Link>
                </>
              )}
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
    </div>
  );
}
