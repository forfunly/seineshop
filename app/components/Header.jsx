import {GlobalSearch} from '~/components/GlobalSearch';
import {CategoryIcon} from '~/components/CategoryIcon';
import {HeaderIcon} from '~/components/HeaderIcon';
import {MarketSelector} from '~/components/MarketSelector';
import {useLocale} from '~/lib/i18n';
import {Suspense, useRef, useEffect, useState} from 'react';
import {catalogSections} from '~/data/catalog-sections';
import {categories} from '~/data/navigation';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

const primaryLinks = catalogSections.map(([title, handle]) => [title, `/collections/${handle}`]);
const supportLinks = [
  ['Contact Us', '/support'],
  ['FAQs', '/support#compatibility'],
  ['Blog & News', '/blogs/journal'],
  ['Track package', '/page/order-tracking'],
];

/**
 * @param {HeaderProps}
 */
export function Header({cart, isLoggedIn}) {
  const {t, localize} = useLocale();
  const navRef = useRef(null);
  const location = useLocation();
  const [menu, setMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const closeNav = () => setMenu(null);
  useEffect(() => {setMenu(null);}, [location.key]);
  useEffect(() => {
    const dismiss = (event) => {
      if (!navRef.current?.contains(event.target)) setMenu(null);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      if (navRef.current?.contains(document.activeElement)) document.getElementById(`nav-trigger-${menu}`)?.focus();
      setMenu(null);
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [menu]);
  function disclosure(name, label, panel, icon) {
    return (
      <div className={`header-disclosure header-disclosure--${name}`}
        onPointerEnter={(event) => {if (event.pointerType === 'mouse') setMenu(name);}}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) {
            setMenu((current) => current === name ? null : current);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMenu((current) => current === name ? null : current);
        }}
      >
        <button type="button" id={`nav-trigger-${name}`} aria-expanded={menu === name}
          aria-controls={`nav-panel-${name}`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setMenu(name);
              requestAnimationFrame(() => document.querySelector(`#nav-panel-${name} :is(a, button)`)?.focus());
            }
          }}
          onClick={(event) => {
            if (event.detail > 0 && event.nativeEvent.pointerType === 'mouse') setMenu(name);
            else setMenu(menu === name ? null : name);
          }}
        >
          {icon && <HeaderIcon name={icon} />} {t(label)} <i className="header-chevron" aria-hidden="true" />
        </button>
        <div className="header-disclosure-panel" id={`nav-panel-${name}`} hidden={menu !== name}>
          {panel}
        </div>
      </div>
    );
  }
  const navLinks = (links) => links.map(([title, url]) => (
    <NavLink key={title} to={localize(url)} onClick={closeNav}>{t(title)}</NavLink>
  ));
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
      <div className="market-nav" ref={navRef}>
        {disclosure('categories', 'All Categories', (
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
                  onPointerEnter={(event) => {if (event.pointerType === 'mouse') setActiveCategory(index);}}
                  onFocus={() => setActiveCategory(index)}
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
                        onClick={closeNav}
                      >
                        {t(title)}
                        <span aria-hidden="true">↗</span>
                      </NavLink>
                    ))}
                  </div>
                  <NavLink
                    className="mega-directory-link"
                    to={localize('/collections')}
                    onClick={closeNav}
                  >
                    {t('View all collections \u2192')}
                  </NavLink>
                </section>
              ))}
            </div>
          </div>
        ), 'menu')}
        <nav className="header-primary-links" aria-label={t('Main navigation')}>
          {navLinks(primaryLinks.slice(0, 3))}
          <span className="header-wide-links">{navLinks(primaryLinks.slice(3))}</span>
        </nav>
        {disclosure('more', 'More', navLinks(primaryLinks.slice(3)))}
        {disclosure('support', 'Support Center', navLinks(supportLinks))}
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
      {[...primaryLinks, ...supportLinks].map(([title, url]) => (
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
