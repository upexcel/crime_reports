(function () {
  'use strict';
  angular.module('initialLocation').directive('focus', ['$timeout', focus]);
  function focus($timeout) {
    return {
      link: function (scope, ele, attr) {
        $timeout(function () {
          ele[0].focus();
        }, 300);
      }
    };
  }
  
})();