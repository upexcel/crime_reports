function handleOpenURL(url) {
  window.localStorage.setItem('external_load', url);
}
(function () {
  'use strict';
  /**
   * Main module of the crimeApp
   */
  angular
    .module('crimeApp', [
      'betterTimePicker',
      'map',
      'list',
      'trends',
      'signin',
      'signup',
      'alert',
      'setting',
      'sidemenu',
      'about',
      'terms-service',
      'agencySubmission',
      'apiFilter',
      'app.filter',
      'app.services',
      'app.factory',
      'app.directive',
      'ionic',
      'pickadate',
      'checklist-model',
      'chart.js',
      'ngStorage',
      'ngIOS9UIWebViewPatch',
      'app.directive',
      'timestorage',
      'ngCordova',
      'setlocation',
      'initialLocation',
      'searchlocation',
      'ionic.native',
      'app.maintenance',
      'ui.bootstrap'
    ]);
   
})();