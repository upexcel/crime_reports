(function () {
    'use strict';
    angular.module('crimeApp')
            .directive('trendChartList', trendChartList);

    function trendChartList() {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/trendsOverlay/trendsChartList/trend-chart-list-tmpl.html',
            bindToController: {
                params: '=',
                historicData: '=',
                barData: '=',
                tableData: '=',
                sexOffendersCount: '=',
                showingAllCrimes: '=',
                exploreAgencyMode: '='
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'trendChartList'
        };

        function controllerFn($scope) {
        }

        function linkFn($scope, $element, $attrs, ctrl) {
            var vm = ctrl;
            $scope.$watch(angular.bind(vm, function () {
                return this.historicData;
            }), function (historicData) {
                var data = {};
                for (var i = 0; i < historicData.length; i++) {
                    data[historicData[i].category] = historicData[i].data;
                }
                vm.allHistoricData = data;
                if (_.isUndefined(historicData)) {
                    return;
                }
                vm.filteredHistoricData = _.pick(historicData, function (historicDatum) {
                    return historicDatum.data.length > 0;
                });

                vm.incidentsCount = _.inject(historicData, function (sum, datum) {
                    return sum + (_.isUndefined(datum.count) ? 1 : datum.count);
                }, 0);
            }, true);

            $scope.$watch(angular.bind(vm, function () {
                return this.params;
            }), function (params) {
                if (_.isUndefined(params)) {
                    return;
                }
                var start_date = moment(params.start_date),
                        end_date = moment(params.end_date);
                vm.days = end_date.diff(start_date, 'days');
            }, true);
        }
    }
})();