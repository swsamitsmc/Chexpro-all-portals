import PageSection from '@/components/PageSection';
import { useTranslation } from 'react-i18next';

const FCRACompliancePage = () => {
  const { t } = useTranslation();
  
  return (
    <PageSection className="max-w-3xl mx-auto py-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">{t('pages.fcraCompliance.title')}</h1>
    <p className="mb-4 text-lg text-muted-foreground">ChexPro is fully compliant with the Fair Credit Reporting Act (FCRA), ensuring that all background screening services are conducted lawfully and ethically.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Key FCRA Principles</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Consent: We obtain written consent before conducting any background check</li>
      <li>Accuracy: We strive to provide accurate and up-to-date information</li>
      <li>Adverse Action: We provide required notifications if adverse action is taken based on screening results</li>
      <li>Access: Individuals have the right to access and dispute information in their reports</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Your Rights Under FCRA</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>Receive a copy of your background report</li>
      <li>Dispute inaccurate or incomplete information</li>
      <li>Be informed if information in your report is used against you</li>
    </ul>
    <p className="mt-8 text-muted-foreground">For more information about FCRA compliance, please contact us at info@chexpro.com.</p>
    </PageSection>
  );
};

export default FCRACompliancePage;
