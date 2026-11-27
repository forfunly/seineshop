import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useLoaderData} from 'react-router';
import {helpPage, supportLinks} from '~/data/header-destinations';
import {useLocale} from '~/lib/i18n';
import {contactTopics, validateContact} from '~/lib/contact';

const EMAIL = 'hello@seineshop.com';
export const faqTopics = ['Account & Registration', 'Products & Service', 'Your Orders', 'Shipping & Delivery', 'Returns & Refunds', 'Payment, Pricing & Promotions'];
const questions = [
  [0, 'How do I create an account?', 'Open Sign in and follow the email verification steps. Shopify creates your customer account when you first sign in successfully.', '/account/login', 'Sign in'],
  [1, 'How do I check product compatibility?', 'Compare the exact device model, connector and charging standard with the information on the product page.', '/collections', 'Browse collections'],
  [2, 'Where can I find my orders?', 'Sign in with the email used at checkout and open My Orders.', '/account/orders', 'My Orders'],
  [3, 'How do I track my order?', 'Enter the tracking number provided for your shipment on the tracking page.', '/page/order-tracking', 'Track package'],
  [3, 'Where can I see shipping options?', 'Available delivery methods and charges are shown in checkout for your shipping address.', '/policies/shipping-policy', 'Shipping Policy'],
  [4, 'What is the returns policy?', 'Review the published store policies. Include your order number when contacting support.', '/policies', 'View store policies'],
  [5, 'How do I apply a coupon?', 'Enter a valid discount code in Shopify checkout. The checkout shows whether the code applies before you pay.', '/help/coupons', 'Get Coupons'],
];

export function loader({params}) {
  const page = helpPage(params.handle);
  if (!page) throw new Response('Page not found', {status: 404});
  return {page, handle: params.handle};
}

const contactFeedback = {
  accepted: 'Your message has been accepted for sending. Thank you for contacting us.',
  invalid: 'Please check the highlighted fields and submit again.',
  forbidden: 'Your form session has expired. Reload the form and try again.',
  limited: 'Too many attempts. Please wait ten minutes before trying again.',
  conflict: 'This submission reference was already used. Edit your message before submitting again.',
  uncertain: 'We could not confirm the send result. Your message is still here. Retry without changing it to reuse the same submission reference.',
  unavailable: 'We could not send your message. Your details have been kept. Please try again or contact us by email.',
  unconfigured: 'The contact form is temporarily unavailable. Please use the email address shown here.',
};

