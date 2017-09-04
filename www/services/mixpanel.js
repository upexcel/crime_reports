(function () {
  'use strict';
  angular.module('crimeApp').factory('mixpanel', function () {
    if (window.mixpanel) {
      mixpanel.register({'URL': window.location.hostname});
    }
    return {
      track: function (name, params) {
        if (window.mixpanel) {
          mixpanel.track(name, params);
        }
      }
    };
  });
})();
