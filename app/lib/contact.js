export const contactTopics = ['General Inquiry', 'Product Inquiry', 'Existing Order Issues', 'Feedback', 'Wholesale Inquiry'];

export function validContactEmail(value) {
  return typeof value === 'string' && value.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value);
}

export function validateContact(values) {
  const errors = {};
  const fields = {};
  for (const [key, max] of [['name', 100], ['email', 254], ['reference', 100], ['message', 1500], ['topic', 40]]) {
    const value = typeof values[key] === 'string' ? values[key].trim() : '';
    fields[key] = value;
    if ((!value && key !== 'reference') || value.length > max || Array.from(value).some((char) => {const code = char.charCodeAt(0); return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;})) errors[key] = true;
  }
  if (!contactTopics.includes(fields.topic)) errors.topic = true;
  if (!validContactEmail(fields.email)) errors.email = true;
  for (const key of ['name', 'reference']) if (/[\r\n]/.test(fields[key])) errors[key] = true;
  return {fields, errors};
}
