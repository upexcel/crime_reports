(function () {
  'use strict';
  angular.module('terms-service')
    .controller('termsAndPrivacyController', function ($scope, $state) {
      var vm = this;

      vm.gotoTermsOfService = function () {
        $state.go('termsOfService', {});
      };
    });
})();