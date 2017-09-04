(function () {
    'use strict';
    angular.module('crimeApp')
            .directive('searchOverlay', searchOverlay);

    function searchOverlay($rootScope, $timeout, safeApply, $q, geometry, $ionicHistory, $state, zoomHelper) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/searchOverlay/search-overlay-tmpl.html',
            bindToController: {
                isPlatformIos: '=',
                modal: '='
            },
            controller: controllerFn,
            controllerAs: 'searchOverlay',
            link: linkFn
        };

        function controllerFn() {
        }

        function linkFn($scope, $element, $attrs, ctrl) {
            var vm = ctrl,
                    searchInput = $($element).find('.srch-textbox');

            vm.loading = false;
            vm.showTextbox = false;
            vm.results = [];
            vm.searchKey = '';
            vm.active = false;

            $scope.$watch(angular.bind(vm, function () {
                return this.searchKey;
            }), function (value) {
                if (_.isUndefined(value) || value === '') {
                    vm.active = false;
                }
            }, true);


            vm.resolveAddress = function (e, searchString) {
                vm.active = true;
                if (!searchString) {
                    vm.active = false;
                    vm.results = [];
                    return;
                }

                vm.loading = true;
               L.mapbox.geocoder("mapbox.places").query({query: searchString,country:['us','ca','sv']}, function (err, data) {
                    if (searchString != vm.searchKey) {
                        return;
                    }
                    safeApply($scope, function () {
                        if (err) {
                            console.log(err);
                        } else {
                            vm.results = data.results.features;
                            vm.noResults = false;
                            if (_.isEmpty(vm.results)) {
                                vm.noResults = true;
                            }
                        }
                        vm.loading = false;
                    });
                });
            };

            vm.onResultSelect = function (result) {
                var args = {},
                        resultLocation = result.center,
                        lat = resultLocation[1],
                        lng = resultLocation[0];

                args.lat = lat;
                args.lng = lng;
                args.result = result;

                vm.closeSearch();
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
                $rootScope.$emit('trackedUserAction', {
                    eventName: 'Search Used',
                    params: {
                        place: result.place_name
                    }
                });
                $element.removeClass('focused');
                if ($state.current.name !== 'app.map') {
                    $state.go('app.map');
                }
                $rootScope.$emit('SearchOverlay::OnSelect', args);
                vm.clearSearch();
            };

            searchInput.on('focus', function () {
                $element.addClass('focused');
            }).on('blur', function () {
                if (searchInput.val().length === 0) {
                    $element.removeClass('focused');
                    vm.active = false;
                    vm.showSearch = false;
                }
                vm.results = [];
                if (ionic.Platform.isWebView()) {
                    if (cordova.plugins.Keyboard.isVisible) {
                        cordova.plugins.Keyboard.close();
                    }
                }
            });
            
            vm.onSearch = function () {
                
                vm.showSearch = true;
                $('#srcTextbox').trigger('click');
                
            };

            vm.clearSearch = function () {
                searchInput.val('').blur();
                vm.active = false;
                vm.showSearch = false;
                vm.noResults = false;
                vm.results = [];
                vm.searchKey = '';
                if (ionic.Platform.isWebView()) {
                    if (cordova.plugins.Keyboard.isVisible) {
                        cordova.plugins.Keyboard.close();
                    }
                }

            };
            
            vm.closeSearch = function () {
                searchInput.val('').blur();
                vm.active = false;
                vm.showSearch = false;
                vm.noResults = false;
                vm.results = [];
                vm.searchKey = '';
                if (ionic.Platform.isWebView()) {
                    if (cordova.plugins.Keyboard.isVisible) {
                        cordova.plugins.Keyboard.close();
                    }
                }
                $ionicHistory.goBack();
            };
        }
        //Link Function End
    }
})();