export const BUSINESS_ERRORS = {
  unavailable:
    'This service is temporarily unavailable. Please try again or contact Steven.',
  unconfigured:
    'Online submission is not available yet. Please contact Steven by email.',
  invalid: 'Please check the required fields, selected options and quantities.',
  forbidden:
    'Your form session has expired. Close and reopen the form, then try again.',
  limited: 'Too many requests. Please wait before trying again.',
  conflict:
    'This inquiry may already have been received. Retry the original submission or contact Steven.',
  uncertain:
    'The result could not be confirmed. Please check before submitting again.',
  media:
    'Choose up to 6 JPG, PNG, WebP or GIF images, each no larger than 2 MB.',
  moq: 'The total quantity must meet the minimum order quantity.',
};

export function numericId(value, kind = 'Product') {
  const text = String(value ?? '');
  const match = text.match(
    new RegExp(`^(?:gid://shopify/${kind}/)?([1-9][0-9]*)$`),
  );
  return match?.[1] || null;
}

export function productRating(product) {
  try {
    if (
      !product.rating?.value &&
      !product.ratingCount?.value &&
      !product.reviewsSummary?.value
    )
      return null;
    const standard = JSON.parse(product.rating?.value || 'null');
    const fallback = JSON.parse(product.reviewsSummary?.value || 'null');
    const count = Number(
      product.ratingCount?.value ?? fallback?.total_reviews ?? 0,
    );
    const average = Number(standard?.value ?? fallback?.average_rating ?? 0);
    return validSummary({total_reviews: count, average_rating: average});
  } catch {
    return null;
  }
}

export function validSummary(summary) {
  const count = Number(summary?.total_reviews);
  const average = Number(summary?.average_rating);
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Number.isFinite(average) ||
    (count > 0 && (average < 1 || average > 5))
  )
    return null;
  return {total_reviews: count, average_rating: count ? average : 0};
}

export function fieldKind(field) {
  const label = String(field.label || '')
    .toLowerCase()
    .trim();
  const text = `${label} ${String(field.id || '').toLowerCase()}`;
  if (/(^|[^a-z])(email|e-mail)([^a-z]|$)/.test(text)) return 'email';
  if (/company|business name/.test(text)) return 'company';
  if (
    /^(?:(?:contact|full|your|customer)\s+)?name$/.test(label) ||
    /^(?:name|fullname|yourname|customername|contactname)$/.test(
      String(field.id || '')
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
    )
  )
    return 'name';
  return null;
}

export function quoteFields(fields = []) {
  if (!Array.isArray(fields)) throw new Error('Invalid form configuration');
  return fields.map((field, index) => {
    if (!field || typeof field.label !== 'string' || !field.label.trim())
      throw new Error('Invalid form field');
    if (
      !['text', 'textarea', 'select', 'number', 'email', 'tel'].includes(
        field.fieldType || 'text',
      )
    )
      throw new Error('Unsupported form field');
    return {
      id: String(field.id || index),
      label: field.label.slice(0, 180),
      fieldType: field.fieldType || 'text',
      required: !!field.required,
      options: Array.isArray(field.options) ? field.options.map(String) : [],
      kind: fieldKind(field),
    };
  });
}

export function validateInquiry(payload, config) {
  if (
    !payload ||
    typeof payload.customerName !== 'string' ||
    !payload.customerName.trim() ||
    payload.customerName.length > 150 ||
    typeof payload.customerEmail !== 'string' ||
    payload.customerEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customerEmail) ||
    !numericId(payload.productId) ||
    !/^[a-zA-Z0-9_-]{1,255}$/.test(payload.productHandle || '') ||
    !Array.isArray(payload.lineItems) ||
    !payload.lineItems.length ||
    payload.lineItems.length > 250 ||
    typeof payload.customFields !== 'object' ||
    !payload.customFields ||
    Array.isArray(payload.customFields) ||
    typeof payload.customFields['Company Name'] !== 'string' ||
    !payload.customFields['Company Name'].trim() ||
    payload.customFields['Company Name'].length > 500 ||
    typeof payload.note !== 'string' ||
    payload.note.length > 5000
  )
    return 'invalid';
  const seen = new Set();
  let total = 0;
  for (const item of payload.lineItems) {
    const id = numericId(item?.variantId, 'ProductVariant');
    if (
      !id ||
      seen.has(id) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    )
      return 'invalid';
    seen.add(id);
    total += item.quantity;
  }
  if (total > 2147483647) return 'invalid';
  if (total < config.moq) return 'moq';
  for (const field of config.fields) {
    const value = payload.customFields[field.label];
    if (field.required && (typeof value !== 'string' || !value.trim()))
      return 'invalid';
    if (
      value &&
      (typeof value !== 'string' ||
        value.length > 5000 ||
        (field.fieldType === 'select' && !field.options.includes(value)) ||
        (field.fieldType === 'number' &&
          (!Number.isFinite(Number(value)) || Number(value) < 0)))
    )
      return 'invalid';
  }
  return null;
}

export function reviewSchema(data) {
  const summary = data?.status === 'ready' && validSummary(data.summary);
  if (!summary?.total_reviews) return {};
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: summary.average_rating,
      reviewCount: summary.total_reviews,
      bestRating: 5,
      worstRating: 1,
    },
    review: data.reviews
      .filter((review) => review.content)
      .slice(0, 5)
      .map((review) => ({
        '@type': 'Review',
        author: {'@type': 'Person', name: review.nickname || 'Anonymous'},
        reviewBody: review.content,
        ...(review.title ? {name: review.title} : {}),
        ...(review.date ? {datePublished: review.date} : {}),
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
  };
}
