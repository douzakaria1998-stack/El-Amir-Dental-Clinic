import { Fragment, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import type { Invoice } from '../../types/invoice';
import type { ClinicSettings } from '../../types/settings';
import { invoiceStrings } from '../../i18n/invoiceStrings';
import { formatAmount, formatDateDMY, sumFees } from '../../utils/format';
import { amountToWords } from '../../utils/amountToWords';
import { actLabel, printableActs } from '../../utils/acts';
import { paginateRows } from '../../utils/paginate';
import { GlobeIcon, MailIcon, PhoneIcon, PinIcon, FacebookIcon, InstagramIcon, TikTokIcon } from './FooterIcons';
import './invoice.css';

export interface InvoiceLayoutInfo {
  pages: number;
  density: number;
}

interface Props {
  invoice: Invoice;
  settings: ClinicSettings;
  qrDataUrl?: string | null;
  /** Called whenever the final layout (density / page count) is known. */
  onLayout?: (info: InvoiceLayoutInfo) => void;
  className?: string;
}

type Density = 0 | 1 | 2;
interface LayoutState {
  key: string;
  density: Density;
  /** null = everything on a single page */
  pages: number[] | null;
  done: boolean;
}

/**
 * The invoice document (A4, 210 × 297 mm). The SAME component is used for the
 * live preview, the PDF capture and the browser print → identical output.
 */
export function InvoiceDocument({ invoice, settings, qrDataUrl, onLayout, className }: Props) {
  const lang = invoice.invoiceLang;
  const s = invoiceStrings[lang];
  const colon = lang === 'fr' ? '\u00A0:' : ':';

  const acts = printableActs(invoice);
  const rows = acts.map((a) => ({ id: a.id, label: actLabel(a, lang, settings), fee: a.fee ?? 0 }));
  const total = sumFees(acts.map((a) => a.fee));
  const sep = settings.thousandsSeparator;

  // Re-measure when fonts finish loading.
  const [fontsTick, setFontsTick] = useState(0);
  useEffect(() => {
    let alive = true;
    if (document.fonts && document.fonts.status !== 'loaded') {
      void document.fonts.ready.then(() => alive && setFontsTick((n) => n + 1));
    }
    return () => {
      alive = false;
    };
  }, []);

  const contentKey = useMemo(
    () =>
      JSON.stringify([
        lang,
        invoice.invoiceDate,
        invoice.billingDate,
        invoice.lastName,
        invoice.firstName,
        invoice.birthDate,
        rows,
        settings.clinicNameFr,
        settings.clinicTaglineFr,
        settings.clinicNameAr,
        settings.clinicTaglineAr,
        settings.logoDataUrl?.length ?? 0,
        settings.logoPosition,
        settings.rc,
        settings.nis,
        settings.nif,
        settings.address,
        settings.addressAr,
        settings.phones,
        settings.email,
        settings.website,
        settings.vatEnabled,
        settings.vatMention,
        settings.footerText,
        settings.footerStyle,
        settings.showBackgroundPattern,
        settings.backgroundPatternColor,
        settings.showWatermark,
        sep,
        Boolean(qrDataUrl),
        fontsTick,
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, invoice, settings, qrDataUrl, fontsTick, JSON.stringify(rows)],
  );

  const [layout, setLayout] = useState<LayoutState>({ key: contentKey, density: 0, pages: null, done: false });
  // Reset the layout state machine when the content changes (adjust-state-during-render pattern).
  if (layout.key !== contentKey) {
    setLayout({ key: contentKey, density: 0, pages: null, done: false });
  }

  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (layout.done || layout.key !== contentKey) return;
    const body = bodyRef.current;
    if (!body) return;
    const overflow = body.scrollHeight > body.clientHeight + 1;
    if (!overflow) {
      setLayout((l) => ({ ...l, done: true }));
      return;
    }
    if (layout.density < 2) {
      setLayout((l) => ({ ...l, density: (l.density + 1) as Density }));
      return;
    }
    // Still overflowing at the densest level → paginate (second page only if really needed).
    const table = body.querySelector<HTMLTableElement>('.inv-table');
    const thead = body.querySelector<HTMLElement>('.inv-table thead');
    const rowEls = Array.from(body.querySelectorAll<HTMLElement>('.inv-table tr.inv-row'));
    if (!table || !thead) {
      setLayout((l) => ({ ...l, done: true }));
      return;
    }
    const rowHeights = rowEls.map((r) => r.offsetHeight);
    const introH = table.offsetTop;
    const theadH = thead.offsetHeight;
    const rowsSum = rowHeights.reduce((a, b) => a + b, 0);
    const tailH = body.scrollHeight - (introH + theadH + rowsSum);
    const pages = paginateRows(rowHeights, body.clientHeight - 2, introH, theadH + 4, tailH);
    setLayout((l) => ({ ...l, pages, done: true }));
  }, [layout, contentKey]);

  const pageCount = layout.pages?.length ?? 1;
  useEffect(() => {
    if (layout.done) onLayout?.({ pages: pageCount, density: layout.density });
  }, [layout.done, layout.density, pageCount, onLayout]);

  // Split rows into pages
  const pageRows: (typeof rows)[] = [];
  if (layout.pages) {
    let i = 0;
    for (const n of layout.pages) {
      pageRows.push(rows.slice(i, i + n));
      i += n;
    }
  } else {
    pageRows.push(rows);
  }

  const legal = [
    { k: 'R.C', v: settings.rc },
    { k: 'N.I.S', v: settings.nis },
    { k: 'N.I.F', v: settings.nif },
  ].filter((x) => x.v.trim());

  const addressFr =
    settings.address && !settings.address.includes('Boulevard du 1er Novembre') && !settings.address.includes('alamane')
      ? settings.address
      : 'Hai Errimel - El Oued';

  const addressAr =
    settings.addressAr && !settings.addressAr.includes('أول نوفمبر') && !settings.addressAr.includes('الأمان')
      ? settings.addressAr
      : 'حي الرمال - الوادي، بالقرب من المحكمة';

  const rawPhones =
    settings.phones && !settings.phones.includes('032 11')
      ? settings.phones
      : '0777 77 53 77 | 0652 69 59 69';

  const phones = rawPhones
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  const footerText = (lang === 'en' ? settings.footerText.en : settings.footerText.fr).trim();
  const vat = (lang === 'en' ? settings.vatMention.en : settings.vatMention.fr).trim();
  const words = amountToWords(total, lang);
  const doctorNameFr =
    settings.clinicNameFr &&
    settings.clinicNameFr !== 'El Amir Dental Clinic' &&
    settings.clinicNameFr !== 'Cabinet Dentaire El Amir'
      ? settings.clinicNameFr
      : 'Dr. Medjouel Yahia Amir';

  const doctorNameAr =
    settings.clinicNameAr && settings.clinicNameAr !== 'عيادة الأمير لطب الأسنان'
      ? settings.clinicNameAr
      : 'الدكتور مجوّل يحي أمير';

  const DEFAULT_LATIN_LINES = useMemo(
    () => ['Dental Implantology and', 'Aesthetic Dentistry', 'Errimel - El Oued', 'BAT: 08/39/1801'],
    [],
  );

  const DEFAULT_ARABIC_LINES = useMemo(
    () => ['طب، زراعة وتجميل الأسنان', 'حي الرمال - الوادي', 'بالقرب من المحكمة'],
    [],
  );

  const latinTaglines = useMemo(() => {
    const raw = settings.clinicTaglineFr?.trim();
    if (!raw) return DEFAULT_LATIN_LINES;
    const lines = raw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].toLowerCase() === 'dental implantology and') {
      return DEFAULT_LATIN_LINES;
    }
    if (!lines.some((l) => l.toLowerCase().includes('aesthetic dentistry')) && lines.some((l) => l.toLowerCase().includes('dental implantology and'))) {
      return DEFAULT_LATIN_LINES;
    }
    return lines;
  }, [settings.clinicTaglineFr, DEFAULT_LATIN_LINES]);

  const arabicTaglines = useMemo(() => {
    const raw = settings.clinicTaglineAr?.trim();
    if (!raw) return DEFAULT_ARABIC_LINES;
    const lines = raw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes('طب، زراعة وتجميل الأسنان')) {
      return DEFAULT_ARABIC_LINES;
    }
    if (!lines.some((l) => l.includes('حي الرمال')) && lines.some((l) => l.includes('طب، زراعة وتجميل الأسنان'))) {
      return DEFAULT_ARABIC_LINES;
    }
    return lines;
  }, [settings.clinicTaglineAr, DEFAULT_ARABIC_LINES]);

  const header = (
    <header className="inv-header">
      <div className="inv-header-banner">
        {/* Left blue badge */}
        <div className="inv-banner-badge">
          <img
            src={settings.logoDataUrl || '/clinic-badge.png'}
            alt={doctorNameFr || 'El Amir Dental Clinic'}
          />
        </div>

        {/* Right main area: top horizontal bar + doctor info columns */}
        <div className="inv-banner-main">
          <div className="inv-banner-topbar" />

          <div className="inv-banner-content">
            {/* Latin info */}
            <div className="inv-banner-col latin">
              {doctorNameFr && (
                <div className="inv-banner-doc-name latin">{doctorNameFr}</div>
              )}
              {latinTaglines.map((line, idx) => (
                <div
                  key={idx}
                  className={`inv-banner-line latin ${line.toUpperCase().startsWith('BAT:') ? 'bat-line' : ''}`}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Arabic info (RTL) */}
            <div className="inv-banner-col arabic" lang="ar" dir="rtl">
              {doctorNameAr && (
                <div className="inv-banner-doc-name arabic">{doctorNameAr}</div>
              )}
              {arabicTaglines.map((line, idx) => (
                <div key={idx} className="inv-banner-line arabic">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  const effectiveQr = '/footer-qr.png';
  const isBlue = settings.footerStyle === 'blue';

  const footer = (
    <>
      {footerText && <div className="inv-footer-text">{footerText}</div>}
      <footer className={`inv-footer ${isBlue ? 'style-blue' : 'style-grey'}`}>
        <div className="inv-footer-left">
          <div className="inv-qr">
            <img src={effectiveQr} alt="QR Code" />
          </div>
        </div>
        <div className="inv-footer-lines">
          {isBlue && (
            <div className="inv-footer-line inv-social-line">
              <span className="txt">elamir.dc.39</span>
              <div className="inv-social-icons">
                <span className="inv-icon-badge"><FacebookIcon /></span>
                <span className="inv-icon-badge"><InstagramIcon /></span>
                <span className="inv-icon-badge"><TikTokIcon /></span>
              </div>
            </div>
          )}
          {isBlue ? (
            <div className="inv-footer-line">
              <span className="ar" lang="ar" dir="rtl">
                {addressAr || 'حي الرمال بالقرب من المحكمة'}
              </span>
              <span className="inv-icon-badge"><PinIcon /></span>
            </div>
          ) : (
            (addressFr || addressAr) && (
              <div className="inv-footer-line">
                {addressFr && <span className="txt">{addressFr}</span>}
                {addressFr && addressAr && <span className="sep">|</span>}
                {addressAr && (
                  <span className="ar" lang="ar" dir="rtl">
                    {addressAr}
                  </span>
                )}
                <span className="inv-icon-badge"><PinIcon /></span>
              </div>
            )
          )}
          {phones.length > 0 && (
            <div className="inv-footer-line">
              <span className="txt">
                {phones.map((p, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className="sep"> | </span>}
                    {p}
                  </Fragment>
                ))}
              </span>
              <span className="inv-icon-badge"><PhoneIcon /></span>
            </div>
          )}
          {!isBlue && (settings.website || settings.email) && !settings.website?.includes('alamane') && !settings.email?.includes('alamane') && (
            <div className="inv-footer-line">
              {settings.website && (
                <>
                  <span className="txt">{settings.website.replace(/^https?:\/\//, '')}</span>
                  <GlobeIcon />
                </>
              )}
              {settings.website && settings.email && <span className="sep">|</span>}
              {settings.email && (
                <>
                  <span className="txt">{settings.email}</span>
                  <MailIcon />
                </>
              )}
            </div>
          )}
        </div>
      </footer>
    </>
  );

  return (
    <div className={`inv-root ${className ?? ''}`} data-pages={pageCount}>
      {pageRows.map((chunk, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pageRows.length - 1;
        return (
          <article
            key={pageIndex}
            className={`inv-page density-${layout.density} ${isBlue ? 'footer-blue' : 'footer-grey'}`}
            lang={lang}
            aria-label={`${s.title} ${formatDateDMY(invoice.invoiceDate)}`}
          >
            {settings.showBackgroundPattern !== false && (
              <div
                className={`inv-bg-pattern tone-${settings.backgroundPatternColor || 'blue'}`}
                aria-hidden="true"
              >
                <div className="inv-bg-stripes" />
                {settings.showWatermark !== false && (
                  <div className="inv-bg-watermark">
                    <img src="/emblem.svg" alt="" />
                  </div>
                )}
              </div>
            )}
            {header}
            <div className="inv-body" ref={isFirst ? bodyRef : undefined}>
              {isFirst && (
                <>
                  {legal.length > 0 && (
                    <div className="inv-legal">
                      {legal.map((l) => (
                        <div key={l.k}>
                          {l.k}
                          {colon} {l.v}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`inv-title ${legal.length === 0 ? 'no-legal' : ''}`}>
                    {s.title} {formatDateDMY(invoice.invoiceDate)}
                  </div>
                  <div className="inv-patient">
                    <div>
                      {s.billingDate}
                      {colon} <span className="v">{formatDateDMY(invoice.billingDate)}</span>
                    </div>
                    <div>
                      {s.lastName}
                      {colon} <span className="v">{invoice.lastName.trim().toLocaleUpperCase('fr')}</span>
                    </div>
                    <div>
                      {s.firstName}
                      {colon} <span className="v">{invoice.firstName.trim().toLocaleUpperCase('fr')}</span>
                    </div>
                    <div>
                      {s.birthDate}
                      {colon} <span className="v">{formatDateDMY(invoice.birthDate)}</span>
                    </div>
                  </div>
                </>
              )}
              {!isFirst && (
                <div className="inv-title" style={{ marginTop: 'var(--inv-gap-title)' }}>
                  {s.title} {formatDateDMY(invoice.invoiceDate)} {s.continued}
                </div>
              )}

              <table className="inv-table">
                <colgroup>
                  <col className="c-act" />
                  <col className="c-fee" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{s.act}</th>
                    <th scope="col">{s.fees}</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((r) => (
                    <tr className="inv-row" key={r.id}>
                      <td className="act">{r.label}</td>
                      <td className="fee">{formatAmount(r.fee, sep)}</td>
                    </tr>
                  ))}
                  {chunk.length === 0 && isFirst && (
                    <tr className="inv-row">
                      <td className="act">&nbsp;</td>
                      <td className="fee">&nbsp;</td>
                    </tr>
                  )}
                  {isLast && (
                    <tr className="inv-total">
                      <td className="blank" />
                      <td className="total">{formatAmount(total, sep)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isLast && (
                <div className="inv-mentions">
                  {settings.vatEnabled && vat && <div>{vat}</div>}
                  <div>
                    {s.amountSentence} <strong>{words}.</strong>
                  </div>
                </div>
              )}
            </div>
            {pageRows.length > 1 && <div className="inv-pageno">{s.page(pageIndex + 1, pageRows.length)}</div>}
            {footer}
          </article>
        );
      })}
    </div>
  );
}
