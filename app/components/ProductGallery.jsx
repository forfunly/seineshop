import {useState, useRef, useId} from 'react';
import {Image} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';

export function ProductGallery({images, selectedImage, title}) {
  const {t} = useLocale();
  const [active, setActive] = useState(null);
  const dialog = useRef(null);
  const dialogTitle = useId();
  const gallery = [...new Map([selectedImage, ...images].filter(Boolean).map((image) => [image.url, image])).values()];
  const current = gallery.find((image) => image.url === active) || gallery[0];
  return (
    <section className="pdp-gallery" aria-label={t('Product photos')}>
      <div className="pdp-image-stage">
        {current ? <Image data={current} alt={current.altText || title} sizes="(min-width: 900px) 55vw, 100vw" loading="eager" /> : <span>{t('Image unavailable')}</span>}
        {current && <button className="pdp-zoom-trigger" type="button" onClick={() => dialog.current?.showModal()} aria-label={t('Enlarge product photo')}>↗ <span>{t('Zoom')}</span></button>}
      </div>
      {gallery.length > 1 && <div className="pdp-thumbnails">
        {gallery.map((image, index) => <button type="button" key={image.url} aria-label={`${t('Product photo')} ${index + 1}`} aria-pressed={current?.url === image.url} onClick={() => setActive(image.url)}>
          <Image data={image} alt="" sizes="80px" />
        </button>)}
      </div>}
      <p className="pdp-photo-caption">{t('Product photos')} · {gallery.indexOf(current) + 1} / {gallery.length || 1}</p>
      <dialog ref={dialog} className="pdp-lightbox" aria-labelledby={dialogTitle}>
        <div className="pdp-lightbox-heading"><h2 id={dialogTitle}>{title}</h2><button type="button" onClick={() => dialog.current?.close()} autoFocus aria-label={t('Close enlarged photo')}>×</button></div>
        {current && <Image data={current} alt={current.altText || title} sizes="90vw" />}
        <div className="pdp-lightbox-controls">
          <button type="button" disabled={gallery.length < 2} onClick={() => setActive(gallery[(gallery.indexOf(current) + gallery.length - 1) % gallery.length].url)}>{t('Previous photo')}</button>
          <span>{gallery.indexOf(current) + 1} / {gallery.length}</span>
          <button type="button" disabled={gallery.length < 2} onClick={() => setActive(gallery[(gallery.indexOf(current) + 1) % gallery.length].url)}>{t('Next photo')}</button>
        </div>
      </dialog>
    </section>
  );
}
