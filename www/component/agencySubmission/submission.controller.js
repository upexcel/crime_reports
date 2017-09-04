(function () {
    'use strict';
    angular.module('agencySubmission')
            .controller('agencySubmissionCtrl', function ($ionicPlatform, $rootScope, removeMap, $scope, $state, Alertuser, mapState, $http, globalConstants, $location) {
                var vm = this, from_id = 'Anonymous User',
                        current_timestamp = new Date(Date.now()).toLocaleString(),
                        centerPoint = mapState.getMapCenter(), viewportBounds = mapState.getBounds();

                $rootScope.hideTabs = true;
                removeMap.checkMapAndRemove();
                var backbutton = false;
                backbutton = $ionicPlatform.registerBackButtonAction(function (event) {
                    vm.close();
                }, 100);

                var agency;
                $rootScope.$on('submitAgency', function (e, agencyData) {
                    agency = agencyData;
                });
                vm.close = function () {
                    if (backbutton)
                        backbutton();
                    $state.go('app.map');
                };
                vm.submissionSpinner = false;
                vm.submit = function () {
                    vm.submissionSpinner = true;
                    var site_url = globalConstants.SITE_URL;
                    var url = site_url + '/home/#!/dashboard?incident_types=' + $scope.filters.incident_types + '&start_date=' + $scope.filters.start_date + '&end_date=' + $scope.filters.end_date +
                            '&days=' + $scope.filters.days + '&start_time=' + $scope.filters.start_time + '&end_time=' + $scope.filters.end_time +
                            '&lat=' + viewportBounds._northEast.lat + '&lng=' + viewportBounds._northEast.lng +
                            '&include_sex_offenders=' + $scope.filters.include_sex_offenders +
                            '&zoom=' + $scope.currentZoom;
                    var mapBounds = {
                        lat1: viewportBounds._northEast.lat.toString(),
                        lng1: viewportBounds._northEast.lng.toString(),
                        lat2: viewportBounds._southWest.lat.toString(),
                        lng2: viewportBounds._southWest.lng.toString()
                    };
                    var params = {
                        to: globalConstants.SOCRATA_EMAIL,
                        from: vm.name || from_id,
                        subject: 'Share agency Customer Request',
                        message: vm.message,
                        timestamp: current_timestamp,
                        location: centerPoint.join(','),
                        viewport_bounds: JSON.stringify(mapBounds),
                        url: url
                    };
                    if (!_.isEmpty(agency)) {
                        params['agency_name'] = agency.agency_name;
                        params['agency_id'] = agency.agency_id;
                        params['state'] = agency.state;
                    }
                    $http.post(site_url + '/mail_to_socrata', {
                        email: params
                    }).then(function (result) {
                        vm.submissionSpinner = false;
                        if (result.data && result.data['message']) {
                            vm.message = '';
                            Alertuser.alert('Thank you for your submission.');
                            $state.go('app.map');
                        } else if (result.data && result.data['error']) {
                            Alertuser.alert(result.data['error']);
                        }
                    }, function () {
                        Alertuser.alert('Please fill valid details');
                        vm.submissionSpinner = false;
                    });
                };
            });
})();