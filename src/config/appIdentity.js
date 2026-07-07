/** @type {const} */
export const APP_IDENTITY = {
  name: 'Patch Fund',
  slug: 'patch-fund',
  scheme: 'patchfund',
  iosBundleIdentifier: 'com.zach.patchfund',
  appGroup: 'group.com.zach.patchfund',
  siriDeepLinkPath: 'siri/log',
};

export const SIRI_DEEP_LINK = `${APP_IDENTITY.scheme}://${APP_IDENTITY.siriDeepLinkPath}`;
