import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {categories} from '~/data/navigation';
export default function Collections() {
  const {t, localize} = useLocale();
  return (
    <div className="collection-directory">
      <nav className="catalog-breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to={localize('/')}>{t('Home')}</Link>
        <span>/</span>
        <span>{t('Collections')}</span>
      </nav>
      <header>
        <p className="eyebrow">{t('FIND YOUR EVERYDAY ESSENTIALS')}</p>
        <h1>{t('Shop by category')}</h1>
        <p>
          {t('Browse by device, product type or the things you use every day.')}
        </p>
        <Link to={localize('/collections/iphone-18-pro-max')}>
          {t('Explore iPhone 18 Pro Max accessories \u2192')}
        </Link>
      </header>
      <nav className="directory-jump" aria-label={t('Jump to category')}>
        {categories.map((c) => (
          <a key={c.handle} href={localize(`#${c.handle}`)}>
            {t(c.title)}
          </a>
        ))}
      </nav>
      <div className="directory-grid">
        {categories.map((c) => (
          <section key={c.handle} id={c.handle}>
            <h2>
              <Link to={localize(c.url)}>
                {t(c.title)} <span aria-hidden="true">↗</span>
              </Link>
            </h2>
            <ul>
              {c.children.map((child) => (
                <li key={child.handle}>
                  <Link to={localize(child.url)}>{t(child.title)}</Link>
                </li>
              ))}
            </ul>
            <Link className="directory-all" to={localize(c.url)}>
              {t('View collection \u2192')}
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
