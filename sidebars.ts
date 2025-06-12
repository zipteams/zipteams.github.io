import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Partner API',
      items: [
        'partner-api/introduction',
        'partner-api/batch-call-ingestion',
        'partner-api/disposition-status-update',
      ],
    },
    {
      type: 'category',
      label: 'Embeddable Components',
      items: [
        'dashboard/customer-insights',
        'dashboard/customer-details',
      ],
    },
  ],
};

export default sidebars;
