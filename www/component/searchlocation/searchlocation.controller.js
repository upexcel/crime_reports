(function () {
    'use strict';
    angular.module('searchlocation').controller('searchlocationCtrl', function ($rootScope, globalConstants, $ionicHistory, $scope, $state, $timeout, safeApply, $q, geometry, Alertuser, zoomHelper, $localStorage) {
        var vm = this;
        if (!L.mapbox.accessToken)
            L.mapbox.accessToken = globalConstants.accessToken;
        vm.loading = false;
        vm.showTextbox = false;
        vm.results = [];
        vm.searchKey = '';
        vm.active = false;
        $rootScope.hideTabs = false;
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
            L.mapbox.geocoder('mapbox.places').query({query: searchString,country:['us','ca','sv']}, function (err, data) {
                
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
            result.search_name = '';
            result.default = false;
            var autoSavedLocations = [];
            if ($localStorage.autoSavedLocations) {
                autoSavedLocations = $localStorage.autoSavedLocations;
            }
            if (autoSavedLocations.length && autoSavedLocations[0].gps == true)
                autoSavedLocations.splice(1, 0, result);
            else
                autoSavedLocations.unshift(result);
            $localStorage.autoSavedLocations = autoSavedLocations;
            $state.go('initialLocation');
        };
        vm.goBack = function () {
            $ionicHistory.goBack();
        };
    });
})();