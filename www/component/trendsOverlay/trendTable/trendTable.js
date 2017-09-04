(function () {
  'use strict';
  angular.module('crimeApp').directive('trendTable', lineChart);

  function lineChart(globalConstants) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/trendsOverlay/trendTable/trend-table-tmpl.html',
      bindToController: {
        crimeData: '=',
        crimeName: '=',
        days: '='
      },
      link: linkFn,
      controller: controllerFn,
      controllerAs: 'trendTable'
    };

    function controllerFn($scope) {
    }

    function linkFn($scope, $element, $attr, ctrl) {
      var vm = ctrl,
        categorization = {};

      function getTopFiveData(data) {
        var groupedData = _.map(_.groupBy(data, 'incident_type'), function (incidentData, incidentType) {
          categorization = globalConstants.CRIME_CATEGORIZATION_MAP[incidentType];
          return {
            incident_type: incidentType,
            data: incidentData,
            category: categorization.category,
            subCategory: categorization.sub_category,
            count: _.inject(incidentData, function (sum, datum) {
              return sum + (Number(datum.count) || 1);
            }, 0)
          };
        });
        var sortedData = _.sortBy(groupedData, function (datum) {
          return -Number(datum.count);
        });
        return sortedData;
      }

      $scope.$watch(angular.bind(vm, function () {
        return this.crimeData;
      }), function (crimeData) {
        if (_.isUndefined(crimeData)) {
          return;
        }
        vm.tableData = getTopFiveData(crimeData);
      }, true);

    }
  }
})
();