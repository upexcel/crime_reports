(function () {
    'use strict';
    angular.module('list')
            .controller("ListController", [
                '$rootScope',
                '$scope',
                '$stateParams',
                '$localStorage',
                'removeMap',
                function ($rootScope, $scope, $stateParams, $localStorage, removeMap) {
                    removeMap.checkMapAndRemove();
                    if ($localStorage.clickedMarker || $stateParams.dataid) {
                        $scope.incidentid = $stateParams.dataid || $localStorage.clickedMarker;
                    }

                    $scope.userSelection = 'agencies';

                    $rootScope.$on('show.list', function (e, selection) {
                        $scope.userSelection = selection;
                    });

                    $rootScope.ifFilterview = false;
                    $rootScope.hideTabs = false;
                    var agencyViewportData = [];
                    _.each($scope.agencySource.viewportData, function (agency) {
                        var obj = {
                            baseData: agency,
                            count: 1,
                            agency_id: agency.agency_id,
                            location: {
                                latitude: agency.center.coordinates[1],
                                longitude: agency.center.coordinates[0]
                            },
                            subCategory: agency.agency_type === 'Police Dept' ? 'agency' : 'sheriff',
                            subType: "agency",
                            type: "agency"
                        };

                        agencyViewportData.push(obj);
                    });
                    if (!$scope.dataSource.agencyData)
                        $scope.dataSource.agencyData = [];
                    if (!$scope.agencySource.agenciesInvolved)
                        $scope.agencySource.agenciesInvolved = [];
                    $scope.involvedAgencies = $scope.dataSource.agencyData.length < $scope.agencySource.agenciesInvolved.length ?
                            $scope.agencySource.agenciesInvolved : $scope.dataSource.agencyData;
                }]);

})();