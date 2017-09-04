(function () {
  'use strict';
  angular
    .module('crimeApp')
    .config(config);
  /** @ngInject */
  function config($ionicConfigProvider, $locationProvider, $compileProvider, $httpProvider) {
    $httpProvider.defaults.headers.post['Accept'] = 'application/json, text/javascript';
    $ionicConfigProvider.tabs.position('down');
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.views.transition('none');
    $compileProvider.debugInfoEnabled(false);
    $httpProvider.useApplyAsync(true);
    $locationProvider.hashPrefix('!');
  }
})();