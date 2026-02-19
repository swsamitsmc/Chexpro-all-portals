import PageSection from '@/components/PageSection';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();
  
  const infoWeCollect = t('pages.privacy.infoWeCollect', { returnObjects: true, defaultValue: [] });
  const howWeUse = t('pages.privacy.howWeUse', { returnObjects: true, defaultValue: [] });
  const yourRights = t('pages.privacy.yourRights', { returnObjects: true, defaultValue: [] });

  return (
    <PageSection className="max-w-3xl mx-auto py-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">{t('pages.privacy.title')}</h1>
      <p className="mb-4 text-lg text-muted-foreground">{t('pages.privacy.intro', { defaultValue: 'At ChexPro, your privacy is our top priority. We are committed to protecting your personal information and maintaining transparency about how we collect, use, and safeguard your data.' })}</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.privacy.infoWeCollectTitle', { defaultValue: 'Information We Collect' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {infoWeCollect.map((item, idx) => (<li key={idx}>{item}</li>))}
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.privacy.howWeUseTitle', { defaultValue: 'How We Use Your Information' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {howWeUse.map((item, idx) => (<li key={idx}>{item}</li>))}
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.privacy.dataProtectionTitle', { defaultValue: 'Data Protection' })}</h2>
      <p className="mb-4 text-muted-foreground">{t('pages.privacy.dataProtection', { defaultValue: 'We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or alteration. All sensitive information is encrypted and stored securely.' })}</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.privacy.yourRightsTitle', { defaultValue: 'Your Rights' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {yourRights.map((item, idx) => (<li key={idx}>{item}</li>))}
      </ul>
      <p className="mt-8 text-muted-foreground">{t('pages.privacy.contactLine', { defaultValue: 'For questions or requests regarding your privacy, please contact us at info@chexpro.com.' })}</p>
    </PageSection>
  );
};

export default PrivacyPolicyPage;
