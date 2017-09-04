(function () {
    'use strict';
    angular.module('sidemenu').controller('sideMenuCtrl', function ($rootScope, $scope, mapState, $state, removeMap) {
        removeMap.checkMapAndRemove();
        $scope.goToMap = function () {
            $rootScope.lastState = 'app.menu';
            $state.go('app.map');
        };
        $scope.createAlert = function () {
            mapState.setAlert({alertType: 'create', alertData: {}});
            $state.go('app.alert');
        };
        $rootScope.hideTabs = true;
    });

})();