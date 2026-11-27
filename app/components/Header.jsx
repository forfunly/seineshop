import {GlobalSearch} from '~/components/GlobalSearch';
import {CategoryIcon} from '~/components/CategoryIcon';
import {HeaderIcon} from '~/components/HeaderIcon';
import {MarketSelector} from '~/components/MarketSelector';
import {useLocale} from '~/lib/i18n';
import {Suspense, useRef, useEffect, useState} from 'react';
import {supportLinks} from '~/data/header-destinations';
import {useWishlist} from '~/lib/wishlist';
import {catalogNavGroups, catalogSections} from '~/data/catalog-sections';
import {categories} from '~/data/navigation';
import {navigationColumns} from '~/data/collection-navigation';
import {Await, Link, NavLink, useAsyncValue, useLocation, useRouteLoaderData} from 'react-router';
import {Money, useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

const collectionLinks = (sections) => sections.map(([title, handle]) => [title, `/collections/${handle}`]);
const primaryLinks = collectionLinks(catalogSections);


/**
 * @param {HeaderProps}
 */
export function Header({cart, isLoggedIn}) {
  const {t, localize} = useLocale();
  const localPreview = useRouteLoaderData('root')?.localNavigationPreview;
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();
  const [scrollHidden, setScrollHidden] = useState(false);
  const [menu, setMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const closeNav = () => setMenu(null);
  useEffect(() => {setMenu(null); setScrollHidden(false);}, [location.key]);
  useEffect(() => {
    let previous = Math.max(0, window.scrollY);
    const syncVisibility = () => {
      const current = Math.max(0, window.scrollY);
      if (current === previous) return;
      const focused = headerRef.current?.contains(document.activeElement);
      setScrollHidden(!focused && current > 120 && current > previous);
      previous = current;
    };
    window.addEventListener('scroll', syncVisibility, {passive: true});
    return () => window.removeEventListener('scroll', syncVisibility);
  }, []);
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
  function disclosure(name, label, panel, icon = undefined) {
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
          aria-controls={`nav-panel-${name}`} aria-label={name === 'more' ? t('More navigation') : undefined}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setMenu(name);
              requestAnimationFrame(() => {
                const target = document.querySelector(`#nav-panel-${name} :is(a, button)`);
                if (target instanceof HTMLElement) target.focus();
              });
            }
          }}
          onClick={(event) => {
            if (event.detail > 0 && 'pointerType' in event.nativeEvent && event.nativeEvent.pointerType === 'mouse') setMenu(name);
            else setMenu(menu === name ? null : name);
          }}
        >
          {icon && <HeaderIcon name={icon} />} {name === 'more' ? '…' : t(label)} {name !== 'more' && <i className="header-chevron" aria-hidden="true" />}
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
    <header ref={headerRef}
      className={`market-header${scrollHidden ? ' market-header--scroll-hidden' : ''}`}
      onFocusCapture={() => setScrollHidden(false)}
    >
      <a className="skip-content" href={localize('#main-content')}>
        {t('Skip to content')}
      </a>
      <div className="utility-bar">
        <span>{t('Everyday tech, thoughtfully chosen.')}</span>
        <a href="mailto:hello@seineshop.com">
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
                  <NavigationFamilies category={category} localPreview={localPreview} close={closeNav} />
                </section>
              ))}
            </div>
          </div>
        ), 'menu')}
        <nav className="header-primary-links" aria-label={t('Main navigation')}>
          {navLinks(collectionLinks(catalogNavGroups.featured))}
          {disclosure('more', 'More navigation', navLinks(collectionLinks(catalogNavGroups.overflow)))}
          {navLinks(collectionLinks(catalogNavGroups.brands))}
        </nav>
        {disclosure('support', 'Support Center', navLinks(supportLinks))}
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
        <NavLink className="mega-family-heading" to={localize(`/collections/${handle}`)} onClick={close}>{t(title)}</NavLink>
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
          <NavigationFamilies category={category} localPreview={localPreview} close={close} />
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
function HeaderActionPopover({className = '', label, name, href, onClick = undefined, children, badge = 0}) {
  const {t, localize} = useLocale();
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {setOpen(false);}, [location.key]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {if (!wrapper.current?.contains(event.target)) setOpen(false);};
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      if (wrapper.current?.contains(document.activeElement)) trigger.current?.focus();
      setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape);};
  }, [open]);
  return <div ref={wrapper} className="header-action-popover" onPointerEnter={(event) => {if (event.pointerType === 'mouse') setOpen(true);}}
    onPointerLeave={(event) => {if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) setOpen(false);}}
    onBlur={(event) => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}>
    <Link ref={trigger} className={`header-action ${className}`} to={localize(href)} aria-label={t(label)} onClick={(event) => {setOpen(false); onClick?.(event);}}
      onKeyDown={(event) => {if (event.key === 'ArrowDown') {event.preventDefault(); setOpen(true); requestAnimationFrame(() => wrapper.current?.querySelector('.header-action-menu a')?.focus());}}}>
      <span className="header-action-icon"><HeaderIcon name={name} />{badge > 0 && <span className="header-cart-count" aria-hidden="true">{badge}</span>}</span>
    </Link>
    <div className="header-action-menu" hidden={!open}>{children}</div>
  </div>;
}
function AccountLink({loggedIn = false}) {
  const {t, localize} = useLocale();
  return <HeaderActionPopover className="header-account" name="user" href={loggedIn ? '/account' : '/account/login'} label={loggedIn ? 'My account' : 'Sign in / Register'}>
    <div className="header-action-menu-title"><strong>{t(loggedIn ? 'My account' : 'Welcome')}</strong></div>
    {!loggedIn && <div className="header-account-signin"><a href={localize('/account/login')}>{t('Sign in')}</a><a href={localize('/account/register')}>{t('Register for Free')}</a></div>}
    {loggedIn && <Link to={localize('/account/profile')}>{t('My account')}</Link>}
    <Link to={localize('/account/orders')}>{t('My Orders')}</Link>
    <Link to={localize('/account/credits')}>{t('Account Credits')}</Link>
    <Link to={localize('/help/coupons')}>{t('My Coupons')}</Link>
    <Link to={localize('/downloads')}>{t('Images Download List')}</Link>
  </HeaderActionPopover>;
}
function WishlistLink() {
  const {t, localize} = useLocale();
  const count = useWishlist().length;
  return <HeaderActionPopover name="heart" href="/wishlist" label={`${t('Wishlist')} (${count})`} badge={count}>
    <div className="header-action-menu-title"><strong>{t('Wishlist')}</strong><span>{count} {t('Items')}</span></div>
    <Link to={localize('/wishlist')}>{t('View wishlist')}</Link>
  </HeaderActionPopover>;
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
      <WishlistLink />
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
function CartBadge({count, summary = null}) {
  const {t, localize} = useLocale();
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return <HeaderActionPopover name="trolley" className="header-cart" href="/cart" label={`${t('Cart')} (${count})`} badge={count}
    onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); open('cart');
      publish('cart_viewed', {cart, prevCart, shop, url: window.location.href});
    }}>
    <div className="header-action-menu-title"><strong>{t('Cart')}</strong><span>{count} {t('Items')}</span></div>
    {summary?.lines?.nodes?.slice(0, 3).map((line) => <Link key={line.id} to={localize(`/products/${line.merchandise.product.handle}`)}>{line.quantity} × {line.merchandise.product.title}</Link>)}
    {summary?.cost?.subtotalAmount && <div className="header-action-menu-title"><span>{t('Subtotal')}</span><Money data={summary.cost.subtotalAmount} /></div>}
    <Link to={localize('/cart')}>{t('View cart')}</Link>
  </HeaderActionPopover>;
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
  return <CartBadge count={cart?.totalQuantity ?? 0} summary={cart} />;
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
