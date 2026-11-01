import {GlobalSearch} from '~/components/GlobalSearch';
import {CategoryIcon} from '~/components/CategoryIcon';
import {HeaderIcon} from '~/components/HeaderIcon';
import {MarketSelector} from '~/components/MarketSelector';
import {useLocale} from '~/lib/i18n';
import {Suspense, useRef, useEffect, useState} from 'react';
import {categories, primaryLinks} from '~/data/navigation';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

/**
 * @param {HeaderProps}
 */
export function Header({cart, isLoggedIn}) {
  const {t, localize} = useLocale();
  const menuRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(0);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);
  return (
    <header className="market-header">
      <a className="skip-content" href={localize('#main-content')}>
        {t('Skip to content')}
      </a>
      <div className="utility-bar">
        <span>{t('Everyday tech, thoughtfully chosen.')}</span>
        <a href="mailto:steven@seineshop.com">
          <HeaderIcon name="mail" />
          {t('Contact us')}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="market-header-main">
        <NavLink to={localize('/')} end aria-label={t('SeineShop home')}>
          <strong className="brand">
            Seine
            <span>{t('shop')}</span>
          </strong>
        </NavLink>
        <GlobalSearch />
        <HeaderCtas cart={cart} isLoggedIn={isLoggedIn} />
      </div>
      <div className="market-nav">
        <details className="category-dropdown" ref={menuRef}>
          <summary>
            ☰ <span>{t('All categories')}</span>
          </summary>
          <div className="mega-menu taxonomy-mega">
            <nav
              className="mega-category-list"
              aria-label={t('Category groups')}
            >
              {categories.map((category, index) => (
                <button
                  key={category.handle}
                  type="button"
                  aria-expanded={activeCategory === index}
                  aria-controls={`mega-${category.handle}`}
                  onClick={() => setActiveCategory(index)}
                >
                  <CategoryIcon category={category.handle} />
                  <span className="mega-category-name">
                    {t(category.title)}
                  </span>
                  <svg
                    className="mega-category-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    aria-hidden="true"
                  >
                    <path d="m4 2 4 4-4 4" />
                  </svg>
                </button>
              ))}
            </nav>
            <div className="mega-category-panels">
              {categories.map((category, index) => (
                <section
                  key={category.handle}
                  id={`mega-${category.handle}`}
                  hidden={activeCategory !== index}
                >
                  <p className="eyebrow">{t('EXPLORE THE COLLECTION')}</p>
                  <h2>{t(category.title)}</h2>
                  <div className="mega-child-links">
                    {category.links.map(([title, url]) => (
                      <NavLink
                        key={url}
                        to={localize(url)}
                        onClick={() => {
                          if (menuRef.current) menuRef.current.open = false;
                        }}
                      >
                        {t(title)}
                        <span aria-hidden="true">↗</span>
                      </NavLink>
                    ))}
                  </div>
                  <NavLink
                    className="mega-directory-link"
                    to={localize('/collections')}
                    onClick={() => {
                      if (menuRef.current) menuRef.current.open = false;
                    }}
                  >
                    {t('View all collections \u2192')}
                  </NavLink>
                </section>
              ))}
            </div>
          </div>
        </details>
        <nav aria-label={t('Main navigation')}>
          {primaryLinks.map(([title, url]) => (
            <NavLink key={title} to={localize(url)}>
              {t(title)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({viewport}) {
  const {t, localize} = useLocale();
  const {close} = useAside();
  return (
    <nav
      className={`header-menu-${viewport}`}
      aria-label={t('Mobile navigation')}
    >
      <NavLink to={localize('/')} onClick={close}>
        {t('Home')}
      </NavLink>
      {primaryLinks.map(([title, url]) => (
        <NavLink key={title} to={localize(url)} onClick={close}>
          {t(title)}
        </NavLink>
      ))}
      {categories.map((category) => (
        <details key={category.title}>
          <summary>
            <CategoryIcon category={category.handle} />
            <span>{t(category.title)}</span>
          </summary>
          {category.links.map(([title, url]) => (
            <NavLink key={title} to={localize(url)} onClick={close}>
              {t(title)}
            </NavLink>
          ))}
        </details>
      ))}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function AccountLink({loggedIn = false}) {
  const {t, localize} = useLocale();
  return (
    <a
      className="header-action header-account"
      href={localize(loggedIn ? '/account' : '/account/login')}
      aria-label={t(loggedIn ? 'My account' : 'Sign in / Register')}
    >
      <HeaderIcon name="user" />
      <span className="header-action-copy">
        <small>{t('My account')}</small>
        <strong>{t(loggedIn ? 'My account' : 'Sign in / Register')}</strong>
      </span>
    </a>
  );
}
function HeaderCtas({cart, isLoggedIn}) {
  const {t} = useLocale();
  return (
    <nav className="header-ctas" aria-label={t('Shopping preferences')}>
      <MarketSelector />
      <Suspense fallback={<AccountLink />}>
        <Await resolve={isLoggedIn} errorElement={<AccountLink />}>
          {(loggedIn) => <AccountLink loggedIn={loggedIn} />}
        </Await>
      </Suspense>
      <CartToggle cart={cart} />
      <HeaderMenuMobileToggle />
    </nav>
  );
}
function HeaderMenuMobileToggle() {
  const {t} = useLocale();
  const {open} = useAside();
  return (
    <button
      aria-label={t('Open navigation menu')}
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <HeaderIcon name="menu" />
    </button>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {t, localize} = useLocale();
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <a
      href={localize('/cart')}
      className="header-action header-cart"
      aria-label={`${t('Cart')} (${count})`}
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <span className="header-cart-icon">
        <HeaderIcon name="bag" />
        <span className="header-cart-count" aria-hidden="true">
          {count}
        </span>
      </span>
      <span className="header-action-copy">
        <small>{t('Shopping bag')}</small>
        <strong>{t('Cart')}</strong>
      </span>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}
function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
