(function () {
    'use strict';
    angular.module('crimeApp').directive('sparkLineChart', sparkLineChart);

    function sparkLineChart($document, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/trendsOverlay/sparkLineChart/spark-line-chart-tmpl.html',
            bindToController: {
                data: '=',
                params: '=',
                className: '@',
                tipsyText: '@',
                onSelect: '=?',
                crimeName: '@'
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'sparkLineChart'
        };

        function controllerFn() {
        }

        function linkFn($scope, $element, $attr, ctrl) {
            var vm = ctrl, segment = 5,
                    $$elem = $($element),
                    chart,
                    $chartElem = $($element).find('.ct-chart'), axisYHighValue;

            function getChartOptions() {
                return {
                    showArea: true,
                    showLine: true,
                    showPoint: false,
                    low: 0,
                    axisX: {
                        offset: 0,
                        showLabel: false,
                        showGrid: false
                    },
                    axisY: {
                        low: 0,
                        offset: 0,
                        high: axisYHighValue,
                        type: Chartist.FixedScaleAxis,
                        showLabel: false,
                        showGrid: false
                    },
                    chartPadding: {
                        bottom: 3,
                        left: 5,
                        right: 5,
                        top: 6
                    },
                    fullWidth: true,
                    lineSmooth: Chartist.Interpolation.simple({
                        divisor: 5
                    })
                };
            }

            $scope.$watch(angular.bind(vm, function () {
                return [this.data, this.params];
            }), function (newVals) {
                if (_.isUndefined(newVals) || _.isEmpty(_.compact(newVals))) {
                    return;
                }
                $timeout(function () {
                    onNewData(newVals[0], newVals[1]);
                }, 0);
            }, true);

            function onNewData(data, params) {
                var formattedData = formatData(data, params),
                        chartOptionsWithDimensions = _.merge(getChartDimensionOptions(), getChartOptions());
                chart = new Chartist.Line($$elem.find('.ct-chart')[0], formattedData, chartOptionsWithDimensions);
            }

      function getChartDimensionOptions() {
        return {
          height: '36px',
          width: '100%'
        };
      }

            function formatData(data, params) {
                var chartData = aggregateData(data, params);
                axisYHighValue = _.max(chartData);
                return {
                    //filling with zero for dummy labels dummy labels
                    labels: _.range(0, getDateRanges(params).length, 0),
                    series: [
                        {
                            className: (vm.className || '').toLowerCase().replace(/[' '/]/g, '-') + ' ct-series-a',
                            data: chartData
                        }
                    ]
                };
            }

            vm.onChartSelect = function () {
                if (vm.onSelect && _.isFunction(vm.onSelect)) {
                    vm.onSelect(vm.crimeName);
                }
            };
            function isSameDate(start_date, end_date) {
                return moment(end_date).diff(moment(start_date), 'days') === 0;
            }

            function getDateRanges(params) {
                var start_date = moment(params.start_date),
                        end_date = moment(params.end_date),
                        start_timestamp = start_date.unix(),
                        end_timestamp = end_date.unix(),
                        timeDiff = (end_timestamp - start_timestamp) / segment,
                        daysDifference = end_date.diff(start_date, 'days');
                if (daysDifference < segment && (end_date > start_date)) {
                    timeDiff = (end_timestamp - start_timestamp) / end_date.diff(start_date, 'days');
                    return _.range(start_timestamp, (end_timestamp + timeDiff), timeDiff);
                } else if (daysDifference === 0) {
                    timeDiff = start_timestamp;
                    return [null, start_date, null];
                } else {
                    return _.range(start_timestamp, (end_timestamp + timeDiff), timeDiff);
                }
            }

            //grouping data into 10 segments
            //Input: [{count:'4, date: '2014-5-19'},{count:'5, date: '2014-5-19'}...]
            function aggregateData(data, params) {
                var timeRanges = getDateRanges(params).reverse(),
                        maxRangeLength = timeRanges.length;
                var list = _.range(0, maxRangeLength, 0);
                if (isSameDate(params.start_date, params.end_date)) {
                    var count = _.inject(data, function (sum, datum) {
                        return sum + (_.isUndefined(datum.count) ? 0 : Number(datum.count));
                    }, 0);
                    list = [count, count, count];
                } else {
                    _.each(data, function (datum) {
                        var date = moment(moment(datum['date']).format('L')).unix();
                        _.each(timeRanges, function (range, index) {
                            if (index == (maxRangeLength - 1)) {
                                list[index] = (list[index] || 0) + Number(datum['count']);
                            } else if (range >= date && date > timeRanges[index + 1]) {
                                list[index] = (list[index] || 0) + Number(datum['count']);
                                return false;
                            }
                        });
                    });
                }
                return list.reverse();
            }
        }// LinkFn ends
    }
})
        ();