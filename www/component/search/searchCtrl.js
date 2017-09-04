(function () {
    'use strict';
    angular.module('setlocation').controller('searchCtrl', function ($scope,$rootScope, $ionicHistory, removeMap) {
        var vm = this;
        removeMap.checkMapAndRemove();
        $rootScope.hideTabs=false;
        $scope.closeSearch = function () {
            $ionicHistory.goBack();
        };
    });

})();