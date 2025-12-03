import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCredentialData } from '../hooks/getCredentialData';
import { CredentialDisplay } from './CredentialDisplay';

interface VCAvailableProps {
  onVCAvailable: (available: boolean) => void;
  onError: (error: string) => void;
}

const ListVerifiableCredentials: React.FC<VCAvailableProps> = ({ onVCAvailable, onError }) => {
  const { t } = useTranslation();
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    getCredentialData()
      .then(result => {
        if (!mounted) return;
        setData(result._data);
        setError(result._error);
        setDone(true);
      })
      .catch(err => {
        if (!mounted) return;
        setError(String(err));
        setDone(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (data) {
      onVCAvailable(true);
    } else {
      onVCAvailable(false);
    }
  }, [data, onVCAvailable]);

  React.useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div>
      <h2>{t('vc')}</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : done && data ? (
        <CredentialDisplay data={data} />
      ) : (
        <p>{t('common.loading')}</p>
      )}
    </div>
  );
}

export default ListVerifiableCredentials;