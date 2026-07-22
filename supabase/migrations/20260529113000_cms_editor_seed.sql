-- Seed default CMS pages for About, Contact, Privacy, Terms, Guidelines, FAQ
-- Uses INSERT ... ON CONFLICT DO NOTHING so existing rows are preserved

INSERT INTO public.cms_pages (title, slug, body, meta_description, status, version)
VALUES
  (
    'About Us',
    'about',
    '## About PoolParty

PoolParty is the social prediction platform where friends, groups, and communities come together to create, join, and settle prediction pools on anything that matters to them.

### Our Mission
We believe that friendly competition and accountability make life more fun. PoolParty gives you the tools to put your predictions where your mouth is — with real stakes, transparent outcomes, and a trust system that keeps everyone honest.

### How It Works
1. **Create a Pool** — Set up a prediction on any topic: sports, pop culture, finance, or anything you can imagine.
2. **Invite Your Circle** — Share with friends, groups, or the public marketplace.
3. **Track & Settle** — Watch outcomes unfold and settle automatically or with community consensus.
4. **Build Your Reputation** — Every pool you win or settle fairly improves your Trust Score.

### Our Values
- **Transparency** — Every outcome is traceable and auditable.
- **Fairness** — Our dispute system ensures no one gets left holding the bag.
- **Community** — We''re built for groups, not just individuals.

### Contact Us
Have questions? Visit our [Contact page](/settings/contact) or email us at support@poolparty.app.',
    'Learn about PoolParty — the social prediction platform for friends, groups, and communities.',
    'published',
    1
  ),
  (
    'Contact Us',
    'contact',
    '## Contact Us

We''d love to hear from you. Whether you have a question, feedback, or need support, our team is here to help.

### Support
For account issues, billing questions, or technical problems, use the in-app **Report a Problem** feature or email us at:

**support@poolparty.app**

We aim to respond within 24 hours on business days.

### General Inquiries
For partnerships, press, or general questions:

**hello@poolparty.app**

### Community
Join our community Discord to connect with other PoolParty users, share feedback, and get early access to new features.

### Mailing Address
PoolParty Inc.
123 Prediction Lane
San Francisco, CA 94105',
    'Contact PoolParty support for help with your account, billing, or technical issues.',
    'published',
    1
  ),
  (
    'Privacy Policy',
    'privacy',
    '## Privacy Policy

*Last updated: January 1, 2025*

PoolParty Inc. ("PoolParty", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

### Information We Collect
- **Account Information**: Name, email address, phone number, and profile details you provide.
- **Usage Data**: How you interact with pools, contracts, and other features.
- **Device Information**: IP address, browser type, operating system.
- **Payment Information**: Processed securely through our payment partners; we do not store full card numbers.

### How We Use Your Information
- To provide and improve our services
- To process transactions and send related information
- To send administrative messages and updates
- To respond to comments and questions
- To analyze usage patterns and improve user experience

### Information Sharing
We do not sell your personal information. We may share information with:
- Service providers who assist in our operations
- Law enforcement when required by law
- Other parties with your consent

### Data Retention
We retain your data for as long as your account is active or as needed to provide services.

### Your Rights
You have the right to access, correct, or delete your personal information. Contact us at privacy@poolparty.app.

### Contact
For privacy-related questions: **privacy@poolparty.app**',
    'PoolParty Privacy Policy — how we collect, use, and protect your personal information.',
    'published',
    1
  ),
  (
    'Terms of Service',
    'terms',
    '## Terms of Service

*Last updated: January 1, 2025*

Welcome to PoolParty. By using our platform, you agree to these Terms of Service. Please read them carefully.

### Acceptance of Terms
By accessing or using PoolParty, you agree to be bound by these Terms and our Privacy Policy.

### Eligibility
You must be at least 18 years old to use PoolParty. By using the platform, you represent that you meet this requirement.

### User Accounts
- You are responsible for maintaining the confidentiality of your account credentials.
- You are responsible for all activity that occurs under your account.
- You must provide accurate and complete information when creating your account.

### Pools and Predictions
- PoolParty is a social prediction platform for entertainment purposes.
- You agree to settle pools honestly and in good faith.
- Fraudulent activity, manipulation of outcomes, or abuse of the dispute system may result in account suspension.

### Trust Score
Your Trust Score reflects your history of fair play on the platform. Actions that harm other users may negatively impact your score.

### Prohibited Conduct
- Creating pools on illegal activities
- Harassment or abuse of other users
- Attempting to manipulate pool outcomes
- Creating fake accounts or impersonating others

### Termination
We reserve the right to suspend or terminate accounts that violate these Terms.

### Limitation of Liability
PoolParty is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.

### Changes to Terms
We may update these Terms from time to time. We will notify you of significant changes.

### Contact
For questions about these Terms: **legal@poolparty.app**',
    'PoolParty Terms of Service — rules and guidelines for using the PoolParty platform.',
    'published',
    1
  ),
  (
    'Community Guidelines',
    'community-guidelines',
    '## Community Guidelines

PoolParty is built on trust, fairness, and friendly competition. These guidelines help keep our community a great place for everyone.

### The Golden Rule
Treat every other user the way you''d want to be treated. Friendly competition is great — bad faith is not.

### Fair Play
- **Honor your commitments**: If you enter a pool, you''re agreeing to settle it honestly.
- **No manipulation**: Don''t attempt to influence outcomes you''ve bet on through outside means.
- **Timely settlement**: Settle pools promptly when outcomes are clear.

### Respectful Behavior
- No harassment, hate speech, or personal attacks.
- Keep pool topics and descriptions appropriate for all audiences.
- Respect the privacy of other users — don''t share personal information without consent.

### Dispute Resolution
- Use the dispute system in good faith — only open disputes when you genuinely believe an outcome was wrong.
- Provide honest evidence and testimony in disputes.
- Abusing the dispute system to delay payment is a violation of these guidelines.

### Content Standards
- Pool titles and descriptions must be clear and honest.
- No pools on illegal activities or that promote harm.
- No spam or repetitive content.

### Consequences
Violations of these guidelines may result in:
- Warning
- Trust Score reduction
- Temporary suspension
- Permanent account ban

### Reporting
If you see a violation, use the **Report a Problem** feature in the app. We review all reports.

### Questions?
Contact us at **community@poolparty.app**',
    'PoolParty Community Guidelines — how to be a good member of the PoolParty community.',
    'published',
    1
  ),
  (
    'FAQ',
    'faq',
    '## Frequently Asked Questions

### Getting Started

**What is PoolParty?**
PoolParty is a social prediction platform where you create and join prediction pools with friends, groups, or the public.

**Is PoolParty free to use?**
Yes! Creating an account and joining pools is free. Some premium features may require a subscription.

**How do I create my first pool?**
Tap the "+" button on the home screen, choose a pool type, set your terms, and invite participants.

### Pools & Predictions

**What types of pools can I create?**
You can create Yes/No pools, multi-outcome pools, numeric scale pools, and date/time prediction pools.

**How are pools settled?**
Pool creators can mark outcomes manually, or pools can be set to auto-resolve based on verified external sources.

**What happens if there''s a dispute?**
Open a dispute through the Dispute Center. Our community review process will evaluate the evidence and reach a fair resolution.

### Trust Score

**What is a Trust Score?**
Your Trust Score is a reputation metric that reflects your history of fair play — settling pools on time, honoring commitments, and resolving disputes fairly.

**How do I improve my Trust Score?**
Settle pools promptly, avoid disputes, and build a track record of reliable participation.

**Can my Trust Score go down?**
Yes. Late settlements, lost disputes, and unpaid pools can lower your score.

### Payments

**How do I add a payment method?**
Go to Profile → Payments to add a card or bank account.

**When do I get paid?**
Winnings are credited to your PoolParty balance immediately after settlement. You can withdraw to your bank account at any time.

### Account & Privacy

**How do I delete my account?**
Go to Settings → Account → Delete Account. Note that this action is irreversible.

**Is my financial information secure?**
Yes. All payment processing is handled by PCI-compliant payment partners. We never store your full card number.

**Still have questions?**
Contact us at **support@poolparty.app**',
    'PoolParty FAQ — answers to the most common questions about using PoolParty.',
    'published',
    1
  )
ON CONFLICT (slug) DO NOTHING;
