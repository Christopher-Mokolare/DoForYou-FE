// Runtime environment configuration
// This file can be modified at deployment time without rebuilding the app
(function (window) {
  window['env'] = window['env'] || {};

  // Environment variables - these will be replaced at deployment time
  window['env']['apiUrl'] = '${API_URL}';
  window['env']['apiKey'] = '${API_KEY}';
  window['env']['whatsappNumber'] = '${WHATSAPP_NUMBER}';
  window['env']['contactEmail'] = '${CONTACT_EMAIL}';
  window['env']['supportPhone'] = '${SUPPORT_PHONE}';
  window['env']['signalRUrl'] = '${SIGNALR_URL}';
})(this);