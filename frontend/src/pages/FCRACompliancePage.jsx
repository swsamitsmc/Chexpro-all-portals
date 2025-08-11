import PageSection from '@/components/PageSection';
import { useTranslation } from 'react-i18next';

const FCRACompliancePage = () => {
  const { t } = useTranslation();
  
  const principles = t('pages.fcraCompliance.principles', { returnObjects: true, defaultValue: [] });
  const rights = t('pages.fcraCompliance.rights', { returnObjects: true, defaultValue: [] });

  return (
    <PageSection className="max-w-3xl mx-auto py-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">{t('pages.fcraCompliance.title')}</h1>
      <p className="mb-4 text-lg text-muted-foreground">{t('pages.fcraCompliance.summary', { defaultValue: 'ChexPro is fully compliant with the Fair Credit Reporting Act (FCRA), ensuring that all background screening services are conducted lawfully and ethically.' })}</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.fcraCompliance.keyPrinciples', { defaultValue: 'Key FCRA Principles' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {principles.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.fcraCompliance.yourRightsTitle', { defaultValue: 'Your Rights Under FCRA' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {rights.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <p className="mt-8 text-muted-foreground">{t('pages.fcraCompliance.contactLine', { defaultValue: 'For more information about FCRA compliance, please contact us at info@chexpro.com.' })}</p>
    </PageSection>
  );
};

export default FCRACompliancePage;
