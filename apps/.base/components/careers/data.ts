/**
 * Open roles exactly as the approved prototype lists them (careers.html). Static sample content for now:
 * item 21 (recruitment tracker) replaces this list with open roles read from the database.
 */
export type Job = {
  ref: string;
  dept: string;
  title: string;
  location: string;
  type: string;
  level: string;
  posted: string;
  closes: string;
  urgent: boolean;
  summary: string;
  duties: string[];
  reqs: string[];
};

export const jobs: Job[] = [
  { ref: 'LX-PRD-114', dept: 'Manufacturing', title: 'Production Line Supervisor', location: 'Accra', type: 'Full time', level: 'Mid level', posted: '2 September 2026', closes: '30 September 2026', urgent: true,
    summary: 'Own the output, safety and discipline of one converting line across a shift, working with planning, maintenance and QA to hit volume without compromising standards.',
    duties: ['Run daily shift briefings and allocate operators across the line.', 'Track output, downtime and waste against targets and report on causes.', 'Enforce hygiene, safety and GMP procedures without exception.', 'Work with maintenance to plan changeovers and preventive work.'],
    reqs: ['HND or degree in engineering, production or a related field.', 'Three or more years on a manufacturing line, at least one supervising a team.', 'Practical understanding of GMP and workplace safety in FMCG.', 'Comfortable with shift work and with holding a team to a standard.'] },
  { ref: 'LX-PRD-118', dept: 'Manufacturing', title: 'Machine Operator (Tissue Converting)', location: 'Accra', type: 'Full time', level: 'Entry level', posted: '28 August 2026', closes: '26 September 2026', urgent: false,
    summary: 'Operate and monitor converting machinery, carry out first-line checks and keep the line running to specification through the shift.',
    duties: ['Set up, run and shut down assigned machinery to standard procedure.', 'Carry out in-process quality checks and log results accurately.', 'Report faults early and support basic maintenance tasks.', 'Keep the work area to hygiene and 5S standards.'],
    reqs: ['WASSCE or technical certificate; NVTI qualification an advantage.', 'One year or more operating industrial machinery, or strong technical aptitude.', 'Attention to detail and willingness to work rotating shifts.'] },
  { ref: 'LX-QA-051', dept: 'Quality', title: 'Quality Assurance Officer', location: 'Accra', type: 'Full time', level: 'Mid level', posted: '1 September 2026', closes: '29 September 2026', urgent: false,
    summary: 'Decide whether a batch leaves the building. You will run the sampling, testing and documentation that keeps our brands where their reputation is.',
    duties: ['Sample and test raw materials, in-process product and finished goods.', 'Maintain batch records and support FDA and standards audits.', 'Investigate deviations and drive corrective action with production.', 'Train line staff on quality checkpoints and specifications.'],
    reqs: ['Degree in chemistry, biochemistry, food science or a related discipline.', 'Two or more years in QA or QC within manufacturing.', 'Working knowledge of Ghana Standards Authority and FDA requirements.', 'The confidence to hold a decision under pressure.'] },
  { ref: 'LX-SLS-207', dept: 'Sales', title: 'Area Sales Manager, Northern Sector', location: 'Tamale', type: 'Full time', level: 'Senior', posted: '25 August 2026', closes: '24 September 2026', urgent: true,
    summary: 'Take ownership of distribution, coverage and revenue across the northern sector, building the wholesaler and retailer base for all three brands.',
    duties: ['Deliver monthly volume and value targets across the assigned territory.', 'Recruit, develop and manage distributors and field representatives.', 'Drive numeric distribution and shelf presence in general trade.', 'Report on market conditions, pricing and competitor activity.'],
    reqs: ['Degree in marketing, business or a related field.', 'Five or more years in FMCG sales, with team management experience.', 'Proven route-to-market experience in the northern regions.', 'Valid driving licence and willingness to travel extensively.'] },
  { ref: 'LX-SLS-212', dept: 'Sales', title: 'Field Sales Representative', location: 'Kumasi', type: 'Full time', level: 'Entry level', posted: '30 August 2026', closes: '28 September 2026', urgent: false,
    summary: 'Work a defined route, keep our brands on the shelf and grow the outlets you own. The most direct way to learn how this business really works.',
    duties: ['Visit outlets on a fixed journey plan and take orders.', 'Merchandise product and execute point-of-sale activations.', 'Open new outlets and recover dormant ones.', 'Report daily sales and stock positions accurately.'],
    reqs: ['HND or degree in any discipline.', 'One year or more in field sales, ideally FMCG.', 'Strong local knowledge of the Ashanti region trade.'] },
  { ref: 'LX-MKT-088', dept: 'Marketing', title: 'Brand Manager, Femcare', location: 'Accra', type: 'Full time', level: 'Senior', posted: '20 August 2026', closes: '19 September 2026', urgent: false,
    summary: 'Lead the Yazz and Linzzy portfolios end to end, from pricing and pack architecture to the national outreach campaigns that carry them.',
    duties: ['Own the brand plan, budget and performance for the femcare portfolio.', 'Develop campaigns across ATL, trade and digital with agency partners.', 'Lead consumer research and turn it into product and pack decisions.', 'Work with the CSR team on menstrual health education programmes.'],
    reqs: ['Degree in marketing or a related field; postgraduate qualification an advantage.', 'Five or more years in brand management, preferably FMCG.', 'Track record of launching or relaunching a consumer brand.', 'Genuine interest in women’s health advocacy.'] },
  { ref: 'LX-MKT-093', dept: 'Marketing', title: 'Digital Marketing Executive', location: 'Accra', type: 'Full time', level: 'Mid level', posted: '3 September 2026', closes: '3 October 2026', urgent: false,
    summary: 'Run the day-to-day digital presence of three brands: content calendars, paid social, community management and reporting that someone actually reads.',
    duties: ['Plan and publish content across brand social channels.', 'Run and optimise paid campaigns on Meta, Google and TikTok.', 'Manage community engagement and escalate consumer issues.', 'Report on reach, engagement and conversion monthly.'],
    reqs: ['Degree or professional certification in marketing or communications.', 'Two or more years running social and paid digital for a brand or agency.', 'Hands-on with Meta Business Suite and Google Ads.', 'A portfolio of work you can walk us through.'] },
  { ref: 'LX-SCM-039', dept: 'Supply chain', title: 'Warehouse and Inventory Officer', location: 'Tema', type: 'Full time', level: 'Mid level', posted: '27 August 2026', closes: '25 September 2026', urgent: false,
    summary: 'Keep stock accurate and product available. You will run receipts, storage, picking and dispatch, and be the reason the numbers reconcile.',
    duties: ['Manage inward receipt, storage and dispatch of finished goods.', 'Run cycle counts and reconcile physical stock to system records.', 'Coordinate with transport on loading and delivery schedules.', 'Maintain warehouse safety and housekeeping standards.'],
    reqs: ['HND or degree in supply chain, logistics or accounting.', 'Two or more years in warehouse or inventory management.', 'Strong ERP or inventory system experience and confident with spreadsheets.'] },
  { ref: 'LX-SCM-044', dept: 'Supply chain', title: 'Procurement Officer', location: 'Accra', type: 'Contract', level: 'Mid level', posted: '18 August 2026', closes: '17 September 2026', urgent: false,
    summary: 'Source raw materials and packaging on time, on spec and on cost, and build supplier relationships that hold up when the schedule tightens.',
    duties: ['Raise and track purchase orders against production plans.', 'Evaluate suppliers on price, quality, lead time and reliability.', 'Negotiate terms and maintain the approved supplier list.', 'Support import documentation and clearing where required.'],
    reqs: ['Degree in procurement, supply chain or business administration.', 'Three or more years in procurement, ideally manufacturing inputs.', 'Familiarity with import processes and Ghanaian clearing requirements.'] },
  { ref: 'LX-FIN-072', dept: 'Corporate', title: 'Management Accountant', location: 'Accra', type: 'Full time', level: 'Senior', posted: '22 August 2026', closes: '21 September 2026', urgent: false,
    summary: 'Turn factory and sales data into decisions: product costing, variance analysis, budgets and the monthly numbers leadership runs the business on.',
    duties: ['Prepare monthly management accounts and variance commentary.', 'Own product costing and margin analysis by brand and SKU.', 'Lead the annual budget and quarterly reforecast process.', 'Support statutory audit and tax compliance.'],
    reqs: ['Degree in accounting or finance; ICAG or ACCA qualified or finalist.', 'Four or more years in a manufacturing finance role.', 'Strong costing experience and advanced spreadsheet skills.'] },
  { ref: 'LX-HR-021', dept: 'Corporate', title: 'HR Officer, Learning and Development', location: 'Accra', type: 'Full time', level: 'Mid level', posted: '4 September 2026', closes: '4 October 2026', urgent: false,
    summary: 'Build the training and onboarding that make our growth-from-within promise real, from technical certification to first-week induction.',
    duties: ['Design and run the annual training calendar across functions.', 'Manage onboarding for new joiners end to end.', 'Coordinate mentorship pairings and track development plans.', 'Maintain training records and measure programme impact.'],
    reqs: ['Degree in human resources, psychology or a related field.', 'Two or more years in L&D or generalist HR, ideally in manufacturing.', 'Confident facilitating a room of mixed seniority.'] },
  { ref: 'LX-GRD-006', dept: 'Corporate', title: 'Graduate Trainee Programme 2027', location: 'Accra', type: 'Internship', level: 'Graduate', posted: '1 September 2026', closes: '31 October 2026', urgent: false,
    summary: 'An eighteen-month rotation across production, quality, sales and marketing, with a permanent role at the end for those who earn it.',
    duties: ['Complete four supervised rotations with real deliverables in each.', 'Run an improvement project in your final rotation and present it to leadership.', 'Work alongside an assigned mentor throughout.'],
    reqs: ['First degree completed within the last two years, second class upper or better.', 'National service completed or in progress.', 'Evidence of initiative outside the classroom.', 'Open to being placed in any function based on fit.'] }
];

export const departments = ["All", "Manufacturing", "Quality", "Sales", "Marketing", "Supply chain", "Corporate"];
export const locations = ["All", "Accra", "Tema", "Kumasi", "Tamale"];
export const types = ["All", "Full time", "Contract", "Internship"];
