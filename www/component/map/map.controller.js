var Map = false,
        shapeLayerGroup, persistentMarkerClusterGroupLayer, markerClusterGroupLayer, noDataMarkerClusterGroupLayer;
(function () {

    'use strict';
    angular.module('map')
            .controller('MainCtrl',
                    function ($scope, $filter, $q, $ionicHistory, $timeout,
                            $localStorage, $rootScope, $state, Alertuser, $ionicPlatform,
                            PLUS_CUSTOMER_AGENCY, $interval, globalConstants, DataSource, clusterMapConfig,
                            geometry, api, timeStorage, signoutService, AgencySource,
                            TrendSource, mapState, resourceUrls, CURRENT_AGENCY, constantFactory) {
                        var vm = this,
                                shapeGroupNameToConfigMap = {},
                                applyShapeGroupOnLoad = false,
                                previousShapeLayer = null,
                                plusCustomerMetaConfig = {};
                        $localStorage.high = 0;//for trends graph
                        $localStorage.bhigh = 0;
                        mixpanel.track("map ctrl");
                        vm.mapViewLoad = false;
                        markerClusterGroupLayer = clusterMapConfig.createClusterGroupWithDefaultConfig({
                            zoomToBoundsOnClick: false,
                            disableClusteringAtZoom: globalConstants.CLUSTER_CRIMES_TILL_ZOOM
                        });
                        persistentMarkerClusterGroupLayer = clusterMapConfig.createClusterGroupWithDefaultConfig({
                            zoomToBoundsOnClick: true,
                            disableClusteringAtZoom: globalConstants.CLUSTER_AGENCIES_TILL_ZOOM,
                            maxClusterRadius: globalConstants.AGENCY_CLUSTER_RADIUS
                        });
                        noDataMarkerClusterGroupLayer = clusterMapConfig.createClusterGroupWithDefaultConfig({
                            zoomToBoundsOnClick: true,
                            disableClusteringAtZoom: globalConstants.CLUSTER_AGENCIES_TILL_ZOOM,
                            maxClusterRadius: globalConstants.AGENCY_CLUSTER_RADIUS
                        });
                        shapeLayerGroup = clusterMapConfig.createShapeLayerGroup();

                        vm.shapeGroupNameToShapesMap = [];
                        vm.shapeGroupNames = ['City Boundaries'];
                        vm.currentShapeIds = {};
                        vm.shapeGroupsLoaded = false;
                        vm.filtersLoaded = false;
                        vm.shapeFiltersLoaded = false;
                        vm.mapLoaded = false;
                        var currentPlatform = ionic.Platform.platform();
                        $scope.isPlatformIos = currentPlatform == 'ios' || currentPlatform == 'ipad' ? true : false;

                        //brand urls...
                        $scope.brandLogoUrl = resourceUrls.crimeReports;
                        $scope.motorolaLogoUrl = resourceUrls.motorola;
                        $scope.socrataLogoUrl = resourceUrls.socrata;

                        $scope.makeChecked = true;
                        $scope.showTrendsTab = false;

                        $rootScope.$on('map.Gpslocation', function (event, gpsLocation, status) {
                            Map.setView([gpsLocation.lat, gpsLocation.lng], gpsLocation.zoom);
                        });

                        $scope.submittip = function () {
                            window.open("https://www.tipsubmit.com/webtipsstart.aspx", '_system', 'location=yes');
                        };

                        $scope.registercamera = function () {
                            window.open("https://www.crimereports.com/camera_registration#/", '_system', 'location=yes');
                        };
                        $scope.giveFeedback = function () {
                            var onSuccess = function (msg) {
                                return;
                            },
                                    onError = function (msg) {
                                        Alertuser.alert('Please check if email client is configured.');
                                    },
                                    shareViaEmail = function () {
                                        window.plugins.socialsharing.shareViaEmail(
                                                '',
                                                'CrimeReports Mobile App Feedback',
                                                [globalConstants.SOCIAL_EMAIL], // TO: must be null or an array
                                                null, // CC: must be null or an array
                                                null, // BCC: must be null or an array
                                                null, // FILES: null, a string, or an array
                                                onSuccess, // called when email was sent or canceled, no way to differentiate
                                                onError // called when something unexpected happened
                                                );
                                    };
                            if (window.plugins && window.plugins.socialsharing) {
                                window.plugins.socialsharing.canShareViaEmail(shareViaEmail, onError);
                            } else {
                                window.open("mailto:" + [globalConstants.SOCIAL_EMAIL] + "?subject=CrimeReports Mobile App Feedback", '_system', 'location=yes');
                            }
                        }

                        $scope.exploreSelectedAgency = function (clickedMarkerData) {
                            $timeout(function () {
                                $scope.$emit('explore.Agency', clickedMarkerData);
                            }, 500)

                        };

                        $scope.ZoomToIncident = function (item) {
                            var data = item,
                                    zoom = 16;
                            $state.go('app.map');
                            $timeout(function () {
                                $rootScope.$emit('list.data', {data: data, zoom: zoom});
                            }, 200);
                        };
                        $rootScope.$on('login', function () {
                            signoutService.checklogin();
                        });
                        $scope.toggleSideMenu = function () {
                            $state.go('app.menu');
                        };
                        $scope.signIn = function () {
                            $state.go('app.signin')
                        }
                        $scope.logout = function () {
                            signoutService.signout().then(function () {
                                $scope.UserName = '';
                                $rootScope.accountType = '';
                                $state.go('app.map');
                                Alertuser.alert('Logged out');
                            }, function (message) {
                                Alertuser.alert(message);
                            });
                        };
                        $scope.crimes = {};
                        $scope.search = {
                            'lat': '',
                            'lon': '',
                            'radius': '',
                            'zoom': ''
                        };
                        $scope.viewPort = {
                            lat: '',
                            lng: '',
                            zoom: '',
                            center: '',
                            bounds: ''
                        };
                        $rootScope.Loggeduser = {
                            UserName: '',
                            accountType: ''
                        }
                        if (timeStorage.get('login')) {
                            var user = timeStorage.get('login');
                            $rootScope.Loggeduser.UserName = user.first_name ? user.first_name + ' ' + user.last_name : user.email;
                            $rootScope.Loggeduser.accountType = user.account;
                            $rootScope.log = true;
                        }
                        $scope.$on('customFilters::changed', function (e, filters) {
                            //update localStorage filter
                            $localStorage['apiFilters'] = filters;
                            vm.filtersLoaded = true;
                            if (!_.isEmpty(filters)) {
                                $scope.dataSource.updateFilters(filters, function () {
                                    $scope.filters = $scope.dataSource.filters;
                                    onDataSrcData();
                                    countIncidents();
                                });
                                $scope.agencySource.updateFilters(filters);
                                mapState.updateFilters(filters);
                                if ($scope.dataSource.dataType !== 'agencies') {
                                    $rootScope.trendSource.updateFilters(filters, function () {
                                        $scope.filtersDone = true;
                                        countIncidents();
                                    });
                                }
                            }
                            $scope.showBottomCard = false;
                            $scope.closeCard();
                        });
                        $localStorage.alert = true;
                        var involvedAgencies = [];
                        $rootScope.$on('SearchOverlay::OnSelect', function (e, args) {
                            $timeout(function () {
                                if (!$scope.dataSource.agencyData)
                                    $scope.dataSource.agencyData = [];
                                if (!$scope.agencySource.agenciesInvolved)
                                    $scope.agencySource.agenciesInvolved = [];
                                if (!$scope.dataSource.partialViewportData)
                                    $scope.dataSource.partialViewportData = [];
                                involvedAgencies = $scope.dataSource.agencyData.length < $scope.agencySource.agenciesInvolved.length ?
                                        $scope.agencySource.agenciesInvolved : $scope.dataSource.agencyData;
                                if (involvedAgencies.length) {
                                    $localStorage.alert = true;
                                } else if ($scope.dataSource.partialViewportData.length) {
                                    $localStorage.alert = true;
                                } else
                                    $localStorage.alert = false;
                                Map.setView([args.lat, args.lng], args.zoom);
                                updateCordinates();
                            }, 1000);


                            $scope.showBottomCard = false;

                        });
                        $rootScope.$on('CustomFilter::PartiallyShowCrimeCategory', function (e, crimeCategory) {
                            $scope.closeCard();
                            $scope.dataSource.applyPartialCategoryFilter(crimeCategory);

                        });

                        $rootScope.$on('$ionicView.beforeLeave', function () {
                            if (!$scope.dataSource.agencyData)
                                $scope.dataSource.agencyData = [];
                            if (!$scope.agencySource.agenciesInvolved)
                                $scope.agencySource.agenciesInvolved = [];
                            if (!$scope.dataSource.partialViewportData)
                                $scope.dataSource.partialViewportData = [];
                            involvedAgencies = $scope.dataSource.agencyData.length < $scope.agencySource.agenciesInvolved.length ?
                                    $scope.agencySource.agenciesInvolved : $scope.dataSource.agencyData;
                            if (involvedAgencies.length) {
                                $localStorage.alert = true;
                            } else if ($scope.dataSource.partialViewportData.length) {
                                $localStorage.alert = true;
                            } else
                                $localStorage.alert = false;
                            if ($scope.ifExploreAgency)
                                $localStorage.ifExploreAgency = true;
                            else
                                $localStorage.ifExploreAgency = false;
                        });
                        $rootScope.$on('vNextLocation::OnSelect', function (e, args) {
                            $timeout(function () {
                                Map.setView([args.lat, args.lng], args.zoom);
                                updateCordinates();
                                $scope.showBottomCard = false;
                            });
                            if (args.result.agency_name) {
                                var object = {
                                    "latlng": {
                                        "lat": args.lat,
                                        "lng": args.lng
                                    },
                                    "target": {
                                        "position": {
                                            "baseData": args.result,
                                            "type": "agency",
                                            "id": args.result.agency_id
                                        }
                                    }
                                }
                                markerClick(object);
                                $timeout(function () {
                                    $scope.$emit('explore.Agency', args.result);
                                }, 500);
                            } else if (!_.isEmpty(PLUS_CUSTOMER_AGENCY)) {
                                // Going from PLUS single-agency-mode to free-multi-agency mode.
                                $scope.backToDefaultMap(args.zoom);
                            }
                        });

                        function selectDefaultDates() {
                            //last 14 days
                            var curr = new Date;
                            var first = curr.getDate() - 7;
                            var firstday = new Date(curr.setDate(first)).toUTCString();

                            curr = new Date();
                            var lastday = new Date()

                            var startDate = new Date(firstday).getDate();
                            startDate = (startDate < 10) ? '0' + startDate : startDate;
                            var startMonth = new Date(firstday).getMonth() + 1;
                            startMonth = (startMonth < 10) ? '0' + startMonth : startMonth;
                            var startYear = new Date(firstday).getFullYear();

                            var endDate = new Date(lastday).getDate();
                            endDate = (endDate < 10) ? '0' + endDate : endDate;
                            var endmonth = new Date(lastday).getMonth() + 1;
                            endmonth = (endmonth < 10) ? '0' + endmonth : endmonth;
                            var endyear = new Date(lastday).getFullYear();

                            $scope.start_date = startYear + '-' + startMonth + '-' + startDate;
                            $scope.end_date = endyear + '-' + endmonth + '-' + endDate;

                        }
                        ;
                        var localDataSource = $localStorage['apiFilters'];
                        //format mm-dd-yyyy;
                        if (localDataSource) {
                            $scope.start_date = localDataSource.start_date;
                            $scope.end_date = localDataSource.end_date;
                            $scope.crimeTypes = localDataSource.incident_types.split(',');
                            $scope.eTime = localDataSource.end_time.toString();
                            $scope.sTime = localDataSource.start_time.toString();
                            $scope.crimeDay = localDataSource.days.split(',');
                            $scope.crimes.IncludeSexOffenders = localDataSource.include_sex_offenders;
                        } else {
                            selectDefaultDates();
                            $scope.crimeTypes = _.chain(globalConstants.CRIME_CATEGORIES).omit('911-or-other').values().map(function (subCategorization) {
                                return _.values(subCategorization);
                            }).flatten().sortBy().value().join(',');
                            $scope.crimes.IncludeSexOffenders = false;
                            $scope.eTime = 23;
                            $scope.sTime = 0;
                            $scope.crimeDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            $scope.crimetime = [];
                        }

                        $scope.filters = {
                            include_sex_offenders: $scope.crimes.IncludeSexOffenders,
                            incident_types: $scope.crimeTypes.toString(),
                            end_date: $scope.end_date,
                            start_date: $scope.start_date,
                            end_time: $scope.eTime,
                            start_time: $scope.sTime,
                            days: $scope.crimeDay.toString()
                        };
                        $scope.dataSource = new DataSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters);
                        $scope.agencySource = new AgencySource(PLUS_CUSTOMER_AGENCY.agency_id, PLUS_CUSTOMER_AGENCY.neighbourhood_shapes || [], $scope.filters);
                        if (!$rootScope.trendSource)
                            $rootScope.trendSource = new TrendSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters, false);


                        $scope.crimetime = [];
                        $scope.arrestMade = 'No';
                        $scope.sexOffenderSelected = true;
                        $scope.otherCrimeSelected = true;
                        var def = $q.defer();
                        function URLToArray(url) {
                            var request = {};
                            var pairs = url.substring(url.indexOf('?') + 1).split('&');
                            for (var i = 0; i < pairs.length; i++) {
                                if (!pairs[i])
                                    continue;
                                var pair = pairs[i].split('=');
                                request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                            }
                            return request;
                        }
                        var agencyNamespace;
                        $scope.initMap = function () {
                            if (shapeLayerGroup) {
                                shapeLayerGroup.clearLayers();
                            }
                            shapeLayerGroup = clusterMapConfig.createShapeLayerGroup();
                            $scope.agencySource.refreshGeoJson();
                            plus_cus_id = "";
                            $rootScope.ifFilterview = false;
                            $rootScope.hideTabs = false;
                            $rootScope.previousView = false;
                            localDataSource = $localStorage['apiFilters'];
                            if (!L.mapbox.accessToken) {
                                L.mapbox.accessToken = globalConstants.accessToken;
                            }
                            if ($localStorage.position && $localStorage.location == 'user') {
                                if ($localStorage.shareUrl) {
                                    var url = $localStorage.shareUrl;
                                    var shared_from = url.indexOf('%2520');
                                    var lind = url.indexOf('/#!/dashboard?')
                                    var find = url.indexOf('agency/') + 7;
                                    if (find != 6)
                                        agencyNamespace = url.substring(find, lind);
                                    url = url.replace(/,/g, "%252C");
                                    url = url.replace(/%20/g, "%2520");
                                    var encoded = url.indexOf("Breaking%2520&%2520Entering");
                                    if (encoded > 0)
                                        url = url.replace(/Breaking%2520&%2520Entering/g, "Breaking%2520%2526%2520Entering");
                                    url = URLToArray(url);
                                    url.incident_types = url.incident_types.replace(/%26/g, "&");
                                    url.incident_types = url.incident_types.replace(/%2C/g, ",");
                                    url.incident_types = url.incident_types.replace(/%20/g, " ");
                                    url.incident_types = url.incident_types.replace(/%2526/g, "&");
                                    url.incident_types = url.incident_types.replace(/%252C/g, ",");
                                    url.incident_types = url.incident_types.replace(/%2520/g, " ");
                                    if (url.shapeGroup != undefined) {
                                        url.shapeGroup = url.shapeGroup.replace(/%20/g, " ");
                                        vm._shapeGroupName = url.shapeGroup;
                                    }
                                    if (url.shapeIds != undefined) {
                                        url.shapeIds = url.shapeIds.replace(/%2C/g, ",");
                                        url.shapeIds = url.shapeIds.replace(/%252C/g, ",");
                                        vm._shapeIds = url.shapeIds;
                                    }
                                    url.days = url.days.replace(/%2C/g, ",");
                                    url.days = url.days.replace(/%252C/g, ",");
                                    var crryuv = url.zoom;
                                    if (url.zoom > 10) {
                                        url.zoom = 8;
                                        setTimeout(function () {
                                            $scope.$emit('customFilters::changed', {include_sex_offenders: url.include_sex_offenders, incident_types: url.incident_types, end_date: url.end_date, start_date: url.start_date, end_time: url.end_time, start_time: url.start_time, days: url.days, zoom: crryuv});
                                            $scope.viewPort = {lat: url.lat, lng: url.lng, zoom: crryuv};
                                            var lat = $scope.viewPort.lat;
                                            var lang = $scope.viewPort.lng;
                                            var zoom = $scope.viewPort.zoom;
                                            Map.setView([lat, lang], zoom);
                                            setTimeout(function () {
                                            setCurrentItem(url.position_id, getMapBoxMarkerFor(url.position_id));
                                            },4000);
                                        }, 8000);
                                    }
                                    $localStorage.apiFilters = {include_sex_offenders: url.include_sex_offenders, incident_types: url.incident_types, end_date: url.end_date, start_date: url.start_date, end_time: url.end_time, start_time: url.start_time, days: url.days, zoom: url.zoom}
                                    $scope.dataSource.apiFilters = {include_sex_offenders: url.include_sex_offenders, incident_types: url.incident_types, end_date: url.end_date, start_date: url.start_date, end_time: url.end_time, start_time: url.start_time, days: url.days, zoom: url.zoom};
                                    setTimeout(function () {
                                        $scope.$emit('customFilters::changed', {include_sex_offenders: url.include_sex_offenders, incident_types: url.incident_types, end_date: url.end_date, start_date: url.start_date, end_time: url.end_time, start_time: url.start_time, days: url.days, zoom: url.zoom});
                                    }, 1000);
                                    if (shared_from == -1)
                                        $localStorage.position = {lat: url.lat, lng: url.lng, zoom: url.zoom};
                                    else
                                        $localStorage.position = {lat: url.lat, lng: url.lng, zoom: url.zoom};
                                    $scope.selecting = url.position_id;
                                    // set share url position and save for map
                                    if (url.shapeIds != undefined) {
                                        $localStorage.urlposition_id = url.position_id;
                                    }
                                }
                                setTimeout(function () {
                                    $localStorage.shareUrl = false;
                                }, 1000);
                                setTimeout(function () {
                                    $localStorage.urlposition_id = false;
                                }, 40000);
                                $scope.viewPort = $localStorage.position;
                                var lat = $scope.viewPort.lat;
                                var lang = $scope.viewPort.lng;
                                var zoom = $scope.viewPort.zoom;
                                $scope.currentZoom = zoom;
                                Map = L.mapbox.map('map', null, {
                                    attributionControl: false,
                                    zoomControl: false,
                                    tileLayer: false,
                                    minZoom: 1
                                })

                                        .setView([lat, lang], zoom);
                                new L.Control.Zoom({
                                    position: 'bottomleft'
                                }).addTo(Map);
                                L.mapbox.tileLayer('mapbox.emerald')
                                        .addTo(Map) // add your tiles to the map
                                        .on('load', finishedLoading); // when the tiles load, remove the screen


                                def.resolve();
                                $timeout(function () {
                                    updateCordinates();
                                });
                            } else if ($scope.viewPort.lat) {

                                var lat = $scope.viewPort.lat;
                                var lang = $scope.viewPort.lng;
                                var zoom = $scope.viewPort.zoom;
                                $scope.currentZoom = zoom;
                                Map = L.mapbox.map('map', null, {
                                    attributionControl: false,
                                    zoomControl: false,
                                    tileLayer: false,
                                    minZoom: 1
                                })
                                        .setView([lat, lang], zoom);
                                new L.Control.Zoom({
                                    position: 'bottomleft'
                                }).addTo(Map);
                                L.mapbox.tileLayer('mapbox.emerald')
                                        .addTo(Map) // add your tiles to the map
                                        .on('load', finishedLoading); // when the tiles load, remove the screen


                                def.resolve();
                                $timeout(function () {
                                    updateCordinates();
                                });
                            } else {
                                Map = L.mapbox.map('map', null, {
                                    attributionControl: false,
                                    zoomControl: false,
                                    tileLayer: false,
                                    minZoom: 1
                                })
                                        .setView([globalConstants.default_lat, globalConstants.default_lng], 5);
                                new L.Control.Zoom({
                                    position: 'bottomleft'
                                }).addTo(Map);
                                L.mapbox.tileLayer('mapbox.emerald')
                                        .addTo(Map) // add your tiles to the map
                                        .on('load', finishedLoading); // when the tiles load, remove the screen

                                def.resolve();
                                $timeout(function () {
                                    updateCordinates();
                                });
                                $scope.currentZoom = 5;
                            }

                            function finishedLoading() {
                            }
                            def.promise.then(function () {
                                Map.whenReady(function () {
                                    onMapReady();
                                });

                                function onMapReady() {
                                    markerClusterGroupLayer.addTo(Map);
                                    persistentMarkerClusterGroupLayer.addTo(Map);
                                    noDataMarkerClusterGroupLayer.addTo(Map);
                                    shapeLayerGroup.addTo(Map);
                                    if (object != null && $scope.showBottomCard) {
                                        var positionId = object.position.id;
                                        setCurrentItem(positionId, getMapBoxMarkerFor(positionId), object);
                                    }
                                    $timeout(function () {
                                        if ($localStorage.position)
                                            $scope.currentZoom = $localStorage.position.zoom;
                                    })

                                }

                                /**
                                 * Map Zoom functionality
                                 */

                                Map.on('zoomend', function (e) {
                                    //update the Map Bounds ...
                                    if ($scope.dataSource.dataType == "crimeClusters")
                                        markerClusterGroupLayer.clearLayers();
                                    southWest = Map.getBounds().getSouthWest();
                                    northEast = Map.getBounds().getNorthEast();
                                    bounds = L.latLngBounds(southWest, northEast);
                                    var newZoom = e.target.getZoom();
                                    $scope.currentZoom = newZoom;
                                    $timeout(function () {
                                        updateCordinates();
                                    })

                                });
                                /**
                                 * Map drag functionality
                                 */

                                Map.on('dragend', function (e) {
                                    var newNE = Map.getBounds().getNorthEast();
                                    var newSw = Map.getBounds().getSouthWest();

                                    var radius = newNE.distanceTo(Map.getCenter());
                                    var MapBounds = Map.getCenter().distanceTo($scope.viewPort.bounds.getCenter());
                                    updateCordinates();
                                    var location = null;
                                    if ($scope.clickedMarkerData.agency_id) {
                                        location = $scope.clickedMarkerData.center;
                                    } else {
                                        location = $scope.clickedMarkerData.location;
                                    }
                                    if (location != null) {
                                        var viewPortBounds = $scope.dataSource.viewportBounds
                                        if (!geometry.isPositionsWithinBounds(location, viewPortBounds)) {
                                            $scope.showBottomCard = false;
                                        }
                                    }

                                });
                            });

                        };//end of init function....on state change...
                        var previousShapeLayers = {};
                        $scope.stateChanging = false;
                        var state;
                        $scope.mapView = true;
                        $scope.$on('$stateChangeStart', function (ev, toState, toParam, fromState) {
                            $localStorage.high = 0;//for trends graph
                            $localStorage.bhigh = 0;
                            state = fromState.name;
                            if (toState.name == 'app.map')
                                $scope.mapView = true;
                            else
                                $scope.mapView = false;
                            $interval.cancel(int);
                            shapeLayerGroup.clearLayers();
                        });
                        if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
                        }
                        $scope.$on('$stateChangeSuccess', function (e, current, p, fromState) {
                            if (current.name == 'app.map') {
                                countIncidents();
                                $scope.mapView = true;
                            }
                            else {
                                $scope.mapView = false;
                                if ($rootScope.ifAgency)
                                    $rootScope.stop = true;
                            }
                            vm.fromfromState = fromState;
                            if (fromState.name == 'setlocation') {

                            }
                            $rootScope.previousView = $state.current.name;
                            $scope.showWarning = false;
                            if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {

                                analytics.trackEvent("Category", "Action", "Label", 25);
                            }
                        });
                        $scope.$on('backToDefaultMap', function (e, currentZoom) {
                            $rootScope.no_of_incidents = 0;
                            $scope.backToDefaultMap(currentZoom);
                        });
                        function selectUrlAgency() {
                            for (var i = 0; i < $scope.agencySource.viewportData.length; i++) {
                                if ($scope.agencySource.viewportData[i].namespace == agencyNamespace && !$scope.ifExploreAgency) {
                                    $scope.$emit('explore.Agency', $scope.agencySource.viewportData[i]);
                                    agencyNamespace = '';
                                }
                            }
                        }
                        // when viewPortChanges...
                        function onMapViewPortChange(params) {
                            if ($scope.dataSource.sexOffenders.length != $scope.dataSource.viewportSexOffenders.length) {
                                $scope.dataSource.viewportSexOffenders = [];
                                for (var i = 0; i < $scope.dataSource.sexOffenders.length; i++) {
                                    $scope.dataSource.viewportSexOffenders.push($scope.dataSource.sexOffenders[i].baseData);
                                }
                                $rootScope.sexOffenderViewportData = $scope.dataSource.viewportSexOffenders;
                            }

                            $scope.dataSource.updateCoordinates(params.bounds, params.zoom, function () {
                                onDataSrcData();
                                if ($scope.dataSource.dataType != "agencies")
                                    $scope.agencySource.enableAndFetchData();
                            });
                            $scope.agencySource.updateCoordinates(params.bounds, params.zoom);
                            mapState.updateBounds(params.bounds);
                            mapState.updateZoom(params.zoom);
                            $rootScope.trendSource.updateZoom(params.zoom);
                            mapState.updateMapCenter(params.center.lat, params.center.lng);
                            if ($scope.dataSource.dataType !== 'agencies') {
                                if ($scope.dataSource.isDataUpdationRequired || $scope.dataSource.dataType != 'crimes') {
                                    $rootScope.trendSource.updateCoordinates(params.bounds, function (data) {
                                        countIncidents();
                                    });
                                } else {
                                    $rootScope.trendSource.updateData($scope.dataSource.viewportData, $scope.dataSource.dataType, params.bounds, function () {
                                        countIncidents();
                                    });
                                }
                            }
                            vm.mapLoaded = true;

                            selectUrlAgency();
                        }
                        ;
                        $scope.$watchCollection('dataSource.isDataUpdationRequired', function (nd, o) {
                            countIncidents();
                        });
                        $scope.$watchCollection('agencySource.dataFetching', function (nd, o) {
                            selectUrlAgency();
                            countIncidents();
                            if (vm._shapeGroupName != undefined) {
                                $timeout(function () {
                                    vm.selectShapeGroup(vm._shapeGroupName);
                                }, 1500);
                            }
                        });
                        $scope.$watchCollection('agencySource.viewportData', function (nd, o) {
                            selectUrlAgency();

                        });
                        function countIncidents() {
                            $rootScope.no_of_incidents = 0;
                            _.each($rootScope.trendSource.historicData, function (crime) {
                                $rootScope.no_of_incidents = $rootScope.no_of_incidents + parseInt(crime.count);
                            });
                            selectUrlAgency();
                        }
                        $scope.$watchCollection('viewPort', function (n, o) {
                            if (n !== o) {
                                if (!$scope.viewPort.bounds)
                                    $scope.viewPort = $localStorage.viewPort;
                                onMapViewPortChange($scope.viewPort);

                            }
                            $localStorage.viewPort = $scope.viewPort;
                        });
                        $scope.$watchCollection('dataSource.dataFetching', function (nd, o) {
                            if (o && $scope.selecting) {
                                updateCordinates();
                                $timeout(function () {
                                    var e = getMapBoxMarkerFor($scope.selecting);
                                    if (e) {
                                        $scope.clickedMarkerData = e.position.baseData;
                                        if (!$scope.currentZoom)
                                            $scope.currentZoom = 16;
                                        if ($scope.clickedMarkerData.latitude != undefined)
                                            Map.setView([$scope.clickedMarkerData.latitude, $scope.clickedMarkerData.longitude], $scope.currentZoom);
                                        else
                                            Map.setView([e._latlng.lat, e._latlng.lng], 14);
                                        setCurrentItem($scope.selecting, e);
                                        $timeout(function () {
                                            $scope.selecting = '';
                                        }, 10000);

                                    }
                                    if ($scope.filtersDone)
                                        $scope.selecting = "";
                                }, 1500);
                            }
                            if ($scope.dataSource.dataFetching == false && vm.mapViewLoad) {
                                drawMapRegion();
                            }
                        });

                        /**
                         * Function to get data from api.
                         */
                        var spiderfyOnClusterClick;
                        var southWest, northEast, bounds;
                        $scope.clickedMarkerData = {};

                        function updateCordinates() {
                            var mapCordinates = {};
                            mapCordinates.lat = Map.getCenter().lat;
                            mapCordinates.lng = Map.getCenter().lng;
                            mapCordinates.zoom = Map.getZoom() ? Map.getZoom() : 12;
                            mapCordinates.center = Map.getCenter();
                            mapCordinates.bounds = Map.getBounds();
                            $scope.viewPort = mapCordinates;
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                            $localStorage.position = {"lat": Map.getCenter().lat, "lng": Map.getCenter().lng, "zoom": mapCordinates.zoom}
                            var viewportBounds, zoom_level;
                            southWest = Map.getBounds().getSouthWest();
                            northEast = Map.getBounds().getNorthEast();
                            viewportBounds = L.latLngBounds(southWest, northEast);
                            zoom_level = Map.getZoom();
                            mapState.updateZoom(zoom_level);
                            mapState.updateBounds(viewportBounds);
                            countIncidents();
                            $('.marker-cluster').on('click', function (e) {
                                $(this).html($(this).html().toString());
                                e.preventDefault();
                            });
                        }
                        //end of HIt Api

                        //load all components and fire api.
                        $scope.$watch(angular.bind(vm, function () {
                            return this.filtersLoaded && this.shapeFiltersLoaded && this.mapLoaded;
                        }), function (allComponentsLoaded) {
                            if (allComponentsLoaded) {
                                $scope.dataSource.enableAndFetchData();
                                $rootScope.trendSource.enableAndFetchData();
                                $scope.agencySource.enableAndFetchData();
                            }
                        });
                        vm.selectShapeGroup = function (newShapeGroupName) {
                            var oldShapeGroupName = vm.currentShapeGroupName,
                                    enabledShapeIds = _.chain(vm.currentShapeIds)
                                    .omit(function (isTrueValue) {
                                        return !isTrueValue;
                                    }).keys().without('false').value(),
                                    newShapeGroupObjects = getShapeObjects(newShapeGroupName);
                            if (newShapeGroupName === oldShapeGroupName) {
                                if (enabledShapeIds.length === newShapeGroupObjects.length && !vm.mapViewLoad) {
                                    //All selected => Unselect All
                                    vm.currentShapeIds = {};
                                } else {
                                    //Some selected => Select All
                                    selectAllShapesIn(newShapeGroupName);
                                }
                                if (vm.mapViewLoad) {
                                    vm.mapViewLoad = false;
                                }
                                return;
                            }

                            vm.currentShapeGroupName = newShapeGroupName;
                            selectAllShapesIn(newShapeGroupName);
                        };
                        //                      shape file filtering
                        function selectAllShapesIn(shapeGroupName) {
                            vm.currentShapeIds = {};
                            _.each(vm.getShapeObjects(shapeGroupName), function (shapeObj) {
                                vm.currentShapeIds[shapeObj.shape_id] = true;
                            });
                        }
                        function drawMapRegion() {
                        }
                        function getShapeObjects(shapeGroupName) {
                            return (vm.shapeGroupNameToShapesMap[shapeGroupName] || {shapes: []}).shapes;
                        }

                        $scope.$on("$ionicView.beforeEnter", function (event, data) {
                            var viewData = $ionicHistory.currentView();
                            if (vm.currentShapeGroupName != undefined && viewData.stateName == "app.map") {
                                var shapeGroupN = vm.currentShapeGroupName;
                                vm.c_shapeId = _.chain(vm.currentShapeIds)
                                        .omit(function (isTrueValue, _) {
                                            return !isTrueValue;
                                        }).keys().without('false').value();
                                vm.mapViewLoad = true;
                                vm.currentShapeGroupName = " ";
                                $timeout(function () {
                                    vm.currentShapeGroupName = shapeGroupN;
                                }, 500);
                            }
                        });
                        $scope.$watch(angular.bind(vm, function () {
                            return this.currentShapeGroupName;
                        }), function (currentShapeGroupName, oldShapeGroup) {
                            if (_.isUndefined(currentShapeGroupName) || _.isUndefined(oldShapeGroup) ||
                                    currentShapeGroupName === oldShapeGroup) {
                                return;
                            }
                            vm.currentShapeIds = {};
                            enableAllShapeForShapeGroup(currentShapeGroupName);
                        });

                        function enableAllShapeForShapeGroup(shapeGroupName) {
                            var object = vm.getShapeObjects(shapeGroupName);
                            vm.testObject = object[0];
                            _.each(vm.getShapeObjects(shapeGroupName), function (shapeObj) {
                                vm.currentShapeIds[shapeObj.shape_id] = true;
                            });
                        }

                        $scope.$watchCollection(angular.bind(vm, function () {
                            return this.currentShapeIds;
                        }), function (newShapeIds) {
                            if (_.isUndefined(newShapeIds)) {
                                return;
                            }
                            var enabledShapeIds = _.chain(newShapeIds)
                                    .omit(function (isTrueValue, _) {
                                        return !isTrueValue;
                                    }).keys().without('false').value();
                            var elements = $(angular.element(document.getElementById('map-regions')));
                            elements.find('.shape-group-selector').prop('indeterminate', false);
                            vm.currentShapeGroupIndeterminate = false;
                            var expandedShapeGroupName = (vm.currentShapeGroupName || vm.lastShapeGroupName);
                            var expandedShapeGroupClassName = $filter('className')(expandedShapeGroupName);
                            var currentShapeGroupCheckbox = elements.find('#shape-group-name-' + expandedShapeGroupClassName);

                            var currentShapeGroupObjects = getShapeObjects(expandedShapeGroupName);

                            if (vm.currentShapeGroupName === '' && enabledShapeIds.length > 0 && vm.lastShapeGroupName) {
                                vm.currentShapeGroupName = vm.lastShapeGroupName;
                            }

                            if (enabledShapeIds.length === 0 && currentShapeGroupObjects.length !== 0) {
                                // All unselected
                                vm.lastShapeGroupName = vm.currentShapeGroupName;
                                vm.currentShapeGroupName = '';
                            } else if (enabledShapeIds.length < currentShapeGroupObjects.length) {
                                // Some selected
                                currentShapeGroupCheckbox.prop('indeterminate', true);
                                vm.currentShapeGroupIndeterminate = true;
                            }

                            $timeout(function () {
                                // #TODO: Individual crimes shape filtering, server side shape filtering no implemented.
                                var shapeGroupConfig = shapeGroupNameToConfigMap[vm.currentShapeGroupName] || {},
                                        shapeGroupComputedColumn = shapeGroupConfig.computed_column || '';

                                if ($scope.dataSource.dataType === 'crimes' && _.isEmpty($scope.dataSource.shapeFilters)) {
                                    $scope.dataSource.partiallyFilterByShape(shapeGroupComputedColumn, enabledShapeIds);
                                    $rootScope.trendSource.updateData($scope.dataSource.viewportData, $scope.dataSource.dataType, $scope.dataSource.viewportBounds, function () {
                                        countIncidents();
                                    });
                                } else {
                                    var enabledShapeIdsString = _.compact(enabledShapeIds).join(',');
                                    $scope.dataSource.updateShapeFilters({
                                        shape_column: shapeGroupComputedColumn,
                                        shape_ids: enabledShapeIdsString
                                    });
                                    mapState.updateFilters($scope.dataSource.apiFilters);
                                    $rootScope.trendSource.updateShapeFilters({
                                        shape_column: shapeGroupComputedColumn,
                                        shape_ids: enabledShapeIdsString
                                    }, function () {
                                        countIncidents();
                                    });
                                }
                                if (vm._shapeIds != undefined && (vm._shapeIds.length != enabledShapeIds.length))
                                    enabledShapeIds = vm._shapeIds;
                                $scope.agencySource.showShapeGroup(vm.currentShapeGroupName, enabledShapeIds, function (n) {

                                });
                                vm.shapeFiltersLoaded = true;
                            }, 0);

                        }, true);

                        vm.getShapeObjects = function (shapeGroupName) {
                            return (vm.shapeGroupNameToShapesMap[shapeGroupName] || {
                                shapes: []
                            }).shapes;
                        };

                        vm.toggleMapRegionDropDown = function () {
                            vm.openMapRegionDropDown = !vm.openMapRegionDropDown;
                        };
                        $scope.$watch('agencySource.viewportShapes', function (n, o) {
                            if ($scope.ifExploreAgency && n) {
                                drawShapesOnMap(n);
                            }
                        });

                        function drawShapesOnMap(shapes) {
                            var existingShapeLayers = [],
                                    newShapeLayers = _.map(shapes, function (shapeObj, shapeId) {
                                        return shapeObj.layer;
                                    });

                            shapeLayerGroup.eachLayer(function (layer) {
                                existingShapeLayers.push(layer);
                            });

                            _.each(_.difference(existingShapeLayers, newShapeLayers), function (shapeLayerToRemove) {
                                shapeLayerGroup.removeLayer(shapeLayerToRemove);
                            });

                            _.each(shapes, function (shapeObj, shapeId) {
                                if (!shapeLayerGroup.hasLayer(shapeObj.layer)) {
                                    clusterMapConfig.stylePolygonShape(shapeId, shapeObj, shapeId === vm.selectedShapeId, vm.isPlusCustomerMode);
                                    shapeLayerGroup.addLayer(shapeObj.layer);
                                }
                            });
                            //if share url have map region option then it will call
                            $timeout(function () {
                                if ($localStorage.urlposition_id) {
                                    var selectedMapBoxMarker = getMapBoxMarkerFor($localStorage.urlposition_id);
                                    setCurrentItem(vm.selectedPositionId, selectedMapBoxMarker);
                                }
                            }, 2000);
                        }

                        $scope.dataSource.onData = function (_, handledCrimesLocally) {
                            if (handledCrimesLocally === true) {
                                $scope.agencySource.updateViewPortAgencies($scope.dataSource.dataType);
                            } else {
                                $scope.agencySource.onCrimeData($scope.dataSource.agencyIdsWithCrimes, $scope.dataSource.dataType);
                            }
                            selectUrlAgency();
                        }

                        function onDataSrcData() {
                            if ($scope.dataSource.dataType === 'crimeClusters') {
                                vm.mapClusterRadius = globalConstants.SERVER_CRIME_CLUSTER_RADIUS;
                                vm.spiderfyOnMapClusterClick = false;
                                $scope.showWarning = true;
                                $scope.showTrendsTab = true;
                            } else if ($scope.dataSource.dataType === 'crimes') { //Crimes
                                var zoomLevel = $scope.dataSource.zoomLevel;
                                vm.mapClusterRadius = globalConstants.INDIVIDUAL_CRIME_CLUSTER_RADIUS[zoomLevel];
                                vm.spiderfyOnMapClusterClick = true;
                                $scope.showWarning = false;
                                $scope.showTrendsTab = true;
                            } else {
                                if (!$scope.ifExploreAgency) {
                                    markerClusterGroupLayer.clearLayers();
                                    vm.spiderfyOnMapClusterClick = false;
                                }
                                $scope.showWarning = false;
                                $scope.showTrendsTab = false;
                            }
                        }
                        $scope.dataSource.onViewportDataHandledLocally = function () {
                            $scope.agencySource.updateViewPortAgencies($scope.dataSource.dataType);
                        };

                        $scope.$watch('dataSource.partialData', function (n, o) {
                            if (!$scope.listData) {
                                if (object && Object.keys(object).length >= 1) {
                                    if (object.position.category != "agency")
                                        $scope.showBottomCard = false;
                                }
                                setNewPositionsOnMap(n);
                                if ($scope.ifExploreAgency && $scope.dataSource.agencyData[0]) {
                                    var exploredAgency = $scope.dataSource.agencyData;
                                    exploredAgency[0].plus_mode = true;
                                    setNewPersistentPositionsOnMap(exploredAgency);
                                }
                                if ($rootScope.ifFilterview) {
                                    $localStorage['apiFilters'] = $scope.dataSource.filters;
                                } else {
                                    highlightSelectedPosition();
                                    $scope.dataSource.filters = $localStorage['apiFilters'];
                                }

                            }
                            $scope.listData = false;
                        });
                        $scope.$watch('agencySource.data', function (n, o) {
                            setNewPersistentPositionsOnMap(n);

                        });
                        $scope.$watch('agencySource.noDataAgency', function (n, o) {
                            if ($scope.currentZoom >= 12) {
                                setNewNoDataPositionsOnMap(n);
                            } else {
                                noDataMarkerClusterGroupLayer.clearLayers();
                            }
                        });
                        /**
                         * Create Mapbox Markers...
                         *
                         **/
                        if ($localStorage.mapClusterRadius)
                            vm.mapClusterRadius = $localStorage.mapClusterRadius;
                        else
                            vm.mapClusterRadius = 50;
                        var mapboxMarkers, agencyMarkers;
                        vm.spiderfyOnMapClusterClick = false;

                        function setNewPositionsOnMap(newPositions) {

                            mapboxMarkers = createMapboxMarkerss(newPositions);
                            if (!$scope.ifExploreAgency)
                                $localStorage.mapClusterRadius = vm.mapClusterRadius;
                            markerClusterGroupLayer.options.maxClusterRadius = vm.mapClusterRadius;
                            markerClusterGroupLayer.options.zoomToBoundsOnClick = !vm.spiderfyOnMapClusterClick;
                            markerClusterGroupLayer.on('clusterclick', onMarkerClusterClick);
                            markerClusterGroupLayer.clearLayers();
                            markerClusterGroupLayer.addLayers(mapboxMarkers);
                            highlightSelectedPosition();
                        }

                        function setNewPersistentPositionsOnMap(newPersistentPositions) {
                            agencyMarkers = createMapboxMarkerss(newPersistentPositions, 99999);
                            persistentMarkerClusterGroupLayer.clearLayers();
                            persistentMarkerClusterGroupLayer.addLayers(agencyMarkers);
                            highlightSelectedPosition();
                        }

                        function setNewNoDataPositionsOnMap(newNoDataPositions) {
                            noDataMarkerClusterGroupLayer.clearLayers();
                            noDataMarkerClusterGroupLayer.on('click', onNoDataMarkerClick);
                            noDataMarkerClusterGroupLayer.addLayers(createMapboxMarkerss(newNoDataPositions, 99999));
                        }
                        $scope.exploreAgency = false;

                        function createMapboxMarkerss(newPositions, zIndexOffset) {
                            if ($scope.exploreAgency != 2) {
                                return _.chain(newPositions).map(function (position) {
                                    if (_.isUndefined(position.location) || position.location === null) {
                                        return;
                                    }
                                    var mapboxMarker = L.marker(new L.LatLng(position.location.latitude, position.location.longitude), {
                                        clickable: true,
                                        zIndexOffset: zIndexOffset || 0
                                    });

                                    if (position.subCategory != "no-data-agency")
                                        mapboxMarker.on('click', markerClick);
                                    //mapboxMarker.on('clusterclick', onMarkerClusterClick);
                                    mapboxMarker.position = position;
                                    mapboxMarker.count = position.count;
                                    mapboxMarker.setIcon(clusterMapConfig.markerIconFor(position, false)); //false replaced $scope.ifExploreAgency


                                    //Dont know what below coding is doing. Removed the timeout that was wrapping this.
                                    if (position.plus_mode) {
                                        object = mapboxMarker;
                                        if (object != null && $scope.showBottomCard) {
                                            angular.element($(object._icon)).addClass('selected');
                                            if ($scope.exploreAgency == true)
                                                $scope.exploreAgency = 2;
                                            $scope.exploreAgency = false;
                                        }
                                    }
                                    //Removing timeout ends.

                                    return mapboxMarker;
                                }).compact().value();
                            } else
                                $scope.exploreAgency = false;
                        }

                        function onMarkerClusterClick(e) {
                            var cluster = e.layer;
                            if (vm.spiderfyOnMapClusterClick) {
                                cluster.spiderfy();
                            }
                        }

                        function propogateClickToDocumentRoot() {
                            $(document).trigger('click');
                        }

                        function onNoDataMarkerClick(e) {
                            var mapboxMarker = e.layer,
                                    position = mapboxMarker.position;
                            $state.go('app.agencySubmission');
                            $rootScope.$emit('submitAgency', position.baseData);
                        }

                        function highlightSelectedPosition() {

                            var selectedMapBoxMarker = getMapBoxMarkerFor(vm.selectedPositionId);
                            if (!_.isUndefined(selectedMapBoxMarker)) {
                                setCurrentItem(vm.selectedPositionId, selectedMapBoxMarker);
                            }
                        }

                        /**
                         * Marker Click functionality
                         */

                        var backbutton = false;
                        $scope.mapCardTitle = '';
                        var object = null;
                        $scope.showBottomCard = false;
                        var plus_cus_id;
                        $scope.closing = false;

                        function markerClick(e) {
                            // registering back button ...
                            angular.element($('.leaflet-marker-icon')).removeClass('selected');

                            if (!$scope.closing) {
                                backbutton = $ionicPlatform.registerBackButtonAction(function (event) {
                                    event.preventDefault();
                                }, 200);
                                listMarker = null;
                                $scope.clickedMarkerData = e.target.position.baseData;
                                $scope.clickedMarkerData.meta = e.target.position.meta;
                                var incident_id = $scope.clickedMarkerData.incident_id ? $scope.clickedMarkerData.incident_id : $scope.clickedMarkerData.sex_offender_id;
                                $localStorage.clickedMarker = incident_id;
                                var positionId = e.target.position.id;
                                vm.selectedPositionId = positionId;
                                setCurrentItem(positionId, getMapBoxMarkerFor(positionId), e.target);
                                if (e.target.position.type == "agency") {
                                    _.each($scope.agencySource.viewportShapes, function (shape, shape_id) {

                                        if (shape_id === $scope.clickedMarkerData.agency_id) {
                                            vm.selectedShapeId = shape_id;
                                            shapeLayerGroup.clearLayers();
                                            drawShapeFileforAgency(shape, shape_id);
                                        }

                                    });

                                    //explore Agency click functionality

                                    if ($scope.clickedMarkerData.plus_enabled && !$scope.ifExploreAgency) {
                                        if (plus_cus_id === $scope.clickedMarkerData.agency_id) {
                                            $scope.$emit('explore.Agency', $scope.clickedMarkerData)
                                            plus_cus_id = "";
                                        } else {
                                            plus_cus_id = $scope.clickedMarkerData.agency_id;
                                        }
                                    }
                                } else if (e.target.position.type == "cluster") {
                                    Map.setView([e.latlng.lat, e.latlng.lng], Map.getZoom() + 2)
                                }
                            } else
                                $scope.closing = false;
                        }

                        function drawShapeFileforAgency(shape, shapeId) {
                            var shapeObj = shape,
                                    shapeLayer = shapeObj.layer;
                            clusterMapConfig.stylePolygonShape(shapeId, shapeObj, shapeId === vm.selectedShapeId, vm.isPlusCustomerMode);

                            previousShapeLayers[shapeId] = shapeLayer;
                            shapeLayerGroup.addLayer(shapeLayer);
                            shapeLayerGroup.addTo(Map);
                        }

                        function getMapBoxMarkerFor(positionId) {
                            return _.find(markerClusterGroupLayer.getLayers(), function (mapboxMarker) {
                                return mapboxMarker.position.id === positionId;
                            }) || _.find(persistentMarkerClusterGroupLayer.getLayers(), function (mapboxMarker) {
                                return mapboxMarker.position.id === positionId;
                            });
                        }

                        function setCurrentItem(positionId, mapboxMarker) {
                            angular.element($('.selected')).removeClass('selected');
                            if (object != null) {
                                angular.element($(object._icon)).removeClass('selected');
                            }

                            var parentMarker = markerClusterGroupLayer.getVisibleParent(mapboxMarker);

                            if (parentMarker !== mapboxMarker && !_.isUndefined(parentMarker) && parentMarker !== null &&
                                    mapboxMarker.position.type !== 'agency' && vm.spiderfyOnMapClusterClick) {
                                parentMarker.spiderfy();
                            } else if (markerClusterGroupLayer._spiderfied &&
                                    !_.contains(markerClusterGroupLayer._spiderfied.getAllChildMarkers(), mapboxMarker)) {
                                markerClusterGroupLayer._spiderfied.unspiderfy();
                            }
                            $timeout(function () {
                                $scope.showBottomCard = true;
                                if (mapboxMarker) {
                                    if (mapboxMarker.position.type != "cluster") {
                                        if (mapboxMarker._icon) {
                                            angular.element($(mapboxMarker._icon)).addClass('selected');
                                        } else {
                                            $timeout(function () {
                                                angular.element($(mapboxMarker._icon)).addClass('selected');
                                            }, 300);
                                        }
                                    }
                                } else{
                                    angular.element($('.selected')).removeClass('selected');
                                    $timeout(function () {
                                        $('.marker-id-'+positionId).addClass('selected');
                                    },300);
                                }
                            }, 300);

                            object = mapboxMarker;
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }

                        }

                        var listMarker = null;
                        $rootScope.$on('list.data', function (event, data) {
                            $timeout(function () {
                                angular.element($('.leaflet-marker-icon')).removeClass('selected');
                            }, 200);
                            $timeout(function () {
                                var message = data.data;
                                var zoom = data.zoom;
//                                if ($scope.currentZoom <= 16)
//                                    zoom = $scope.currentZoom;
                                $scope.listData = true;
                                $scope.clickedMarkerData = {};
                                $scope.shownDiv = false;
                                $scope.clickedMarkerData = message;
                                var positionId = message.primary_key;
                                setCurrentItem(positionId, getMapBoxMarkerFor(positionId));
                                if ($scope.clickedMarkerData.incident_id) {
                                    $rootScope.showAgencydetails = false;
                                    var lat, lng;
                                    if ($scope.clickedMarkerData.incident_id) {
                                        lat = message.location.coordinates[1];
                                        lng = message.location.coordinates[0];
                                    } else {
                                        lat = message.latitude;
                                        lng = message.longitude;
                                    }
                                    $timeout(function () {
                                        Map.setView([lat, lng], zoom);
                                    });

                                } else if (message.location) {
                                    var Alat = message.location.coordinates[1],
                                            Alng = message.location.coordinates[0];
                                    $timeout(function () {
                                        Map.setView([Alat, Alng], zoom);

                                    });
                                } else {
                                    var Alat = message.center.coordinates[1],
                                            Alng = message.center.coordinates[0];
                                    $timeout(function () {
                                        Map.setView([Alat, Alng], zoom);

                                    });
                                }
                                updateCordinates();
                            }, 300);

                        });

                        $scope.closeCard = function () {
                            $localStorage.listViewCrimeClickDataForMap = false;
                            $localStorage.clickedMarker = false;
                            $scope.closing = true;
                            $timeout(function () {
                                $scope.closing = false;
                            }, 500);
                            $scope.shownDiv = false;
                            vm.selectedPositionId = null;
                            vm.openMapRegionDropDown = false;
                            plus_cus_id = !plus_cus_id;
                            $scope.previousSearch = [];
                            $scope.clickedMarkerData = {};
                            if (backbutton) {
                                backbutton(); //distroying the back button....
                            }
                            $scope.showBottomCard = false;
                            if (object != null) {
                                angular.element($(object._icon)).removeClass('selected');
                            }
                            var shapeObjLen = Object.keys(previousShapeLayers).length;
                            if (shapeObjLen > 0 && !$scope.ifExploreAgency && shapeLayerGroup) {
                                shapeLayerGroup.removeLayer(previousShapeLayers[vm.selectedShapeId]);
                            }
                            if (int)
                                $interval.cancel(int);
                        };

                        $rootScope.$on('sharetipFromListView', function (e, item) {
                            $scope.shareTip(item)
                        })
                        //share Tip and submit Tip...

                        $scope.shareTip = function (item) {
                            var shapeObj = vm.currentShapeIds;
                            var shapeArray = [];
                            angular.forEach(shapeObj, function (value, key) {
                                if (value)
                                    shapeArray[key] = value;

                            });
                            var _shapeIds = Object.keys(shapeArray);
                            var _shapeGroupName = vm.currentShapeGroupName;
                            var site_url = globalConstants.SITE_URL,
                                    share_url = formatUrl(site_url, item, _shapeIds, _shapeGroupName);
                            if (window.plugins && window.plugins.socialsharing) {
                                window.plugins.socialsharing.share(null, null, null, share_url);
                            }
                        };

                        // Encoded URL for share
                        function formatUrl(site_url, item, shapeIds, shapeGroupName) {
                            $scope.filters = $localStorage['apiFilters'];
                            var abc, base;
                            if ($scope.ifExploreAgency) {
                                base = '/agency/' + PLUS_CUSTOMER_AGENCY.namespace;
                            } else
                                base = '/home';
                            if (item.location) {
                                if (shapeIds.length == 0)
                                    abc = site_url + base + '/#!/dashboard?incident_types=' + $scope.filters.incident_types + '&start_date=' + $scope.filters.start_date + '&end_date=' + $scope.filters.end_date +
                                            '&days=' + $scope.filters.days + '&start_time=' + $scope.filters.start_time + '&end_time=' + $scope.filters.end_time +
                                            '&lat=' + item.location.coordinates[1] + '&lng=' + item.location.coordinates[0] +
                                            '&include_sex_offenders=' + $scope.filters.include_sex_offenders +
                                            '&zoom=' + $scope.currentZoom + '&position_id=' + item.primary_key + '&shape_id=false';
                                else
                                    abc = site_url + base + '/#!/dashboard?incident_types=' + $scope.filters.incident_types + '&start_date=' + $scope.filters.start_date + '&end_date=' + $scope.filters.end_date +
                                            '&days=' + $scope.filters.days + '&start_time=' + $scope.filters.start_time + '&end_time=' + $scope.filters.end_time +
                                            '&lat=' + item.location.coordinates[1] + '&lng=' + item.location.coordinates[0] +
                                            '&include_sex_offenders=' + $scope.filters.include_sex_offenders + '&shapeIds=' + shapeIds +
                                            '&zoom=' + $scope.currentZoom + '&position_id=' + item.primary_key + '&shapeGroup=' + shapeGroupName;
                            } else {
                                if (shapeIds.length == 0)
                                    abc = site_url + base + '/#!/dashboard?incident_types=' + $scope.filters.incident_types + '&start_date=' + $scope.filters.start_date + '&end_date=' + $scope.filters.end_date +
                                            '&days=' + $scope.filters.days + '&start_time=' + $scope.filters.start_time + '&end_time=' + $scope.filters.end_time +
                                            '&lat=' + item.lat + '&lng=' + item.lng + '&include_sex_offenders=' + $scope.filters.include_sex_offenders +
                                            '&zoom=' + item.zoom + '&shape_id=false';
                                else
                                    abc = site_url + base + '/#!/dashboard?incident_types=' + $scope.filters.incident_types + '&start_date=' + $scope.filters.start_date + '&end_date=' + $scope.filters.end_date +
                                            '&days=' + $scope.filters.days + '&start_time=' + $scope.filters.start_time + '&end_time=' + $scope.filters.end_time +
                                            '&lat=' + item.lat + '&lng=' + item.lng + '&include_sex_offenders=' + $scope.filters.include_sex_offenders + '&shapeIds=' + shapeIds +
                                            '&zoom=' + item.zoom + '&shapeGroup=' + shapeGroupName;
                            }
                            return encodeURI(abc);
                        }


                        $scope.submitTip = function (AgencyID, Case) {
                            window.open("https://www.tipsubmit.com/WebTips.aspx?AgencyID=" + AgencyID + "&case=" + Case, '_blank', 'location=no');
                        };
                        $scope.submitTipAgency = function (AgencyID) {
                            window.open("https://www.tipsubmit.com/WebTips.aspx?AgencyID=" + AgencyID, '_blank', 'location=no');
                        }
                        $scope.centerOnMap = function (incident) {
                            if ($scope.currentZoom <= 16)
                                var zoom = 16;
                            else
                                zoom = $scope.currentZoom;
                            Map.setView([incident.latitude, incident.longitude], zoom);
                            updateCordinates();
                        };
                        $scope.visitTwitterOrFacebookPage = function (url) {
                            window.open(url, '_system');
                        };
                        /*
                         * toggle Map Card...
                         */
                        $scope.shownDiv = false;
                        $scope.toggleGroup = function (index) {
                            if ($scope.shownDiv) {
                                $scope.shownDiv = false;
                            } else {
                                $scope.shownDiv = true;
                            }
                        };
                        $scope.isGroupShown = function (group) {
                            return $scope.shownGroup === group;
                        };
                        $rootScope.openFilters = function () {
                            //always close card when opening filters
                            if ($rootScope.ifFilterview) {
                                $rootScope.ifFilterview = false;
                                if ($ionicHistory.backView() === null) {
                                    $state.go('app.map');
                                } else {
                                    $ionicHistory.goBack();
                                }
                            } else {
                                $rootScope.ifFilterview = true;
                                $state.go('app.filter');
                            }
                        };
                        $scope.showFilters = false;
                        $scope.$watch('currentZoom', function (n, o) {
                            $timeout(function () {
                                if ($scope.ifExploreAgency) {
                                    $scope.showFilters = true;
                                } else {
                                    if (n >= 12) {
                                        $scope.showFilters = true;
                                    } else {
                                        $scope.showFilters = false;
                                    }
                                }
                            }, 500);
                        });

                        $rootScope.test = {
                            myFromDate: '',
                            myToDate: ''
                        };
                        $rootScope.dateLimits = setDateLimits('free users');
                        var plusCustomerConfig;
                        var int = '';
                        $scope.$watch('ifExploreAgency', function (n, o) {
                            if (n == true) {
                                int = $interval(function () {
                                    angular.element($('.icon-agency')).addClass('selected');
                                }, 1000);

                            } else {
                                $interval.cancel(int);
                                angular.element($('.icon-agency')).removeClass('selected');

                            }
                        })
                        $rootScope.$on('explore.Agency', function (e, item) {
                            $localStorage.exploreAgency = {
                                agencyId: item.agency_id,
                                agencyName: item.agency_name
                            }
                            $localStorage.partialCategoryFilter = '';
                            $scope.exploreAgency = true;
                            $scope.showWarning = false;
                            var plusCustomerMessageDataFromApi = api.getMessage(item.agency_id);

                            plusCustomerMessageDataFromApi.then(function (data) {
                                CURRENT_AGENCY = data.data;
                                plusCustomerMetaConfig = CURRENT_AGENCY.agencies[0];
                                $localStorage.plusCustomerMeta = plusCustomerMetaConfig;
                                $scope.plusCustomerMessageDetails = {
                                    messageTitle: plusCustomerMetaConfig.message_title || 'A Message from ' + CURRENT_AGENCY.agency_name + ' Chief',
                                    message: plusCustomerMetaConfig.message,
                                    detailedMessage: plusCustomerMetaConfig.detailed_message,
                                    messageImage: plusCustomerMetaConfig.image,
                                    twitterAppId: plusCustomerMetaConfig.twitter_app_id
                                };
                                if (!plusCustomerMetaConfig.shapes)
                                    return;
                                _.each(JSON.parse(plusCustomerMetaConfig.shapes), function (shapeGroupConfig) {
                                    shapeGroupNameToConfigMap[shapeGroupConfig.name] = shapeGroupConfig;
                                    vm.shapeGroupNames.push(shapeGroupConfig.name);
                                });

                            }).finally(function () {
                                $timeout(function () {
                                    if ($scope.ifExploreAgency) {
                                        $scope.clickedMarkerData = item;
                                        $scope.showBottomCard = true;
                                    }
                                }, 900);
                            });
                            angular.element($('.icon-agency')).addClass('selected');
                            $scope.showFilters = true;
                            $rootScope.dateLimits = setDateLimits('plus users');
                            $scope.ifExploreAgency = true;
                            $rootScope.ifAgency = true;
                            $scope.exploreAgencyName = item.agency_name;
                            markerClusterGroupLayer.clearLayers();
                            persistentMarkerClusterGroupLayer.clearLayers();
                            shapeLayerGroup.clearLayers();
                            PLUS_CUSTOMER_AGENCY = item;
                            $scope.dataSource = new DataSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters, true);
                            $rootScope.trendSource = new TrendSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters, true);
                            $scope.agencySource = new AgencySource(PLUS_CUSTOMER_AGENCY.agency_id, PLUS_CUSTOMER_AGENCY.neighbourhood_shapes || [], $scope.filters);

                            var lat = item.center.coordinates[1],
                                    lng = item.center.coordinates[0],
                                    zoom = 12;
                            $timeout(function () {
                                vm.zoomLevelBeforePlusAgencyExplore = $scope.currentZoom;
                                Map.setView([lat, lng], $scope.currentZoom);
                                updateCordinates();
                            });

                            var obj = {
                                mode: true,
                                agency_id: item.agency_id,
                                agency_name: item.agency_name
                            };
                            vm.selectedShapeId = item.agency_id;
                            mapState.setExploreAgencyMode(obj);
                            var default_shape_index = 0;
                            vm.currentShapeGroupName = vm.shapeGroupNames[default_shape_index];
                            $scope.agencySource.onShapeGroupLoad = function (shapeGroups) {
                                vm.shapeGroupNameToShapesMap = {};
                                _.each(shapeGroups, function (shapeGroup) {
                                    vm.shapeGroupNameToShapesMap[shapeGroup.name] = shapeGroup;
                                });
                                vm.shapeGroupsLoaded = true;
                            };
                            $scope.clickedMarkerData = {};
                            $scope.shownDiv = false;
                            $timeout(function () {
                                $scope.clickedMarkerData = item;
                                $scope.showBottomCard = true;
                            });

                        });

                        $scope.backToDefaultMap = function (currentZoom) {
                            $rootScope.stop = false;

                            $localStorage.partialCategoryFilter = '';
                            if ($state.current.name !== 'app.map') {
                                $state.go('app.map');
                            }
                            vm.shapeGroupNames = ['City Boundaries'];
                            vm.currentShapeIds = {};
                            $rootScope.dateLimits = setDateLimits('free users');
                            shapeLayerGroup.clearLayers();
                            $scope.ifExploreAgency = false;
                            $rootScope.ifAgency = false;
                            $scope.closeCard();
                            PLUS_CUSTOMER_AGENCY = {};
                            $scope.dataSource = new DataSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters, false);
                            $rootScope.trendSource = new TrendSource(PLUS_CUSTOMER_AGENCY.agency_id, $scope.filters);
                            $scope.agencySource = new AgencySource(PLUS_CUSTOMER_AGENCY.agency_id, PLUS_CUSTOMER_AGENCY.neighbourhood_shapes || [], $scope.filters);
                            var zoom = vm.zoomLevelBeforePlusAgencyExplore || 11;
                            $timeout(function () {
                                Map.setZoom(zoom);
                            });
                            mapState.setExploreAgencyMode({});
                            updateCordinates();
                            if ($scope.currentZoom < 12)
                                $scope.showFilters = false;
                            else
                                $scope.showFilters = true;
                        };

                        $scope.goBack = function () {
                            if ($ionicHistory.backView() == null) {
                                $state.go('app.map');
                            } else {
                                $ionicHistory.goBack();
                            }
                        };

                        function setDateLimits(mode) {
                            var date = new Date();
                            var dateLimits = {
                                minDate: '',
                                maxDate: ''
                            };
                            if (mode === 'free users') {
                                //set 6 month
                                dateLimits.minDate = moment(date.setMonth(date.getMonth() - 6)).format('MM/DD/YYYY');
                                dateLimits.maxDate = moment(new Date()).format('MM/DD/YYYY');
                            } else {
                                //set 2 years
                                dateLimits.minDate = moment(date.setMonth(date.getMonth() - 24)).format('MM/DD/YYYY');
                                dateLimits.maxDate = moment(new Date()).format('MM/DD/YYYY');
                            }
                            return dateLimits;
                        }

                        //tabs functionality

                        $scope.listview = function () {
                            var incident_id = $scope.clickedMarkerData.incident_id ? $scope.clickedMarkerData.incident_id : $scope.clickedMarkerData.sex_offender_id;
                            $state.go('app.list', {dataid: incident_id});
                        };

                        $scope.goToMapView = function () {
                            if ($localStorage.listViewCrimeClickDataForMap) {
                                var data = $localStorage.listViewCrimeClickDataForMap,
                                        zoom = 16;
                                $state.go('app.map');
                                $timeout(function () {
                                    $rootScope.$emit('list.data', {data: data, zoom: zoom});
                                    $localStorage.clickedMarker = data.incident_id;
                                    $localStorage.listViewCrimeClickDataForMap = false;
                                }, 200);
                            } else {
                                $state.go('app.map');
                            }
                        };
                        $scope.goToListView = function () {
                            $state.go('app.list');
                            if ($scope.currentZoom >= 12)
                                $rootScope.$emit('toggle-tabs', true);
                        };
                        $scope.goToTrendsView = function () {
                            $state.go('app.trends');
                        };

                        $scope.goToSearchView = function () {
                            $state.go('app.search');

                        };
                        $scope.goToAgency = function (url) {
                            var backUrl = url;
                            if (url[0] != 'h') {
                                url = "http://" + url;
                            }
                            var status = 0;
                            var ref = cordova.InAppBrowser.open(url, '_system', 'location=yes,hidden=yes');
                            ref.addEventListener('loaderror', function (event) {
                                status = 1;
                                ref.close();
                                backUrl = "https://" + backUrl;
                                $timeout(function () {
                                    cordova.InAppBrowser.open(backUrl, '_blank', 'location=yes');
                                }, 1000)
                            });
                            ref.addEventListener('loadstart', function (event) {
                                status = 2;
                                $timeout(function () {
                                    if (status != 1)
                                        ref.show();
                                }, 1000)

                            });
                        };

                        $scope.stateSexoffenderRegistry = function (url) {
                            window.open(url, '_blank', 'location=yes');
                        };

                        $scope.isFieldPresent = function (field) {
                            if(_.isUndefined(field) || _.isEmpty(field) || _.isNull(field)) {
                                return false;
                            } else {
                                return true;
                            }
                        };
                    });
})();