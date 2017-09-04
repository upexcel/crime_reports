(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('AgencySource', function ($q, geometry, $localStorage, api, globalConstants, $timeout) {
                return AgencySource;

                function AgencySource(agencyId, neighbourhoodShapesGroups, urlParams) {
                    var agencySource = this,
                            shapeFilesCache = {},
                            NULL_BOUNDS = new L.latLngBounds(L.latLng(0, 0), L.latLng(0, 0)),
                            agencyShapes = {},
                            shapeGroupsLoaded = false,
                            currentShapeGroupName = urlParams.shapeGroup || '',
                            currentShapeIds = urlParams.shape || [],
                            currentAgencyIdsWithCrimes = [],
                            currentCrimeDataType = 'agencies',
                            promises = [],
                            disableDataFetch = true,
                            shapeGroups = {};
                    if (agencyId) {
                        var agencyShapeGroupsPromise = api.getAgencyShapeGroups(agencyId);
                        trackPromise(agencyShapeGroupsPromise);
                        agencyShapeGroupsPromise.then(function (result) {
                            shapeGroups = result.data;
                            if (agencySource.onShapeGroupLoad) {
                                agencySource.onShapeGroupLoad(shapeGroups);
                            }
                            _.each(shapeGroups, function (shapeGroup) {
                                _.each(shapeGroup.shapes, function (shapeObj) {
                                    shapeObj.layer = L.geoJson(shapeObj.shape);
                                });
                            });

                            shapeGroupsLoaded = true;
                            agencySource.showShapeGroup(currentShapeGroupName, currentShapeIds);
                        });
                    }

                    _.each(neighbourhoodShapesGroups, function (shapeGroup, groupName) {
                        _.each(shapeGroup, function (shapeObj) {
                            shapeObj.shapeCoords = getLatLngLatCoordinatesFromShape(shapeObj.shape);
                        });
                    });

                    agencySource.data = [];
                    agencySource.dataFetching = false;
                    agencySource.noDataAgencyLoading = false;
                    agencySource.bufferedViewportData = [];
                    agencySource.viewportData = [];
                    agencySource.noDataAgency = [];
                    agencySource.agenciesInvolved = [];
                    agencySource.viewportShapes = {};
                    agencySource.filters = urlParams || {};
                    agencySource.zoomLevel = 1;
                    agencySource.viewportBounds = NULL_BOUNDS;
                    agencySource.onData = function () {
                    };

                    agencySource.updateCoordinates = function (viewportBounds, zoomLevel) {
                        agencySource.viewportBounds = viewportBounds;
                        agencySource.zoomLevel = zoomLevel;
                        setViewportAgenciesAndShapes();
                        setNoDataAgency(zoomLevel);
                    };
                    agencySource.updateFilters = function (filters) {
                        agencySource.filters = filters;
                        agencySource.updateViewPortAgencies();
                    };

                    var existingDataViewPort = agencySource.viewportBounds;

                    function setNoDataAgency(zoomLevel) {
                        if (geometry.isCoordinatesSubset(existingDataViewPort, agencySource.viewportBounds)) {
                            return;
                        }
                        if (zoomLevel >= 12 && !agencyId) {
                            var noDataAgencyPromise = api.getNoDataAgencies(agencySource.viewportBounds);
                            existingDataViewPort = agencySource.viewportBounds;

                            agencySource.noDataAgencyLoading = true;
                            noDataAgencyPromise.then(function (result) {
                                agencySource.noDataAgency = result.data;
                                agencySource.noDataAgencyLoading = false;
                            }, function () {
                                agencySource.noDataAgencyLoading = false;
                            });
                        } else {
                            agencySource.noDataAgency = [];
                        }
                    }

                    var agencyDataPromise = api.getAgencies(agencyId);
                    trackPromise(agencyDataPromise);
                    agencyDataPromise.then(function (result) {
                        if (result)
                            onData1(result.data);
                    });

                    function trackPromise(dataPromise) {
                        promises.push(dataPromise);
                        agencySource.dataFetching = true;
                        $q.all(promises).then(function (results) {
                            if (results.length === promises.length) {
                                $timeout(function () {
                                    agencySource.dataFetching = false;
                                }, 100);
                                promises = [];
                            }
                        }, function () {
                            $timeout(function () {
                                agencySource.dataFetching = false;
                            }, 100);
                            promises = [];
                        });
                    }

                    function onData1(data) {
                        agencySource.data = data;
                        setViewportAgenciesAndShapes();
                    }

                    agencySource.onCrimeData = function (agencyIdsWithCrime, crimeDataType) {
                        currentCrimeDataType = crimeDataType;
                        currentAgencyIdsWithCrimes = agencyIdsWithCrime;
                        //setAgenciesInvolved(agencyIdsWithCrime, crimeDataType);
                    };

                    agencySource.showShapeGroup = function (shapeGroupName, selectedShapeIds) {
                        currentShapeGroupName = shapeGroupName;
                        currentShapeIds = selectedShapeIds;
                        if (!shapeGroupsLoaded) {
                            return;
                        }
                        setViewportAgencyShapeFiles();
                    };
                    agencySource.enableAndFetchData = function () {
                        disableDataFetch = false;
                        agencySource.updateViewPortAgencies();
                    };
                    agencySource.updateViewPortAgencies = function (crimeDataType) {
                        if (agencyId) {
                            setAgenciesInvolved([agencyId]);
                        } else if (crimeDataType === 'agencies') {
                            setAgenciesInvolved([]);
                        } else {
                            var viewportAgenciesPromise = api.getViewPortAgencies(agencySource.viewportBounds, agencySource.zoomLevel, agencySource.filters);
                            trackPromise(viewportAgenciesPromise);
                            viewportAgenciesPromise.then(function (result) {
                                var agencyIds = _.map(result.data.agencies, function (agency) {
                                    return agency.agency_id;
                                });
                                setAgenciesInvolved(agencyIds);
                            });
                        }
                    };

                    function setAgenciesInvolved(agencyIdsWithCrime, crimeDataType) {
                        if (!agencySource.viewportBounds)
                            agencySource.viewportBounds = $localStorage.viewPort.bounds;
                        var agenciesWithCenterInViewport = geometry.getDataListWithinViewPort(agencySource.data, agencySource.viewportBounds);
                        agencySource.agenciesInvolved = _.select(agencySource.data, function (agency) {
                            return _.contains(agencyIdsWithCrime, agency.baseData.agency_id) ||
                                    _.contains(agenciesWithCenterInViewport, agency);
                        });
                    }

                    function setViewportAgenciesAndShapes() {

                        var bufferedViewportBounds = geometry.bufferBoundsByDiff(agencySource.viewportBounds, globalConstants.AGENCY_CENTER_IN_VIEWPORT_BUFFER);
                        agencySource.viewportData = geometry.getDataListWithinViewPort(agencySource.data, agencySource.viewportBounds);
                        agencySource.bufferedViewportData = geometry.getDataListWithinViewPort(agencySource.data, bufferedViewportBounds);
                        setViewportAgencyShapeFiles();
                        retrieveAgencyShapefilesIfRequired();
                        setAgenciesInvolved(currentAgencyIdsWithCrimes, currentCrimeDataType);
                        agencySource.onData();

                    }

                    function shouldRetrieveShapeFiles() {
                        return agencySource.zoomLevel >= globalConstants.SHOW_AGENCY_SHAPEFILES_FROM_ZOOM;
                    }
                    function setViewportAgencyShapeFiles() {
                        var currentShapeGroup = {};
                        if (!shouldRetrieveShapeFiles()) {
                            agencySource.viewportShapes = [];
                        } else {
                            var requiredAgenciesId = _.map(agencySource.bufferedViewportData, function (data) {
                                return data.agency_id;
                            }),
                                    viewportShapes = _.pick(shapeFilesCache, function (shape, agencyId) {
                                        return _.contains(requiredAgenciesId, agencyId) && shape;
                                    });
                            if (!_.isEmpty(shapeGroups)) {
                                _.each(shapeGroups, function (shapeValue) {
                                    if (shapeValue.name == currentShapeGroupName)
                                        currentShapeGroup = shapeValue;
                                });
                            }
                            if (!_.isUndefined(currentShapeGroup) && shapeGroupsLoaded) {
                                _.each(currentShapeGroup.shapes || [], function (shapeObj) {
                                    if (_.contains(currentShapeIds, shapeObj.shape_id) && shapeObj.layer) {
                                        viewportShapes['neighbourhood' + shapeObj.shape_id] = {layer: shapeObj.layer, type: 'neighbourhood'};
                                    }
                                });
                            }
                            agencySource.viewportShapes = viewportShapes;
                        }
                    }

                    var shapeFiles;

                    function retrieveAgencyShapefilesIfRequired() {

                        if (!shouldRetrieveShapeFiles()) {
                            return;
                        }
                        var cachedAgenciesId = _.keys(shapeFilesCache),
                                requiredAgenciesId = _.map(agencySource.bufferedViewportData, function (data) {
                                    return data.agency_id;
                                }),
                                toBeFetchedAgencies = _.difference(requiredAgenciesId, cachedAgenciesId);

                        if (toBeFetchedAgencies.length == 0) {
                            return;
                        }

                        //Adding fetching agency ids so it wont fetch again
                        _.each(toBeFetchedAgencies, function (agencyId) {
                            shapeFilesCache[agencyId] = false;
                        });

                        var agencyShapesPromise = api.getAgencyShape(toBeFetchedAgencies);
                        // Not showing loading spinner for agency shape loading, as it is a 
                        //  very slow call, and gives the feeling that the app is sluggish.
                        // trackPromise(agencyShapesPromise);
                        agencyShapesPromise.then(function (result) {
                            shapeFiles = result.data;
                            _.each(result.data, function (agencyShapeResult) {
                                var shape = agencyId ? geometry.invertShape(agencyShapeResult.agency_shape) : agencyShapeResult.agency_shape;
                                shapeFilesCache[agencyShapeResult.agency_id] = {
                                    layer: L.geoJson(shape),
                                    type: 'agency'
                                };
                            });
                            setViewportAgencyShapeFiles();
                        });

                    }

                    agencySource.refreshGeoJson = function () {
                        _.each(shapeGroups, function (shapeGroup) {
                            _.each(shapeGroup.shapes, function (shapeObj) {
                                shapeObj.layer = L.geoJson(shapeObj.shape);
                            });
                        });
                        _.each(shapeFiles, function (agencyShapeResult) {
                            var shape = agencyId ? geometry.invertShape(agencyShapeResult.agency_shape) : agencyShapeResult.agency_shape;
                            shapeFilesCache[agencyShapeResult.agency_id] = {
                                layer: L.geoJson(shape),
                                type: 'agency'
                            };
                        });
                    };

                } //AgencySource Constructor ends

                function getLatLngLatCoordinatesFromShape(shape) {
                    var polygons = (shape.type === 'Polygon') ? shape.coordinates : shape.coordinates[0];
                    return _.map(polygons, fixLngLatCoordinatesToLatLng);
                }

                function fixLngLatCoordinatesToLatLng(lngLats) {
                    return _.map(lngLats, function (lngLat) {
                        return [lngLat[1], lngLat[0]];
                    });
                }

            });
})();