(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('TrendSource', function ($rootScope, api, $q, smartHttp, geometry, reorderCategory, globalConstants) {
                return trendSource;
                function trendSource(agencyId, filters, isPlusCustomer) {
                    var trendSource = this,
                            canceller = $q.defer();
                    var url = globalConstants.SITE_URL,
                            disableDataFetch = true;
                    trendSource.loading = false;
                    trendSource.filters = filters || {};
                    trendSource.shapeFilters = {};
                    trendSource.apiFilters = filters || {},
                            trendSource.historicData = [];
                    trendSource.allHistoricData = [];
                    trendSource.barData = {};
                    trendSource.tableData = {};
                    trendSource.isPlusCustumerMode = isPlusCustomer;
                    trendSource.zoom = 0;
                    trendSource.onData = function () {

                    };
                    trendSource.updateZoom = function (zoom) {
                        trendSource.zoom = zoom;
                    };
                    trendSource.updateCoordinates = function (viewportBounds, callback) {
                        trendSource.viewportBounds = viewportBounds;
                        update(viewportBounds, trendSource.filters, trendSource.shapeFilters, [], trendSource.crimesDataType, callback);
                    };
                    trendSource.updateFilters = function (filters, callback) {
                        if (_.isEqual(trendSource.filters, filters)) {
                            return;
                        }
                        trendSource.filters = filters;
                        update(trendSource.viewportBounds, filters, trendSource.shapeFilters, [], trendSource.crimesDataType, callback);
                    };

                    trendSource.updateShapeFilters = function (shapeFilters, callback) {
                        trendSource.shapeFilters = shapeFilters;
                        update(trendSource.viewportBounds, trendSource.filters, shapeFilters, [], trendSource.crimesDataType, callback);
                    };

                    trendSource.updateData = function (dataSource, crimesDataType, viewportBounds, callback) {
                        var crimesData = dataSource.viewportData;
                        trendSource.viewportBounds = viewportBounds;
                        update(viewportBounds, trendSource.filters, trendSource.shapeFilters, crimesData, crimesDataType, callback);
                    };

                    trendSource.enableAndFetchData = function () {
                        update(trendSource.viewportBounds, trendSource.filters, trendSource.shapeFilters, [], trendSource.crimesDataType);
                    };

                    function update(viewportBounds, filters, shapeFilters, crimesData, crimesDataType, callback) {
                        if (angular.isObject(viewportBounds)) {
                            var params = {
                                lat1: viewportBounds._northEast.lat,
                                lng1: viewportBounds._northEast.lng,
                                lat2: viewportBounds._southWest.lat,
                                lng2: viewportBounds._southWest.lng
                            },
                            apiFilters = _.merge(filters, shapeFilters);
                            apiFilters.zoom = trendSource.zoom;
                            trendSource.apiFilters = apiFilters;
                            _.merge(params, apiFilters);
                            fetchDataFromServer(params, callback);
                        }
                    }

                    function haveRequiredData(crimesData, crimesDataType) {
                        return crimesDataType === 'crimes';
                    }

                    function isCrimeEnabled(filters) {
                        return filters.incident_types && filters.incident_types.split(',').length > 0 && filters.incident_types != 'false';
                    }

                    function fetchDataFromServer(params, callback) {
                        var paramsWithAgencyId = _.merge({agency_id: agencyId}, params),
                                historicalDataPromise = null,
                                hourWiseDataPromise = null,
                                topItemDataPromise = null;
                        paramsWithAgencyId.all_crimes = false;

                        historicalDataPromise = api.getHistoricData(paramsWithAgencyId);
                        trendSource.loading = true;
                        if ($rootScope.ifAgency) {
                            trendSource.loading2 = true;
                            var id = angular.copy(paramsWithAgencyId);
                            id.all_crimes = true;
                            var historicalDataPromise2 = smartHttp.get(globalConstants.SITE_URL + '/api/trends/historical_wise.json', {
                                params: id
                            });
                            ;
                            historicalDataPromise2.then(function (data) {
                                trendSource.loading2 = false;
                                trendSource.loading = false;
                                trendSource.allHistoricData = formatHistoricData(data.data);
                            });
                        }
                        if (isPlusCustomer) {
                            hourWiseDataPromise = api.getHourWiseData(paramsWithAgencyId);
                            var id = angular.copy(paramsWithAgencyId);
                            id.all_crimes = true;
                            topItemDataPromise = api.getTopItemData(id);
                        } else {
                            hourWiseDataPromise = $q.when({data: {}});
                            topItemDataPromise = $q.when({data: {}});
                        }


                        trendSource.historicDataPromise = historicalDataPromise;
                        trendSource.hourWiseDataPromise = hourWiseDataPromise;
                        trendSource.topItemDataPromise = topItemDataPromise;
                        $q.all([historicalDataPromise, hourWiseDataPromise, topItemDataPromise]).then(function (results) {
                            trendSource.loading = false;
                            setData(results[0].data, results[1].data, results[2].data, callback);
                        });

                    }


                    function setData(historicData, barData, tableData, callback) {
                        trendSource.historicData = formatHistoricData(historicData);
                        trendSource.barData = barData;
                        trendSource.tableData = tableData;
                        trendSource.onData();
                        if (_.isFunction(callback)) {
                            callback();
                        }
                    }

                    function formatHistoricData(historicData) {
                        var incidentTypesInvolved = (trendSource.filters.incident_types || '').split(','),
                                categoriesInvolved = _.chain(globalConstants.CRIME_CATEGORIES).pick(function (subcategoryIncidentTypeHash, category) {
                            var categoryIncidentTypes = _.chain(subcategoryIncidentTypeHash).values().flatten().value();
                            return _.intersection(incidentTypesInvolved, categoryIncidentTypes).length > 0;
                        }).keys().value(),
                                missingCategories = _.difference(categoriesInvolved, _.keys(historicData)),
                                formattedHistoricData = [];
                        formattedHistoricData = _.map(historicData, function (historicCrimes, category) {
                            var count = _.inject(historicCrimes, function (sum, datum) {
                                return sum + (Number(datum.count) || 1);
                            }, 0);
                            return {
                                category: category,
                                count: count,
                                data: historicCrimes
                            };
                        });
                        _.each(missingCategories, function (category) {
                            formattedHistoricData.push({
                                category: category,
                                count: 0,
                                data: []
                            });
                        });
                        return reorderCategory.reorderedTrendsData(formattedHistoricData);
                    }

                    function aggregateIndividualCrimes(crimes) {
                        var historicData = {},
                                barData = {},
                                topItemData = {};
                        _.chain(crimes).groupBy('categorization.category').each(function (categoryCrimes, category) {
                            if (category === 'sex-offender') {
                                return;
                            }

                            historicData[category] = historicData[category] || [];
                            barData[category] = barData[category] || [];
                            topItemData[category] = topItemData[category] || [];
                            _.each(categoryCrimes, function (crime) {
                                var crimeBaseData = crime;
                                if (!_.isUndefined(crimeBaseData)) {
                                    historicData[category].push({
                                        date: crimeBaseData['incident_datetime'],
                                        count: crime.count || 1
                                    });
                                    barData[category].push({
                                        time: crimeBaseData['hour_of_day'],
                                        count: crime.count || 1
                                    });
                                    topItemData[category].push({
                                        incident_type: crimeBaseData['parent_incident_type'],
                                        count: crime.count || 1
                                    });
                                }
                            });
                        }).value();
                        return [historicData, barData, topItemData];
                    }
                }
            });
})();