(function () {
  'use strict';
  angular.module('crimeApp').config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $location) {
      return {
        'request': function (config) {
          return config;
        },
        'requestError': function (rejection) {
          return $q.reject('rejection', rejection);
        },
        'response': function (response) {
          return response;
        },
        'responseError': function (rejection) {
          if (rejection.status == 503) {
            $location.path('/maintenance');
          }
          return $q.reject(rejection);
        }
      };
    });
  });
})();