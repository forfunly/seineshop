import {Form, Link, useLocation, useNavigate, useNavigation} from 'react-router';
import {useState} from 'react';
import {useLocale} from '~/lib/i18n';
import {CollectionCardsProvider, CollectionProductCard} from './BestSellerQuickView';
import {PHONE_CATEGORIES, PHONE_COLLECTION, phoneCategory} from '~/lib/iphone-pro-collection';

const path = `/collections/${PHONE_COLLECTION}`;
const sorts = [['featured', 'Popularity'], ['price-asc', 'Price Low to High'], ['price-desc', 'Price High to Low'], ['newest', 'Newest'], ['best-selling', 'Best Sellers']];
const early = new Set(['Product Tags', 'Estimated Lead Time', 'Brand', 'Manufacturer', 'Model', 'Material', 'Color']);

export function IphoneProCollection({collection, phone}) {
  const {localize, t} = useLocale();
  const {pathname, search} = useLocation();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const category = phoneCategory(collection.handle);
  const [expanded, setExpanded] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const params = new URLSearchParams(search);
  const href = (changes) => {
    const next = new URLSearchParams(search);
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      for (const item of Array.isArray(value) ? value : [value]) if (item !== '' && item != null && !(key === 'page' && item === 1)) next.append(key, String(item));
    }
    return `${pathname}${next.size ? `?${next}` : ''}`;
  };
  const preserve = (...keys) => [...new Map([...params].filter(([key]) => key !== 'page' && !keys.includes(key)).map(([key,value]) => [JSON.stringify([key,value]), [key,value]]))].map(([id,[key,value]]) => <input key={id} type="hidden" name={key} value={value} />);
  const catLinks = PHONE_CATEGORIES.map(({key,title}, i) => <Link key={key} to={localize(`${path}-${key}`)}>{t(`iPhone 18 Pro ${title}`)} <small>[{phone.counts[i]}]</small></Link>);
  const currency = collection.products.nodes[0]?.priceRange.minVariantPrice.currencyCode;
  const outline = [['Home','/'], ['Apple Accessories','/collections/apple-accessories'], ['iPhone Accessories','/collections/iphone-accessories']];
  if (category) outline.push(['iPhone 18 Pro',path]);
  return <div className="iphone-pro-catalog">
    <nav className="ipc-crumbs" aria-label={t('Breadcrumb')}>
      {outline.map(([label,url]) => <Link key={url} to={localize(url)}>{t(label)}</Link>)} <span aria-current="page">{t(category ? collection.title : 'Wholesale iPhone 18 Pro')}</span>
    </nav>
    <nav className="ipc-chips" aria-label={t('Product categories')}>
      {category ? <>{category.topics.map((topic) => <Link key={topic} to={href({topic: phone.topic === topic ? '' : topic})} aria-current={phone.topic === topic ? 'true' : undefined}>{t(topic)}</Link>)}{PHONE_CATEGORIES.filter(({key}) => key !== category.key).map(({key,title}) => <Link key={key} to={localize(`${path}-${key}`)}>{t(title)}</Link>)}</> : catLinks}
    </nav>
    <div className="ipc-layout">
      <button className="ipc-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="ipc-facets" onClick={() => setFiltersOpen(!filtersOpen)}>{t('Filters')}</button>
      <aside id="ipc-facets" className={`ipc-facets${filtersOpen ? ' is-open' : ''}`} aria-label={t('Filters')}>
        {!category && <details open>
          <summary>{t('Product Categories')}</summary>
          <ul>{PHONE_CATEGORIES.map(({key, title}, i) => {
            const checked = phone.selectedCategories.includes(key);
            const next = checked ? phone.selectedCategories.filter((value) => value !== key) : [...phone.selectedCategories, key];
            return <li key={key}><Link className="ipc-option" aria-current={checked ? 'true' : undefined} to={href({'filter.category': next})}>
              <span className="ipc-check" aria-hidden="true"/><span>{t(`iPhone 18 Pro ${title}`)} <small>[{phone.counts[i]}]</small></span>
            </Link></li>;
          })}</ul>
        </details>}
        {phone.facets.map(({key,values}, i) => <div key={key}>
          {i === 2 && <section><h2>{t('Price')}{currency ? ` (${currency})` : ''}</h2>
            <Form method="get" className="ipc-price" key={`${phone.min}:${phone.max}`}>
              {preserve('min','max')}
              <input type="number" name="min" min="0" step="any" defaultValue={phone.min ?? ''} placeholder={t('Min')} aria-label={t('Minimum price')} />
              <span>–</span><input type="number" name="max" min="0" step="any" defaultValue={phone.max ?? ''} placeholder={t('Max')} aria-label={t('Maximum price')} />
              <button type="submit">OK</button>
            </Form>
          </section>}
          <details key={`${key}-${Boolean(phone.active[key])}`} open={early.has(key) || Boolean(phone.active[key])}>
            <summary>{t(key)}</summary>
            {values.length ? <ul>{(expanded[key] ? values : values.slice(0,5)).map(([label,count]) => {
              const selected = phone.active[key] || [];
              const checked = selected.includes(label);
              const toggle = key === 'Product Tags' || key === 'Promotions';
              if (toggle && !count && !checked) return <li key={label}><span className="ipc-option ipc-option--toggle" aria-disabled="true"><span className="ipc-switch" aria-hidden="true"/><span>{t(label)}</span></span></li>;
              return <li key={label}><Link className={`ipc-option${toggle ? ' ipc-option--toggle' : ''}`} aria-current={checked ? 'true' : undefined} to={href({[`filter.${key}`]: checked ? selected.filter((v) => v !== label) : [...selected,label]})}>
                <span className={toggle ? 'ipc-switch' : 'ipc-check'} aria-hidden="true"/><span>{t(label)}{!toggle && <> <small>[{count}]</small></>}</span>
              </Link></li>;
            })}</ul> : <p>{t('No options available')}</p>}
            {values.length > 5 && <button type="button" onClick={() => setExpanded({...expanded,[key]: !expanded[key]})}>{t(expanded[key] ? 'View Less' : 'View More')}</button>}
          </details>
        </div>)}
        {search && <p><Link to={pathname}>{t('Clear all')}</Link></p>}
      </aside>
      <section className="ipc-results" aria-busy={navigation.state !== 'idle'}>
        <div className="ipc-tools">
          <h1>{t(collection.title)} <small>({phone.count} {t('Group Items')})</small></h1>
          <Form className="ipc-search" method="get" key={phone.q}>
            {preserve('q')}
            <input name="q" type="search" defaultValue={phone.q} placeholder={t('Search in results')} aria-label={t('Search in results')} />
            <button type="submit" aria-label={t('Search')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></svg></button>
          </Form>
          <div className="ipc-display-controls">
            <Form method="get" className="ipc-size" key={phone.size}>
              {preserve('size')}
              <label htmlFor="ipc-page-size">{t('Show')}:</label>
              <select id="ipc-page-size" name="size" aria-label={t('Page size')} defaultValue={phone.size} onChange={(event) => navigate(href({size: event.currentTarget.value}), {preventScrollReset: true})}>
                {[40,60,80].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <noscript><button type="submit">OK</button></noscript>
            </Form>
            <div className="ipc-view">
              <Link to={href({view:''})} aria-label={t('Grid view')} aria-current={phone.view === 'grid' ? 'true' : undefined}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/></svg></Link>
              <Link to={href({view:'list'})} aria-label={t('List view')} aria-current={phone.view === 'list' ? 'true' : undefined}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 4h4v4H4zm0 6h4v4H4zm0 6h4v4H4zm7-10h9m-9 6h9m-9 6h9"/></svg></Link>
            </div>
          </div>
        </div>
        <p className="ipc-description">{t(collection.description)}</p>
        <nav className="ipc-sort" aria-label={t('Sort by')}><strong>{t('Sort by')}:</strong>{sorts.map(([sort,label]) => <Link key={sort} to={href({sort: sort === 'featured' ? '' : sort})} aria-current={phone.sort === sort ? 'true' : undefined}>{t(label)}</Link>)}</nav>
        {collection.products.nodes.length ? <CollectionCardsProvider><div className={`ipc-products ipc-products--${phone.view} browse-grid--${phone.view} collection-card-grid`}>
          {collection.products.nodes.map((product,index) => <CollectionProductCard key={product.id} product={product} loading={index < 5 ? 'eager' : 'lazy'} badge={phone.bestSellerIds.includes(product.id) ? 'Best Sellers' : undefined} />)}
        </div></CollectionCardsProvider> : <p>{t('No products match your selection.')}</p>}
        {phone.pages > 1 && <nav className="ipc-pages" aria-label={t('Pagination')}>
          {phone.page > 1 && <Link to={href({page:phone.page - 1})}>{t('Previous')}</Link>}
          <span aria-current="page">{phone.page} / {phone.pages}</span>
          {phone.page < phone.pages && <Link to={href({page:phone.page + 1})}>{t('Next')}</Link>}
        </nav>}
        <section className="ipc-editorial"><h2>{t(`Wholesale ${collection.title}`)}</h2><p>{t(collection.description)}</p><h2>{t('FAQs')}</h2>
          <details><summary>{t('Will an iPhone 18 Pro accessory fit an iPhone 17 Pro?')}</summary><p>{t('Check the compatible models listed on the product page. Some accessories list both models; fit can vary by design.')}</p></details>
          <details><summary>{t('How do I compare materials and features?')}</summary><p>{t('Use the material and feature filters, then check the individual product specifications for details.')}</p></details>
        </section>
      </section>
    </div>
  </div>;
}
