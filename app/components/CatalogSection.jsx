import {useState} from 'react';
import {Link, useLocation} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {catalogPresentation, usesCatalogResults, brandDirectory} from '~/data/catalog-sections';
import {FacetedCollection} from './FacetedCollection';

function Directory({collection, presentation, values}) {
  const {t, localize} = useLocale();
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('');
  const [category, setCategory] = useState('');
  const sorted = [...values].sort((a, b) => a.label.localeCompare(b.label));
  const initialOf = (item) => /^[A-Z]/.test(item.label.toUpperCase()) ? item.label[0].toUpperCase() : '#';
  const categoryValues = [...new Set(values.flatMap((item) => item.categories || []))].sort();
  const categoryBrands = sorted.filter((item) => !category || item.categories?.includes(category));
  const initials = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const filtered = categoryBrands.filter((item) => (!letter || initialOf(item) === letter) && item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const link = (item) => `${localize(`/collections/${collection.handle}`)}?${new URLSearchParams({filter: item.input})}`;
  return <div className="navigation-page brand-directory">
    <nav className="navigation-breadcrumb" aria-label={t('Breadcrumb')}><Link to={localize('/')}>{t('Home')}</Link> / {t(collection.title)}</nav>
    <header className="navigation-hero"><h1>{t(collection.title)}</h1><p>{t(presentation.description)}</p></header>
    <section><h2>{t('Hot Brands')}</h2><div className="brand-tiles">{[...values].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 6).map((item) => <Link key={item.id} to={link(item)}>{item.label}</Link>)}</div>{!values.length && <p>{t('No featured brands yet')}</p>}</section>
    <section>
      <h2>{t('Brands in All Categories')}</h2>
      <div className="brand-category-list"><button type="button" aria-pressed={!category} onClick={() => setCategory('')}>{t('All Categories')}</button>{categoryValues.map((label) => <button type="button" key={label} aria-pressed={category === label} onClick={() => setCategory(label)}>{t(label)} <small>[{values.filter((item) => item.categories?.includes(label)).length}]</small></button>)}</div>
      <label>{t('Search brands')}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="brand-index"><button type="button" aria-pressed={!letter} onClick={() => setLetter('')}>{t('ALL')}</button>{initials.map((initial) => <button type="button" key={initial} disabled={!categoryBrands.some((item) => initialOf(item) === initial)} aria-pressed={letter === initial} onClick={() => setLetter(initial)}>{initial}</button>)}</div>
      {filtered.length ? <div className="brand-tiles">{filtered.map((item) => <Link key={item.id} to={link(item)}>{item.label}</Link>)}</div> : <div className="navigation-empty"><h3>{t(values.length ? 'No matching brands' : 'No brands in this directory yet')}</h3></div>}
    </section>
  </div>;
}

export function CatalogSection(props) {
  const {collection, browse} = props;
  const {t, localize} = useLocale();
  const location = useLocation();
  const presentation = catalogPresentation[collection.handle];
  if (!presentation) return <FacetedCollection {...props} />;
  const filters = collection.products.filters || [];
  const brandItems = filters.find((facet) => facet.id === 'filter.p.vendor')?.values || [];
  if (presentation.kind === 'directory' && !browse.selected.length) return <Directory collection={collection} presentation={presentation} values={brandDirectory(collection.products.nodes)} />;
  const featureResults = usesCatalogResults(collection.handle);
  const categoryItems = filters.find((facet) => facet.id === 'filter.p.product_type')?.values || [];
  const tabs = presentation.kind === 'newest'
    ? presentation.tabs.map((label) => ({label, input: JSON.stringify({productType: label})}))
    : presentation.kind === 'brands' ? brandItems : featureResults ? categoryItems : [];
  const path = localize(`/collections/${collection.handle}`);
  const href = (input) => {
    const params = new URLSearchParams(location.search);
    const retained = featureResults ? params.getAll('filter').filter((value) => !categoryItems.some((item) => item.input === value)) : [];
    for (const key of ['filter', 'cursor', 'direction', 'type']) params.delete(key);
    retained.forEach((value) => params.append('filter', value));
    if (input) params.append('filter', input);
    return `${path}${params.size ? `?${params}` : ''}`;
  };
  return <FacetedCollection {...props} collection={{...collection, description: collection.shopifyDescription || presentation.description}}
    sectionKind={presentation.kind}
    sectionNavigation={
      presentation.kind === 'brands' || presentation.kind === 'newest' || featureResults ? <nav className="catalog-section-tabs" aria-label={t(presentation.kind === 'brands' ? 'Browse by brand' : 'Product categories')}>
        <Link to={href(null)} aria-current={!(featureResults ? tabs.some((item) => browse.selected.includes(item.input)) : browse.selected.length) ? 'page' : undefined}>{t('All products')}</Link>
        {tabs.map((item) => <Link key={item.input} to={href(item.input)} aria-current={browse.selected.includes(item.input) ? 'page' : undefined}>{t(item.label)}</Link>)}
        {presentation.kind === 'brands' && !tabs.length && <span>{t('No featured brands yet')}</span>}
      </nav> : presentation.kind === 'directory' ? <Link className="brand-directory-return" to={path}>{t('Back to brand directory')}</Link> : null
    } />;
}
