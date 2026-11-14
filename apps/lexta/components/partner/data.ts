/**
 * Partnership routes, partner benefits and onboarding steps exactly as the approved prototype lists them
 * (partner-with-us.html). Static content.
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
    summary: 'Appointed distributors carry an agreed brand range with protected territory, credit terms after review, and a Lexta field team working the trade alongside you.',
    criteria: ['Registered business with a trading history in FMCG', 'Warehouse space and a working delivery vehicle', 'Working capital for an agreed opening order', 'Sales staff who can service retail routes'],
    note: 'Include your territory, current brands and monthly volumes.',
    placeholder: 'Where you trade, the brands you carry today, warehouse capacity and monthly volumes.' },
  { key: 'Retail', tag: 'RT', title: 'Retail & trade', meta: 'Shops and chains',
    desc: 'Supermarkets, pharmacies, open-market wholesalers and chain retail.',
    summary: 'Retail partners buy direct or through an appointed distributor, with planogram support, promo calendars and merchandising visits for listed stores.',
    criteria: ['Registered retail or wholesale outlet', 'Consistent reorder pattern', 'Shelf space for the listed range', 'Willingness to run agreed promotions'],
    note: 'Tell us your store count and where you are located.',
    placeholder: 'Store names, locations, categories you stock and the range you want listed.' },
  { key: 'Institutional', tag: 'IN', title: 'Institutional & bulk', meta: 'Contract supply',
    desc: 'Hotels, hospitals, schools, mines and government supply contracts.',
    summary: 'Contract supply on scheduled deliveries with quoted pricing, tender documentation and a named account manager for the duration of the contract.',
    criteria: ['Defined annual or quarterly requirement', 'Procurement contact and delivery schedule', 'Compliance documents where a tender applies', 'Agreed payment terms'],
    note: 'Give quantities, delivery points and contract timing.',
    placeholder: 'Products, quantities, delivery locations, frequency and contract period.' },
  { key: 'Private label', tag: 'PL', title: 'Private label & export', meta: 'Manufacturing',
    desc: 'Contract manufacturing under your own brand, or export into new markets.',
    summary: 'We manufacture tissue and hygiene lines to specification under your brand, or appoint export partners for markets adjacent to Ghana and Liberia.',
    criteria: ['Clear product specification or reference sample', 'Committed minimum order quantity', 'Brand ownership or licence documentation', 'Import and regulatory clearance in your market'],
    note: 'Share your specification, volumes and target market.',
    placeholder: 'Product specification, artwork status, MOQ and the market you are supplying.' },
  { key: 'CSR', tag: 'CS', title: 'CSR & community', meta: 'Impact partners',
    desc: 'NGOs, schools, health services and community groups delivering work on the ground.',
    summary: 'We co-fund and supply hygiene, sanitation and school programmes with partners who run them locally: product donations, WASH support and joint campaigns, reported on together.',
    criteria: ['Registered NGO, school, health facility or community body', 'A defined community, catchment or beneficiary group', 'Named programme lead we can work with directly', 'Willingness to report outcomes at agreed intervals'],
    note: 'Tell us the programme, the community and what you need from us.',
    placeholder: 'Programme aim, community served, timeline, and the product, funding or people support you need.' },
  { key: 'Suppliers', tag: 'SP', title: 'Raw material suppliers', meta: 'Inbound supply',
    desc: 'Packaging, chemicals, paper stock and logistics vendors supplying our plants.',
    summary: 'We source packaging, raw materials and transport for the Tema and Accra plants on standing contracts, with vendor audits, agreed quality specs and scheduled payment terms.',
    criteria: ['Registered business with valid TIN and tax clearance', 'Consistent quality documentation or certificates of analysis', 'Capacity to hold buffer stock against a rolling forecast', 'Willingness to undergo a site and quality audit'],
    note: 'Tell us what you supply, your capacity and lead times.',
    placeholder: 'Materials or services offered, monthly capacity, lead times, certifications and reference clients.' }
];

export const benefits: Benefit[] = [
  { kicker: 'Supply', title: 'Stock you can plan around', desc: 'Local manufacturing and a Tema warehouse keep lead times short and reorders predictable.' },
  { kicker: 'Terms', title: 'Trade terms and credit', desc: 'Volume-based pricing, rebates on agreed targets and credit lines after a performance review.' },
  { kicker: 'Field', title: 'A team in the trade', desc: 'Field sales and merchandisers work your territory with you, not from a desk in Accra.' },
  { kicker: 'Brand', title: 'Marketing that pulls', desc: 'Consumer campaigns, sampling and point-of-sale material that move stock off your shelf.' },
  { kicker: 'Training', title: 'Onboarding and training', desc: 'Product knowledge, merchandising standards and order-cycle training for your staff.' },
  { kicker: 'Data', title: 'Straight reporting', desc: 'Monthly performance reviews on sell-out, coverage and stock cover, with no guesswork.' }
];

export const steps: Step[] = [
  { num: '01', title: 'Submit your details', desc: 'Send the application with your trading history, location and the range you want.', time: 'Day 1' },
  { num: '02', title: 'Screening call', desc: 'Our trade team confirms coverage in your area and walks through terms.', time: 'Within 48 hours' },
  { num: '03', title: 'Documentation', desc: 'Business registration, tax and bank references, then a signed trading agreement.', time: '1 to 2 weeks' },
  { num: '04', title: 'Opening order', desc: 'Range selection, first delivery and a field visit to set up your shelf.', time: 'From week 3' }
];

