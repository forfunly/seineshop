import {useId, useState} from 'react';
import {useLocale} from '~/lib/i18n';
import {validUpload} from '~/lib/visual-search';

export function ImageSearchUpload({onFile, busy = false}) {
  const {t} = useLocale();
  const id = useId();
  const [invalid, setInvalid] = useState(false);
  return <div className="image-upload">
    <label htmlFor={id}>{t('Upload a product image')}</label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        event.currentTarget.value = '';
        setInvalid(!validUpload(file));
        if (validUpload(file)) onFile(file);
      }} />
    <p>{t('JPG, PNG or WebP. Up to 8 MB. Your image stays on this device.')}</p>
    {invalid && <p role="alert">{t('Choose a JPG, PNG or WebP image up to 8 MB.')}</p>}
  </div>;
}
