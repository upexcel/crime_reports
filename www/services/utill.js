(function () {
  'use strict';

  angular.module('crimeApp').factory('util', function () {
    return {
      stripString: stripString,
      hypenatedString: hypenatedString
    };

    function stripString(str) {
      return (str || '').replace(/^\s*/g, '').replace(/\s+$/g, '');
    }

    function hypenatedString(str) {
      return stripString(str).replace('/', '').toLowerCase().replace(/\s+/g, '-');
    }
  });

})();