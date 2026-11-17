/**
 * Partnership routes, partner benefits and onboarding steps, in the approved prototype's layout (partner-with-us.html).
 * Lexta's Drive content names Distributor, Wholesaler and Modern Trade as the partnership types. Trade terms, timings
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
  { key: 'Distributor', tag: 'DT', title: 'Distributor', meta: 'Territory based',
    desc: 'Hold stock, cover a defined territory and sell into retail across your region.',
    summary: 'Appointed distributors carry an agreed range of Yazz, Linzzy and Hooch and sell into retail across their territory. [PLACEHOLDER: distributor trade terms, credit and territory policy]',
    criteria: ['Registered business with a trading history in FMCG', 'Warehouse space and a working delivery vehicle', 'Working capital for an agreed opening order', 'Sales staff who can service retail routes'],
    note: 'Include your territory, current brands and monthly volumes.',
    placeholder: 'Where you trade, the brands you carry today, warehouse capacity and monthly volumes.' },
  { key: 'Retail', tag: 'RT', title: 'Wholesale & modern trade', meta: 'Wholesalers, shops and chains',
    desc: 'Wholesalers, supermarkets, pharmacies and chain retail.',
    summary: 'Wholesalers and modern trade partners stock our brands for their customers, buying direct or through an appointed distributor. [PLACEHOLDER: wholesale and modern trade terms and merchandising support]',
    criteria: ['Registered retail or wholesale outlet', 'Consistent reorder pattern', 'Shelf space for the listed range', 'Willingness to run agreed promotions'],
    note: 'Tell us your store count and where you are located.',
    placeholder: 'Store names, locations, categories you stock and the range you want listed.' },
  { key: 'Institutional', tag: 'IN', title: 'Institutional & bulk', meta: 'Contract supply',
    desc: 'Hotels, hospitals, schools, mines and government supply contracts.',
    summary: 'Schools, hospitals, hotels, NGOs and agencies can request a quote for scheduled supply of the products they need. [PLACEHOLDER: institutional supply terms]',
    criteria: ['Defined annual or quarterly requirement', 'Procurement contact and delivery schedule', 'Compliance documents where a tender applies', 'Agreed payment terms'],
    note: 'Give quantities, delivery points and contract timing.',
    placeholder: 'Products, quantities, delivery locations, frequency and contract period.' },
  { key: 'Private label', tag: 'PL', title: 'Private label & export', meta: 'Regional partners',
    desc: 'Export into new markets, or a private label enquiry.',
    summary: 'With a subsidiary in Monrovia, Liberia, and an ambition to serve families throughout Africa, we welcome enquiries from regional partners. [PLACEHOLDER: whether Lexta offers private label or contract manufacturing, and for which lines]',
    criteria: ['Clear product specification or reference sample', 'Committed minimum order quantity', 'Brand ownership or licence documentation', 'Import and regulatory clearance in your market'],
    note: 'Share your specification, volumes and target market.',
    placeholder: 'Product specification, artwork status, MOQ and the market you are supplying.' },
  { key: 'CSR', tag: 'CS', title: 'CSR & community', meta: 'Impact partners',
    desc: 'NGOs, schools, health services and community groups delivering work on the ground.',
    summary: 'Schools, NGOs, health facilities and community groups can propose a partnership on one of our CSR initiatives. Share your organisation, region, the initiative and a short proposal.',
    criteria: ['Registered NGO, school, health facility or community body', 'A defined community, catchment or beneficiary group', 'Named programme lead we can work with directly', 'Willingness to report outcomes at agreed intervals'],
    note: 'Tell us the programme, the community and what you need from us.',
    placeholder: 'Programme aim, community served, timeline, and the product, funding or people support you need.' },
  { key: 'Suppliers', tag: 'SP', title: 'Raw material suppliers', meta: 'Inbound supply',
    desc: 'Packaging, raw materials, paper stock and logistics vendors.',
    summary: 'Suppliers of packaging, raw materials and transport can introduce their business to Lexta. [PLACEHOLDER: supplier onboarding, audit and payment terms]',
    criteria: ['Registered business with valid TIN and tax clearance', 'Consistent quality documentation or certificates of analysis', 'Capacity to hold buffer stock against a rolling forecast', 'Willingness to undergo a site and quality audit'],
    note: 'Tell us what you supply, your capacity and lead times.',
    placeholder: 'Materials or services offered, monthly capacity, lead times, certifications and reference clients.' }
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

