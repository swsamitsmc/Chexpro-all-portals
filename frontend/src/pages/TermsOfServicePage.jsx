import PageSection from '@/components/PageSection';
import { useTranslation } from 'react-i18next';

const TermsOfServicePage = () => {
  const { t } = useTranslation();
  
  const useOfServices = t('pages.terms.useOfServices', { returnObjects: true, defaultValue: [] });
  const userResponsibilities = t('pages.terms.userResponsibilities', { returnObjects: true, defaultValue: [] });

  return (
    <PageSection className="max-w-3xl mx-auto py-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">{t('pages.terms.title')}</h1>
      <p className="mb-4 text-lg text-muted-foreground">{t('pages.terms.intro', { defaultValue: 'Welcome to ChexPro. By using our background screening services, you agree to the following terms and conditions:' })}</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.terms.useOfServicesTitle', { defaultValue: 'Use of Services' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {useOfServices.map((item, idx) => (<li key={idx}>{item}</li>))}
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.terms.limitationOfLiabilityTitle', { defaultValue: 'Limitation of Liability' })}</h2>
      <p className="mb-4 text-muted-foreground">{t('pages.terms.limitationOfLiability', { defaultValue: 'ChexPro is not liable for any damages resulting from the use or inability to use our services, including but not limited to loss of data, business interruption, or inaccuracies in screening results.' })}</p>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.terms.userResponsibilitiesTitle', { defaultValue: 'User Responsibilities' })}</h2>
      <ul className="list-disc ml-6 mb-4 text-muted-foreground">
        {userResponsibilities.map((item, idx) => (<li key={idx}>{item}</li>))}
      </ul>
      <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.terms.changesTitle', { defaultValue: 'Changes to Terms' })}</h2>
      <p className="mb-4 text-muted-foreground">{t('pages.terms.changes', { defaultValue: 'ChexPro reserves the right to update these terms at any time. Continued use of our services constitutes acceptance of any changes.' })}</p>
      <p className="mt-8 text-muted-foreground">{t('pages.terms.contactLine', { defaultValue: 'For questions regarding these terms, please contact us at info@chexpro.com.' })}</p>
    </PageSection>
  );
};

export default TermsOfServicePage;
