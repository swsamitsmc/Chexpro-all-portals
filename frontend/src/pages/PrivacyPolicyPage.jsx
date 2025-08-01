import React from 'react';
import PageSection from '@/components/PageSection';

const PrivacyPolicyPage = () => (
  <PageSection className="max-w-3xl mx-auto py-16">
    <h1 className="text-4xl font-bold mb-6 text-primary">Privacy Policy</h1>
    <p className="mb-4 text-lg text-muted-foreground">At ChexPro, your privacy is our top priority. We are committed to protecting your personal information and maintaining transparency about how we collect, use, and safeguard your data.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Information We Collect</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Personal identification information (Name, email address, phone number, etc.)</li>
      <li>Background check data provided by you or authorized third parties</li>
      <li>Usage data and cookies for website analytics</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">How We Use Your Information</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>To provide and improve our background screening services</li>
      <li>To communicate with you regarding your requests and account</li>
      <li>To comply with legal and regulatory requirements</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Data Protection</h2>
    <p className="mb-4 text-muted-foreground">We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or alteration. All sensitive information is encrypted and stored securely.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Your Rights</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Access, update, or delete your personal information</li>
      <li>Opt-out of marketing communications</li>
      <li>Request information about our data practices</li>
    </ul>
    <p className="mt-8 text-muted-foreground">For questions or requests regarding your privacy, please contact us at info@chexpro.com.</p>
  </PageSection>
);

export default PrivacyPolicyPage;
