import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button 
        onClick={() => changeLanguage('en')}
        style={{
          background: i18n.language === 'en' ? 'rgba(255,255,255,0.3)' : 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('es')}
        style={{
          background: i18n.language === 'es' ? 'rgba(255,255,255,0.3)' : 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ES
      </button>
    </div>
  );
};