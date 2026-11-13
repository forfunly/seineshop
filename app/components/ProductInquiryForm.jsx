import {useCallback, useEffect, useRef, useState} from 'react';
import {
  BUSINESS_ERRORS,
  fieldKind,
  validateInquiry,
} from '~/lib/business-tools';
import {SALES_EMAIL} from '~/lib/wholesale';
import {useLocale} from '~/lib/i18n';

export async function formRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    if (!response.ok || data.success === false)
      return {
        ok: false,
        code: data.code || 'unavailable',
        retryAfter: response.headers.get('Retry-After'),
      };
    return {ok: true, data};
  } catch {
    return {
      ok: false,
      code: options?.method === 'POST' ? 'uncertain' : 'unavailable',
    };
  }
}

export function ProductInquiryForm({
  product,
  variant,
  quantity,
  type,
  openRequest,
  onCancel,
}) {
  const {t, localize} = useLocale();
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [received, setReceived] = useState('');
  const [lines, setLines] = useState([]);
  const [variants, setVariants] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const [serviceType, setServiceType] = useState(type);
  const attempt = useRef(null);
  const pending = useRef(false);
  const errorRef = useRef(null);
  const lastOpen = useRef(null);
  const endpoint = localize('/api/business-inquiry');

  const loadSetup = useCallback(async () => {
    setSetup(null);
    setLoading(true);
    setError('');
    const response = await formRequest(
      `${endpoint}?handle=${encodeURIComponent(product.handle)}`,
    );
    setLoading(false);
    if (!response.ok) {
      setError(response.code);
      return;
    }
    setSetup(response.data);
    setVariants(response.data.product.variants.nodes);
    setCursor(
      response.data.product.variants.pageInfo.hasNextPage
        ? response.data.product.variants.pageInfo.endCursor
        : null,
    );
  }, [endpoint, product.handle]);

  useEffect(() => {
    if (!openRequest || lastOpen.current === openRequest) return;
    lastOpen.current = openRequest;
    if (!attempt.current && !pending.current) {
      setServiceType(openRequest.type || type);
      setLines(
        variant
          ? [
              {
                variantId: variant.id,
                quantity: String(Math.max(1, Number(quantity) || 1)),
                title: variant.title,
                sku: variant.sku,
              },
            ]
          : [],
      );
    }
    if (!attempt.current) void loadSetup();
  }, [openRequest, variant, quantity, type, setup, loadSetup]);

  useEffect(() => {
    if (error && !loading) errorRef.current?.focus({preventScroll: true});
  }, [error, loading]);

  const loadMore = async () => {
    setMoreBusy(true);
    const response = await formRequest(
      `${endpoint}?handle=${encodeURIComponent(product.handle)}&after=${encodeURIComponent(cursor)}`,
    );
    setMoreBusy(false);
    if (!response.ok) {
      setError(response.code);
      return;
    }
    setVariants((current) => [
      ...new Map(
        [...current, ...response.data.product.variants.nodes].map((item) => [
          item.id,
          item,
        ]),
      ).values(),
    ]);
    const page = response.data.product.variants.pageInfo;
    setCursor(page.hasNextPage ? page.endCursor : null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!setup || pending.current || received) return;
    let payload = attempt.current?.payload;
    if (!payload) {
      const form = new FormData(event.currentTarget);
      const customFields = Object.fromEntries(
        setup.config.fields.map((field) => {
          const kind = fieldKind(field);
          return [
            field.label,
            String(
              form.get(
                kind === 'name'
                  ? 'customerName'
                  : kind === 'email'
                    ? 'customerEmail'
                    : kind === 'company'
                      ? 'company'
                      : `custom-${field.id}`,
              ) || '',
            ).trim(),
          ];
        }),
      );
      customFields['Company Name'] = String(form.get('company') || '').trim();
      customFields['Phone / WhatsApp'] = String(form.get('phone') || '').trim();
      payload = {
        customerName: String(form.get('customerName') || ''),
        customerEmail: String(form.get('customerEmail') || ''),
        productId: product.id,
        productHandle: product.handle,
        customFields,
        lineItems: lines.map((line) => ({
          variantId: line.variantId,
          quantity: Number(line.quantity),
        })),
        note: [
          `Service type: ${serviceType}`,
          `Requirements: ${String(form.get('requirements') || '').trim()}`,
          `Phone / WhatsApp: ${String(form.get('phone') || '').trim()}`,
          `Sample link: ${String(form.get('sampleLink') || '').trim()}`,
          `Delivery country / target market: ${String(form.get('destination') || '').trim()}`,
        ].join('\n'),
      };
      const invalid = validateInquiry(payload, setup.config);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    if (!attempt.current)
      attempt.current = {operationId: crypto.randomUUID(), payload};
    pending.current = true;
    setBusy(true);
    setError('');
    const response = await formRequest(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Seine-CSRF': setup.csrf},
      body: JSON.stringify(attempt.current),
    });
    pending.current = false;
    setBusy(false);
    if (response.ok) {
      setReceived(response.data.inquiryId);
      return;
    }
    // Validation failures happen before creation. Ambiguous outcomes retain the immutable request.
    if (
      response.code === 'invalid' ||
      response.code === 'moq' ||
      response.code === 'forbidden'
    )
      attempt.current = null;
    setError(response.code);
  };

  if (received)
    return (
      <div className="business-confirmation" role="status">
        <h3>{t('Your inquiry has been received.')}</h3>
        <p>
          {t('Inquiry reference')}: <strong>{received}</strong>
        </p>
        <p>
          {t(
            'We will review your requirements and contact you with a quotation. This is not a confirmed order.',
          )}
        </p>
      </div>
    );
  const locked = busy || !!attempt.current;
  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      aria-busy={busy || loading}
    >
      {error && (
        <div
          ref={errorRef}
          className="business-form-error"
          role="alert"
          tabIndex={-1}
        >
          <p>{t(BUSINESS_ERRORS[error] || BUSINESS_ERRORS.unavailable)}</p>
          {attempt.current && (
            <p>
              {t(
                'Your original inquiry is saved in this open form. Retry without changing its contents.',
              )}
            </p>
          )}
        </div>
      )}
      {loading && <p role="status">{t('Loading inquiry options…')}</p>}
      <p className="business-form-help">
        {t('For wholesale and business inquiries.')}
      </p>
      <fieldset disabled={locked || !setup} className="business-form-fields">
        <legend>{t('Product options and quantities')}</legend>
        {lines.map((line, index) => (
          <div className="inquiry-variant-row" key={line.variantId}>
            <div>
              <strong>{t(line.title)}</strong>
              <small>{line.sku || ''}</small>
            </div>
            <label>
              <span className="sr-only">
                {t('Quantity')} {line.title}
              </span>
              <input
                aria-label={`${t('Quantity')} ${line.title}`}
                type="number"
                min="1"
                max="2147483647"
                step="1"
                required
                value={line.quantity}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((item, i) =>
                      i === index
                        ? {...item, quantity: event.target.value}
                        : item,
                    ),
                  )
                }
              />
            </label>
            {lines.length > 1 && (
              <button
                type="button"
                aria-label={`${t('Remove option')} ${line.title}`}
                onClick={() =>
                  setLines((current) => current.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
        {setup && (
          <>
            <details className="inquiry-extra-options">
              <summary>{t('Add another option')}</summary>
              <label>
                <span className="sr-only">{t('Add another option')}</span>
                <select
                  value=""
                  onChange={(event) => {
                    const next = variants.find(
                      (item) => item.id === event.target.value,
                    );
                    if (next)
                      setLines((current) => [
                        ...current,
                        {
                          variantId: next.id,
                          title: next.title,
                          sku: next.sku,
                          quantity: '1',
                        },
                      ]);
                  }}
                >
                  <option value="">{t('Select an option')}</option>
                  {variants
                    .filter(
                      (item) =>
                        !lines.some((line) => line.variantId === item.id),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} {item.sku ? `· ${item.sku}` : ''}
                      </option>
                    ))}
                </select>
              </label>
              {cursor && (
                <button
                  type="button"
                  disabled={moreBusy}
                  onClick={() => {
                    void loadMore();
                  }}
                >
                  {t(moreBusy ? 'Loading…' : 'Load more options')}
                </button>
              )}
            </details>
            <p className="business-form-help">
              {t('Minimum total quantity')}: {setup.config.moq} ·{' '}
              {t('Selected total')}:{' '}
              {lines.reduce(
                (sum, line) => sum + (Number(line.quantity) || 0),
                0,
              )}
            </p>
          </>
        )}
        <label>
          {t('Service type')} *
          <select
            name="serviceType"
            required
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          >
            {['Wholesale', 'OEM', 'ODM'].map((mode) => (
              <option value={mode} key={mode}>
                {t(mode)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Your requirements')} *
          <textarea
            name="requirements"
            rows={3}
            required
            maxLength={1500}
            placeholder={t(
              'Quantity by variant, logo, packaging, specifications and preferred delivery date…',
            )}
          />
        </label>
        <div className="pdp-inquiry-fields">
          <label>
            {t('Email address')} *
            <input
              name="customerEmail"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            {t('Phone / WhatsApp')} *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={60}
              placeholder={t('Include country code')}
            />
          </label>
          <label>
            {t('Your name')} *
            <input
              name="customerName"
              autoComplete="name"
              required
              maxLength={150}
            />
          </label>
          <label>
            {t('Company name')} *
            <input
              name="company"
              autoComplete="organization"
              required
              maxLength={500}
            />
          </label>
          <label>
            {t('Sample link (optional)')}
            <input
              name="sampleLink"
              type="url"
              pattern="https?://.+"
              maxLength={1000}
              placeholder="https://"
            />
          </label>
          <label>
            {t('Delivery country / target market (optional)')}
            <input
              name="destination"
              autoComplete="country-name"
              maxLength={120}
            />
          </label>
        </div>
        {setup?.config.fields
          .filter((field) => !field.kind)
          .map((field) => (
            <label key={field.id}>
              {t(field.label)}
              {field.required ? ' *' : ''}
              {field.fieldType === 'textarea' ? (
                <textarea
                  name={`custom-${field.id}`}
                  required={field.required}
                  maxLength={5000}
                  rows={3}
                />
              ) : field.fieldType === 'select' ? (
                <select name={`custom-${field.id}`} required={field.required}>
                  <option value="">{t('Please select')}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={`custom-${field.id}`}
                  type={field.fieldType}
                  min={field.fieldType === 'number' ? '0' : undefined}
                  required={field.required}
                  maxLength={5000}
                />
              )}
            </label>
          ))}
        <div className="inquiry-attachment-help">
          <strong>{t('Screenshots or files')}</strong>
          <p>
            {t(
              'Send attachments by email and include your inquiry reference after submitting.',
            )}{' '}
            <a href={`mailto:${SALES_EMAIL}`}>{t('Email attachments')} ↗</a>
          </p>
        </div>
      </fieldset>
      <p className="pdp-business-note">
        {t(
          'Submit your requirements online. Prices, customization and delivery will be confirmed in our quotation.',
        )}
      </p>
      <div className="business-form-actions">
        <button
          type="button"
          className="business-cancel-button"
          onClick={onCancel}
        >
          {t('Cancel')}
        </button>
        <button
          className="pdp-inquiry-button"
          disabled={!setup || busy}
          type="submit"
        >
          {t(
            busy
              ? 'Submitting…'
              : attempt.current
                ? 'Retry original inquiry'
                : 'Submit inquiry',
          )}
        </button>
      </div>
      {!setup && !loading && (
        <button
          type="button"
          className="business-text-button"
          onClick={() => {
            void loadSetup();
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
  );
}
