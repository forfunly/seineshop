export const supportLinks = [
  ['Contact Us', '/help/contact'],
  ['FAQs', '/help/faq'],
  ['Seine Shop API', '/help/api'],
  ['Blog & News', '/blogs/journal'],
  ['Get Coupons', '/help/coupons'],
  ['Why Choose Us', '/help/why-choose-us'],
  ['AI Assistant Setup Guide', '/help/ai-assistant-setup-guide'],
];

export const helpPages = {
  contact: {title: 'Contact Us', description: 'Get help with a Seine Shop order, product or wholesale inquiry.'},
  faq: {title: 'FAQs', description: 'Find Seine Shop answers about orders, shipping, returns and product compatibility.'},
  api: {title: 'Seine Shop API', description: 'Developer information for accessing published Seine Shop catalog information.'},
  coupons: {title: 'Get Coupons', description: 'Check current Seine Shop offers and how to apply a discount at checkout.'},
  'why-choose-us': {title: 'Why Choose Us', description: 'Explore how Seine Shop helps shoppers and wholesale buyers choose mobile accessories.'},
  'ai-assistant-setup-guide': {title: 'AI Assistant Setup Guide', description: 'Use public Seine Shop catalog information with your AI assistant.'},
};

export function helpPage(handle) {
  return Object.hasOwn(helpPages, handle) ? helpPages[handle] : undefined;
}

// An empty offer page is intentionally excluded until public offers exist.
export const indexableHelpPaths = ['/help/contact', '/help/faq', '/help/api', '/help/why-choose-us', '/help/ai-assistant-setup-guide'];
