import {useEffect, useRef, useState} from 'react';
import {BUSINESS_ERRORS} from '~/lib/business-tools';
import {SALES_EMAIL} from '~/lib/wholesale';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';
import {formRequest} from './ProductInquiryForm';

export function ProductRating({summary}) {
  const {t, locale} = useLocale();
  if (!summary)
    return (
      <a className="pdp-rating-link" href="#product-reviews">
        {t('Customer reviews')}
      </a>
    );
  return (
    <a className="pdp-rating-link" href="#product-reviews">
      {summary.total_reviews > 0 ? (
        <>
          <span className="review-stars" aria-hidden="true">
            ★
          </span>
          <strong>
            {new Intl.NumberFormat(locale.code, {
              maximumFractionDigits: 1,
            }).format(summary.average_rating)}{' '}
            / 5
          </strong>
          <span>
            ({summary.total_reviews} {t('reviews')})
          </span>
        </>
      ) : (
        <span>{t('No reviews yet')}</span>
      )}
    </a>
  );
}

export function ProductReviews({product, initialData}) {
  const {t, localize, locale} = useLocale();
  const [data, setData] = useState(initialData);
  const [overallSummary, setOverallSummary] = useState(initialData?.summary);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [listError, setListError] = useState(false);
  const [setup, setSetup] = useState(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [files, setFiles] = useState([]);
  const [rating, setRating] = useState(0);
  const pending = useRef(false);
  const uploads = useRef({tempId: '', files: new Map()});
  const sequence = useRef(0);
  const errorRef = useRef(null);
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} =
    useModalDialog();
  const endpoint = localize('/api/product-reviews');
  useEffect(() => {
    sequence.current++;
    setData(initialData);
    setOverallSummary(initialData?.summary);
    setFilter('');
    setListError(false);
    setLoading(false);
  }, [initialData]);
  useEffect(() => {
    if (error) errorRef.current?.focus({preventScroll: true});
  }, [error]);

  const loadPage = async (page, rating) => {
    const id = ++sequence.current;
    setLoading(true);
    setListError(false);
    const response = await formRequest(
      `${endpoint}?${new URLSearchParams({handle: product.handle, page: String(page), rating})}`,
    );
    if (id !== sequence.current) return;
    setLoading(false);
    if (!response.ok || response.data.status !== 'ready') {
      setListError(true);
      return;
    }
    if (!rating) setOverallSummary(response.data.summary);
    setData(response.data);
    setFilter(rating);
  };

  const open = async () => {
    openDialog();
    if (success || busy) return;
    setSetup(null);
    setSetupBusy(true);
    setError('');
    const response = await formRequest(
      `${endpoint}?intent=setup&handle=${encodeURIComponent(product.handle)}`,
    );
    setSetupBusy(false);
    if (!response.ok) {
      setError(response.code);
      return;
    }
    setSetup(response.data);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!setup || pending.current || success || uncertain) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    pending.current = true;
    setBusy(true);
    setError('');
    let tempId = uploads.current.tempId;
    const tokens = [];
    for (const file of files) {
      if (uploads.current.files.has(file)) {
        tokens.push(uploads.current.files.get(file));
        continue;
      }
      const media = new FormData();
      media.set('intent', 'media');
      media.set('file', file);
      media.set('productId', product.id);
      media.set('productHandle', product.handle);
      if (tempId) media.set('tempId', tempId);
      const response = await formRequest(endpoint, {
        method: 'POST',
        headers: {'X-Seine-CSRF': setup.csrf},
        body: media,
      });
      if (!response.ok) {
        pending.current = false;
        setBusy(false);
        setError(response.code);
        return;
      }
      tokens.push(response.data.token);
      tempId = response.data.tempId;
      uploads.current.files.set(file, response.data.token);
      uploads.current.tempId = tempId;
    }
    form.set('productId', product.id);
    form.set('productHandle', product.handle);
    for (const token of tokens) form.append('mediaToken', token);
    const response = await formRequest(endpoint, {
      method: 'POST',
      headers: {'X-Seine-CSRF': setup.csrf},
      body: form,
    });
    pending.current = false;
    setBusy(false);
    if (!response.ok) {
      setError(response.code);
      setUncertain(response.code === 'uncertain');
      return;
    }
    element.reset();
    setRating(0);
    setFiles([]);
    setSuccess(true);
  };

  return (
    <section
      className="product-reviews"
      id="product-reviews"
      aria-labelledby="product-reviews-heading"
    >
      <div className="product-reviews-heading">
        <div>
          <h2 id="product-reviews-heading">
            {t('Customer reviews')}
            {data?.status === 'ready' && overallSummary && (
              <span className="reviews-count">
                {' '}
                ({overallSummary.total_reviews})
              </span>
            )}
          </h2>
          {data?.status === 'ready' && overallSummary?.total_reviews > 0 && (
            <ProductRating summary={overallSummary} />
          )}
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="pdp-quote-entry"
          onClick={() => {
            void open();
          }}
        >
          {t('Write a review')}
        </button>
      </div>
      <div aria-busy={loading}>
        {data?.status === 'ready' ? (
          <>
            {(overallSummary?.total_reviews > 0 || filter) && (
              <label className="reviews-filter">
                {t('Filter by rating')}
                <select
                  disabled={loading}
                  value={filter}
                  onChange={(event) => {
                    void loadPage(1, event.target.value);
                  }}
                >
                  <option value="">{t('All ratings')}</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option value={rating} key={rating}>
                      {rating} / 5
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!data.reviews.length && (
              <div className="reviews-empty">
                <h3>
                  {t(
                    filter ? 'No reviews match this rating.' : 'No reviews yet',
                  )}
                </h3>
                {!filter && (
                  <p>{t('Share your experience with this product.')}</p>
                )}
              </div>
            )}
            <div className="reviews-list">
              {data.reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-card-header">
                    <strong>{review.nickname || t('Anonymous')}</strong>
                    {review.date && (
                      <time dateTime={review.date}>
                        {new Intl.DateTimeFormat(locale.code, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC',
                        }).format(new Date(review.date))}
                      </time>
                    )}
                  </div>
                  <p
                    className="review-stars"
                    aria-label={`${review.rating} / 5`}
                  >
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </p>
                  {review.title && <h3>{review.title}</h3>}
                  <p className="review-content">{review.content}</p>
                  {!!review.media.length && (
                    <div className="review-media">
                      {review.media.map((media) => (
                        <a
                          href={media.src}
                          key={media.src}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={media.src}
                            alt={t('Customer photo')}
                            width="112"
                            height="112"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
            {(data.page > 1 || data.hasNextPage) && (
              <nav
                className="reviews-pagination"
                aria-label={t('Review pages')}
              >
                <button
                  type="button"
                  disabled={loading || data.page === 1}
                  onClick={() => {
                    void loadPage(data.page - 1, filter);
                  }}
                >
                  {t('Previous')}
                </button>
                <span>
                  {t('Page')} {data.page}
                </span>
                <button
                  type="button"
                  disabled={loading || !data.hasNextPage}
                  onClick={() => {
                    void loadPage(data.page + 1, filter);
                  }}
                >
                  {t('Next')}
                </button>
              </nav>
            )}
          </>
        ) : (
          <p>
            {t('Reviews are temporarily unavailable. Please try again later.')}
          </p>
        )}
        {listError && (
          <p role="alert">
            {t('Reviews are temporarily unavailable. Please try again later.')}
          </p>
        )}
        {(listError || data?.status !== 'ready') && (
          <button
            type="button"
            className="business-text-button"
            disabled={loading}
            onClick={() => {
              void loadPage(1, filter);
            }}
          >
            {t(loading ? 'Loading…' : 'Try again')}
          </button>
        )}
      </div>
      <dialog
        ref={dialogRef}
        className="pdp-inquiry-dialog review-dialog"
        aria-labelledby="write-review-heading"
      >
        <div className="pdp-inquiry-content">
          <div className="pdp-inquiry-heading">
            <h2 id="write-review-heading">{t('Write a review')}</h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDialog}
              aria-label={t('Close')}
            >
              ×
            </button>
          </div>
          <p>{product.title}</p>
          {success ? (
            <div className="business-confirmation" role="status">
              <h3>{t('Thank you for your review.')}</h3>
              <p>
                {t(
                  'Your review has been received. It will appear according to our review approval settings.',
                )}
              </p>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                void submit(event);
              }}
              aria-busy={busy || setupBusy}
            >
              {error && (
                <div
                  className="business-form-error"
                  ref={errorRef}
                  role="alert"
                  tabIndex={-1}
                >
                  {t(BUSINESS_ERRORS[error] || BUSINESS_ERRORS.unavailable)}
                </div>
              )}
              {setupBusy && <p role="status">{t('Loading review form…')}</p>}
              <fieldset
                disabled={busy || uncertain || !setup}
                className="business-form-fields"
              >
                <legend className="sr-only">{t('Your review')}</legend>
                <fieldset className="review-rating-picker">
                  <legend>{t('Your rating')} *</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label
                        key={value}
                        className={value <= rating ? 'is-filled' : ''}
                      >
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          required
                          checked={rating === value}
                          onChange={() => setRating(value)}
                        />
                        <span aria-hidden="true">★</span>
                        <span className="sr-only">{value} / 5</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="pdp-inquiry-fields">
                  <label>
                    {t('Display name')}
                    {setup?.settings.requireName ? ' *' : ''}
                    <input
                      name="nickname"
                      autoComplete="nickname"
                      required={setup?.settings.requireName}
                      maxLength={150}
                    />
                  </label>
                  <label>
                    {t('Email address')} *
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>
                </div>
                <p className="business-form-help">
                  {t('Your email address will not be displayed publicly.')}
                </p>
                <label>
                  {t('Review title')}
                  {setup?.settings.requireTitle ? ' *' : ''}
                  <input
                    name="title"
                    required={setup?.settings.requireTitle}
                    maxLength={300}
                  />
                </label>
                <label>
                  {t('Your review')}
                  {setup?.settings.requireFeedback ? ' *' : ''}
                  <textarea
                    name="content"
                    rows={5}
                    maxLength={16000}
                    required={setup?.settings.requireFeedback}
                  />
                </label>
                {setup?.settings.allowPhotos !== false && (
                  <label>
                    {t('Photos (optional)')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={(event) => {
                        const next = [...event.target.files];
                        if (
                          next.length > 6 ||
                          next.some(
                            (file) =>
                              file.size > 2 * 1024 * 1024 ||
                              !/^image\/(jpeg|png|webp|gif)$/.test(file.type),
                          )
                        ) {
                          event.target.value = '';
                          setFiles([]);
                          setError('media');
                        } else {
                          setFiles(next);
                          uploads.current = {tempId: '', files: new Map()};
                          setError('');
                        }
                      }}
                    />
                    <small>{t('Up to 6 images, 2 MB each.')}</small>
                  </label>
                )}
              </fieldset>
              <button
                type="submit"
                className="pdp-inquiry-button"
                disabled={busy || uncertain || !setup}
              >
                {t(busy ? 'Submitting…' : 'Submit review')}
              </button>
              {!setup && !setupBusy && (
                <button
                  type="button"
                  className="business-text-button"
                  onClick={() => {
                    void open();
                  }}
                >
                  {t('Try again')}
                </button>
              )}
              <p className="business-form-help">
                {t('Or contact Steven')}:{' '}
                <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
              </p>
            </form>
          )}
        </div>
      </dialog>
    </section>
  );
}
