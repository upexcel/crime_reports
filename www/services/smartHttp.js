angular.module('crimeApp')
  .factory('smartHttp', function ($http, $q, $state) {
    'use strict';
    var httpErrorCodesToRetry = [500, 503, 408];
    var SmartHttp = function (options) {
      options = options || {};
      var that = this;
      var q = $q.defer(),
        retriesRemaining = _.isUndefined(options.retry) ? 1 : options.retry;
      this.get = function (url, config) {
        $http.get(url, config).then(function (result) {
          q.resolve(result);
        }, function (rejection) {
          if (_.include(httpErrorCodesToRetry, rejection.status) && retriesRemaining > 0) {
            retriesRemaining = retriesRemaining - 1;
            that.get(url, config);
          } else {
            q.reject(rejection);
            if (rejection.status === 0 || rejection.status === -1) {
               //Cancelled by code with intention. Do nothing.
            }
            else if (rejection.status === 422 || rejection.status === 404) {
               //$state.go('404');
            } else {
               //$state.go('500');
            }
          }
        });
        return q.promise;
      };
      this.alertcrime = function (url, config) {
        $http.post(url, config).then(function (result) {
          q.resolve(result);
        }, function (rejection) {
          if (_.include(httpErrorCodesToRetry, rejection.status) && retriesRemaining > 0) {
            retriesRemaining = retriesRemaining - 1;
            that.get(url, config);
          } else {
            q.reject(rejection);
            if (rejection.status === 0 || rejection.status === -1) {
              //Cancelled by code with intention. Do nothing.
            }
            else if (rejection.status === 422 || rejection.status === 404) {
              $state.go('404');
            } else {
              $state.go('500');
            }
          }
        });
        return q.promise;
      };
    };

    return {
      get: function (url, config) {
        return new SmartHttp({retry: 1}).get(url, config);
      },
      alert: function (url, config) {
        return new SmartHttp({retry: 1}).alertcrime(url, config);
      }
    };
  });