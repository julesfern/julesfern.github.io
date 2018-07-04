/*
 * Entrypoint file for the application
 * responsible only for configuring and initializing
 */

import App from './app.js';

document.addEventListener('DOMContentLoaded', function () {
  const application = new App();
  // Add application root to document
  document.body.appendChild(application.getElement());
});