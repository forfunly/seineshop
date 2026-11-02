import {useLocale} from '~/lib/i18n';
import {Pagination} from '@shopify/hydrogen';

/**
 * <PaginatedResourceSection> encapsulates the previous and next pagination behaviors throughout your application.
 * @param {Class<Pagination<NodesType>>['connection']>}
 */
export function PaginatedResourceSection({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
}) {
  const {t} = useLocale();
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({
            node,
            index,
          }),
        );
        return (
          <div>
            <PreviousLink>
              {t(
                isLoading ? (
                  'Loading...'
                ) : (
                  <span>
                    <span aria-hidden="true">↑</span>
                    {t('Load previous')}
                  </span>
                ),
              )}
            </PreviousLink>
            {t(
              resourcesClassName ? (
                <div
                  aria-label={t(ariaLabel)}
                  className={resourcesClassName}
                  role={ariaLabel ? 'region' : undefined}
                >
                  {t(resourcesMarkup)}
                </div>
              ) : (
                resourcesMarkup
              ),
            )}
            <NextLink>
              {t(
                isLoading ? (
                  'Loading...'
                ) : (
                  <span>
                    {t('Load more')}
                    <span aria-hidden="true">↓</span>
                  </span>
                ),
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
