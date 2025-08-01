import React from 'react';
import PageSection from '@/components/PageSection';

const DataSecurityPage = () => (
  <PageSection className="max-w-3xl mx-auto py-16">
    <h1 className="text-4xl font-bold mb-6 text-primary">Data Security</h1>
    <p className="mb-4 text-lg text-muted-foreground">At ChexPro, we take data security seriously. Our systems and processes are designed to protect your information at every step.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Our Security Measures</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>End-to-end encryption for all sensitive data</li>
      <li>Regular security audits and vulnerability assessments</li>
      <li>Strict access controls and authentication protocols</li>
      <li>Compliance with industry standards and regulations</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Your Data, Your Control</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>You can request access to or deletion of your data at any time</li>
      <li>We never sell or share your information without consent</li>
    </ul>
    <p className="mt-8 text-muted-foreground">For questions about our data security practices, please contact us at info@chexpro.com.</p>
  </PageSection>
);

export default DataSecurityPage;
