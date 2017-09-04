var Map = false,
        shapeLayerGroup, persistentMarkerClusterGroupLayer, markerClusterGroupLayer, noDataMarkerClusterGroupLayer;
(function () {
    'use strict';
    angular.module('setlocation').controller('setlocationCtrl', function ($rootScope, $http, $scope, $state, $timeout, $localStorage, globalConstants, AgencySource, geometry, zoomHelper, api, $ionicPlatform) {
        var vm = this;
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        if (navigator && navigator.geolocation && !$localStorage.shareUrl) {
            var watchID = navigator.geolocation.getCurrentPosition(geolocationSuccess,
                    geolocationError, options);
        }

        function geolocationSuccess(Position) {
            var GEOCODING = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + Position.coords.latitude + '%2C' + Position.coords.longitude + '&language=en';

            $.getJSON(GEOCODING).done(function (location) {
                for (var i = 0; i < location.results.length; i++) {
                    for (var j = 0; j < location.results[i].types.length; j++) {
                        if (location.results[i].types[0] == "locality") {
                            $localStorage.formatted_address = location.results[i].formatted_address;
                            break;
                        }
                    }
                }
            })

            if (Position.coords.latitude && Position.coords.longitude) {

                var view = {
                    lat: Position.coords.latitude,
                    lng: Position.coords.longitude,
                    zoom: 12
                };
                viewportInit(view, 'success');
            }
        }

        function geolocationError(PositionError) {

            var view = {
                lat: 37.8044,
                lng: -122.2711,
                zoom: 11
            };
            viewportInit(view, 'error');
        }

        function viewportInit(view, resType) {
            if (resType == 'success')
                $localStorage.position = view;
            if (!L.mapbox.accessToken)
                L.mapbox.accessToken = globalConstants.accessToken;
            Map = L.mapbox.map('map1', null, {
                attributionControl: false,
                zoomControl: false,
                tileLayer: false,
                minZoom: 1
            }).setView([view.lat, view.lng], view.zoom);

            L.mapbox.tileLayer('mapbox.emerald')
                    .addTo(Map)
                    .on('load', finishedLoading);

            function finishedLoading() {
                var southWest = Map.getBounds().getSouthWest();
                var northEast = Map.getBounds().getNorthEast();

                var viewportBounds = L.latLngBounds(southWest, northEast);
                var api_filter = {
                    'include_sex_offenders': false,
                    'incident_types': 'Property Crime,Property Crime Commercial,Property Crime Residential,Disorder,Drugs,Quality of Life,Homicide,Assault with Deadly Weapon,Assault,Theft of Vehicle,Theft,Robbery,Breaking & Entering,Liquor,Theft from Vehicle,Kidnapping,Sexual Offense,Sexual Assault,Other Sexual Offense',
                    'end_date': '2016-08-01',
                    'start_date': '2016-07-25',
                    'end_time': 23,
                    'start_time': 0,
                    'days': 'sunday,monday,tuesday,wednesday,thursday,friday,saturday',
                    'shape_column': '',
                    'shape_ids': '',
                    'zoom': 12
                };
                var viewportAgencies = api.getViewPortAgencies(viewportBounds, 12, api_filter);
                viewportAgencies.then(function (result) {
                    $localStorage.viewPortAgencies = result;
                });
                if (!vm.savedLocationData)
                    vm.savedLocationData = [];
                if (view.lat != 37.8044) {
                    L.mapbox.geocoder('mapbox.places').query(view.lng + "," + view.lat, function (err, data) {
                        if (!err && data.results.features[0].place_name) {
                            var result = data.results.features[0];
                            if (vm.savedLocationData.length) {
                                _.forEach(vm.savedLocationData, function (val, key) {
                                    if (val.place_name == result.place_name) {
                                        return false;
                                    } else if (key + 1 == vm.savedLocationData.length) {
                                        setGpsLocation(result);
                                    }
                                });
                            }
                            else {
                                setGpsLocation(result);
                            }
                        }
                    });
                }
            }
        }
        function setGpsLocation(result) {
            result.search_name = '';
            result.default = false;
            result.gps = true;
            var autoSavedLocations = [];
            if ($localStorage.autoSavedLocations) {
                autoSavedLocations = $localStorage.autoSavedLocations;
                _.forEach(autoSavedLocations, function (val, key) {
                    if (val.gps) {
                        autoSavedLocations[key] = result;
                        result = '';
                    }
                });
            }
            if (result)
                autoSavedLocations.unshift(result);
            if ($localStorage.formatted_address && ($localStorage.formatted_address != undefined || $localStorage.formatted_address != ""))
                autoSavedLocations[0].place_name = $localStorage.formatted_address;
            $localStorage.autoSavedLocations = autoSavedLocations;

            setInit();
            $scope.$apply();
        }
        function setInit() {
            if ($localStorage.autoSavedLocations) {
                if ($localStorage.autoSavedLocations.length > 0) {
                    if ($localStorage.autoSavedLocations[0].place_name) {
                        if (($localStorage.autoSavedLocations[0].place_name.length > 40) || ($localStorage.autoSavedLocations[0].place_name.length > 38 && $localStorage.autoSavedLocations[0].default)) {
                            vm.id_name = 'scrollbox1';
                        } else if (!$localStorage.autoSavedLocations[0].default && $localStorage.autoSavedLocations[0].search_name == '') {
                            vm.id_name = 'scrollbox2';
                        } else if ($localStorage.autoSavedLocations[0].default && $localStorage.autoSavedLocations[0].search_name == '') {
                            if ($localStorage.autoSavedLocations[0].place_name.length < 38) {
                                vm.id_name = 'scrollbox2';
                            } else {
                                vm.id_name = 'scrollbox';
                            }
                        } else if (!$localStorage.autoSavedLocations[0].default && $localStorage.autoSavedLocations[0].search_name != '') {
                            vm.id_name = 'scrollbox2';
                        } else if ($localStorage.autoSavedLocations[0].default && $localStorage.autoSavedLocations[0].search_name != '') {
                            if ($localStorage.autoSavedLocations[0].place_name.length < 38) {
                                vm.id_name = 'scrollbox2';
                            } else {
                                vm.id_name = 'scrollbox';
                            }
                        }
                    }

                    vm.savedLocation = true;
                    vm.savedLocationData = $localStorage.autoSavedLocations;
                    _.forEach(vm.savedLocationData, function (val, key) {
                        if (val.agency_type) {
                            val.agency = true;
                        } else {
                            val.agency = false;
                        }
                    });
                }
            } else {
                vm.savedLocation = false;
            }
        }
        setInit();
        vm.openLocation = function (result) {
            if (angular.isArray(result.center)) {
                var resultLocation = result.center;
            } else {
                var resultLocation = result.center.coordinates;
            }
            var args = {},
                    lat = resultLocation[1],
                    lng = resultLocation[0];

            args.lat = lat;
            args.lng = lng;
            args.result = result;
            if (_.isUndefined(result.bbox)) {
                args.zoom = zoomHelper.getZoomLevel(2000);
            } else {
                var boundingValues = result.bbox,
                        radius = geometry.distanceBetween({
                            lat: boundingValues[1],
                            lng: boundingValues[0]
                        }, {
                            lng: boundingValues[2],
                            lat: boundingValues[3]
                        });
                args.zoom = zoomHelper.getZoomLevel(radius);
            }
            if ($state.current.name !== 'app.map') {
                $state.go('app.map');
            }
            $timeout(function () {
                $rootScope.$emit('trackedUserAction', {
                    eventName: 'Search Used',
                    params: {
                        place: result.place_name
                    }
                });
                $rootScope.$emit('vNextLocation::OnSelect', args);
            }, 500);
        };
        $localStorage.location = false;
        $scope.goMap = function () {
            $state.go('app.map');
            $localStorage.location = 'user';
        };
    });

})();