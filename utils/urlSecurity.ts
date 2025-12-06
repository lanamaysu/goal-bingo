/**
 * Security utilities for handling Google Apps Script Web App URLs
 */

const GAS_URL_PREFIX = 'https://script.google.com/macros/s/';
const GAS_URL_SUFFIX = '/exec';

/**
 * Extracts the deployment ID from a Google Apps Script Web App URL
 * @param url - Full GAS Web App URL
 * @returns deployment ID
 */
export const extractDeploymentId = (url: string): string | null => {
  if (!url.startsWith(GAS_URL_PREFIX)) {
    return null;
  }
  const id = url.substring(GAS_URL_PREFIX.length, url.length - GAS_URL_SUFFIX.length);
  return id && id.length > 0 ? id : null;
};

/**
 * Reconstructs a GAS Web App URL from a deployment ID
 * @param deploymentId - Deployment ID
 * @returns Full GAS Web App URL
 */
export const reconstructGasUrl = (deploymentId: string): string => {
  return `${GAS_URL_PREFIX}${deploymentId}${GAS_URL_SUFFIX}`;
};

/**
 * Validates if a URL is a proper Google Apps Script Web App URL
 * @param url - URL to validate
 * @returns true if valid
 */
export const isValidGasUrl = (url: string): boolean => {
  if (!url.startsWith('https://')) {
    return false;
  }
  const deploymentId = extractDeploymentId(url);
  return deploymentId !== null && deploymentId.length > 0;
};

/**
 * Simple obfuscation for storage (not cryptographically secure, just makes it non-obvious)
 * Uses browser `btoa`/`atob` with UTF-8 handling and falls back to Node `Buffer` when available.
 */
const simpleObfuscate = (str: string): string => {
  // Browser: handle UTF-8 safely
  if (typeof btoa === 'function') {
    // encodeURIComponent + convert percent encodings to raw bytes
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }

  // Node: use Buffer if available
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }

  throw new Error('No base64 encoder available in this environment');
};
