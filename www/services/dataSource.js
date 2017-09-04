(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('DataSource', function ($q, geometry, globalConstants, api, $timeout) {
                return DataSource;
                function DataSource(agency_id, filters, exploreAgencyMode) {
                    var dataSource = this,
                            agenciesThreshold = 300 * 1000,
                            clusterThreshold = 50 * 1000,
                            NULL_BOUNDS = new L.latLngBounds(L.latLng(0, 0), L.latLng(0, 0)),
                            partialShapeColumn = '',
                            partialShapeValues = [],
                            disableDataFetch = true;

                    dataSource.viewportBounds = NULL_BOUNDS;
                    dataSource.crimeDataBounds = NULL_BOUNDS;
                    dataSource.bufferedRadius = 0;
                    dataSource.exploreAgencyMode = exploreAgencyMode;
                    
                    // Api params
                    dataSource.forcedClustering = false;
                    dataSource.filters = filters || {};
                    dataSource.shapeFilters = {};
                    dataSource.apiFilters = {};
                    dataSource.zoomLevel = 1;
                    
                    // Data retrieved via api calls.
                    dataSource.data = [];
                    dataSource.originalData = [];
                    dataSource.viewportData = [];
                    dataSource.agencyIdsWithCrimes = [];
                    dataSource.agencyData = [];
                    dataSource.dataType = '';
                    dataSource.dataFetching = false;
                    dataSource.sexOffenders = [];
                    dataSource.viewportSexOffenders = [];
                    
                    // Partials: Applying secondary crime category filter by clicking on 
                    // spark line charts.
                    dataSource.partialData = [];
                    dataSource.partialViewportData = [];
                    dataSource.partialCategoryFilter = '';

                    dataSource.onData = function () {
                    };
                    dataSource.onViewportDataHandledLocally = function () {
                    };

                    dataSource.updateCoordinates = function (viewportBounds, zoom_level, callBack) {
                        update(viewportBounds, zoom_level, dataSource.filters, dataSource.shapeFilters, callBack);
                    };
                    dataSource.updateShapeFilters = function (shapeFilters, disableApiCallOnLoad) {
                        shapeFilters = shapeFilters || {};
                        update(dataSource.viewportBounds, dataSource.zoomLevel, dataSource.filters, shapeFilters, disableApiCallOnLoad);
                    };
                    dataSource.updateFilters = function (filters, callback) {
                        filters = filters || {};
                        update(dataSource.viewportBounds, dataSource.zoomLevel, filters, dataSource.shapeFilters, callback);
                    };

                    dataSource.enableAndFetchData = function () {
                        disableDataFetch = false;
                        update(dataSource.viewportBounds, dataSource.zoomLevel, dataSource.filters, dataSource.shapeFilters);
                    };

                    function setViewportData(callBack) {
                        if (dataSource.dataType === 'crimeClusters') {
                            dataSource.viewportData = [];
                            dataSource.viewportSexOffendersCount = _.inject(dataSource.sexOffenders, function (sum, datum) {
                                return sum + (_.isUndefined(datum.count) ? 1 : datum.count);
                            }, 0);
                        } else {
                            dataSource.viewportData = geometry.getDataListWithinViewPort(dataSource.data, dataSource.viewportBounds);
                            dataSource.originalViewportData = geometry.getDataListWithinViewPort(dataSource.originalData, dataSource.viewportBounds);
//                            this function is not working correctly for sex offender count
//                            dataSource.viewportSexOffenders = geometry.getDataListWithinViewPort(dataSource.sexOffenders, dataSource.viewportBounds);
                            dataSource.viewportSexOffenders = geometry.getSexoffenderData(dataSource.sexOffenders, dataSource.viewportBounds);
                            if (_.contains([true, 'true'], dataSource.filters.include_sex_offenders)) {
                                dataSource.viewportSexOffendersCount = dataSource.viewportSexOffenders.length;
                            } else {
                                dataSource.viewportSexOffendersCount = -1;
                            }
                        }
                        computePartialData();
                        if (callBack)
                            callBack();
                    }

                    dataSource.applyPartialCategoryFilter = function (crimeCategory) {
                        dataSource.partialCategoryFilter = crimeCategory;
                        computePartialData();
                    };
                    dataSource.partiallyFilterByShape = function (shapeColumn, shapeIds) {
                        partialShapeColumn = shapeColumn;
                        partialShapeValues = shapeIds;
                        computePartialData();
                    };

                    function setData(data, agencyIdsWithCrimes, handledCrimesLocally, agencyData, sexOffenders, callBack) {
                        dataSource.originalData = data;
                        dataSource.data = data;
                        // computePartialData();
                        dataSource.agencyIdsWithCrimes = agencyIdsWithCrimes;
                        dataSource.agencyData = agencyData;
                        dataSource.sexOffenders = sexOffenders || [];
                        partialShapeColumn = '';
                        partialShapeValues = [];
                        if (callBack != 'noCallback') {
                            if (data.length != 0 || exploreAgencyMode) {
                                setViewportData(callBack);
                            } else if (dataSource.dataType == 'agencies') {
                                if (callBack)
                                    callBack();
                            } else {
                                setViewportData(callBack);
                            }
                        }

                        dataSource.onData(data, handledCrimesLocally);
                    }

                    function computePartialData() {

                        if (partialShapeColumn !== '' && dataSource.dataType === 'crimes') {
                            dataSource.viewportData = _.select(dataSource.originalViewportData, function (position) {
                                return _.contains(partialShapeValues, position[partialShapeColumn]) || position.category == 'sex-offender';
                            });
                            dataSource.data = _.select(dataSource.originalData, function (position) {
                                return _.contains(partialShapeValues, position.baseData[partialShapeColumn]) || position.category == 'sex-offender';
                            });
                        } else {
                            dataSource.viewportData = dataSource.originalViewportData;
                            dataSource.data = dataSource.originalData;
                        }
                        if (dataSource.partialCategoryFilter &&
                                (dataSource.dataType === 'crimes' || dataSource.dataType === 'crimeClusters')) {
                            dataSource.partialViewportData = _.select(dataSource.viewportData, function (position) {
                                if (position.categorization)
                                    return position.categorization.category === dataSource.partialCategoryFilter;
                            });
                            dataSource.partialData = _.select(dataSource.data, function (position) {
                                return position.category === dataSource.partialCategoryFilter;
                            });
                        } else {
                            dataSource.partialViewportData = dataSource.viewportData;
                            dataSource.partialData = dataSource.data;
                        }
                        dataSource.sexOffenders = dataSource.sexOffenders;
                    }

                    function update(viewportBounds, newZoomLevel, newFilters, newShapeFilters, callBack) {
                        var newDataType = getViewPortType(newZoomLevel),
                                bufferedViewPortBounds = geometry.bufferBounds(viewportBounds, 0.25),
                                oldDataType = dataSource.dataType,
                                oldFilters = dataSource.filters,
                                oldApiFilters = dataSource.apiFilters,
                                newApiFilters = _.merge({}, newFilters, newShapeFilters),
                                oldZoomLevel = dataSource.zoomLevel,
                                isDataUpdationRequired;
                        newApiFilters.zoom = newZoomLevel;
                        if (dataSource.exploreAgencyMode && newDataType === 'agencies') {
                            isDataUpdationRequired = false;
                            dataSource.dataType = 'agencies';
                            // dataSource.data = dataSource.agencyData;
                        } else {
                            isDataUpdationRequired = shouldUpdateData(oldDataType, newDataType, oldApiFilters, newApiFilters,
                                    dataSource.crimeDataBounds, viewportBounds, bufferedViewPortBounds, oldZoomLevel, newZoomLevel);
                        }

                        dataSource.filters = newFilters || {};
                        dataSource.shapeFilters = newShapeFilters || {};
                        dataSource.apiFilters = newApiFilters;
                        dataSource.zoomLevel = newZoomLevel;
                        dataSource.viewportBounds = viewportBounds;
                        dataSource.isDataUpdationRequired = isDataUpdationRequired;

                        if (isDataUpdationRequired) {
                            if (oldDataType !== newDataType && oldZoomLevel !== newZoomLevel) {
                                setData([], [], [], [], [], 'noCallback');
                            }
                            dataSource.dataType = newDataType;

                            dataSource.crimeDataBounds = (newDataType === 'agencies') ? NULL_BOUNDS : bufferedViewPortBounds;
                            updateData(newDataType, bufferedViewPortBounds, newZoomLevel, newApiFilters).then(function (result) {
                                dataSource.dataType = result.type;
                                setData(result.data, result.agencyIdsWithCrimes, result.handledCrimesLocally, result.agencyData, result.sexOffenders, callBack);
                            });
                            //                            if (newDataType === 'agencies') {
                            dataSource.onViewportDataHandledLocally();
                            //                            }
                        } else {
                            setViewportData(callBack);
                            dataSource.onViewportDataHandledLocally();
                        }
                    }

                    function shouldUpdateData(oldDataType, newDataType, oldApiFilters, newApiFilters,
                            crimeDataBounds, newViewportBounds, newBufferedViewportBounds, oldZoomLevel, newZoomLevel) {
                        var isViewPortSubset = geometry.isCoordinatesSubset(crimeDataBounds, newViewportBounds);
                        if (!_.isEqual(oldApiFilters, newApiFilters)) {
                            return true;
                        } else if (oldDataType === 'crimes' && newDataType === 'crimesOrClusters') {
                            return !isViewPortSubset;
                        } else if (oldDataType === 'crimeClusters' && newDataType === 'crimesOrClusters') {
                            var individualCrimeMarkerThreshold = globalConstants.API_INDIVIDUAL_CRIME_THRESHOLD_MOBILE_MODE,
                                    positionsInNewBufferBounds = geometry.getDataListWithinViewPort(dataSource.data, newBufferedViewportBounds),
                                    positionsCountInNewBufferBounds = _.inject(positionsInNewBufferBounds, function (sum, datum) {
                                        return sum + (datum.count || 1);
                                    }, 0),
                                    oldClusterGranularity = globalConstants.FORCED_CLUSTER_GRID_PRECISION[oldZoomLevel.toString()],
                                    newClusterGranularity = globalConstants.FORCED_CLUSTER_GRID_PRECISION[newZoomLevel.toString()];

                            if (oldClusterGranularity !== newClusterGranularity) {
                                return true;
                            }

                            if (isViewPortSubset && positionsCountInNewBufferBounds > individualCrimeMarkerThreshold) {
                                return false;
                            }
                        } else if (oldDataType === 'agencies' && newDataType === 'agencies') {
                            return false;
                        }
                        return true;
                    }

                    function getViewPortType(zoom) {
                        if (zoom <= globalConstants.AGENCY_VIEWPORT_ZOOM && !exploreAgencyMode) {
                            return 'agencies';
                        } else {
                            return 'crimesOrClusters';
                        }
                    }

                    function updateData(newDataType, bufferedBounds, zoomLevel, filters) {
                        var dataPromise = null;
                        dataSource.dataFetching = true;
                        if (newDataType === 'agencies') {
                            //                            dataPromise = api.getAgencies();
                            dataPromise = $q.when({
                                data: [],
                                type: 'agencies'
                            });
                            api.cancelCrimeDataRequests();
                        } else {
                            dataPromise = api.getCrimeData(agency_id, bufferedBounds, filters, zoomLevel);
                        }

                        dataPromise.then(function (result) {
                            $timeout(function () {
                                dataSource.dataFetching = false;
                            });
                            dataSource.agenciesCount = result.agenciesCount;
                            dataSource.ungroupedClusterCounts = result.ungroupedClusterCounts || 0;
                        }, function () {
                            dataSource.dataFetching = false;
                        });
                        return dataPromise;
                    }

                }
            });
})();