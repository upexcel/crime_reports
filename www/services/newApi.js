(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('api', function ($q, smartHttp, $localStorage, globalConstants, $rootScope, Position) {
                var crimeDataTimeoutDefer = $q.defer(),
                        viewPortAgencyDefer = $q.defer(),
                        historicDataDefer = $q.defer(),
                        hourWiseDataDefer = $q.defer(), topItemDataDefer = $q.defer(),
                        memoizedGetAgencies = _.memoize(_getAgencies, function (agencyId) {
                            return agencyId;
                        });
                var url = globalConstants.SITE_URL;
                return {
                    cancelCrimeDataRequests: cancelCrimeDataRequests,
                    cancelNoDataAgenciesRequests: cancelNoDataAgenciesRequests,
                    getAgencyShape: function (agencyIds) {
                        return smartHttp.get(url + '/api/agencies/shapes.json', {
                            params: {
                                agency_ids: agencyIds.join(',')
                            }
                        });
                    },
                    getAgencyShapeGroups: function (agencyId) {
                        return smartHttp.get(url + '/api/agencies/shape_groups.json', {
                            params: {
                                agency_id: agencyId
                            }
                        });
                    },
                    getAgencies1: function (agencyId) {
                        crimeDataTimeoutDefer.resolve();
                        crimeDataTimeoutDefer = $q.defer();
                        return memoizedGetAgencies(agencyId);
                    },
                    getAgencies: function (agencyId) {
                        return memoizedGetAgencies(agencyId);
                    },
                    getHistoricData: _getHistoricData,
                    getHourWiseData: _getHourWiseData,
                    getTopItemData: _getTopItemData,
                    getViewPortAgencies: _getViewPortAgencies,
                    getNoDataAgencies: function (viewportBounds) {
                        return getNoDataAgencies(viewportBounds);
                    },
                    getPlusAgencies: function (viewportBounds) {
                        return getPlusAgencies(viewportBounds);
                    },
                    getCrimeClusterData: function (agencyId, bounds, filters, zoom) {
                        cancelCrimeDataRequests();
                        var apiParams = _.merge({}, filters, {
                            zoom: zoom
                        });
                        return getCrimeClusterData(agencyId, bounds, apiParams);
                    },
                    getMessage: function (agencyId) {
                        var defobject = $q.defer();
                        var newdata = smartHttp.get(url + '/api/agencies/details.json?agency_id=' + agencyId);
                        defobject.resolve(newdata);
                        return defobject.promise;
                    },
                    getCrimeData: function (agencyId, bounds, filters, zoom) {
                        cancelCrimeDataRequests();
                        var crimesDataDefer = $q.defer(),
                                apiParams = _.merge({}, filters, {
                                    zoom: zoom
                                }),
                                individualCrimeMarkerThreshold = globalConstants.API_INDIVIDUAL_CRIME_THRESHOLD,
                                individualCrimesPromise = getIndividualCrimeData(agencyId, bounds, apiParams),
                                clusterPromise = getCrimeClusterData(agencyId, bounds, apiParams);

                        individualCrimesPromise.then(function (crimeData) {
                            if (crimeData.instanceCount <= individualCrimeMarkerThreshold) {
                                crimesDataDefer.resolve(crimeData);
                            }
                        });

                        clusterPromise.then(function (clusterData) {
                            if (clusterData.instanceCount > individualCrimeMarkerThreshold) {
                                crimesDataDefer.resolve(clusterData);
                            }
                        });
                        return crimesDataDefer.promise;
                    },
                    getIncidentVideoLinks: function (agency_id, incident_id) {
                        var url1='https://rc-crimereports.herokuapp.com';
                        return smartHttp.get(url1 +'/api/crimes/video_links.json', {
                            params: {
                              agency_id: agency_id,
                              incident_id: incident_id
                            }, cache: true
                          });
                    }
                };
                function _getHistoricData(paramsWithAgencyId) {
                    historicDataDefer.resolve();
                    historicDataDefer = $q.defer();
                    if (isCrimeEnabled(paramsWithAgencyId)) {
                        return smartHttp.get(url + '/api/trends/historical_wise.json', {
                            params: paramsWithAgencyId,
                            timeout: historicDataDefer.promise
                        });
                    } else {
                        return $q.when({data: {}});
                    }
                }
                function cancelNoDataAgenciesRequests() {
                    noDataAgenciesDefer.resolve();
                    noDataAgenciesDefer = $q.defer();
                }

                function _getHourWiseData(paramsWithAgencyId) {
                    var id = angular.copy(paramsWithAgencyId);
                    id.all_crimes = true;
                    hourWiseDataDefer.resolve();
                    hourWiseDataDefer = $q.defer();
                    if (isCrimeEnabled(paramsWithAgencyId)) {
                        return smartHttp.get(url + '/api/trends/hour_wise.json', {
                            params: id,
                            timeout: hourWiseDataDefer.promise,
                            cache: true
                        });
                    } else {
                        return $q.when({data: {}});
                    }
                }

                function _getTopItemData(paramsWithAgencyId) {
                    topItemDataDefer.resolve();
                    topItemDataDefer = $q.defer();
                    if (isCrimeEnabled(paramsWithAgencyId)) {
                        return smartHttp.get(url + '/api/trends/type_wise.json', {
                            params: paramsWithAgencyId,
                            timeout: topItemDataDefer.promise,
                            cache: true
                        });
                    } else {
                        return $q.when({data: {}});
                    }
                }

                function _getViewPortAgencies(viewPortBounds, zoomLevel, filters) {
                    if (!viewPortBounds)
                        viewPortBounds = $localStorage.viewPort.bounds;
                    var params = {
                        lat1: Number(viewPortBounds._northEast.lat),
                        lng1: Number(viewPortBounds._northEast.lng),
                        lat2: Number(viewPortBounds._southWest.lat),
                        lng2: Number(viewPortBounds._southWest.lng),
                        filter_by_viewport: true,
                        zoom: Number(zoomLevel)
                    };
                    params = _.merge({}, filters, params);
                    viewPortAgencyDefer.resolve();
                    viewPortAgencyDefer = $q.defer();
                    return smartHttp.get(url + '/api/agencies/details.json', {
                        params: params,
                        timeout: viewPortAgencyDefer.promise,
                        cache: true
                    });
                }

                function getNoDataAgencies(viewPortBounds) {
                    if (!viewPortBounds)
                        viewPortBounds = $localStorage.viewPort.bounds;
                    return smartHttp.get(url + '/api/agencies/details.json', {
                        cache: true,
                        params: {
                            lat1: Number(viewPortBounds._northEast.lat),
                            lng1: Number(viewPortBounds._northEast.lng),
                            lat2: Number(viewPortBounds._southWest.lat),
                            lng2: Number(viewPortBounds._southWest.lng),
                            use_center: true,
                            account_type: 'Missing',
                            county_contract: 'true'
                        }
                    }).then(function (result) {
                        var agencies = result.data.agencies,
                                agencyPositions = _.map(agencies, function (agency) {
                                    return new Position(agency, 'agency');
                                });
                        return {
                            data: agencyPositions,
                            agenciesCount: agencies.length,
                            type: 'no-data-agencies'
                        };
                    });
                }

                function getPlusAgencies(viewPortBounds) {
                    return smartHttp.get(url + '/api/agencies/details.json', {
                        cache: true,
                        params: {
                            lat1: Number(viewPortBounds._northEast.lat),
                            lng1: Number(viewPortBounds._northEast.lng),
                            lat2: Number(viewPortBounds._southWest.lat),
                            lng2: Number(viewPortBounds._southWest.lng),
                            use_center: true,
                            account_type: 'Plus',
                            county_contract: 'true'
                        }
                    }).then(function (result) {
                        return result;
//                        var agencies = result.data.agencies,
//                                agencyPositions = _.map(agencies, function(agency) {
//                                    return new Position(agency, 'agency');
//                                });
//                        return {
//                            data: agencyPositions,
//                            agenciesCount: agencies.length,
//                            type: 'no-data-agencies'
//                        };
                    });
                }

                function cancelCrimeDataRequests() {
                    crimeDataTimeoutDefer.resolve();
                    crimeDataTimeoutDefer = $q.defer();
                }

                function _getAgencies(agencyId) {
                    return smartHttp.get(url + '/api/agencies/details.json', {
                        params: {
                            agency_id: agencyId
                        },
                        cache: false
                    }).then(function (result) {
                        var agencies = result.data.agencies,
                                agencyPositions = _.map(agencies, function (agency) {
                                    return new Position(agency, 'agency');
                                });
                        return {
                            data: agencyPositions,
                            agenciesCount: agencies.length,
                            type: 'agencies'
                        };
                    }, function(e){});
                }

                function getIndividualCrimeData(agencyId, bounds, filters) {
                    if (!bounds) {
                        bounds = $localStorage.viewPort.bounds;
                    }
                    var params, crimeDataPromise, sexOffendersPromise,
                            apiParams = {
                                agency_id: agencyId,
                                lat1: bounds._northEast.lat,
                                lng1: bounds._northEast.lng,
                                lat2: bounds._southWest.lat,
                                lng2: bounds._southWest.lng
                            };

                    params = {
                        params: $.extend({}, apiParams, filters),
                        timeout: crimeDataTimeoutDefer.promise
                    };

                    if (isCrimeEnabled(filters)) {
                        crimeDataPromise = smartHttp.get(url + '/api/crimes/details.json', params);
                    } else {
                        crimeDataPromise = $q.when({
                            data: {
                                agencies: [],
                                instance_count: 0
                            }
                        });
                    }
                    if (isSexOffendersEnabled(filters)) {
                        sexOffendersPromise = smartHttp.get(url + '/api/sex_offenders/details.json', params);
                    } else {
                        sexOffendersPromise = $q.when({
                            data: {
                                sex_offenders: [],
                                instance_count: 0
                            }
                        });
                    }

                    return $q.all([crimeDataPromise, sexOffendersPromise]).then(function (results) {
                        var agenciesResult = results[0],
                                sexOffendersResult = results[1],
                                agencies = agenciesResult.data.agencies,
                                sexOffenderPositions = _.map(sexOffendersResult.data.sex_offenders, function (offender) {
                                    offender.type = 'Registered Sex Offender';
                                    return new Position(offender, 'sex-offender');
                                }),
                                agencyCrimePositions = _.chain(agencies).map(function (agency) {
                            var agencyMeta = _.omit(agency, 'crimes');
                            return _.map(agency.crimes, function (agencyCrime) {
                                return new Position(agencyCrime, 'crime', 1, agencyMeta);
                            });
                        }).flatten().value(),
                                agencyIdsWithCrimes = _.chain(agencies).select(function (agency) {
                            return agency.crimes.length > 0;
                        }).pluck('agency_id').value();
                        var agencyData = [];

                        if (agencyId) {
                            var obj = formatAgencies(agencies[0]);
                            agencyData.push(obj);
                        } else {
                            _.each(agencies, function (agency) {
                                if (agency.crimes.length > 0) {
                                    var obj = formatAgencies(agency);
                                    agencyData.push(obj);
                                }
                            });
                        }
                        return {
                            data: agencyCrimePositions.concat(sexOffenderPositions),
                            agencyIdsWithCrimes: agencyIdsWithCrimes,
                            agencyData: agencyData,
                            sexOffenders: sexOffenderPositions,
                            agenciesCount: agencies.length,
                            instanceCount: sexOffendersResult.data.instance_count + agenciesResult.data.instance_count,
                            handledCrimesLocally: !isCrimeEnabled(filters),
                            type: 'crimes'
                        }
                        ;
                    });

                }

                function formatAgencies(agency) {
                    if (!agency) {
                        return {};
                    }
                    var obj = {
                        baseData: agency,
                        count: 1,
                        agency_id: agency.agency_id,
                        location: {
                            latitude: agency.center.coordinates[1],
                            longitude: agency.center.coordinates[0]
                        },
                        subCategory: agency.agency_type === 'Police Dept' ? 'agency' : 'sheriff',
                        subType: 'agency',
                        type: 'agency'
                    };
                    return obj;
                }

                function getCrimeClusterData(agencyId, bounds, filters) {
                    if (!bounds) {
                        bounds = $localStorage.viewPort.bounds;
                    }
                    var params, crimeDataPromise, sexOffendersPromise,
                            apiParams = {
                                agency_id: agencyId,
                                lat1: bounds._northEast.lat,
                                lng1: bounds._northEast.lng,
                                lat2: bounds._southWest.lat,
                                lng2: bounds._southWest.lng
                            };

                    params = {
                        params: $.extend({}, apiParams, filters),
                        timeout: crimeDataTimeoutDefer.promise
                    };

                    if (isCrimeEnabled(filters)) {
                        crimeDataPromise = smartHttp.get(url + '/api/crimes/cluster.json', params);
                    } else {
                        crimeDataPromise = $q.when({
                            data: {
                                agencies: []
                            }
                        });
                    }

                    if (isSexOffendersEnabled(filters)) {
                        sexOffendersPromise = smartHttp.get(url + '/api/sex_offenders/cluster.json', params);
                    } else {
                        sexOffendersPromise = $q.when({
                            data: {
                                sex_offender_clusters: []
                            }
                        });
                    }

                    return $q.all([crimeDataPromise, sexOffendersPromise]).then(function (results) {
                        var crimesCount = 0,
                                agencies = results[0].data.agencies,
                                sexOffenderClusters = _.map(results[1].data.sex_offender_clusters, function (cluster) {
                                    var count = Number(cluster.count) || 0,
                                            primaryKey = cluster.snap.coordinates.toString() + 'sex-offender';
                                    crimesCount = crimesCount + count;
                                    return new Position(_.merge({primary_key: primaryKey}, cluster), 'cluster', count);
                                }),
                                agencyCrimeClusters = _.chain(agencies).map(function (agency) {
                            return _.map(agency.clusters, function (cluster) {
                                var count = Number(cluster.count) || 0,
                                        primaryKey = (agency.agency_id || '') + '-' +
                                        cluster.snap.coordinates.toString() + '-' +
                                        cluster.category;
                                crimesCount = crimesCount + count;
                                return new Position(_.merge({primary_key: primaryKey}, cluster), 'cluster', count);
                            });
                        }).flatten().value(),
                                clusters = agencyCrimeClusters.concat(sexOffenderClusters),
                                agencyIdsWithCrimes = _.chain(agencies).select(function (agency) {
                            return agency.clusters.length >= 0;
                        }).pluck('agency_id').value();

                        var agencyData = [];
                        _.each(agencies, function (agency) {
                            var obj = {
                                baseData: agency,
                                count: 1,
                                agency_id: agency.agency_id,
                                location: {
                                    latitude: agency.center.coordinates[1],
                                    longitude: agency.center.coordinates[0]
                                },
                                subCategory: agency.agency_type === 'Police Dept' ? 'agency' : 'sheriff',
                                subType: 'agency',
                                type: 'agency'
                            };
                            agencyData.push(obj);
                        });

                        return {
                            data: clusters,
                            agencyIdsWithCrimes: agencyIdsWithCrimes,
                            agencyData: agencyData,
                            sexOffenders: sexOffenderClusters,
                            agenciesCount: agencies.length,
                            instanceCount: crimesCount,
                            handledCrimesLocally: !isCrimeEnabled(filters),
                            type: 'crimeClusters'
                        };
                    });
                }

                function isSexOffendersEnabled(filters) {
                    return filters.include_sex_offenders === true || filters.include_sex_offenders === 'true';
                }

                function isCrimeEnabled(filters) {
                    return filters.incident_types && filters.incident_types.split(',').length > 0;
                }
            });
})();