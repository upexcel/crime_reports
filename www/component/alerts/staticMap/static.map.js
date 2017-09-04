(function () {
  'use strict';
  angular.module('crimeApp').directive('staticMap', staticMap);

  function staticMap($timeout) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      controllerAs: 'staticMapCtrl',
      templateUrl: 'component/alerts/staticMap/static.map.temp.html',
      bindToController: {
        mapBounds: '='
      },
      link: linkFunction,
      controller: ctrlFunction
    };
    function ctrlFunction() {
    }

    function linkFunction($scope, $element, $attr, ctrl) {
      var vm = ctrl, map = L.mapbox.map($($element).find('.map-instance')[0], 'mapbox.emerald', {
        attributionControl: false,
        zoomControl: false,
        minZoom: 1
      });
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.keyboard.disable();

      // Disable tap handler, if present.
      if (map.tap) {
        map.tap.disable();
      }

      $scope.$watch(angular.bind(vm, function () {
        return this.mapBounds;
      }), function (newBounds) {
        if (_.isUndefined(newBounds)) {
          return;
        }
        var bounds = new L.latLngBounds(L.latLng(Number(vm.mapBounds.lat1), Number(vm.mapBounds.lng1)), L.latLng(Number(vm.mapBounds.lat2), Number(vm.mapBounds.lng2)));
        map.setMaxBounds(bounds, {maxZoom: 20});
      });

      $scope.$on('Static::Map::InvalidateSize', function () {
        $timeout(function () {
          map.invalidateSize();
        }, 0);
      });
    }

    //Link Function Ends
  }
})();