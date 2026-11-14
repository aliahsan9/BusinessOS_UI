import { LegalDocument, LegalDocumentKey } from './legal-document.model';

const UPDATED = 'November 14, 2026';

const privacy: LegalDocument = {
  key: 'privacy',
  path: '/privacy',
  label: 'Privacy Policy',
  eyebrow: 'Privacy Policy',
  title: 'Privacy Policy',
  lead:
    'BusinessOS is a business workspace for inventory, sales, customers, finance, and your team. This policy explains what we collect, how we use it, and the choices you have.',
  updated: UPDATED,
  sections: [
    {
      id: 'who-we-are',
      title: 'Who we are',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS (“we”, “us”) operates the BusinessOS service at https://businessos.app. Our published office is in Faisalabad, Pakistan. This policy covers the public website, account registration, and the signed-in workspace.',
        },
        {
          type: 'p',
          text: 'If you have a privacy question, email [[mailto:support@businessos.com|support@businessos.com]] or use the [[/contact|Contact page]]. Put “Privacy” in the subject line.',
        },
      ],
    },
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      blocks: [
        {
          type: 'p',
          text: 'We collect information you give us, information created while you use the workspace, and a limited amount of technical data needed to run the service.',
        },
        {
          type: 'ul',
          items: [
            'Account details: name, work email, password (stored in hashed form), and, if you use Google sign-in, the name and email Google shares with us. We never receive your Google password.',
            'Workspace details: business name and the organization settings you save.',
            'Business records you or your teammates enter: products, stock, suppliers, purchase orders, customers, orders, quotations, invoices, payments, expenses, and related notes.',
            'Billing details: plan, billing country, currency, invoices, and payment status. Card and wallet credentials are collected by the payment provider shown at checkout. We do not store full card numbers.',
            'Support messages you send us.',
            'Technical data: login sessions, browser and device type, and feature activity used to keep the service secure and reliable.',
          ],
        },
      ],
    },
    {
      id: 'how-we-use-it',
      title: 'How we use information',
      blocks: [
        {
          type: 'p',
          text: 'We use information to provide BusinessOS, bill for it, keep it secure, and support you.',
        },
        {
          type: 'ul',
          items: [
            'Create and operate your workspace, including inventory, sales, finance, reporting, and team permissions.',
            'Authenticate users, enforce roles, and isolate each organization’s records from other customers.',
            'Send transactional messages such as invites, password resets, and billing notices.',
            'Process subscriptions, trials, invoices, and refunds.',
            'Respond to support requests and diagnose outages or errors.',
            'Improve reliability. We do not sell your customer lists, inventory, or financial records.',
          ],
        },
      ],
    },
    {
      id: 'ai-assistant',
      title: 'Navla, the AI assistant',
      blocks: [
        {
          type: 'p',
          text: 'Navla answers from the records in your workspace that the signed-in user is allowed to see. A question can send the prompt and the relevant business context to our model provider (OpenAI) so it can generate a reply. Changes Navla proposes to your records wait for a person on your team to confirm them.',
        },
        {
          type: 'p',
          text: 'We do not sell those prompts or replies. Do not paste secrets, payment card numbers, or personal data you do not need the assistant to process. Navla is a workspace tool. Its answers are not legal, tax, or accounting advice.',
        },
      ],
    },
    {
      id: 'when-we-share',
      title: 'When we share information',
      blocks: [
        {
          type: 'p',
          text: 'We share information only with the people and processors needed to run BusinessOS, when you tell us to, or when the law requires it.',
        },
        {
          type: 'ul',
          items: [
            'Teammates you invite, limited by the roles you assign.',
            'Infrastructure providers that host the application and store backups, under confidentiality obligations.',
            'Payment providers that process a subscription, including Stripe and any local method shown at checkout.',
            'OpenAI, when someone in the workspace uses Navla.',
            'Google, when someone chooses Google sign-in.',
            'Professional advisers, or authorities, when required by law or to investigate abuse, fraud, or a security incident.',
          ],
        },
      ],
    },
    {
      id: 'international',
      title: 'Where information is processed',
      blocks: [
        {
          type: 'p',
          text: 'We operate from Pakistan. Hosting, payment, and AI providers may process information in other countries. When we use a provider, we do so to deliver the service you signed up for. If you are in a region with its own privacy law, you can contact us to exercise the access, correction, or deletion rights that law gives you.',
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and similar technology',
      blocks: [
        {
          type: 'ul',
          items: [
            'Essential cookies and local storage keep you signed in and protect the session.',
            'We may use limited product analytics to understand which features fail or go unused.',
            'We do not use advertising cookies to sell or profile your business records.',
            'You can block non-essential cookies in your browser. Blocking essential cookies will prevent sign-in.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: 'How we protect it',
      blocks: [
        {
          type: 'p',
          text: 'Connections to BusinessOS are encrypted in transit. Access inside a workspace is limited by role. Each organization’s records are scoped to that account so another customer cannot browse them. No online service can promise perfect security. Please use a unique password and remove teammates who should no longer have access.',
        },
      ],
    },
    {
      id: 'retention',
      title: 'How long we keep it',
      blocks: [
        {
          type: 'p',
          text: 'We keep workspace data while the account is open. Cancelling a subscription does not, by itself, delete those records. After you ask us to close the workspace, we delete or anonymize business data within a reasonable period, unless we must keep it longer for tax, accounting, fraud prevention, or a legal claim. Backup copies age out on their normal schedule. Billing records may be kept for as long as tax and accounting rules require.',
        },
      ],
    },
    {
      id: 'your-choices',
      title: 'Your choices',
      blocks: [
        {
          type: 'ul',
          items: [
            'Update your profile and company settings inside the workspace.',
            'Invite, remove, or change roles for teammates at any time.',
            'Turn Navla off in workspace settings if you do not want the assistant to process prompts.',
            'Cancel a paid plan from Billing. What happens to fees is described in the [[/refunds|Refund Policy]].',
            'Ask us to export or delete workspace data by emailing [[mailto:support@businessos.com|support@businessos.com]]. Include the work email on the account.',
          ],
        },
      ],
    },
    {
      id: 'children',
      title: 'Children',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS is a business product and is not directed at children. We do not knowingly create accounts for anyone under 16. If you believe a child has given us personal information, contact us and we will delete it.',
        },
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      blocks: [
        {
          type: 'p',
          text: 'We will update the date at the top when this policy changes. If a change materially reduces how we protect workspace data, we will give account owners notice by email or in the product before it takes effect. Continuing to use BusinessOS after the effective date means you accept the updated policy.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS, Faisalabad, Pakistan. Email [[mailto:support@businessos.com|support@businessos.com]]. The [[/terms|Terms of Service]] and [[/refunds|Refund Policy]] sit alongside this policy.',
        },
      ],
    },
  ],
};

const terms: LegalDocument = {
  key: 'terms',
  path: '/terms',
  label: 'Terms of Service',
  eyebrow: 'Terms of Service',
  title: 'Terms of Service',
  lead:
    'These terms are the agreement between you and BusinessOS for the website, the workspace, and paid plans. Please read them with the Privacy Policy and the Refund Policy.',
  updated: UPDATED,
  sections: [
    {
      id: 'agreement',
      title: 'The agreement',
      blocks: [
        {
          type: 'p',
          text: 'By creating an account, signing in with Google, or using BusinessOS, you agree to these terms, the [[/privacy|Privacy Policy]], and the [[/refunds|Refund Policy]]. If you are accepting for a company, you confirm that you have authority to bind that company. “You” means that company and the people it allows into the workspace.',
        },
        {
          type: 'p',
          text: 'If you do not agree, do not create an account. We may refuse registration that looks fraudulent or incomplete.',
        },
      ],
    },
    {
      id: 'the-service',
      title: 'The service',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS is a software service for running a business: products and stock, suppliers and purchasing, customers and sales, invoices and payments, expenses and finance, reports, team permissions, and Navla, an assistant that answers from your own records. Features, limits, and prices depend on the plan shown at signup or on the pricing page.',
        },
        {
          type: 'p',
          text: 'We may add, change, or retire features. If we discontinue a paid feature you rely on during a period you have already paid for, you may cancel under the [[/refunds|Refund Policy]].',
        },
      ],
    },
    {
      id: 'accounts',
      title: 'Accounts and workspaces',
      blocks: [
        {
          type: 'ul',
          items: [
            'You must provide a real name, a work email you control, and the business name for the workspace.',
            'You are responsible for the people you invite and for the roles you give them. Their activity counts as yours.',
            'Keep passwords confidential. Tell us promptly if you suspect unauthorized access.',
            'One workspace is for one organization. Do not use it to store another company’s records without that company’s permission.',
            'We may suspend an account that is unused for a long period on a free plan, after notice to the account email, or that we reasonably believe is compromised.',
          ],
        },
      ],
    },
    {
      id: 'customer-data',
      title: 'Your data',
      blocks: [
        {
          type: 'p',
          text: 'You keep ownership of the business records you submit. You grant us a license to host, back up, display, and process that data solely to provide and secure BusinessOS, including sending the minimum context Navla needs to answer a question from a user who is allowed to see it.',
        },
        {
          type: 'p',
          text: 'You are responsible for the lawfulness of the data you upload, including personal information about your customers and staff, and for having a lawful basis to process it. You will not upload data you are not allowed to share with us.',
        },
      ],
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      blocks: [
        {
          type: 'p',
          text: 'You may use BusinessOS for lawful business operations. You may not:',
        },
        {
          type: 'ul',
          items: [
            'Break the law, or infringe someone else’s privacy or intellectual property.',
            'Probe, scan, or access another customer’s workspace, or attempt to bypass tenant isolation or role checks.',
            'Upload malware, or interfere with the service for other customers.',
            'Resell, sublicense, or offer BusinessOS as your own product without a written agreement with us.',
            'Use Navla to seek information from outside your permissions, or treat its output as professional advice.',
            'Misrepresent charges to your bank before you have contacted us about a billing dispute.',
          ],
        },
      ],
    },
    {
      id: 'plans-and-payment',
      title: 'Plans, trials, and payment',
      blocks: [
        {
          type: 'p',
          text: 'Paid plans are billed monthly or yearly, in the currency and country shown before you confirm. Prices can differ by billing country. Taxes may be added where required. A custom plan is agreed separately with [[mailto:sales@businessos.app|sales@businessos.app]].',
        },
        {
          type: 'p',
          text: 'A paid plan includes one free trial per workspace. The trial length is the number of days shown on that plan. Paid plans currently include a 14-day trial. The free plan is not a trial and is not charged. No subscription fee is created until the trial ends and a payment method is confirmed. If the workspace has already used its trial, a later paid plan starts without a second trial.',
        },
        {
          type: 'p',
          text: 'You authorize the payment provider shown at checkout to charge the plan fee, and any prorated amount for a confirmed plan change, on a recurring basis until you cancel. Card details are handled by that provider. If a renewal payment fails, we may mark the subscription past due and limit paid features until the invoice is paid.',
        },
        {
          type: 'p',
          text: 'Plan limits (users, products, customers, storage, Navla requests, and included modules) are part of the plan. When a limit is reached, the product blocks the action that would exceed it. Existing records stay in place.',
        },
      ],
    },
    {
      id: 'cancellation',
      title: 'Cancellation',
      blocks: [
        {
          type: 'p',
          text: 'An administrator can cancel from Billing. You can cancel at the end of the current paid period, or cancel immediately.',
        },
        {
          type: 'ul',
          items: [
            'Cancel at period end: paid access continues until the period you already paid for ends. The subscription does not renew.',
            'Cancel immediately: the paid subscription ends now and access to the workspace may end. This does not, by itself, delete the records stored in the workspace.',
            'Moving a paid Stripe subscription down to the free plan keeps paid access until the current period ends, and the paid plan does not renew.',
          ],
        },
        {
          type: 'p',
          text: 'Fees for a period that has already started are handled by the [[/refunds|Refund Policy]]. Deletion of workspace data is a separate request under the [[/privacy|Privacy Policy]].',
        },
      ],
    },
    {
      id: 'refunds',
      title: 'Refunds',
      blocks: [
        {
          type: 'p',
          text: 'Refunds follow the [[/refunds|Refund Policy]], which is part of these terms. Cancelling a plan is not the same thing as a refund.',
        },
      ],
    },
    {
      id: 'ai-assistant',
      title: 'Navla',
      blocks: [
        {
          type: 'p',
          text: 'Navla is included only on plans that list it, and it is subject to the request allowance on that plan. Answers are generated from your records and can be wrong or incomplete. You are responsible for reviewing anything you confirm, save, or send to a customer. Navla does not create a professional relationship or a guarantee of a business result.',
        },
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual property',
      blocks: [
        {
          type: 'p',
          text: 'We own BusinessOS, including the software, the site, the BusinessOS and Navla names, and the design of the product. These terms give you a limited, non-exclusive, non-transferable right to use the service for your internal business while your account is in good standing. You may not copy, reverse engineer, or frame the service except where the law does not allow that restriction.',
        },
        {
          type: 'p',
          text: 'If you send us feedback, we may use it to improve the product without any obligation to you.',
        },
      ],
    },
    {
      id: 'third-parties',
      title: 'Third-party services',
      blocks: [
        {
          type: 'p',
          text: 'Checkout, Google sign-in, and Navla depend on third parties. Their terms and privacy notices apply to the part of the interaction they handle. We are not responsible for an outage or policy of a payment provider, Google, or the model provider, but we remain responsible for the BusinessOS service we agreed to provide.',
        },
      ],
    },
    {
      id: 'availability',
      title: 'Availability',
      blocks: [
        {
          type: 'p',
          text: 'We work to keep BusinessOS available, but we do not guarantee uninterrupted access. Maintenance, provider outages, and events outside our control can interrupt the service. We will restore it as soon as we reasonably can.',
        },
      ],
    },
    {
      id: 'suspension',
      title: 'Suspension',
      blocks: [
        {
          type: 'p',
          text: 'We may suspend or close a workspace that does not pay fees when due, that breaks these terms, or that creates a security risk for other customers. Where we can do so safely, we will tell the account owner and give a chance to fix the issue. We may act first if the risk is urgent.',
        },
      ],
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS is a tool for operating your business. It does not provide legal, tax, audit, or accounting advice, and reports you generate should be reviewed before you rely on them with a customer, a bank, or a tax authority. Except where the law does not allow it, the service is provided “as available”, without an implied warranty of merchantability, fitness for a particular purpose, or non-infringement.',
        },
      ],
    },
    {
      id: 'liability',
      title: 'Limitation of liability',
      blocks: [
        {
          type: 'p',
          text: 'To the extent the law allows, neither party is liable for lost profits, lost data, or indirect or consequential damages. Our total liability arising out of the service in any twelve-month period is limited to the fees you paid us for that workspace during those twelve months. If you paid no fees, that cap is USD 100.',
        },
        {
          type: 'p',
          text: 'Nothing in these terms limits liability for fraud, or for death or personal injury caused by negligence, or any other liability that cannot legally be limited.',
        },
      ],
    },
    {
      id: 'governing-law',
      title: 'Governing law',
      blocks: [
        {
          type: 'p',
          text: 'These terms are governed by the laws of Pakistan, without regard to conflict-of-law rules. The courts of Faisalabad, Pakistan have exclusive jurisdiction, except where a consumer-protection law that applies to you does not allow that restriction.',
        },
      ],
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      blocks: [
        {
          type: 'p',
          text: 'We may update these terms. We will change the date at the top and, for a material change, give account owners notice by email or in the product before it takes effect. If you keep using BusinessOS after that date, the updated terms apply. If you do not agree, cancel before the change takes effect.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      blocks: [
        {
          type: 'p',
          text: 'BusinessOS, Faisalabad, Pakistan. Support: [[mailto:support@businessos.com|support@businessos.com]]. Sales for a custom plan: [[mailto:sales@businessos.app|sales@businessos.app]].',
        },
      ],
    },
  ],
};

