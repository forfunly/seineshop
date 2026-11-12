import {useState, useId} from 'react';
import {Image} from '@shopify/hydrogen';
import {productGallery} from '~/lib/product-gallery';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';

export function ProductGallery({images, selectedImage, sku, title}) {
  const {t} = useLocale();
  const [active, setActive] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog();
  const dialogTitle = useId();
  const groups = productGallery(images, selectedImage, sku);
  const gallery = showAll ? groups.all : groups.selected;
  const current = gallery.find((image) => image.url === active) || gallery[0];
  return (
    <section className="pdp-gallery" aria-label={t('Product photos')}>
      {groups.all.length > groups.selected.length && <div className="pdp-gallery-scope"><button type="button" aria-pressed={!showAll} onClick={() => {setShowAll(false); setActive(null);}}>{t('Selected option')} ({groups.selected.length})</button><button type="button" aria-pressed={showAll} onClick={() => {setShowAll(true); setActive(null);}}>{t('All photos')} ({groups.all.length})</button></div>}
      <div className="pdp-image-stage">
        {current ? <Image data={current} alt={current.altText || title} sizes="(min-width: 900px) 55vw, 100vw" loading="eager" /> : <span>{t('Image unavailable')}</span>}
        {current && <button ref={triggerRef} className="pdp-zoom-trigger" type="button" onClick={openDialog} aria-label={t('Enlarge product photo')}>↗ <span>{t('Zoom')}</span></button>}
      </div>
      {gallery.length > 1 && <div className="pdp-thumbnails">
        {gallery.map((image, index) => <button type="button" key={image.url} aria-label={`${t('Product photo')} ${index + 1}`} aria-pressed={current?.url === image.url} onClick={() => setActive(image.url)}>
          <Image data={image} alt="" sizes="80px" loading="lazy" />
        </button>)}
      </div>}
      <p className="pdp-photo-caption">{t('Product photos')} · {gallery.indexOf(current) + 1} / {gallery.length || 1}</p>
      <dialog ref={dialogRef} className="pdp-lightbox" aria-labelledby={dialogTitle}>
        <div className="pdp-lightbox-heading"><h2 id={dialogTitle}>{title}</h2><button ref={closeButtonRef} type="button" onClick={closeDialog} aria-label={t('Close enlarged photo')}>×</button></div>
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
