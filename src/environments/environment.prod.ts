export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || 'https://your-backend-domain.com',
  apiKey: process.env['API_KEY'] || 'DFY_63c6ee01-0ba6-49e1-9f67-4b752c523267',
  whatsappNumber: '27795258611',
  appName: 'DoForYou',
  contactEmail: 'info@doforyou.co.za',
  supportPhone: '0795258611',
  taskRequestForm: 'https://docs.google.com/forms/d/e/1FAIpQLSd_uoW_FP3Q3qTSZmDpsR1aqqXK35Os2EWCKJrKnQKoPUeTrg/viewform',
  enableErrorReporting: true,
  logLevel: 'error',
  errorHandler: {
    enabled: true,
    logToConsole: false,
    reportToService: true
  }
};