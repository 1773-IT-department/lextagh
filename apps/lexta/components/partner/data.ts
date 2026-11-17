/**
 * Partnership routes, partner benefits and onboarding steps, in the approved prototype's layout (partner-with-us.html).
 * Only Lexta's sources: the Drive's partnership types (Distributor / Wholesaler / Modern Trade, and the CSR /
 * partnership proposal). Institutional, private label and supplier routes had no Lexta source and were removed. Trade terms, timings
 * and service levels Lexta has not confirmed are shown as [PLACEHOLDER: ...] notes. Keys feed the form and must not change.
 */
export type Route = {
  key: string;
  tag: string;
  title: string;
  meta: string;
  desc: string;
  summary: string;
  criteria: string[];
  note: string;
  placeholder: string;
};

export type Benefit = { kicker: string; title: string; desc: string };
export type Step = { num: string; title: string; desc: string; time: string };

export const routes: Route[] = [
  { key: 'Distributor', tag: 'DT', title: 'Distributor', meta: 'Trade / distribution',
    desc: 'For distributors: select your partnership type and share your region and contact details.',
    summary: 'For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details. [PLACEHOLDER: distributor trade terms, credit and territory policy]',
    criteria: ['[PLACEHOLDER: what Lexta looks for in a distributor]'],
    note: 'Share your region and contact details.',
    placeholder: 'Your region and contact details.' },
  { key: 'Retail', tag: 'WM', title: 'Wholesaler & modern trade', meta: 'Trade / distribution',
    desc: 'For wholesalers and modern trade: select your partnership type and share your region and contact details.',
    summary: 'For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details. [PLACEHOLDER: wholesale and modern trade terms]',
    criteria: ['[PLACEHOLDER: what Lexta looks for in a wholesaler or modern trade partner]'],
    note: 'Share your region and contact details.',
    placeholder: 'Your region and contact details.' },
  { key: 'CSR', tag: 'CS', title: 'CSR & community', meta: 'Partnership proposal',
    desc: 'Explore initiatives by brand, submit a partnership proposal or request information about a programme.',
    summary: 'Our care extends beyond our products. Through education, hygiene awareness, environmental responsibility and community partnerships, Lexta seeks to help create healthier, more informed and more sustainable communities. Tell us the brand and the initiative your proposal is for.',
    criteria: ['[PLACEHOLDER: what Lexta looks for in a CSR or community partner]'],
    note: 'Tell us the brand and the initiative your proposal is for.',
    placeholder: 'The brand and initiative, and your proposal.' }
];

export const benefits: Benefit[] = [
  { kicker: 'Supply', title: 'Stock you can plan around', desc: '[PLACEHOLDER: supply, warehouse and lead time details]' },
  { kicker: 'Terms', title: 'Trade terms and credit', desc: '[PLACEHOLDER: pricing, rebates and credit terms]' },
  { kicker: 'Field', title: 'A team in the trade', desc: '[PLACEHOLDER: field sales and merchandising support for partners]' },
  { kicker: 'Brand', title: 'Brands families know', desc: 'Yazz, Linzzy and Hooch, three brands built for everyday family needs and backed by our community campaigns.' },
  { kicker: 'Training', title: 'Onboarding and training', desc: '[PLACEHOLDER: onboarding and training offered to partners]' },
  { kicker: 'Data', title: 'Straight reporting', desc: '[PLACEHOLDER: performance reviews and reporting for partners]' }
];

export const steps: Step[] = [
  { num: '01', title: 'Submit your details', desc: 'Select your partnership type and send your region, contact details, trading history and the range you want.', time: 'Day 1' },
  { num: '02', title: 'Review', desc: 'Your application goes to the trade desk, which reviews coverage in your area.', time: '[PLACEHOLDER: timing]' },
  { num: '03', title: 'Documentation', desc: 'Business registration, tax and references, then a signed trading agreement.', time: '[PLACEHOLDER: timing]' },
  { num: '04', title: 'Opening order', desc: 'Range selection and your first delivery.', time: '[PLACEHOLDER: timing]' }
];

