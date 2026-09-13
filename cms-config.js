window.CMS_CONFIG = Object.freeze({
  cmsURL: ['localhost', '127.0.0.1'].includes(location.hostname)
    ? location.origin
    : 'https://xuanying-homepage.xuanying-personal-homepage.workers.dev',
});
