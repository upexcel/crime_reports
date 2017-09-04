(function () {
  'use strict';
  angular.module('crimeApp')
    .factory('signoutService', logoutService);

  function logoutService($ionicHistory, timeStorage, $rootScope, $http, globalConstants, $q) {
    var service = {};
    var site_url = globalConstants.SITE_URL;
    service.checklogin = function () {
      if (timeStorage.get('login')) {
        $rootScope.log = true;
        $rootScope.UserName = timeStorage.get('login').name ? timeStorage.get('login').name : timeStorage.get('login').email;
        $rootScope.accountType = timeStorage.get('login').account;
      }
    };
    service.signout = function () {
      var defer = $q.defer();
      $rootScope.log = false;
      var date = new Date();
      $http({
        method: 'GET',
        url: site_url + '/signout.json?' + date.getTime(),
      }).then(function (result) {
        timeStorage.remove('login');
        timeStorage.remove('google_access_token');
        defer.resolve();
        $ionicHistory.clearCache();
      }, function (err) {
        defer.reject('Somthing went wrong, try again.');
      });
      try {
        if (window.cordova) {
          facebookConnectPlugin.getLoginStatus(function (fbUserObject) {
            if (fbUserObject.status === 'connected') {
              facebookConnectPlugin.logout(
                function () {
                  defer.resolve();
                },
                function () {
                });
            }
          }, function (errorObj) {
            console.log('FB failed' + errorObj);
          });
        }
        else {
          facebookConnectPlugin.getLoginStatus(function (response) {
            if (response.status === 'connected') {
              facebookConnectPlugin.logout(function (response) {
                // user is now logged out
                defer.resolve();
              }, function () {  
              });
            }
          });
        }
      }
      catch (e) {
      }
      return defer.promise;
    };
    return service;
  }
})();

