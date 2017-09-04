(function () {
    'use strict';
    angular.module('list')
            .controller('filterCtrl', filterCtrl);
    function filterCtrl($scope, $rootScope, $localStorage, removeMap) {
        $rootScope.ifFilterview = true;
        $rootScope.hideTabs = true;
        removeMap.checkMapAndRemove();
    }
})();