function Contact() {
  const {t, localize} = useLocale();
  const [topic, setTopic] = useState(contactTopics[0]);
  const [setup, setSetup] = useState(null);
  const [setupError, setSetupError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const pending = useRef(false);
  const attempt = useRef(null);
  const feedbackRef = useRef(null);
  const endpoint = localize('/api/contact');
  const loadSetup = useCallback(async (signal) => {
    setLoading(true);
    setSetupError('');
    try {
      const response = await fetch(endpoint, {cache: 'no-store', credentials: 'same-origin', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000)});
      const data = await response.json();
      if (!response.ok || !data.csrf) throw new Error(data.code || 'unavailable');
      if (!signal?.aborted) setSetup(data);
    } catch (error) {
      if (!signal?.aborted) {setSetup(null); setSetupError(error instanceof Error && error.message === 'unconfigured' ? 'unconfigured' : 'unavailable');}
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    void loadSetup(controller.signal);
    return () => controller.abort();
  }, [loadSetup]);
  useEffect(() => {if (feedback) feedbackRef.current?.focus({preventScroll: true});}, [feedback]);

  async function submit(event) {
    event.preventDefault();
    if (pending.current || !setup) return;
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(['topic', 'name', 'email', 'reference', 'message', 'website'].map((key) => [key, String(formData.get(key) || '')]));
    const {errors} = validateContact(values);
    if (Object.keys(errors).length) {setFeedback({code: 'invalid', errors}); return;}
    const fingerprint = JSON.stringify(values);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = {fingerprint, id: crypto.randomUUID()};
    const submissionId = attempt.current.id;
    pending.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({...values, csrf: setup.csrf, submissionId}),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      const code = response.ok && data.code === 'accepted' && data.submissionId === submissionId ? 'accepted' : response.ok ? 'uncertain' : data.code || 'unavailable';
      setFeedback({code, errors: data.errors});
    } catch {
      setFeedback({code: 'uncertain'});
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const errorFor = (name) => feedback?.errors?.[name] ? <span className="help-field-error" id={`contact-error-${name}`}>{t(name === 'email' ? 'Enter a valid email address.' : 'Please check this field.')}</span> : null;
  const fieldProps = (name) => ({'aria-invalid': feedback?.errors?.[name] || undefined, 'aria-describedby': feedback?.errors?.[name] ? `contact-error-${name}` : undefined});
  return <>
    <div className="help-contact-cards">
      <article><h2>{t('General Inquiry')}</h2><p>{t('Find answers to common product and order questions.')}</p><Link to={localize('/help/faq')}>{t('Explore FAQs')}</Link></article>
      <article><h2>{t('Feedback')}</h2><p>{t('Tell us about your shopping experience.')}</p><a href="#contact-form" onClick={() => {if (!busy) {setTopic('Feedback'); setFeedback(null);}}}>{t('Give Feedback')}</a></article>
      <article><h2>{t('Track package')}</h2><p>{t('Check an existing shipment using its tracking number.')}</p><Link to={localize('/page/order-tracking')}>{t('Track package')}</Link></article>
    </div>
    <section className="help-form" id="contact-form">
      <div><h2>{t('Get in Touch')}</h2><p>{t('Send your inquiry directly to our support team using this form.')}</p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></div>
      <form method="post" action={endpoint} onChange={() => setFeedback(null)} onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          <label>{t('Inquiry type')}<select name="topic" value={topic} onChange={(event) => setTopic(event.target.value)} {...fieldProps('topic')}>{contactTopics.map((label) => <option key={label} value={label}>{t(label)}</option>)}</select>{errorFor('topic')}</label>
          <label>{t('Name')}<input name="name" autoComplete="name" maxLength={100} required {...fieldProps('name')} />{errorFor('name')}</label>
          <label>{t('Email')}<input name="email" autoComplete="email" type="email" maxLength={254} required {...fieldProps('email')} />{errorFor('email')}</label>
          <label>{t('Order number or item number')}<input name="reference" maxLength={100} {...fieldProps('reference')} />{errorFor('reference')}</label>
          <label>{t('Message')}<textarea name="message" rows={5} maxLength={1500} required {...fieldProps('message')} />{errorFor('message')}</label>
          <label className="help-contact-honeypot" aria-hidden="true">{t('Leave this field empty')}<input name="website" autoComplete="off" tabIndex={-1} /></label>
          <button type="submit" disabled={!setup || loading || feedback?.code === 'accepted'}>{t(busy ? 'Sending message…' : loading ? 'Loading form…' : 'Send message')}</button>
        </fieldset>
        {setupError && <div role="alert"><p>{t(contactFeedback[setupError])}</p><button type="button" disabled={loading} onClick={() => void loadSetup(undefined)}>{t('Reload form')}</button></div>}
        {feedback && <div ref={feedbackRef} tabIndex={-1} role={feedback.code === 'accepted' ? 'status' : 'alert'} className="help-contact-result"><p>{t(contactFeedback[feedback.code] || contactFeedback.unavailable)}</p>{feedback.code === 'accepted' && <p>{t('Submission reference')}: {attempt.current?.id}</p>}{feedback.code === 'forbidden' && <button type="button" onClick={() => {setFeedback(null); void loadSetup(undefined);}}>{t('Reload form')}</button>}</div>}
        <noscript>{t('Enable JavaScript to use this form, or contact us by email.')}</noscript>
      </form>
    </section>
  </>;
}

function FAQ() {
  const {t, localize} = useLocale();
  const [term, setTerm] = useState('');
  const [topic, setTopic] = useState(null);
  const visible = questions.filter(([key, question, answer]) => (topic === null || key === topic) && [t(question), t(answer), t(faqTopics[key])].some((text) => text.toLowerCase().includes(term.trim().toLowerCase())));
  return <>
    <div className="help-faq-search"><h2>{t('Hi, how can we help you?')}</h2><label>{t('Search FAQs')}<input type="search" value={term} onChange={(event) => setTerm(event.target.value)} /></label></div>
    <div className="help-faq-grid">
      <section><h2>{t('Frequently Asked Questions')}</h2>
        {!visible.length && <p role="status">{t('No answers found. Try a different search.')}</p>}
        {visible.map(([, question, answer, path, label]) => <details key={question}><summary>{t(question)}</summary><p>{t(answer)}</p><Link to={localize(path)}>{t(label)} →</Link></details>)}
      </section>
      <aside><h2>{t('All FAQ topics')}</h2>
        <button type="button" aria-pressed={topic === null} onClick={() => setTopic(null)}>{t('All topics')}</button>
        {faqTopics.map((label, index) => <button key={label} type="button" aria-pressed={topic === index} onClick={() => setTopic(index)}>{t(label)}</button>)}
      </aside>
    </div>
    <div className="navigation-empty"><h2>{t('Still need help?')}</h2><Link to={localize('/help/contact')}>{t('Contact Us')}</Link></div>
  </>;
}

function Coupons() {
  const {t, localize} = useLocale();
  return <div className="navigation-empty"><h2>{t('No public coupon offers right now')}</h2><p>{t('If you already have a discount code, enter it at checkout. Eligibility is confirmed there.')}</p><Link to={localize('/cart')}>{t('View cart')}</Link></div>;
}

function API() {
  const {t, localize} = useLocale();
  const [handle, setHandle] = useState('');
  const path = localize('/api/catalog');
  return <div className="help-content">
    <h2>{t('Public product lookup')}</h2><p>{t('Read title, description, price range and availability for a published product. This API cannot access accounts, place orders or modify data.')}</p>
    <pre><code>{`GET ${path}?handle={product-handle}`}</code></pre>
    <form method="get" action={path} className="help-api-test" target="_blank" rel="noopener"><label>{t('Product handle')}<input name="handle" pattern="[a-z0-9][a-z0-9\\-]*" maxLength={255} value={handle} onChange={(event) => setHandle(event.target.value)} required /></label><button type="submit">{t('Open JSON result')}</button></form>
    <p>{t('The handle is the last part of a product page URL, after /products/.')}</p><Link to={localize('/collections')}>{t('Browse collections')}</Link>
  </div>;
}

function WhyChoose() {
  const {t, localize} = useLocale();
  return <div className="help-contact-cards">
    {[
      ['Device compatibility', 'Check exact fit and charging specifications before you choose.', '/collections', 'Browse collections'],
      ['Wholesale & custom orders', 'Use the inquiry option on eligible product pages to discuss your buying needs.', '/help/contact', 'Contact Us'],
      ['Order support', 'Get help with account access, shipment tracking and store policies.', '/help/faq', 'Explore FAQs'],
    ].map(([title, copy, url, cta]) => <article key={title}><h2>{t(title)}</h2><p>{t(copy)}</p><Link to={localize(url)}>{t(cta)}</Link></article>)}
  </div>;
}

function AISetup() {
  const {t, localize} = useLocale();
  return <div className="help-content">
    <h2>{t('Use public catalog data with your assistant')}</h2>
    <ol>
      <li>{t('Open a Seine Shop product and copy its product handle.')}</li>
      <li>{t('Open the product lookup in the API guide and give the resulting URL to a web-enabled assistant.')}</li>
      <li>{t('Ask it to summarize the product specifications. Confirm current prices and availability on the storefront before ordering.')}</li>
    </ol>
    <p>{t('No account authorization or private credentials are needed. Do not share an order number or customer information with this public workflow.')}</p>
    <Link to={localize('/help/api')}>{t('Open API guide')}</Link> · <a href="/llms.txt">llms.txt</a>
  </div>;
}

const templates = {contact: Contact, faq: FAQ, api: API, coupons: Coupons, 'why-choose-us': WhyChoose, 'ai-assistant-setup-guide': AISetup};
export default function HelpPage() {
  const {t, localize} = useLocale();
  const {page, handle} = useLoaderData();
  const Template = templates[handle];
  return <div className="navigation-page">
    <nav className="navigation-breadcrumb" aria-label={t('Breadcrumb')}><Link to={localize('/')}>{t('Home')}</Link> / <Link to={localize('/support')}>{t('Support Center')}</Link> / {t(page.title)}</nav>
    <header className="navigation-hero"><h1>{t(page.title)}</h1><p>{t(page.description)}</p></header>
    <Template key={handle} />
    <nav className="help-crosslinks" aria-label={t('Support Center')}>{supportLinks.filter(([title]) => title !== page.title).map(([title, url]) => <Link key={url} to={localize(url)}>{t(title)}</Link>)}</nav>
  </div>;
}