const refunds: LegalDocument = {
  key: 'refunds',
  path: '/refunds',
  label: 'Refund Policy',
  eyebrow: 'Refund Policy',
  title: 'Refund Policy',
  lead:
    'This policy explains when a BusinessOS subscription is charged, when it is not, and how to ask for a refund. It is part of the Terms of Service.',
  updated: UPDATED,
  sections: [
    {
      id: 'scope',
      title: 'What this covers',
      blocks: [
        {
          type: 'p',
          text: 'This policy covers subscription fees for BusinessOS plans billed through the checkout on your workspace. It does not cover amounts you collect from your own customers inside BusinessOS. Those payments are between you and your customer.',
        },
      ],
    },
    {
      id: 'trial',
      title: 'Free trial',
      blocks: [
        {
          type: 'p',
          text: 'The first paid subscription on a workspace includes the free trial shown on the plan. Paid plans currently include a 14-day trial. The free plan has no trial and no subscription fee.',
        },
        {
          type: 'p',
          text: 'We do not create a subscription charge until the trial ends and a payment method is confirmed. Cancel before the trial ends if you do not want that charge. A workspace can use the trial once. There is nothing to refund for a trial that was never charged.',
        },
      ],
    },
    {
      id: 'monthly',
      title: 'Monthly plans',
      blocks: [
        {
          type: 'p',
          text: 'Monthly fees pay for the current billing period. You can cancel at any time from Billing.',
        },
        {
          type: 'ul',
          items: [
            'If you cancel at period end, you keep paid access until that period ends, and we do not bill the next month. We do not refund the month already underway.',
            'If you cancel immediately, paid access ends now. The unused days of that month are not refunded.',
          ],
        },
      ],
    },
    {
      id: 'annual',
      title: 'Annual plans',
      blocks: [
        {
          type: 'p',
          text: 'Annual plans are billed in advance for the year. You can cancel at any time to stop the next renewal. We do not automatically refund unused months on an annual plan. A charge we should not have made is covered under “When we refund” below.',
        },
      ],
    },
    {
      id: 'plan-changes',
      title: 'Upgrades, downgrades, and renewals',
      blocks: [
        {
          type: 'ul',
          items: [
            'A confirmed upgrade can produce a prorated charge for the rest of the current period. That prorated charge follows this policy once it is paid.',
            'A downgrade from a paid Stripe plan to the free plan keeps the paid plan until the current period ends. We do not refund that period.',
            'A renewal that succeeds after you cancelled at period end, because the cancellation did not reach us before the renewal ran, is refundable. Write to us with the invoice number.',
            'Failed payments that never complete are not charges and are not refunded. Your bank may still show a pending authorization, which the bank releases.',
          ],
        },
      ],
    },
    {
      id: 'when-we-refund',
      title: 'When we refund',
      blocks: [
        {
          type: 'p',
          text: 'We refund a subscription charge in these cases:',
        },
        {
          type: 'ul',
          items: [
            'We billed you twice for the same period.',
            'We billed the wrong plan or the wrong amount, and the invoice does not match what you confirmed.',
            'We billed a renewal after you cancelled in time for that renewal not to run.',
            'A defect on our side made the paid service unusable for a material part of the period you are asking about, and we could not restore it in a reasonable time.',
            'The law that applies to the charge requires a refund.',
          ],
        },
        {
          type: 'p',
          text: 'Approved refunds go back to the original payment method, in the currency of the original charge, including tax we collected on that charge when the provider can return it. Your bank or card issuer controls how quickly the credit appears. That is often five to ten business days after we submit it, and it can take longer.',
        },
      ],
    },
    {
      id: 'when-we-do-not',
      title: 'When we do not refund',
      blocks: [
        {
          type: 'ul',
          items: [
            'A change of mind after a monthly period has started, or unused time on an annual plan, except for the cases above.',
            'A trial that was never charged.',
            'The free plan.',
            'Usage that stayed inside the plan you chose, including Navla requests you consumed.',
            'Currency-conversion fees, overdraft fees, or other charges added by your bank.',
            'Amounts your own customers paid you through invoices you issued in BusinessOS.',
          ],
        },
      ],
    },
    {
      id: 'how-to-request',
      title: 'How to request a refund',
      blocks: [
        {
          type: 'p',
          text: 'Email [[mailto:support@businessos.com|support@businessos.com]] from the account owner’s address. Include the workspace name, the invoice number, the amount, the date of the charge, and a short description of what went wrong. You can also start from the [[/contact|Contact page]].',
        },
        {
          type: 'p',
          text: 'We aim to reply within two business days. If we approve the refund, we submit it to the payment provider. If we decline it, we will say why, with a reference to this policy.',
        },
      ],
    },
    {
      id: 'chargebacks',
      title: 'Disputes and chargebacks',
      blocks: [
        {
          type: 'p',
          text: 'Contact us before you dispute a charge with your bank. A chargeback opened while we are reviewing a refund request can delay the credit. If a chargeback reverses a fee and we also refund it, we may recover the duplicate credit. We may suspend a workspace that disputes a valid charge without contacting us first.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      blocks: [
        {
          type: 'p',
          text: 'Billing questions: [[mailto:support@businessos.com|support@businessos.com]]. Custom contracts: [[mailto:sales@businessos.app|sales@businessos.app]]. See also the [[/terms|Terms of Service]] and [[/privacy|Privacy Policy]].',
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  privacy,
  terms,
  refunds,
};
