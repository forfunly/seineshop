/* eslint-disable jsx-a11y/no-noninteractive-element-interactions -- Delegated arrow and Escape handling for the search input and suggestion links. */
import {useEffect, useRef, useState} from 'react';
import {Form, Link, useFetcher, useLocation, useNavigate} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {categories} from '~/data/navigation';
import {ImageSearchUpload} from './ImageSearchUpload';
import {stageSearchImage} from '~/lib/visual-search';
import {HeaderIcon} from './HeaderIcon';
import {useLocale} from '~/lib/i18n';
import {urlWithTrackingParams} from '~/lib/search';

const suggestedTerms = ['iPhone case', 'wireless charger', 'screen protector', 'USB cable'];

export function GlobalSearch() {
  const {t, localize} = useLocale();
  const fetcher = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();
  const imageDialog = useRef(null);
  const imageButton = useRef(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('');
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeTrigger = useRef(null);
  const category = categories.find((item) => item.handle === scope);
  const input = useRef(null);
  const box = useRef(null);
  const query = term.trim();
  const load = fetcher.load;
  const endpoint = localize('/search');
  const destination = category ? localize(category.url) : endpoint;
  const resultsUrl = (value) => `${destination}?${new URLSearchParams(category ? {q: value, scope: 'collection'} : {q: value})}`;
  useEffect(() => {
    if (query.length < 2 || !open) return;
    const timer = setTimeout(() => {
      void load(
        `${endpoint}?${new URLSearchParams({predictive: "true", limit: "4", q: query, ...(scope && {category: scope})})}`,
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [query, load, endpoint, scope, open]);
  useEffect(() => {
    setOpen(false);
    setScopeOpen(false);
    const params = new URLSearchParams(location.search);
    const scoped = params.get('scope') === 'collection'
      ? categories.find((item) => location.pathname.endsWith(item.url))
      : null;
    setScope(scoped?.handle || '');
    setTerm(scoped || /\/search$/.test(location.pathname) ? params.get('q') || '' : '');
  }, [location.key, location.pathname, location.search]);
  useEffect(() => {
    const closeOutside = (event) => {
      if (!box.current?.contains(event.target)) {
        setOpen(false);
        setScopeOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  const fresh = fetcher.data?.term === query && (fetcher.data?.scope || '') === scope;
  const items =
    fresh && !fetcher.data?.error ? fetcher.data?.result?.items : null;
  const loading = query.length >= 2 && (!fresh || fetcher.state !== 'idle');
  const link = (baseUrl, item, searchTerm = query) =>
    localize(
      urlWithTrackingParams({
        baseUrl,
        trackingParams: item?.trackingParameters,
        term: searchTerm,
      }),
    );
  function keyboard(event) {
    if (event.key === 'Escape' && (open || scopeOpen)) {
      event.stopPropagation();
      (scopeOpen ? scopeTrigger : input).current?.focus();
      setOpen(false);
      setScopeOpen(false);
      return;
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...box.current.querySelectorAll(scopeOpen ? '.search-scope-panel button' : '.global-search-panel a')];
    if (!links.length) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement);
    const next =
      event.key === 'ArrowDown'
        ? (index + 1) % links.length
        : index <= 0
          ? links.length - 1
          : index - 1;
    links[next].focus();
  }
  return (
    <div
      className="global-search"
      role="group"
      aria-label={t('Site search')}
      ref={box}
      onKeyDown={keyboard}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setScopeOpen(false);
        }
      }}
    >
      <Form
        className="market-search"
        method="get"
        action={destination}
        role="search"
        onSubmit={() => setOpen(false)}
      >
        <button
          type="button"
          className="search-scope-trigger"
          aria-label={`${t('Search category')}: ${t(category?.title || 'ALL')}`}
          aria-expanded={scopeOpen}
          aria-controls="search-scope-panel"
          ref={scopeTrigger}
          onClick={() => {
            setOpen(false);
            setScopeOpen(!scopeOpen);
          }}
        >
          <span>{t(category?.title || 'ALL')}</span>
          <i className="header-chevron" aria-hidden="true" />
        </button>
        {category && <input type="hidden" name="scope" value="collection" />}
        <label className="sr-only" htmlFor="site-search">
          {t('Search products')}
        </label>
        <input
          id="site-search"
          role="combobox"
          aria-autocomplete="list"
          ref={input}
          name="q"
          type="search"
          autoComplete="off"
          maxLength={120}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {setScopeOpen(false); setOpen(true);}}
          onClick={() => {setScopeOpen(false); setOpen(true);}}
          aria-expanded={open}
          aria-controls="global-search-suggestions"
          aria-haspopup="dialog"
          placeholder={t('Search for Products')}
          required
        />
        <button className="search-image-trigger" type="button" aria-haspopup="dialog" aria-label={t('Search by Image')} ref={imageButton} onClick={() => {
          setOpen(false);
          setScopeOpen(false);
          imageDialog.current.showModal();
        }}><HeaderIcon name="camera" /></button>
        <button type="submit" aria-label={t('Search')}>
          <HeaderIcon name="search" />
        </button>
      </Form>
      <dialog className="search-image-dialog" ref={imageDialog} aria-labelledby="image-search-dialog-title" onClose={() => imageButton.current?.focus()}>
        <div className="search-image-heading"><h2 id="image-search-dialog-title">{t('Search by Image')}</h2><button type="button" aria-label={t('Close')} onClick={() => imageDialog.current.close()}>×</button></div>
        <ImageSearchUpload onFile={(file) => {
          stageSearchImage(file);
          imageDialog.current.close();
          void navigate(localize(`/image-search${scope ? `?category=${encodeURIComponent(scope)}` : ''}`));
        }} />
      </dialog>
      {scopeOpen && (
        <div className="search-scope-panel" id="search-scope-panel">
          {[{title: 'All Categories', handle: ''}, ...categories].map((item) => (
            <button key={item.handle} type="button" aria-pressed={scope === item.handle} onClick={() => {
              setScope(item.handle);
              setScopeOpen(false);
              scopeTrigger.current?.focus();
            }}>
              {t(item.title)}
            </button>
          ))}
        </div>
      )}
      <div className="search-quick-terms">
        {suggestedTerms.map((value) => <Link key={value} to={resultsUrl(t(value))}>{t(value)}</Link>)}
      </div>
      {open && (
        <div
          className="global-search-panel"
          id="global-search-suggestions"
          role="dialog"
          aria-label={t('Search suggestions')}
        >
          <div className="global-search-panel-head">
            <strong>{t(query.length < 2 ? 'Hot Search:' : 'Search suggestions')}</strong>
          </div>
          {query.length < 2 ? (
            <div className="global-search-explore">
              {suggestedTerms.map((value) => (
                <Link key={value} to={resultsUrl(t(value))}>{t(value)}</Link>
              ))}
            </div>
          ) : (
            <>
              <div className="global-search-status" role="status">
                {loading
                  ? t('Searching…')
                  : fetcher.data?.error
                    ? t(
                        'Suggestions are unavailable. Press Search to try again.',
                      )
                    : !fetcher.data?.result?.total
                      ? t(
                          'No suggestions yet. Try another word or search all products.',
                        )
                      : t('Suggested matches')}
              </div>
              {!loading && items && (
                <div className="global-search-columns">
                  <div className="global-search-terms">
                    {!!items.queries?.length && (
                      <section>
                        <h3>{t('Suggestions')}</h3>
                        {items.queries.map((item) => (
                          <Link
                            key={item.text}
                            to={link('/search', item, item.text)}
                          >
                            {item.text} ↗
                          </Link>
                        ))}
                      </section>
                    )}
                    {!!items.collections?.length && (
                      <section>
                        <h3>{t('Collections')}</h3>
                        {items.collections.map((item) => (
                          <Link
                            key={item.id}
                            to={link(`/collections/${item.handle}`, item)}
                          >
                            {t(item.title)}
                          </Link>
                        ))}
                      </section>
                    )}
                    {!!items.articles?.length && (
                      <section>
                        <h3>{t('Articles')}</h3>
                        {items.articles.map((item) => (
                          <Link
                            key={item.id}
                            to={link(
                              `/blogs/${item.blog.handle}/${item.handle}`,
                              item,
                            )}
                          >
                            {t(item.title)}
                          </Link>
                        ))}
                      </section>
                    )}
                  </div>
                  {!!items.products?.length && (
                    <section className="global-search-products">
                      <h3>{t('Products')}</h3>
                      {items.products.map((p) => {
                        const variant = p.selectedOrFirstAvailableVariant;
                        return (
                          <Link
                            key={p.id}
                            to={link(`/products/${p.handle}`, p)}
                          >
                            {variant?.image && (
                              <Image
                                data={variant.image}
                                alt={variant.image.altText || p.title}
                                sizes="64px"
                                style={{width: 64, height: 64}}
                              />
                            )}
                            <span>
                              <strong>{t(p.title)}</strong>
                              {variant?.price && <Money data={variant.price} />}
                            </span>
                          </Link>
                        );
                      })}
                    </section>
                  )}
                </div>
              )}
              <Link
                className="global-search-all"
                to={resultsUrl(query)}
              >
                {t(category ? 'Search this collection' : 'View all results')} →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
