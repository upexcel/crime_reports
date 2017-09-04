(function () {
  'use strict';
  angular.module('app.maintenance').controller('maintenanceCtrl', function ($interval, globalConstants, $state, $localStorage, $http) {
    var vm = this;
    function check() {
      if ($localStorage.login) {
        var user = {email: $localStorage.login.email, password: ''};
      }
      else
        user = {email: '', password: ''};
      $http({
        method: 'POST',
        url: globalConstants.SITE_URL + '/signin.json',
        data: {
          'authenticity_token': 'oops',
          'user': user
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json;charset=UTF-8',
          'Accept': 'application/json, text/plain'
        }
      }).then(function (result) {
        $state.go('setlocation');
      }, function(err){
          if (err.status != 503) {
            $state.go('setlocation');
          }
          else
            check();
      });
    }

    check();
  });
})();