import axios from 'axios';

const DOWNLOAD_TIMEOUT_MS = 120000;

export const downloadBundleText = async (url: string): Promise<string> => {
  const res = await axios.get<string>(url, {
    timeout: DOWNLOAD_TIMEOUT_MS,
    responseType: 'text',
    transformResponse: [(data) => data],
  });
  return typeof res.data === 'string' ? res.data : String(res.data);
};
