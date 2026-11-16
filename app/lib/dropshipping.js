export const validProductHandle = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,254}$/.test(value);

export function dropshipProductHandle(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['www.seineshop.com', 'seineshop.com'].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/(?:jp\/|de\/)?products\/([a-z0-9][a-z0-9-]{0,254})\/?$/);
    return match ? match[1] : null;
  } catch {return null;}
}

// A login return destination is restricted to this workspace, with one optional product context.
export function dropshipReturnPath(value) {
  if (typeof value !== 'string' || value.length > 350) return null;
  const match = value.match(/^(\/(?:jp\/|de\/)?dropshipping)(?:\?product=([a-z0-9][a-z0-9-]{0,254}))?$/);
  return match ? value : null;
}
