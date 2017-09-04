angular.module('app.services', [])
  .service('Alertuser', function () {
    this.alert = function (msg) {
      if (window.plugins) {
        window.plugins.toast.showLongBottom(msg, function (a) {
        }, function (b) {
        });
      }

    };
    this.LongCenter = function (msg) {
      if (window.plugins) {
        window.plugins.toast.showLongCenter(msg, function (a) {
        }, function (b) {
        });
      }

    };

    this.saveAlert = function (msg) {
      if (window.plugins) {
        window.plugins.toast.showShortCenter(msg, function (a) {
        }, function (b) {
        });
      }

    };
  }).service('httpRequest', function ($q, $http) {
  var canceller;
  return {
    send: function (api, method, cancelable, ifFilter) {
      if (!method) {
        method = 'GET';
      }
      var def = $q.defer();
      var url = api;
      var json = {
        url: url,
        method: method,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      };
      if (cancelable) {
        if (canceller) {
          canceller.resolve();
        }

        canceller = $q.defer();

        json.timeout = canceller.promise;
      }

      var http = $http(json);

      http.success(function (data) {
        if (ifFilter == 'filter') {
          var crimeData = [];
          for (var i = 0; i < data.city_list.length; i++) {
            var crime = data.city_list[i].city_info.crimes;
            crimeData = crimeData.concat(crime);
          }
          def.resolve(crimeData);
        } else if (ifFilter == 'filtersexoffender') {
          def.resolve(data.sex_offenders);
        } else {
          def.resolve(data);
        }
      });
      http.error(function (error) {
        def.resolve(error);
      });

      return def.promise;

    },
    multiplePromise: function (promiseurl, method, cancelable) {

      if (!method) {
        method = 'GET';
      }

      var def = $q.defer();
      var api1 = {
        url: promiseurl[0],
        method: method,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: false
      };
      var api2 = {
        url: promiseurl[1],
        method: method,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        cache: false
      };

      if (cancelable) {
        if (canceller) {
          canceller.resolve();
        }

        canceller = $q.defer();

        api1.timeout = canceller.promise;
        api2.timeout = canceller.promise;
      }

      var promises = [
        $http(api1),
        $http(api2)
      ];
      $q.all(promises).then(function (result) {
        var sexoffenderData = result[0].data.sex_offenders;
        var crimeData = [];
        var len = result[1].data.agencies.length;
        for (var i = 0; i < len; i++) {
          var crime = result[1].data.agencies[i].crimes;
          crimeData = crimeData.concat(crime);
        }
        var data = [];
        data = crimeData.concat(sexoffenderData);
        def.resolve(data);
      }, function (error) {
        def.resolve('error');
      });
      return def.promise;
    }
  };
}).service('getRadius', function () {
  return {
    radius: function () {
      var ne = Map.getBounds()._northEast;
      var pos = Map.getCenter();
      var center = {
        'lat': pos.lat,
        'lng': pos.lng
      };
      var distance = getDistance(center, ne);
      var cal = parseFloat((distance * 10) / 100);
      var radius = parseFloat(distance + cal);
      return radius;
    }
  };
})
  .service('CalculateRadius', function () {
    this.rad = function (x) {
      return x * Math.PI / 180;
    };
  })
  .service('CalculateDistance', function (CalculateRadius) {
    this.getDistance = function (p1, p2) {
      var R = 6378137; // Earth?s mean radius in meter
      var dLat = CalculateRadius.rad(p2.lat - p1.lat);
      var dLong = CalculateRadius.rad(p2.lng - p1.lng);
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(CalculateRadius.rad(p1.lat)) * Math.cos(CalculateRadius.rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = (R * c);
      return d; // returns the distance in meters
    };
  })
  .service('removeHtmltag', function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var text = div.innerHTML;
    return text;
  })
  .service('user', function ($http, $q, globalConstants) {
    var def = $q.defer();
    var site_url = globalConstants.SITE_URL;
    return {
      getLoggedinUser: function () {
        $http({
          method: 'GET',
          url: site_url + '/user/details',
        }).then(function (result) {
          def.resolve(result);
        }, function (error) {
          def.resolve(error);
        });
        return def.promise;
      },
      checkIsAdminUser: function (data) {
        $http({
          method: 'GET',
          url: site_url + '/user/is_admin_user?email=' + data.email,
        }).then(function (result) {
          def.resolve(result);
        }, function (error) {
          def.resolve(error);
        });
        return def.promise;
      },
      saveThirdPartyUserInfo: function (userdata) {
        $http({
          method: 'POST',
          url: site_url + '/users/auth/google',
          data: {user: userdata}
        }).then(function (result) {
          def.resolve(result);
        }, function (error) {
          def.resolve(error);
        });
        return def.promise;
      }
    };
  });
        