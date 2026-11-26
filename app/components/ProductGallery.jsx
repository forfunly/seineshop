import {useEffect, useId, useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {galleryLens, galleryStep, gallerySwipe, productGallery} from '~/lib/product-gallery';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';

const initialView = {scale: 1, rotation: 0};

export function ProductGallery({images, selectedImage, sku, title, supplemental = []}) {
  const {t} = useLocale();
  const [active, setActive] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState(initialView);
  const thumbnails = useRef(null);
  const touch = useRef(null);
  const magnifierRef = useRef(null);
  const lensRef = useRef(null);
  const swiped = useRef(false);
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog();
  const dialogTitle = useId();
  const groups = productGallery(images, selectedImage, sku, supplemental);
  const gallery = showAll ? groups.all : groups.selected;
  const index = Math.max(0, gallery.findIndex((image) => image.url === active));
  const current = gallery[index];
  const count = gallery.length;

  useEffect(() => {
    const rail = thumbnails.current;
    const selected = rail?.children[index];
    if (!selected || !rail.clientHeight) return;
    const visible = rail.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    if (item.top < visible.top) rail.scrollTop += item.top - visible.top;
    else if (item.bottom > visible.bottom) rail.scrollTop += item.bottom - visible.bottom;
  }, [index, count]);

  useEffect(() => {
    if (magnifierRef.current) magnifierRef.current.hidden = true;
  }, [current?.url]);

  function hideMagnifier() {
    if (magnifierRef.current) magnifierRef.current.hidden = true;
  }

  function moveMagnifier(event) {
    if (event.pointerType !== 'mouse' || !matchMedia('(min-width: 900px) and (any-hover: hover)').matches) return;
    const trigger = event.currentTarget;
    const image = trigger.querySelector('.pdp-photo-slide[aria-hidden="false"] img');
    if (!image || !current) return;
    const bounds = trigger.getBoundingClientRect();
    const photo = image.getBoundingClientRect();
    const lens = galleryLens({left: photo.left, top: photo.top, width: photo.width, height: photo.height},
      image.naturalWidth, image.naturalHeight, event.clientX, event.clientY);
    if (!lens) return hideMagnifier();
    const panel = magnifierRef.current;
    const width = Math.min(bounds.width, document.documentElement.clientWidth - bounds.right - 8);
    const height = bounds.height;
    const backgroundWidth = Math.max(width, height * lens.ratio) * 2.5;
    lensRef.current.style.cssText = `left:${lens.left - bounds.left}px;top:${lens.top - bounds.top}px;width:${lens.size}px;height:${lens.size}px`;
    Object.assign(panel.style, {
      width: `${width}px`, height: `${height}px`,
      backgroundImage: `url(${JSON.stringify(current.url)})`,
      backgroundSize: `${backgroundWidth}px ${backgroundWidth / lens.ratio}px`,
      backgroundPosition: `${lens.positionX}% ${lens.positionY}%`,
    });
    panel.hidden = false;
  }

  function select(next) {
    hideMagnifier();
    setActive(gallery[next]?.url ?? null);
    setView(initialView);
  }

  function step(direction, wrap = false) {
    select(galleryStep(index, direction, count, wrap));
  }

  function changeScope(all) {
    hideMagnifier();
    setShowAll(all);
    setActive(null);
    setView(initialView);
  }

  function startTouch(event) {
    swiped.current = false;
    if (event.pointerType === 'touch' && event.isPrimary) {
      touch.current = {id: event.pointerId, x: event.clientX, y: event.clientY};
    }
  }

  function finishTouch(event) {
    const start = touch.current;
    if (start?.id !== event.pointerId) return;
    touch.current = null;
    const direction = gallerySwipe(event.clientX - start.x, event.clientY - start.y);
    if (direction && count > 1) {
      swiped.current = true;
      step(direction, true);
    }
  }

  function openPhoto(event) {
    if (event.detail && swiped.current) {
      swiped.current = false;
      return;
    }
    setView(initialView);
    hideMagnifier();
    openDialog();
  }

  function navigateByKey(event, wrap) {
    if (count < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1, wrap);
  }

  function zoom(delta) {
    setView((state) => ({...state, scale: Math.min(3, Math.max(0.4, Math.round((state.scale + delta) * 10) / 10))}));
  }

  return (
    <section className="pdp-gallery" aria-label={t('Product photos')}>
      {groups.all.length > groups.selected.length && <div className="pdp-gallery-scope">
        <button type="button" aria-pressed={!showAll} onClick={() => changeScope(false)}>{t('Selected option')} ({groups.selected.length})</button>
        <button type="button" aria-pressed={showAll} onClick={() => changeScope(true)}>{t('All photos')} ({groups.all.length})</button>
      </div>}
      {count > 1 && <div className="pdp-thumbnails" ref={thumbnails}>
        {gallery.map((image, i) => <button type="button" key={image.url} aria-label={`${t('Product photo')} ${i + 1}`} aria-pressed={index === i}
          onPointerEnter={(event) => {if (event.pointerType === 'mouse' && matchMedia('(min-width: 900px) and (hover: hover)').matches) select(i);}}
          onFocus={() => select(i)} onClick={() => select(i)}>
          <Image data={image} alt="" sizes="64px" loading="lazy" />
        </button>)}
      </div>}
      <div className="pdp-image-stage">
        {current ? <button ref={triggerRef} className="pdp-image-trigger" type="button" aria-label={t('Enlarge product photo')}
          onClick={openPhoto} onPointerMove={moveMagnifier} onPointerLeave={hideMagnifier} onKeyDown={(event) => navigateByKey(event, false)} onPointerDown={startTouch} onPointerUp={finishTouch} onPointerCancel={() => {touch.current = null;}}>
          <span className="pdp-photo-track" style={{transform: `translateX(${-index * 100}%)`}}>
            {gallery.map((image, i) => <span className="pdp-photo-slide" key={image.url} aria-hidden={index !== i}>
              <Image data={image} alt={image.altText || title} sizes="(min-width: 900px) 48vw, 100vw" loading={index === i ? 'eager' : 'lazy'} draggable={false} />
            </span>)}
          </span>
          <span ref={lensRef} className="pdp-magnifier-lens" aria-hidden="true" />
        </button> : <span>{t('Image unavailable')}</span>}
        <div ref={magnifierRef} className="pdp-magnifier-panel" aria-hidden="true" hidden />
        {count > 1 && <>
          <button type="button" className="pdp-stage-arrow pdp-stage-previous" disabled={index === 0} aria-label={t('Previous photo')} onClick={() => step(-1)}>‹</button>
          <button type="button" className="pdp-stage-arrow pdp-stage-next" disabled={index === count - 1} aria-label={t('Next photo')} onClick={() => step(1)}>›</button>
        </>}
        {current && <span className="pdp-mobile-photo-count" aria-hidden="true">{index + 1}/{count}</span>}
      </div>
      {current && <p className="pdp-photo-caption" aria-live="polite">{t('Product photos')} · {index + 1} / {count}</p>}
      <dialog ref={dialogRef} className="pdp-lightbox" aria-labelledby={dialogTitle} onKeyDown={(event) => navigateByKey(event, true)}>
        <h2 id={dialogTitle} className="pdp-lightbox-title">{title}</h2>
        <button ref={closeButtonRef} type="button" className="pdp-lightbox-close" onClick={closeDialog} aria-label={t('Close enlarged photo')}>×</button>
        <div className="pdp-lightbox-stage" onPointerDown={startTouch} onPointerUp={finishTouch} onPointerCancel={() => {touch.current = null;}}>
          {current && <Image data={current} alt={current.altText || title} sizes="90vw" style={{transform: `scale(${view.scale}) rotate(${view.rotation}deg)`}} draggable={false} loading="lazy" />}
        </div>
        {count > 1 && <>
          <button type="button" className="pdp-lightbox-arrow pdp-lightbox-previous" aria-label={t('Previous photo')} onClick={() => step(-1, true)}>‹</button>
          <button type="button" className="pdp-lightbox-arrow pdp-lightbox-next" aria-label={t('Next photo')} onClick={() => step(1, true)}>›</button>
        </>}
        <div className="pdp-lightbox-controls">
          <span aria-live="polite">{index + 1} / {count}</span>
          <div>
            <button type="button" aria-label={t('Zoom out')} onClick={() => zoom(-0.2)} disabled={view.scale <= 0.4}>−</button>
            <button type="button" aria-label={t('Zoom in')} onClick={() => zoom(0.2)} disabled={view.scale >= 3}>+</button>
            <button type="button" aria-label={t('Rotate left')} onClick={() => setView((state) => ({...state, rotation: state.rotation - 90}))}>↺</button>
            <button type="button" aria-label={t('Reset photo view')} onClick={() => setView(initialView)}>▣</button>
            <button type="button" aria-label={t('Rotate right')} onClick={() => setView((state) => ({...state, rotation: state.rotation + 90}))}>↻</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
