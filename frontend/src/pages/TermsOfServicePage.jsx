import React from 'react';
import PageSection from '@/components/PageSection';

const TermsOfServicePage = () => (
  <PageSection className="max-w-3xl mx-auto py-16">
    <h1 className="text-4xl font-bold mb-6 text-primary">Terms of Service</h1>
    <p className="mb-4 text-lg text-muted-foreground">Welcome to ChexPro. By using our background screening services, you agree to the following terms and conditions:</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Use of Services</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Services are provided for lawful purposes only</li>
      <li>You must provide accurate and complete information</li>
      <li>Unauthorized use or access is strictly prohibited</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
    <p className="mb-4 text-muted-foreground">ChexPro is not liable for any damages resulting from the use or inability to use our services, including but not limited to loss of data, business interruption, or inaccuracies in screening results.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">User Responsibilities</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Maintain confidentiality of your account credentials</li>
      <li>Comply with all applicable laws and regulations</li>
      <li>Report any unauthorized activity immediately</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Changes to Terms</h2>
    <p className="mb-4 text-muted-foreground">ChexPro reserves the right to update these terms at any time. Continued use of our services constitutes acceptance of any changes.</p>
    <p className="mt-8 text-muted-foreground">For questions regarding these terms, please contact us at info@chexpro.com.</p>
  </PageSection>
);

export default TermsOfServicePage;
