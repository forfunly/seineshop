import {GlobalSearch} from '~/components/GlobalSearch';
import {CategoryIcon} from '~/components/CategoryIcon';
import {HeaderIcon} from '~/components/HeaderIcon';
import {MarketSelector} from '~/components/MarketSelector';
import {useLocale} from '~/lib/i18n';
import {Suspense, useRef, useEffect, useState} from 'react';
import {categories} from '~/data/navigation';
import {collectionPrimaryNavigation, navigationColumns} from '~/data/collection-navigation';
import {Await, NavLink, useAsyncValue, useRouteLoaderData} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

/**
 * @param {HeaderProps}
 */
export function Header({cart, isLoggedIn}) {
  const {t, localize} = useLocale();
  const menuRef = useRef(null);
  const localPreview = useRouteLoaderData('root')?.localNavigationPreview;
  const closeMenu = () => {if (menuRef.current) menuRef.current.open = false;};
  const [activeCategory, setActiveCategory] = useState(0);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    const closeOutside = (event) => {
      if (menuRef.current?.open && !menuRef.current.contains(event.target)) menuRef.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
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
            ☰ <span>{t('All Categories')}</span>
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
                  onPointerEnter={(event) => {if (event.pointerType === 'mouse') setActiveCategory(index);}}
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
                  <NavigationFamilies category={category} localPreview={localPreview} close={closeMenu} />
                </section>
              ))}
            </div>
          </div>
        </details>
        <nav aria-label={t('Main navigation')}>
          {collectionPrimaryNavigation(localPreview).map(([title, url]) => (
            <NavLink key={title} to={localize(url)} className={url === '/discover/handpicked-brands' ? 'market-support' : undefined}>
              {t(title)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavigationFamilies({category, localPreview, close}) {
  const {t, localize} = useLocale();
  const columns = navigationColumns(category, localPreview);
  return <div className="mega-family-grid">
    {columns.map((column) => <div className="mega-family-column" key={column[0].handle}>
      {column.map(({handle, title, series}) => <div className="mega-family" key={handle}>
        <p className="mega-family-heading">{t(title)}</p>
        {series.length > 0 && <ul>{series.map(({handle: seriesHandle, label}) => <li key={seriesHandle}>
          <NavLink to={localize(`/collections/${seriesHandle}`)} onClick={close}>{t(label)}</NavLink>
        </li>)}</ul>}
      </div>)}
    </div>)}
  </div>;
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
  const localPreview = useRouteLoaderData('root')?.localNavigationPreview;
  return (
    <nav
      className={`header-menu-${viewport}`}
      aria-label={t('Mobile navigation')}
    >
      <NavLink to={localize('/')} onClick={close}>
        {t('Home')}
      </NavLink>
      {collectionPrimaryNavigation(localPreview).map(([title, url]) => (
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
          <NavigationFamilies category={category} localPreview={localPreview} close={close} />
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
