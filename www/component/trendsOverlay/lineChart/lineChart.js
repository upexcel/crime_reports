(function () {
    'use strict';
    angular.module('crimeApp').directive('lineChart', lineChart);

    function lineChart($localStorage, $timeout, safeApply) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/trendsOverlay/lineChart/line-chart-tmpl.html',
            bindToController: {
                data: '=',
                params: '=',
                className: '@'
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'lineChart'
        };

        function controllerFn($scope) {
        }

        function linkFn($scope, $element, $attr, ctrl) {
            var vm = ctrl, segment = 10,
                    $$elem = $($element),
                    chartOptions = {
                        showPoint: false,
                        low: 0,
                        chartPadding: {
                            bottom: 10,
                            left: 0,
                            right: 25,
                            top: 10
                        },
                        fullWidth: true,
                        lineSmooth: Chartist.Interpolation.simple({
                            divisor: 3
                        }),
                        axisY: {
                            onlyInteger: true,
                        },
                        axisX: {
                            labelInterpolationFnc: function (value, index) {
                                return index % 2 === 0 ? value : null;
                            }
                        }
                    },
            chart;
            $scope.$watch(angular.bind(vm, function () {
                return [this.data, this.params];
            }), function (newVals) {
                if (_.isUndefined(newVals) || _.isEmpty(newVals[0]) || _.isEmpty(_.compact(newVals))) {
                    return;
                }
                onNewData(newVals[0], newVals[1]);
            }, true);

            function onNewData(data, params) {
                var formattedData = formatData(data, params);

                if (isSameDate(params.start_date, params.end_date)) {
                    chartOptions.showPoint = true;
                } else {
                    chartOptions.showPoint = false;
                }
                if(!$localStorage.high)
                    $localStorage.high=0;
                var high=getHighValue(formattedData);
                if(high>$localStorage.high){
                    $localStorage.high=high;
                    chartOptions.high = high;
                }
                else
                    chartOptions.high=$localStorage.high;
                chart = new Chartist.Line($$elem.find('.ct-chart')[0], formattedData, chartOptions, true);
            }
            function getHighValue(formattedData) {
                return _.chain(formattedData.series).map(function (series) {
                    return series.data;
                }).flatten()
                        .max().value() || 1;
            }

            function formatData(data, params) {
                var chartData = _.map(data, function (datum) {
                    return {
                        className: (datum.category || '').toLowerCase().replace(/[ /]/g, '-'),
                        data: aggregateData(datum.data, params)
                    };
                });
                return {
                    labels: _.map(getDateRanges(params), function (timestamp) {
                        return timestamp == null ? null : moment.unix(timestamp).format('M/DD');
                    }),
                    series: chartData
                };
            }

            function isSameDate(start_date, end_date) {
                return moment(end_date).diff(moment(start_date), 'days') == 0;
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
                } else if (daysDifference == 0) {
                    timeDiff = start_timestamp;
                    return [null, start_date, null];
                } else {
                    return _.range(start_timestamp, (end_timestamp + timeDiff), timeDiff);
                }
            }

            //grouping data into segments
            //Input: [{count:'4, date: '2014-5-19'},{count:'5, date: '2014-5-19'}...]
            function aggregateData(data, params) {
                var timeRanges = getDateRanges(params).reverse(),
                        maxRangeLength = timeRanges.length;
                var list = Array(maxRangeLength).fill(0);
                if (isSameDate(params.start_date, params.end_date)) {
                    var count = _.inject(data, function (sum, datum) {
                        return sum + (_.isUndefined(datum.count) ? 0 : Number(datum.count));
                    }, 0);
                    list = [null, count, null];
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
})();