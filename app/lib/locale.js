export const LOCALES = [
  {code: 'en', prefix: '', language: 'EN', label: 'English'},
  {code: 'ja', prefix: '/jp', language: 'JA', label: '日本語'},
  {code: 'de', prefix: '/de', language: 'DE', label: 'Deutsch'},
];
export function localeFromPath(pathname = '/') {
  return (
    LOCALES.find(
      (locale) =>
        locale.prefix &&
        (pathname === locale.prefix ||
          pathname.startsWith(`${locale.prefix}/`)),
    ) || LOCALES[0]
  );
}
export function stripLocale(pathname = '/') {
  return pathname.slice(localeFromPath(pathname).prefix.length) || '/';
}
export function localizePath(path, locale) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//')
  )
    return path;
  if (/^\/(images|assets|sitemaps)(\/|$)|^\/sitemap|^\/robots\.txt/.test(path))
    return path;
  const clean = stripLocale(path);
  return `${locale.prefix}${clean === '/' ? '/' : clean}`;
}
