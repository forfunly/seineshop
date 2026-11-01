import {useLocation} from 'react-router';
import {localeFromPath, localizePath, LOCALES, stripLocale} from './locale';
import messages from '../locales/messages.json';
/** @returns {any} */
export function translate(value, code) {
  if (typeof value !== 'string' || code === 'en') return value;
  if (messages[value]?.[code]) return messages[value][code];
  const ja = code === 'ja';
  /** @type {Array<{pattern: RegExp, render: (match: RegExpMatchArray) => string}>} */
  const patterns = [
    {
      pattern: /^Welcome, (.+)$/,
      render: (m) => (ja ? `${m[1]}さん、ようこそ` : `Willkommen, ${m[1]}`),
    },
    {
      pattern: /^(.+) guides & comparisons$/i,
      render: (m) =>
        ja ? `${m[1]}のガイド・比較` : `${m[1]}: Ratgeber & Vergleiche`,
    },
    {
      pattern: /^Read (.+)$/,
      render: (m) =>
        ja
          ? `${messages[m[1]]?.[code] || m[1]}を読む`
          : `${messages[m[1]]?.[code] || m[1]} lesen`,
    },
    {
      pattern: /^Up to (.+)$/,
      render: (m) => (ja ? `最大${m[1]}` : `Bis zu ${m[1]}`),
    },
    {
      pattern: /^\(items: (\d+)\)$/,
      render: (m) => (ja ? `（${m[1]}点）` : `(${m[1]} Artikel)`),
    },
    {
      pattern: /^Remove gift card ending in (.+)$/,
      render: (m) =>
        ja
          ? `末尾${m[1]}のギフトカードを削除`
          : `Gutschein mit Endung ${m[1]} entfernen`,
    },
    {
      pattern:
        /^Explore (.+) at SeineShop\. Compare product specifications, materials and compatibility to find the right choice for your everyday needs\.$/,
      render: () =>
        ja
          ? `SeineShopのコレクションから、毎日に合うアイテムを。仕様、素材、対応機種を比較してお選びください。`
          : `Entdecke die SeineShop-Kollektion. Vergleiche Spezifikationen, Materialien und Kompatibilität für deinen Alltag.`,
    },
  ];
  for (const {pattern, render} of patterns) {
    const match = value.match(pattern);
    if (match) return render(match);
  }
  return value;
}
export function useLocale() {
  const {pathname} = useLocation();
  const locale = localeFromPath(pathname);
  return {
    locale,
    t: (value) => translate(value, locale.code),
    localize: (path) => localizePath(path, locale),
  };
}
export function LanguageSelector() {
  const {pathname, search} = useLocation();
  const {locale} = useLocale();
  const languageSearch = stripLocale(pathname).startsWith('/products/')
    ? ''
    : search;
  return (
    <nav className="language-selector" aria-label="Language">
      {LOCALES.map((item) => (
        <a
          key={item.code}
          href={`${localizePath(pathname, item)}${languageSearch}`}
          lang={item.code}
          aria-current={locale.code === item.code ? 'true' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
