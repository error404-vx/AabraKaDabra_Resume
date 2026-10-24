import type { Category } from '../types.js';

/**
 * Entry format: "Canonical~alias~alias". A leading "!" makes that name/alias case-sensitive
 * (used for short or ambiguous words like "Swift" or "Lean").
 */
const DICTIONARY: Record<Exclude<Category, 'Other'>, string[]> = {
  Languages: [
    'JavaScript~!JS~ES6', 'TypeScript', 'Python', 'Java', 'C#~C Sharp', 'C++', 'Golang', '!Rust', 'Ruby', 'PHP',
    'Kotlin', '!Swift', 'Scala', 'SQL~T-SQL~PL/SQL', 'Bash~Shell Scripting~shell scripts', 'PowerShell',
    'HTML~HTML5', 'CSS~CSS3', 'Sass~SCSS', '!Dart', 'Objective-C', 'Perl', 'MATLAB', 'Groovy', 'Solidity', '!VBA',
    'COBOL', 'Elixir', 'Haskell', '!Lua',
  ],
  'Frameworks & Libraries': [
    'React~React.js~ReactJS', 'Angular~AngularJS', 'Vue.js~!Vue~VueJS', 'Next.js~NextJS', 'Nuxt', 'Svelte',
    'Node.js~NodeJS~!Node', 'Express.js~ExpressJS', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', '!Spring',
    'Hibernate', '.NET~.NET Core~dotnet', 'ASP.NET', 'Entity Framework', 'Ruby on Rails~!Rails', 'Laravel',
    'Symfony', 'jQuery', 'Redux', 'GraphQL', 'REST APIs~RESTful~REST API~!REST', 'gRPC', 'Tailwind CSS~Tailwind',
    '!Bootstrap', 'Material UI~!MUI', 'React Native', 'Flutter', 'Electron', 'SwiftUI', 'Jetpack Compose', 'Jest',
    'Mocha', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'pytest', 'TestNG', 'Storybook', 'Webpack', '!Vite',
    'Three.js', 'D3.js', 'Pandas', 'NumPy', 'scikit-learn~sklearn', 'TensorFlow', 'PyTorch', 'Keras', 'LangChain',
  ],
  'Cloud & DevOps': [
    'AWS~Amazon Web Services', 'Azure~Microsoft Azure', 'GCP~Google Cloud', 'Docker', 'Kubernetes~!K8s',
    'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps',
    'CI/CD~continuous integration~continuous delivery~continuous deployment', 'Helm', 'Prometheus', 'Grafana',
    'Datadog', 'Splunk', 'New Relic', 'Linux', 'Unix', 'Nginx', 'Serverless', 'AWS Lambda~!Lambda', '!EC2', '!S3',
    'CloudFormation', 'Microservices~microservice', 'Infrastructure as Code~!IaC', 'Site Reliability Engineering~!SRE',
    'Observability', 'TCP/IP', 'Load Balancing~load balancers', 'Git', 'GitHub', 'GitLab', 'Bitbucket', 'OpenShift',
    'Pulumi', 'Argo CD~ArgoCD', 'Istio',
  ],
  'Data & AI': [
    'Machine Learning~!ML', 'Deep Learning', 'Generative AI~GenAI~Gen AI', 'Artificial Intelligence~!AI',
    'Large Language Models~!LLMs~!LLM', 'NLP~Natural Language Processing', 'Computer Vision',
    'Data Analysis~data analytics~analyze data~analyzing data', 'Data Visualization', 'Data Modeling~data models',
    'Data Engineering', 'ETL~!ELT~data pipelines', 'Data Warehousing~data warehouse', 'Apache Spark~PySpark~!Spark',
    'Hadoop', 'Kafka', 'Airflow', '!dbt', 'Snowflake', 'Databricks', 'BigQuery', 'Redshift', 'Tableau',
    'Power BI~PowerBI', 'Looker', 'Statistics~statistical analysis', 'A/B Testing~A/B tests~experimentation',
    'MLOps', 'Prompt Engineering', 'RAG~Retrieval-Augmented Generation', 'Jupyter', '!SAS', 'SPSS',
    'Predictive Modeling', 'Big Data',
  ],
  Databases: [
    'PostgreSQL~Postgres', 'MySQL', 'SQL Server~MSSQL', '!Oracle', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
    'Elasticsearch', 'SQLite', 'Cosmos DB~CosmosDB', 'Firebase', 'Supabase', 'NoSQL', 'Neo4j', 'MariaDB',
  ],
  'Tools & Platforms': [
    'Jira', 'Confluence', 'Trello', 'Asana', 'Microsoft Office~MS Office~Microsoft 365~Office 365',
    '!PowerPoint', 'Google Workspace~G Suite', 'Salesforce', 'HubSpot', 'Zendesk', 'ServiceNow', '!SAP',
    '!Workday', 'QuickBooks', 'NetSuite', 'Figma', 'Adobe Creative Suite~Adobe Creative Cloud', 'Photoshop',
    'Illustrator', 'InDesign', 'Adobe XD', 'After Effects', 'Premiere Pro', 'Canva', 'Google Analytics~!GA4',
    'Google Ads~AdWords', 'Meta Ads~Facebook Ads', 'SEMrush', 'Ahrefs', 'Mailchimp', 'Marketo', 'WordPress',
    'Shopify', 'Postman', 'Visual Studio Code~VS Code', 'IntelliJ', 'Active Directory', 'Windows Server', 'Miro',
    'Microsoft Dynamics~Dynamics 365', 'AutoCAD', 'SolidWorks', 'Revit', '!Unity', 'Unreal Engine', 'Cerner',
  ],
  'Methods & Practices': [
    'Agile', 'Scrum', 'Kanban', '!Lean', 'Six Sigma', 'Waterfall', 'DevOps', 'TDD~Test-Driven Development',
    '!BDD~Behavior-Driven Development', 'Object-Oriented Programming~!OOP~object-oriented', 'Design Patterns',
    'System Design', 'Distributed Systems', 'Unit Testing~unit tests', 'Integration Testing~integration tests',
    'Test Automation~automated testing~automated tests', 'Code Review~code reviews',
    'Performance Optimization~performance tuning', 'Application Security~AppSec', '!OWASP',
    'Accessibility~!WCAG~a11y', 'Responsive Design', '!SDLC', '!ITIL', 'Data Structures~algorithms', 'API Design',
    'Event-Driven Architecture', 'Domain-Driven Design~!DDD', 'UX Design~user experience', 'UI Design~user interface design',
    'User Research', 'Wireframing~wireframes', 'Prototyping', 'Design Systems~design system', 'Version Control',
  ],
  'Business & Domain': [
    'Project Management', 'Program Management', 'Product Management', 'Product Strategy', 'Roadmapping~roadmaps',
    'Stakeholder Management~stakeholders', 'Requirements Gathering~gather requirements~gathering requirements',
    'Business Analysis', 'Process Improvement~continuous improvement', 'Change Management', 'Risk Management',
    'Budgeting~budgets', 'Financial Analysis', 'Financial Modeling', 'Forecasting', 'Financial Reporting',
    'Accounting', '!GAAP', '!IFRS', 'Accounts Payable', 'Accounts Receivable', 'Auditing~audits', 'Payroll',
    'Compliance', 'Regulatory Requirements~regulatory', 'KPIs~key performance indicators~!KPI', '!OKRs', '!B2B',
    '!B2C', '!SaaS', 'Sales', 'Lead Generation', 'Account Management', 'Business Development', 'Customer Success',
    'Customer Service~customer support', '!CRM', 'Negotiation', 'Pipeline Management~sales pipeline',
    'Cold Calling', 'Digital Marketing', 'Content Marketing', 'Content Strategy', 'Social Media Marketing~social media',
    '!SEO~Search Engine Optimization', '!SEM~!PPC~pay-per-click', 'Email Marketing', 'Marketing Automation',
    'Brand Management~branding', 'Copywriting', 'Market Research', 'Competitive Analysis', 'Go-to-Market~!GTM',
    'Growth Marketing', 'Recruiting~recruitment~talent acquisition', 'Onboarding', 'Employee Relations',
    'Performance Management', '!HRIS', 'Training and Development~training & development', 'Supply Chain',
    'Logistics', 'Procurement', 'Inventory Management', 'Vendor Management', 'Operations Management',
    'Quality Assurance~!QA', 'Quality Control', 'Patient Care', '!HIPAA', 'EHR~!EMR~electronic health records',
    'Contract Management', '!GDPR~data privacy', 'Cybersecurity~cyber security~information security',
    'Penetration Testing', '!SIEM', 'Incident Response', 'Vulnerability Management',
    'Identity and Access Management~!IAM', 'Technical Support~IT support~help desk', 'Troubleshooting',
    'Technical Writing~technical documentation', 'Event Planning', 'Public Relations',
  ],
  'Soft Skills': [
    'Communication~communicate~communicator', 'Collaboration~collaborate~cross-functional',
    'Leadership~lead teams', 'Problem Solving~problem-solving~solve problems', 'Critical Thinking',
    'Attention to Detail~detail-oriented~detail oriented', 'Time Management~prioritization',
    'Adaptability~adaptable', 'Mentoring~mentor~coaching', 'Teamwork~team player', 'Ownership~take ownership',
    'Customer Focus~customer-centric~customer-focused~customer obsessed', 'Analytical Skills~analytical',
    'Presentation Skills~presentations', 'Organizational Skills~organized~organisational',
    'Self-Motivated~self-starter~proactive', 'Interpersonal Skills~interpersonal', 'Decision Making~decision-making',
    'Creativity~creative', 'Multitasking~multi-task~multitask',
  ],
};

