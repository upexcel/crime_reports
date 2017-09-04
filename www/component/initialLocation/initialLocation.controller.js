(function () {
  'use strict';
  angular.module('initialLocation').controller('InitialLocationCtrl', function ($rootScope, api, $scope, $state, $timeout, $localStorage, $ionicHistory, geometry, zoomHelper) {
    var vm = this;
    var keys = [];
    if ($localStorage.viewPortAgencies) {
      _.forEach($localStorage.viewPortAgencies.data.agencies, function (val, key) {
        _.forEach($localStorage.autoSavedLocations, function (val1, key1) {
          if (val1.agency_name) {
            if (val.agency_id == val1.agency_id) {
              keys.push(key);
            }
          }
        });
      });
      vm.plusagenciesData = $localStorage.viewPortAgencies.data.agencies;
      for (var i = keys.length - 1; i >= 0; i--)
        vm.plusagenciesData.splice(keys[i], 1);

    }
    vm.savedLocation = 'Hi There';
    if ($localStorage.autoSavedLocations) {
      vm.autoSavedLocations = $localStorage.autoSavedLocations;
    } else {
      vm.autoSavedLocations = [];
    }

    vm.goBack = function () {
      $ionicHistory.goBack();
    };
    vm.deleteLocation = function (locationData, index) {
      vm.plusagenciesData.unshift(locationData);
      if (index > -1) {
        vm.autoSavedLocations.splice(index, 1);
      }
    };
    vm.openLocation = function (result) {
      var args = {},
        resultLocation = result.center,
        lat = resultLocation[1],
        lng = resultLocation[0];

      args.lat = lat;
      args.lng = lng;
      args.result = result;
      if (_.isUndefined(result.bbox)) {
        args.zoom = zoomHelper.getZoomLevel(2000);
      } else {
        var boundingValues = result.bbox,
          radius = geometry.distanceBetween({
            lat: boundingValues[1],
            lng: boundingValues[0]
          }, {
            lng: boundingValues[2],
            lat: boundingValues[3]
          });
        args.zoom = zoomHelper.getZoomLevel(radius);
      }
      if ($state.current.name !== 'app.map') {
        $state.go('app.map');
      }
      $timeout(function () {
        $rootScope.$emit('trackedUserAction', {
          eventName: 'Search Used',
          params: {
            place: result.place_name
          }
        });
        $rootScope.$emit('vNextLocation::OnSelect', args);
      }, 200);
    };
    vm.editBox = -1;
    var tempName = '';
    var cancelIndex;
    vm.renameLocation = function (index) {
      if (index != -1) {
        cancelIndex = index;
        tempName = vm.autoSavedLocations[index].search_name;
      }
      vm.editBox = index;
    };
    vm.renameLocationCancel = function () {
      vm.autoSavedLocations[cancelIndex].search_name = tempName;
      vm.editBox = -1;
    };
    vm.setDefault = function (index, status) {
      _.forEach(vm.autoSavedLocations, function (val, key) {
        val.default = false;
      });
      vm.autoSavedLocations[index].default = !status;
    };
    vm.addInBookMark = function (plusAgencyData, index) {
      plusAgencyData.default = false;
      plusAgencyData.agency = true;
      if (index > -1) {
        vm.plusagenciesData.splice(index, 1);
      }
      if ($localStorage.autoSavedLocations) {
        $localStorage.autoSavedLocations = vm.autoSavedLocations;
      } else {
        $localStorage.autoSavedLocations = [];
      }
      $localStorage.autoSavedLocations.push(plusAgencyData);
      vm.autoSavedLocations = $localStorage.autoSavedLocations;
    };
  });

})();