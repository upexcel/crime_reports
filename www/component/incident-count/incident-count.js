(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('incidentCountHeader', incidentCountHeader);

  function incidentCountHeader(mapState, $rootScope) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      bindToController: {
        ifExploreAgency: '=',
        currentZoom: '=',
        exploreAgencyName: '=',
        noOfIncidents: '=',
        startDate: '=',
        endDate: '=',
        ifLoading: '=',
        incidentHeaderView: '=',
        mapView: '='
      },
      templateUrl: 'component/incident-count/incident-count-temp.html',
      controller: controllerFn,
      controllerAs: 'incidentHeader',
      link: linkFn
    };

    function controllerFn() {
    }

    function linkFn($scope, $element, $attrs, ctrl) {
      var vm = ctrl;
      vm.ifFilterview = $rootScope.ifFilterview;
      vm.openFilters = $rootScope.openFilters;
      $scope.$watch(angular.bind(vm, function () {
        return this.currentZoom;
      }), function (newV, old) {
      });
      vm.backToDefaultMap = function (currentZoom) {
        $scope.$emit('backToDefaultMap', currentZoom);
      };
    }
  }
})();