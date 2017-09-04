(function () {
    'use strict';
    angular.module('crimeApp').directive('barChart', lineChart);

    function lineChart($filter, $ionicScrollDelegate, safeApply) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/trendsOverlay/barChart/bar-chart-tmpl.html',
            bindToController: {
                data: '=',
                params: '=',
                className: '@',
                showOnlySeries: '='
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'barChart'
        };

        function controllerFn($scope) {
        }

        function linkFn($scope, $element, $attr, ctrl) {
            var vm = ctrl,
                    BAR_CHART_HEIGHT = 200,
                    BAR_CHART_WIDTH = 270,
                    $$elem = $($element),
                    chartOptions = {
                        low: 0,
                        chartPadding: {
                            bottom: 4,
                            left: -15,
                            right: 0,
                            top: 4
                        },
                        axisY: {
                            onlyInteger: true
                        },
                        axisX: {
                            position: 'end',
                            labelInterpolationFnc: function (value, index, data) {
                                if (_.compact(data).length <= 3) {
                                    return data[index];
                                } else {
                                    return index % 3 === 0 ? value : null;
                                }
                            }
                        }
                    },
            chart;

            $scope.$watch(angular.bind(vm, function () {
                return [this.data, this.params, this.showOnlySeries];
            }), function (newVals) {
                if (_.isUndefined(newVals) || _.isEmpty(newVals[0]) || _.isEmpty(_.compact(newVals))) {
                    return;
                }
                onNewData(newVals[0], newVals[1], newVals[2]);
            }, true);

            function onNewData(data, params, showOnlySeries) {
                $ionicScrollDelegate.resize();
                var formattedData = formatData(data, params, showOnlySeries);
                chartOptions.high = getHighValue(formattedData);
                chart = new Chartist.Bar($$elem.find('.ct-chart')[0], formattedData, chartOptions, true);
            }

            function getHighValue(formattedData) {
                var barValues = (formattedData.series || []).concat(formattedData.disabledSeries || []);
                return _.max(_.flatten(barValues)) || 1;
            }

            function formatData(data, params, showOnlySeries) {
                var enabledDatum = data[showOnlySeries],
                        disabledData = _.omit(data, showOnlySeries);
                vm.className = ($filter('className')(vm.className || ''));
                return {
                    labels: getBarChartLabels(params),
                    series: [aggregateData(enabledDatum, params)],
                    disabledSeries: _.map(disabledData, function (datum) {
                        return aggregateData(datum, params);
                    })
                };
            }

            function getBarChartLabels(params) {
                var timeRanges = _.map(getTimeRanges(params), function (time) {
                    if (time == 12) {
                        return 'Noon';
                    } else if (time < 12) {
                        return time + ' AM';
                    } else {
                        return time - 12 + ' PM';
                    }
                });
                var amIndex = timeRanges.indexOf('0 AM');
                if (amIndex != -1) {
                    timeRanges[amIndex] = '12 AM';
                }
                return timeRanges;
            }

            function getTimeRanges(params) {
                var start_time = Number(params.start_time || 0),
                        end_time = Number(params.end_time || 23);
                if (start_time > end_time) {
                    return _.range(0, (23 + 1));
                } else {
                    return _.range(start_time, (end_time + 1));
                }
            }

            function aggregateData(data, params) {
                var timeRanges = getTimeRanges(params),
                        maxRangeLength = timeRanges.length;
                var list = _.range(0, maxRangeLength, 0);
                _.each(data, function (datum) {
                    var time = Number(datum['time']);
                    _.each(timeRanges, function (range, index) {
                        if (range == time) {
                            list[index] = (list[index] || 0) + Number(datum['count']);
                        }
                    });
                });
                return list;
            }

        }// LinkFn ends
    }
})
        ();