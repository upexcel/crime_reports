(function () {
    'use strict';
    angular.module('trends')
            .controller('TrendsController',
                    function ($scope, $rootScope, $state, $q, removeMap) {
                        removeMap.checkMapAndRemove();
                        $rootScope.ifFilterview = false;
                        $rootScope.hideTabs = false;
                        $scope.trendsActive = true;
                        $scope.showList = function (selection) {
                            var def = $q.defer();
                            def.resolve($state.go('app.list'));
                            def.promise.then(function () {
                                $rootScope.$emit('show.list', selection);
                            });
                        };
                    });
})();
