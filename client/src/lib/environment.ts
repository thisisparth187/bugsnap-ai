import type { EnvironmentDetails, EnvironmentField, EnvironmentSource } from '../types';

export const NOT_PROVIDED = 'Not provided';

const sourceFor = (value: string, detected: boolean): EnvironmentSource => value.trim() ? (detected ? 'detected' : 'user-provided') : 'missing';

function detectBrowser(userAgent: string) {
  const match = (pattern: RegExp, name: string) => {
    const result = userAgent.match(pattern);
    return result ? `${name} ${result[1]}` : null;
  };
  return match(/Edg\/([\d.]+)/, 'Microsoft Edge')
    || match(/Chrome\/([\d.]+)/, 'Chrome')
    || match(/Firefox\/([\d.]+)/, 'Firefox')
    || match(/Version\/([\d.]+).*Safari\//, 'Safari')
    || NOT_PROVIDED;
}

function detectOperatingSystem(userAgent: string) {
  if (/Windows NT/i.test(userAgent)) return 'Windows';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return NOT_PROVIDED;
}

function detectDeviceType(userAgent: string) {
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/Mobile|iPhone|Android/i.test(userAgent)) return 'Mobile';
  if (userAgent) return 'Desktop';
  return NOT_PROVIDED;
}

function appPathUrl() {
  if (!window.location || !/^https?:$/.test(window.location.protocol)) return NOT_PROVIDED;
  return `${window.location.origin}${window.location.pathname}`;
}

export function detectEnvironment(): EnvironmentDetails {
  const userAgent = window.navigator.userAgent || '';
  const browser = detectBrowser(userAgent);
  const operatingSystem = detectOperatingSystem(userAgent);
  const deviceType = detectDeviceType(userAgent);
  return {
    browser,
    operatingSystem,
    deviceType,
    applicationUrl: NOT_PROVIDED,
    applicationVersion: NOT_PROVIDED,
    userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    screen: { width: window.screen?.width || 0, height: window.screen?.height || 0 },
    technicalMetadataIncluded: true,
    pageUrlIncluded: false,
    sources: {
      browser: sourceFor(browser, true),
      operatingSystem: sourceFor(operatingSystem, true),
      deviceType: sourceFor(deviceType, true),
      applicationUrl: 'missing',
      applicationVersion: 'missing',
    },
  };
}

export function setEnvironmentField(environment: EnvironmentDetails, field: EnvironmentField, value: string): EnvironmentDetails {
  return { ...environment, [field]: value, sources: { ...environment.sources, [field]: value.trim() ? 'user-provided' : 'missing' } };
}

export function setPageUrlIncluded(environment: EnvironmentDetails, included: boolean): EnvironmentDetails {
  if (!included) {
    return { ...environment, pageUrlIncluded: false, applicationUrl: environment.sources.applicationUrl === 'detected' ? NOT_PROVIDED : environment.applicationUrl, sources: { ...environment.sources, applicationUrl: environment.sources.applicationUrl === 'detected' ? 'missing' : environment.sources.applicationUrl } };
  }
  const url = appPathUrl();
  return { ...environment, pageUrlIncluded: url !== NOT_PROVIDED, applicationUrl: url, sources: { ...environment.sources, applicationUrl: url === NOT_PROVIDED ? 'missing' : 'detected' } };
}

export function setTechnicalMetadataIncluded(environment: EnvironmentDetails, included: boolean): EnvironmentDetails {
  return {
    ...environment,
    technicalMetadataIncluded: included,
    userAgent: included ? window.navigator.userAgent : null,
    viewport: included ? { width: window.innerWidth, height: window.innerHeight } : null,
    screen: included ? { width: window.screen?.width || 0, height: window.screen?.height || 0 } : null,
  };
}

export function refreshClientMetadata(environment: EnvironmentDetails): EnvironmentDetails {
  const textFields = Object.fromEntries((Object.keys(environment.sources) as EnvironmentField[]).map((field) => [field, environment[field].trim() || NOT_PROVIDED])) as Pick<EnvironmentDetails, EnvironmentField>;
  return {
    ...environment,
    ...textFields,
    userAgent: environment.technicalMetadataIncluded ? window.navigator.userAgent : null,
    viewport: environment.technicalMetadataIncluded ? { width: window.innerWidth, height: window.innerHeight } : null,
    screen: environment.technicalMetadataIncluded ? { width: window.screen?.width || 0, height: window.screen?.height || 0 } : null,
    applicationUrl: environment.pageUrlIncluded ? appPathUrl() : environment.applicationUrl,
  };
}

export function environmentFieldLabel(field: EnvironmentField) {
  return ({ browser: 'Browser and version', operatingSystem: 'Operating system', deviceType: 'Device type', applicationUrl: 'Application URL', applicationVersion: 'Application version' } satisfies Record<EnvironmentField, string>)[field];
}

export function environmentPrompt(field: EnvironmentField) {
  return ({ browser: 'Provide the browser and version.', operatingSystem: 'Provide the operating system.', deviceType: 'Provide the device type.', applicationUrl: 'Provide the application URL if relevant.', applicationVersion: 'Provide the application version if available.' } satisfies Record<EnvironmentField, string>)[field];
}
