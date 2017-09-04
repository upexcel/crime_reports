(function () {
  'use strict';
  angular.module('crimeApp')
    .service('validator', function () {
      return {
        validateEmail: function (email) {
          var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return re.test(email);
        }
      };
    });
})();