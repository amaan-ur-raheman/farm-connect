import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      common: {
        welcome: 'Welcome',
        login: 'Login',
        logout: 'Log Out',
        cancel: 'Cancel',
        save: 'Save',
        search: 'Search...',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        continue: 'Continue',
        submit: 'Submit',
      },
      dashboard: {
        myFarm: 'My Farm',
        portfolio: 'Portfolio',
        earnings: 'Available Earnings',
        withdraw: 'Withdraw',
        leases: 'My Leases',
        propertyValue: 'Property Value',
        fieldJournal: 'Field Journal',
        quickActions: 'Quick Actions',
        postUpdate: 'Post Update',
        manageListings: 'Manage Listings',
        deliveries: 'Deliveries',
      },
      profile: {
        title: 'Profile',
        editProfile: 'Edit Profile',
        settings: 'Settings',
        language: 'Language',
        biometrics: 'FaceID / Fingerprint',
        helpSupport: 'Help & Support',
        shareApp: 'Share App',
      }
    },
  },
  hi: {
    translation: {
      common: {
        welcome: 'स्वागत है',
        login: 'लॉगिन',
        logout: 'लॉग आउट',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        search: 'खोजें...',
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        continue: 'जारी रखें',
        submit: 'जमा करें',
      },
      dashboard: {
        myFarm: 'मेरा खेत',
        portfolio: 'पोर्टफोलियो',
        earnings: 'कुल कमाई',
        withdraw: 'पैसे निकालें',
        leases: 'मेरी लीज',
        propertyValue: 'संपत्ति का मूल्य',
        fieldJournal: 'फील्ड जर्नल',
        quickActions: 'त्वरित कार्रवाई',
        postUpdate: 'अपडेट डालें',
        manageListings: 'लिस्टिंग प्रबंधित करें',
        deliveries: 'डिलीवरी',
      },
      profile: {
        title: 'प्रोफ़ाइल',
        editProfile: 'प्रोफ़ाइल संपादित करें',
        settings: 'सेटिंग्स',
        language: 'भाषा',
        biometrics: 'फिंगरप्रिंट / फेसआईडी',
        helpSupport: 'सहायता और समर्थन',
        shareApp: 'ऐप शेयर करें',
      }
    },
  },
};

const LANGUAGE_KEY = 'user-language';

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    savedLanguage = 'en';
  }

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

initI18n();

export default i18n;
