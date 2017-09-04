(function () {
    'use strict';
    angular.module('crimeApp').directive('listView', listView);

    function listView($timeout, $location, $sce, $http, $ionicModal, $state, $localStorage, $ionicScrollDelegate, $rootScope, globalConstants, PLUS_CUSTOMER_AGENCY, api, Alertuser) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'incId': '=incid'
            },
            templateUrl: 'component/list/list-view-tmpl.html',
            bindToController: {
                agencyData: '=',
                viewportData: '=',
                crimesType: '=',
                agencyInvolved: '=',
                involvedAgencies: '=',
                exploreAgencyMode: '=',
                crimesLoading: '=',
                zoomLevel: '=',
                noOfIncidents: '=',
                exploreAgencyName: '=',
                ifLoading: '=',
                startDate: '=',
                endDate: '=',
                userSelection: '=',
                plusCustomerMessageData: '=',
                isTrendsLoading: '=',
                historicData: '=',
                urlParams: '=',
                incId: '='
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'listView'
        };
        function controllerFn() {
        }

        function linkFn($scope, $element, $attrs, ctrl) {
            var vm = ctrl,
                    normalAgencies = [],
                    featuredAgencies = [],
                    leftfeaturedAgencies = 0,
                    itemsAdded = 0,
                    sortedCrimes = [],
                    itemslimit = 10,
                    startIndex = 0,
                    lastIndex = itemslimit,
                    sortAlpha = {
                        name: 'Name A-Z',
                        type: 'alpha'
                    },
            sortAlphaReverse = {
                name: 'Name Z-A',
                type: 'alpha',
                reverse: true
            },
            sortByNewToOld = {
                name: 'Date (most recent first)',
                type: 'date',
                reverse: true
            },
            sortByOldToNew = {
                name: 'Date (oldest first) ',
                type: 'date'
            },
            sortByIncident = {
                name: 'Incident Type A-Z',
                type: 'category'
            },
            sortByIncidentReverse = {
                name: 'Incident Type Z-A',
                type: 'category',
                reverse: true
            };
            if (!$rootScope.ifAgency || $rootScope.ifAgency == undefined) {
                vm.submit_Tip = true;
            } else {
                vm.submit_Tip = false;
            }
            if ($localStorage.partialCategoryFilter)
                vm.partialCategoryFilter = $localStorage.partialCategoryFilter;
            vm.onChartSelect = function (crimeCategory) {
                vm.partialCategoryFilter = crimeCategory;
                $localStorage.partialCategoryFilter = vm.partialCategoryFilter;
                $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', crimeCategory);
            };
            vm.resetPartialCategoryFilter = function () {
                vm.partialCategoryFilter = '';
                $localStorage.partialCategoryFilter = '';
                $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', null);
            };
            vm.sortOptions = [sortAlpha, sortAlphaReverse, sortByNewToOld, sortByOldToNew, sortByIncident, sortByIncidentReverse];
            vm.currentSortOption = sortByNewToOld;
            vm.normalAgencyPositions = [];
            vm.featuredAgencyPositions = [];
            vm.sortedCrimePositions = [];
            vm.canLoadmoreData = true;

            //Body Worn Camera Video Implementation
            vm.openVideoModal = openVideoModal;
            function openVideoModal(videoLinks, crimePosition) {
                vm.videoLink = videoLinks;
                vm.crimePositionVideo = crimePosition;
                vm.incidentVideoLinks = [];
                vm.videoTime = [];
                for (var i = 0; i < videoLinks.length; i++) {
                    var obj = {
                        "video_start_time": "00:00",
                        "video_end_time": "00:00"
                    };
                    vm.videoTime.push(obj);
                }
                vm.agencyName = $localStorage.exploreAgency.agencyName || 'Police Department';
                if (crimePosition == undefined)
                    vm.incidentId = $scope.incId;
                else
                    vm.incidentId = crimePosition.incident_id;
                _.each(videoLinks, function (link) {
                    var url = $sce.trustAsResourceUrl(link);
                    vm.incidentVideoLinks.push({trustedResourceUrl: url, videoUrl: link, timer: vm.videoTime});
                });
                vm.userDetails = {preferred_response_method: 'email'};
                vm.responseMethods = [{name: 'Email', value: 'email'}, {name: 'Phone', value: 'phone'}];
                vm.videoDetails = {};
                vm.showReqestForm = false;
                vm.disableFootageReq = false;
                $ionicModal.fromTemplateUrl('component/ui/video/incident-video-links-modal-tmpl.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();

                });
                $timeout(function () {
                    LoadVideoPlayer();
                }, 1000);
            }
            //open video model again if state from signIn
            $timeout(function () {
                if ($localStorage.fromState) {
                    if ($localStorage.fromState == 'listViewVideo') {
                        if ($localStorage.listViewVideoLink) {
                            openVideoModal($localStorage.listViewVideoLink, $localStorage.listViewCrimePositionVideo)
                        }
                    }
                    $timeout(function () {
                        $localStorage.fromState = false;
                        $localStorage.listViewVideoLink = false;
                        $localStorage.listViewCrimePositionVideo = false;
                    }, 2000)
                }
            }, 1500);

            var openRequestForm = false;
            vm.LoadVideoPlayer = function (index) {
                LoadVideoPlayer(index);
            }
            function openRequestFormProcess() {
                if ($rootScope.Loggeduser.UserName != "") {
                    $ionicScrollDelegate.scrollTop();
                    if (openRequestForm) {
                        vm.showReqestForm = true;
                    } else {
                        return;
                    }
                } else {
                    $scope.modal.hide();
                    $scope.modal.remove();
                    vm.showReqestForm = false;
                    $state.go('app.signin');
                    $localStorage.fromState = 'listViewVideo';
                    $localStorage.listViewVideoLink = vm.videoLink;
                    $localStorage.listViewCrimePositionVideo = vm.crimePositionVideo;
                }
            }

            function LoadVideoPlayer(index) {
                var options = {
                    width: 560,
                    height: 360,
                    'controls': true,
                    'controlBar': {'volumeMenuButton': false}
                };
                if (index == undefined) {
                    index = 1;
                }
                var id = 'my-video' + index;
                // custom slider implentation
                videojs(document.getElementById(id), options, function () {
                    var player = this;
                    $('.vjs-progress-control').append('<div class="vjs-custom-range-slider"><div class="slider-instance"></div></div>');
                    onLoadComplete(player.duration());
                    this.on('loadedmetadata', function () {
                        onLoadComplete(player.duration());
                    });
                });

                function secondsToTime(secs) {
                    var pad = '00';
                    var hours = Math.floor(secs / (60 * 60)),
                            divisor_for_minutes = secs % (60 * 60),
                            minutes = Math.floor(divisor_for_minutes / 60) + '',
                            divisor_for_seconds = divisor_for_minutes % 60,
                            seconds = Math.ceil(divisor_for_seconds) + '',
                            timeStr = hours > 0 ? hours + ':' : '';
                    return timeStr += timeStr + pad.substring(0, pad.length - minutes.length) + minutes + ':' + pad.substring(0, pad.length - seconds.length) + seconds;
                }

                function onLoadComplete(duration) {
                    if (duration === 0) {
                        return;
                    } else {
                        vm.videoTime[index - 1].video_start_time = secondsToTime(0);
                        vm.videoTime[index - 1].video_end_time = secondsToTime(duration);
                        $scope.$apply();
                    }
                    var selector = '#my-video' + index + ' .slider-instance';
                    if (selector != undefined) {
                        $(selector).slider({
                            min: 0,
                            max: duration,
                            step: 0.1,
                            range: true,
                            tooltip: 'hide',
                            grid: true,
                            value: [0, duration]
                        }).on('change', function (change) {
                            vm.videoTime[index - 1].video_start_time = secondsToTime(change.value.newValue[0]);
                            vm.videoTime[index - 1].video_end_time = secondsToTime(change.value.newValue[1]);
                            $scope.$apply();
                        });
                    }
                }

            }

            vm.openRequestForm = function (videoUrl) {
                openRequestForm = true;
                openRequestFormProcess();
                vm.videoDetails.video_url = videoUrl;
            };

            vm.backToVideos = function () {
                vm.showReqestForm = false;
                LoadVideoPlayer();
            };

            vm.submitFootageRequest = function () {
                vm.disableFootageReq = true;
                var site_url = globalConstants.SITE_URL;
                $http.post(site_url + '/bodycam_footage_request', {
                    agency_id: $localStorage.exploreAgency.agencyId,
                    video_details: vm.videoDetails,
                    incident_details: {incident_id: vm.incidentId},
                    user_details: vm.userDetails
                }).then(function (result) {
                    vm.disableFootageReq = false;
                    Alertuser.alert('Your video footage has been submitted.');
                    $scope.modal.hide();
                    $scope.modal.remove();
                }, function () {
                    vm.disableFootageReq = false;
                    Alertuser.alert('Request Cannot be processed, Please try again or contact administrator.');
                });
            };

            vm.startVideo = function (shareUrl) {
                if (shareUrl && window.plugins && window.plugins.streamingMedia) {
                    window.plugins.streamingMedia.playVideo(shareUrl);
                    var options = {
                        successCallback: function () {
                        },
                        errorCallback: function (errMsg) {
                            console.log("Error! " + errMsg);
                        },
                        orientation: 'landscape'
                    };
                    window.plugins.streamingMedia.playVideo(shareUrl, options);
                }
            };
            function getIncidentVideos(agency_id, crimePosition) {
                vm.isVidoesLoading = true;
                vm.crimePosition = crimePosition;
                var incident_id = crimePosition.incident_id;
                var ins = api.getIncidentVideoLinks(agency_id, incident_id);

                ins.then(function (data) {
                    vm.isVidoesLoading = false;
                    vm.incidentVideoLinks = data.data;
                });
            }
            vm.close = function () {
                if ($rootScope.ifAgency) {
                    vm.isVidoesLoading = true;
                    var ins = api.getIncidentVideoLinks($localStorage.exploreAgency.agencyId, vm.incidentId);

                    ins.then(function (data) {
                        vm.isVidoesLoading = false;
                        vm.incidentVideoLinks = data.data;
                    });
                }
                $scope.modal.hide();
                $scope.modal.remove();
                $timeout(function () {
                    // Incident highlight in listView
                    $location.hash($scope.incId);
                    var handle = $ionicScrollDelegate.$getByHandle('content');
                    handle.anchorScroll(true);
                }, 500);
            };
            // End- Body Worn Camera Video Implementation

            if (vm.plusCustomerMessageData) {

                vm.plusCustomerMessageData_image = vm.plusCustomerMessageData.messageImage;
                vm.plusCustomerMessageData_message_title = vm.plusCustomerMessageData.messageTitle;
                vm.plusCustomerMessageData_message = vm.plusCustomerMessageData.message;
                vm.plusCustomerMessageData_detailed_message = vm.plusCustomerMessageData.detailedMessage;
                vm.twitterAppId = vm.plusCustomerMessageData.twitterAppId;
            }

            $rootScope.$on('toggle-tabs', function (e, data) {
                if (vm.incidentActive) {
                    vm.agencyActive = data;
                    vm.incidentActive = false;
                } else {
                    vm.incidentActive = data;
                    vm.agencyActive = false;
                }
            });

            $scope.$watchCollection(angular.bind(vm, function () {
                var data = [];
                if (this.agencyInvolved.length) {
                    _.each(this.agencyInvolved, function (agency) {
                        data.push(agency.baseData);
                    });
                    return data;
                } else if (this.agencyData.viewportData.length) {
                    return this.agencyData.viewportData;
                } else if ($rootScope.ifAgency) {

                    return this.agencyData.data;
                }
            }), onNewAgencyPositions);

            function onNewAgencyPositions(agencyPositions) {
                var featuredAgencyPositions = [],
                        normalAgencyPositions = [];
                if (!agencyPositions)
                    agencyPositions = [];
                if (!_.isUndefined(agencyPositions[0])) {
                    _.each(agencyPositions, function (agencyPosition) {
                        if (agencyPosition.plus_enabled) {
                            agencyPosition.agency_url = formattedUrl(agencyPosition.agency_url);
                            agencyPosition.facebook_url = formattedUrl(agencyPosition.facebook_url);
                            agencyPosition.twitter_url = formattedUrl(agencyPosition.twitter_url);
                            featuredAgencyPositions.push(agencyPosition);
                        } else {
                            if (agencyPosition.baseData != undefined) {
                                featuredAgencyPositions.push(agencyPosition.baseData);
                            } else {
                                normalAgencyPositions.push(agencyPosition);
                            }
                        }
                    });
                }
                featuredAgencies = _.sortBy(featuredAgencyPositions, agencySorter);
                normalAgencies = _.sortBy(normalAgencyPositions, agencySorter);
                if (vm.crimesType != 'agencies') {
                    vm.featuredAgencyPositions = featuredAgencies;
                    vm.normalAgencyPositions = normalAgencies;
                } else {
                    if (featuredAgencies.length >= 20) {
                        startIndex = 0, lastIndex = 20;
                        vm.featuredAgencyPositions = featuredAgencies.slice(startIndex, lastIndex);
                        leftfeaturedAgencies = featuredAgencies.length - lastIndex > 0 ? featuredAgencies.length - lastIndex : 0;
                    } else {
                        vm.featuredAgencyPositions = featuredAgencies;
                        startIndex = 0, lastIndex = 20 - featuredAgencies.length;
                        vm.normalAgencyPositions = normalAgencies.slice(startIndex, lastIndex);
                    }
                    vm.canLoadmoreData = vm.normalAgencyPositions.length + vm.featuredAgencyPositions.length == 20 ? true : false;
                    itemsAdded = 20;
                }
                $ionicScrollDelegate.$getByHandle('content').resize();
            }

            if (!_.isEmpty(vm.twitterAppId) && !_.isUndefined(vm.twitterAppId)) {
                $timeout(function () {
                    twttr.widgets.createTimeline(
                            vm.twitterAppId,
                            document.getElementById('twitter-section'),
                            {
                                height: 660,
                                chrome: 'noborders',
                                linkColor: '#357cdf'
                            });
                }, 0);
            }

            function agencySorter(agency) {

                return agency.agency_name;

            }

            function formattedUrl(url) {

                if (!_.isUndefined(url) && (!_.isEmpty(url))) {
                    if (!/^https?:\/\//i.test(url)) {
                        url = 'http://' + url;
                    }
                    return url;
                }

            }

            $scope.$watchCollection(angular.bind(vm, function () {
                return [this.currentSortOption, this.viewportData];
            }), onNewPositionsAndSort);
            $scope.$watch(angular.bind(vm, function () {
                return this.viewportData;
            }), function (viewportData) {
                if (_.isUndefined(viewportData)) {
                    return;
                }
            });

            function onNewPositionsAndSort(args) {
                sortPositions(args);
            }

            function sortPositions(args) {
                var sexOffenderArray = [];
                if (!$localStorage.apiFilters.include_sex_offenders || $localStorage.apiFilters.include_sex_offenders == "false") {
                    sexOffenderArray = [];
                } else {
                    sexOffenderArray = $rootScope.sexOffenderViewportData;
                }
                if (sexOffenderArray == undefined)
                    sexOffenderArray = [];
                var viewportDataArray = args[1];
                if (sexOffenderArray != undefined || sexOffenderArray.length != 0) {
                    for (var i = 0; i < sexOffenderArray.length; i++) {
                        for (var k = 0; k < viewportDataArray.length; k++) {
                            var flag = false;
                            if (viewportDataArray[k].primary_key == sexOffenderArray[i].primary_key) {
                                flag = true;
                            }
                        }
                        if (!flag) {
                            args[1].push(sexOffenderArray[i]);
                        }
                    }
                }
                var sortOption = args[0], viewportDataRaw = args[1];
                var viewportData = [];
                for (var i = 0; i < viewportDataRaw.length; i++) {
                    if (viewportDataRaw[i].count == undefined) {
                        viewportData.push(viewportDataRaw[i]);
                    }
                }
                if (vm.crimesType !== 'agencies') {
                    if (_.isUndefined(viewportData) || !viewportData.length) {
                        vm.sortedCrimePositions = [];
                    } else {
                        var sortedCrimePositions;
                        switch (sortOption.type) {
                            case 'alpha':
                                sortedCrimePositions = _.sortBy(viewportData, function (position) {
                                    return (position.parent_incident_type || 'Registered Sex Offender' || '').toLowerCase();
                                });
                                break;
                            case 'date':
                                sortedCrimePositions = _.sortBy(viewportData, function (position) {
                                    return new Date(position.incident_datetime || '2010-01-01T12:00:00');
                                });
                                break;
                            case 'category':
                                sortedCrimePositions = _.sortBy(viewportData, function (position) {
                                    return (position.parent_incident_type || '').toLowerCase();
                                });
                                break;
                            default:
                                sortedCrimePositions = viewportData;
                        }
                        if (sortOption.reverse) {
                            sortedCrimes = sortedCrimePositions.reverse();
                        } else {
                            sortedCrimes = sortedCrimePositions;
                        }
                        startIndex = 0;
                        var index;
                        if ($scope.incId) {
                            var item = _.find(sortedCrimes, function (item, key) {
                                if (item.incident_id) {
                                    if (item.incident_id === $scope.incId) {
                                        index = key;
                                        lastIndex = key + 10;
                                        return item;
                                    }
                                } else {
                                    if (item.sex_offender_id === $scope.incId) {
                                        index = key;
                                        lastIndex = key + 10;
                                        return item;
                                    }
                                }
                            });
                            $timeout(function () {
                                if ($rootScope.ifAgency) {
                                    vm.isVidoesLoading = true;
                                    var ins = api.getIncidentVideoLinks($localStorage.exploreAgency.agencyId, $scope.incId);
                                    ins.then(function (data) {
                                        vm.isVidoesLoading = false;
                                        vm.incidentVideoLinks = data.data;
                                    });
                                }
                                vm.openlist[index] = true;
                                // Incident highlight in listView
                                $location.hash($scope.incId);
                                var handle = $ionicScrollDelegate.$getByHandle('content');
                                handle.anchorScroll(true);
                            }, 500);
                        }
                        vm.sortedCrimePositions = sortedCrimes.slice(startIndex, lastIndex);
                        vm.canLoadmoreData = true;
                    }
                }

            }
            $rootScope.$on('$locationChangeSuccess', function (event) {
                event.preventDefault();
            })
            vm.showChiefMessage = true;

            vm.toggleChiefMessage = function () {
                vm.showChiefMessage = !vm.showChiefMessage;
            };

            vm.openPluslist = [];

            vm.togglePlusAgencyList = function (index, item) {
                if (vm.openPluslist[index] == true) {
                    vm.openPluslist[index] = false;
                } else {
                    vm.openPluslist = [];
                    vm.openPluslist[index] = true;
                }
                $timeout(function () {
                    $ionicScrollDelegate.resize();
                }, 300);
            };
            $ionicModal.fromTemplateUrl('modal.html', function ($ionicModal) {
                $scope.modal = $ionicModal;

                $scope.title = vm.plusCustomerMessageData_message_title;
                $scope.detailed_message = vm.plusCustomerMessageData_detailed_message;
            }, {
                // Use our scope for the scope of the modal to keep it simple
                scope: $scope,
                // The animation we want to use for the modal entrance
                animation: 'slide-in-up'
            });
            vm.openAgencylist = [];
            vm.toggleAgencyList = function (index) {
                if (vm.openAgencylist[index] == true) {
                    vm.openAgencylist[index] = false;
                } else {
                    vm.openAgencylist = [];
                    vm.openAgencylist[index] = true;
                }
                $timeout(function () {
                    $ionicScrollDelegate.resize();
                }, 300);
            };

            // Incident toggle in listview 
            vm.openlist = [];
            vm.toggleGroup = function (index) {
                if (vm.openlist[index] == true) {
                    vm.openlist[index] = false;
                } else {
                    vm.openlist = [];
                    vm.openlist[index] = true;
                }
                if ($rootScope.ifAgency) {
                    getIncidentVideos($localStorage.exploreAgency.agencyId, vm.sortedCrimePositions[index]);
                }
                $timeout(function () {
                    $ionicScrollDelegate.resize();
                }, 500);
            };

            vm.goToAgencyWebsite = function (url) {
                window.open(url, '_system');
            };

            vm.shareTip = function (item) {
                $rootScope.$emit('sharetipFromListView', item);
            };

            // Encoded URL for share 
            function formatUrl(site_url, item) {
                var base;
                if ($rootScope.ifAgency) {
                    if(item.meta){
                        if(item.meta.namespace){
                            base = '/agency/' + item.meta.namespace;
                        } else{
                            base = '/agency/' + $localStorage.plusCustomerMeta.namespace;
                        }
                    } else{
                        base = '/agency/' + item.city.toLowerCase();
                    }
                } else {
                    base = '/home';
                }
                var url = {
                    lat: item.location.coordinates[1],
                    lng: item.location.coordinates[0]
                };
                var abc = site_url + base + '/#!/dashboard?incident_types=' + vm.urlParams.incident_types + '&start_date=' + vm.urlParams.start_date + '&end_date=' + vm.urlParams.end_date +
                        '&days=' + vm.urlParams.days + '&lat=' + item.location.coordinates[1] + '&lng=' + item.location.coordinates[0] +
                        '&zoom=' + vm.zoomLevel + '&position_id=' + item.primary_key + '&shape_id=false';
                return encodeURI(abc);
            }

            vm.submitTip = function (AgencyID, Case) {
                window.open("https://www.tipsubmit.com/WebTips.aspx?AgencyID=" + AgencyID + "&case=" + Case, '_blank', 'location=no');
            };

            $scope.submitTipAgency = function (AgencyID) {
                window.open("https://www.tipsubmit.com/WebTips.aspx?AgencyID=" + AgencyID, '_blank', 'location=no');
            }

            vm.visitTwitterOrFacebookPage = function (url) {
                window.open(url, '_system');
            };

            vm.exploreAgency = function (item) {
                var lat = item.center.coordinates[1], lng = item.center.coordinates[0];
                $rootScope.exploreAgencyMap = null;
                $rootScope.agency_id = item.agency_id;
                $rootScope.lat = lat;
                $rootScope.lng = lng;
                $state.go('app.map');
                $scope.$emit('explore.Agency', item);
            };

            vm.clickFunction = function (item) {
                var data = item,
                        zoom = 16;
                $state.go('app.map');
                $timeout(function () {
                    $rootScope.$emit('list.data', {data: data, zoom: zoom});
                }, 200);
            };

            vm.ZoomToIncident = function (item) {

                var data = item,
                        zoom = 14;
                $state.go('app.map');
                $timeout(function () {
                    $rootScope.$emit('list.data', {data: data, zoom: zoom});
                }, 200);
            };

            // Infinite scroll for Listview
            vm.loadMore = function () {
                if (vm.zoomLevel >= 12 && vm.agencyActive === true) {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    vm.canLoadmoreData = false;
                } else if (vm.trendsActive === true) {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    vm.canLoadmoreData = false;
                } else {
                    vm.canLoadmoreData = true;
                    var slicedArr = [];
                    startIndex = lastIndex;

                    if (vm.crimesType === 'agencies') {
                        if (leftfeaturedAgencies >= itemslimit) {
                            lastIndex = lastIndex + itemslimit;
                            slicedArr = featuredAgencies.slice(startIndex, lastIndex);
                            vm.featuredAgencyPositions = vm.featuredAgencyPositions.concat(slicedArr);
                            leftfeaturedAgencies = featuredAgencies.length - lastIndex;
                            if (leftfeaturedAgencies == 0) {
                                lastIndex = 0;
                            }
                            itemsAdded = lastIndex;
                        } else if (leftfeaturedAgencies > 0 && leftfeaturedAgencies < itemslimit) {
                            lastIndex = lastIndex + leftfeaturedAgencies;
                            slicedArr = featuredAgencies.slice(startIndex, lastIndex);
                            vm.featuredAgencyPositions = vm.featuredAgencyPositions.concat(slicedArr);
                            itemsAdded = itemsAdded + slicedArr.length;

                            startIndex = 0;
                            lastIndex = itemslimit - leftfeaturedAgencies;
                            slicedArr = normalAgencies.slice(startIndex, lastIndex);
                            vm.normalAgencyPositions = vm.normalAgencyPositions.concat(slicedArr);
                            leftfeaturedAgencies = 0;
                            itemsAdded = itemsAdded + slicedArr.length;
                        } else {
                            lastIndex = lastIndex + itemslimit;
                            slicedArr = normalAgencies.slice(startIndex, lastIndex);
                            vm.normalAgencyPositions = vm.normalAgencyPositions.concat(slicedArr);
                            itemsAdded = itemsAdded + slicedArr.length;
                        }
                    } else {
                        lastIndex = lastIndex + itemslimit;
                        slicedArr = sortedCrimes.slice(startIndex, lastIndex);
                        vm.sortedCrimePositions = vm.sortedCrimePositions.concat(slicedArr);
                    }
                    if (vm.crimesType === 'agencies') {
                        if (slicedArr.length < 10 && itemsAdded == (normalAgencies.length + featuredAgencies.length))
                            vm.canLoadmoreData = false;
                    } else {
                        if (slicedArr.length < 10)
                            vm.canLoadmoreData = false;
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');

                }
                $ionicScrollDelegate.$getByHandle('content').resize();
            };
            if ((vm.exploreAgencyMode || vm.zoomLevel < 12) && !$scope.incId) {
                vm.agencyActive = true;
                vm.incidentActive = false;
            } else {
                vm.incidentActive = true;
                vm.agencyActive = false;
            }

            vm.showAgency = function () {
                vm.canLoadmoreData = true;
                vm.agencyActive = true;
                vm.incidentActive = false;
                $ionicScrollDelegate.$getByHandle('content').resize();
            };

            vm.showIncident = function () {
                vm.canLoadmoreData = true;
                vm.incidentActive = true;
                vm.agencyActive = false;
                $ionicScrollDelegate.$getByHandle('content').resize();
            };
            vm.listCrimeClick = function (item) {
                $localStorage.listViewCrimeClickDataForMap = item;
            };
        }
        //Link Function Ends
    }

})();