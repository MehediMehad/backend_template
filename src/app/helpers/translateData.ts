import axios from 'axios';

import config from '../../configs';

type TranslateOptions = {
  targetLang: string; // ex: 'en'
  excludeKeys?: string[]; // Which will not be translated
};

const DEFAULT_EXCLUDE_KEYS = [
  'id',
  '_id',
  'email',
  'role',
  'status',
  'slug',
  'password',
  'createdAt',
  'updatedAt',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const translateData = async (data: any, options: TranslateOptions): Promise<any> => {
  const { targetLang, excludeKeys = [] } = options;

  const excluded = new Set([...DEFAULT_EXCLUDE_KEYS, ...excludeKeys]);

  // string
  if (typeof data === 'string') {
    const res = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {},
      {
        params: {
          q: data,
          target: targetLang,
          key: config.google.translate_api_key, // 👈 Replace with your own API key
        },
      },
    );

    return res.data.data.translations[0].translatedText;
  }

  // Array
  if (Array.isArray(data)) {
    return Promise.all(data.map((item) => translateData(item, { targetLang, excludeKeys })));
  }

  // Date
  if (data instanceof Date) {
    return data;
  }

  // Object
  if (typeof data === 'object' && data !== null) {
    const translatedObj: Record<string, any> = {}; // eslint-disable-line

    for (const key of Object.keys(data)) {
      // ❌ Will not translate if key is excluded
      if (excluded.has(key)) {
        translatedObj[key] = data[key];
        continue;
      }

      translatedObj[key] = await translateData(data[key], {
        targetLang,
        excludeKeys,
      });
    }

    return translatedObj;
  }

  // number, boolean, null, undefined
  return data;
};
