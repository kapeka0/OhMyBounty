export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeDomain = (subdomain: string): string => {
  return subdomain
    .trim()
    .replace(/\r?\n|\r/g, ' ')
    .replace(/^https?:\/\//, '');
};

export const ensureHttpsUrl = (subdomain: string): string => {
  return subdomain.includes('https://') ? subdomain : `https://${subdomain}`;
};
