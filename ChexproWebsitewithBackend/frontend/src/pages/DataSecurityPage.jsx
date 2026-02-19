import PageSection from '@/components/PageSection';
import { useTranslation } from 'react-i18next';

const DataSecurityPage = () => {
  const { t } = useTranslation();
  
  return (
    <PageSection className="max-w-3xl mx-auto py-16">
      <h1 className="text-4xl font-bold mb-6 text-primary">{t('pages.dataSecurity.title')}</h1>
    <p className="mb-4 text-lg text-muted-foreground">{t('pages.dataSecurity.intro')}</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.dataSecurity.measuresHeading')}</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>{t('pages.dataSecurity.measures.0')}</li>
      <li>{t('pages.dataSecurity.measures.1')}</li>
      <li>{t('pages.dataSecurity.measures.2')}</li>
      <li>{t('pages.dataSecurity.measures.3')}</li>
    </ul>
    <h2 className="text-2xl font-semibold mt-8 mb-2">{t('pages.dataSecurity.controlHeading')}</h2>
    <ul className="list-disc ml-6 mb-4 text-muted-foreground">
      <li>{t('pages.dataSecurity.control.0')}</li>
      <li>{t('pages.dataSecurity.control.1')}</li>
    </ul>
    <p className="mt-8 text-muted-foreground">{t('pages.dataSecurity.contact')}</p>
    </PageSection>
  );
};

export default DataSecurityPage;