// Short/ambiguous names that need context-aware patterns.
const SPECIAL: { name: string; category: Category; re: RegExp }[] = [
  { name: 'Go', category: 'Languages', re: /(?<=[,(/:]\s*|\band\s)Go(?=\s*[,)/]|\s+and\b|\s*$)/gm },
  { name: 'R', category: 'Languages', re: /(?<=[,(/:]\s*|\band\s)R(?=\s*[,)/]|\s+and\b)/g },
  { name: 'C', category: 'Languages', re: /(?<=[,(/:]\s*)C(?=\s*[,)/]|\s+and\b)/g },
  { name: 'Excel', category: 'Tools & Platforms', re: /\b(?:MS |Microsoft )?Excel\b(?!\s+(?:in|at|with)\b)/g },
];

export interface SkillMatcher {
  name: string;
  category: Category;
  patterns: RegExp[];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LEFT = '(?<![A-Za-z0-9+#.])';
const RIGHT = '(?![A-Za-z0-9+#])';

function compile(entry: string): { name: string; patterns: RegExp[] } {
  const parts = entry.split('~');
  const name = parts[0].replace(/^!/, '');
  const ci: string[] = [];
  const cs: string[] = [];
  for (const p of parts) (p.startsWith('!') ? cs : ci).push(esc(p.replace(/^!/, '')));
  const patterns: RegExp[] = [];
  if (ci.length) patterns.push(new RegExp(`${LEFT}(?:${ci.join('|')})${RIGHT}`, 'gi'));
  if (cs.length) patterns.push(new RegExp(`${LEFT}(?:${cs.join('|')})${RIGHT}`, 'g'));
  return { name, patterns };
}

export const SKILLS: SkillMatcher[] = [
  ...Object.entries(DICTIONARY).flatMap(([category, entries]) =>
    entries.map((e) => ({ ...compile(e), category: category as Category })),
  ),
  ...SPECIAL.map((s) => ({ name: s.name, category: s.category, patterns: [s.re] })),
];

const BY_NAME = new Map(SKILLS.map((s) => [s.name.toLowerCase(), s]));

export function countMatches(matcher: SkillMatcher, text: string): number {
  return matcher.patterns.reduce((sum, re) => sum + (text.match(re)?.length ?? 0), 0);
}

/** Returns patterns for a keyword, falling back to a literal match for terms outside the dictionary. */
export function patternsFor(term: string): RegExp[] {
  return BY_NAME.get(term.toLowerCase())?.patterns ?? [new RegExp(`${LEFT}${esc(term)}${RIGHT}`, 'gi')];
}

export function mentions(term: string, text: string): boolean {
  return patternsFor(term).some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

export function isKnownSkillText(token: string): boolean {
  return SKILLS.some((s) => s.patterns.some((re) => {
    re.lastIndex = 0;
    return re.test(token);
  }));
}
