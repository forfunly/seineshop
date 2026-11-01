/* eslint-disable jsx-a11y/no-noninteractive-element-interactions -- Delegated arrow and Escape handling for the search input and suggestion links. */
import {useEffect, useRef, useState} from 'react';
import {Form, Link, useFetcher, useLocation} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {HeaderIcon} from './HeaderIcon';
import {useLocale} from '~/lib/i18n';
import {urlWithTrackingParams} from '~/lib/search';
import '~/styles/search.css';

export function GlobalSearch() {
  const {t, localize} = useLocale();
  const fetcher = useFetcher();
  const location = useLocation();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef(null);
  const box = useRef(null);
  const query = term.trim();
  const load = fetcher.load;
  const endpoint = localize('/search');
  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(() => {
      void load(
        `${endpoint}?predictive=true&limit=4&q=${encodeURIComponent(query)}`,
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [query, load, endpoint]);
  useEffect(() => {
    setOpen(false);
  }, [location.key]);
  const fresh = fetcher.data?.term === query;
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
    if (event.key === 'Escape') {
      setOpen(false);
      input.current?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...box.current.querySelectorAll('.global-search-panel a')];
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
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Form
        className="market-search"
        method="get"
        action={localize('/search')}
        role="search"
        onSubmit={() => setOpen(false)}
      >
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
          onFocus={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="global-search-suggestions"
          aria-haspopup="dialog"
          placeholder={t('Search phone cases, chargers, accessories…')}
          required
        />
        <button type="submit" aria-label={t('Search')}>
          <HeaderIcon name="search" />
          <span>{t('Search')}</span>
        </button>
      </Form>
      {open && (
        <div
          className="global-search-panel"
          id="global-search-suggestions"
          role="dialog"
          aria-label={t('Search suggestions')}
        >
          <div className="global-search-panel-head">
            <strong>
              {t(query.length < 2 ? 'Explore SeineShop' : 'Search suggestions')}
            </strong>
            <button
              type="button"
              aria-label={t('Close search suggestions')}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          {query.length < 2 ? (
            <div className="global-search-explore">
              <p>{t('Try a product, model or SKU')}</p>
              {[
                'iPhone case',
                'wireless charger',
                'screen protector',
                'USB cable',
              ].map((q) => (
                <Link
                  key={q}
                  to={`${localize('/search')}?q=${encodeURIComponent(q)}`}
                >
                  {t(q)} ↗
                </Link>
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
                to={`${localize('/search')}?q=${encodeURIComponent(query)}`}
              >
                {t('View all results')} →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
