(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('reorderCategory', function (globalConstants) {
                return {
                    reorderedTrendsData: reorderedTrendsData
                };
                function reorderedTrendsData(trendsData) {
                    var orderedHistoricData = [];
                    _.each(globalConstants.TRENDS_ORDER, function (category) {
                        _.find(trendsData, function (data) {
                            if (category === data.category) {
                                orderedHistoricData.push(data);
                            }
                        });
                    });
                    return orderedHistoricData;
                }
            });
})();