(function () {
    'use strict';
    angular.module('alert')
            .controller('alertController', alertController);
    function alertController($ionicPlatform, $ionicPopup, $ionicActionSheet, removeMap, $scope, $timeout, $rootScope, $localStorage, Alertuser, $http, mapState, timeStorage, globalConstants, $ionicScrollDelegate, $state, smartHttp) {
        $rootScope.hideTabs = true;

        var currentZoom = mapState.getZoom();
        $scope.currentZoom = currentZoom;
        removeMap.checkMapAndRemove();
        var backbutton = false;
        backbutton = $ionicPlatform.registerBackButtonAction(function (event) {
            vm.close();
        }, 1500);
        var vm = this;
        vm.scrollStart = function () {
            document.body.style.cursor = 'none';
        };
        vm.scrollEnd = function () {
            document.body.style.cursor = 'block';
        };
        vm.auth = {user: {}};
        if (timeStorage.get('login')) {
            vm.auth.user.loggedIn = true;
        } else {
            vm.auth.user.loggedIn = false;
        }
        vm.showAlertModal = true;
        if (!$scope.ifExploreAgency)
            vm.showAlertModal = currentZoom > globalConstants.AGENCY_VIEWPORT_ZOOM;
        vm.crimeTypeCollapsed = false;
        var customFilters = $localStorage['apiFilters'],
                CURRENT_AGENCY = mapState.getExploreAgencyMode();
        vm.crimeTypeCollapsedChange = function () {
            vm.crimeTypeCollapsed = !vm.crimeTypeCollapsed;
            $ionicScrollDelegate.resize();
        };
        vm.signIn = function () {
            $state.go('app.signin');
        };

        if (vm.showAlertModal && !vm.auth.user.loggedIn) {
            var confirmPopup = $ionicPopup.confirm({
                template: '<p class="alert-text">You must be signed in to create an alert</p>',
                cssClass: 'alert-for-signin',
                buttons: [
                    {text: 'Cancel'},
                    {
                        text: 'Sign In',
                        onTap: function () {
                            return true;
                        }
                    }
                ]
            });

            confirmPopup.then(function (res) {
                if (res) {
                    $state.go('app.signin');
                }
            });
        }

        var userAlertData = mapState.getAlert();
        if (userAlertData.alertType && userAlertData.alertType === 'edit') {
            vm.modalTitle = 'Edit an Alert';
            vm.alert = userAlertData.alertData;
            vm.include_sex_offenders = userAlertData.alertData.include_sex_offenders;
            vm.incidentTypes = userAlertData.alertData.query_params.incident_types.split(',');
        } else {
            vm.modalTitle = 'Create an Alert';
            vm.alert = {send_official_alerts: 'false', frequency: 'daily'};
            vm.incidentTypes = (customFilters['incident_types'] || '').split(',');
        }

        vm.close = function () {
            if (backbutton)
                backbutton();
            $state.go('app.map');
        };
        $('#name-alert').bind('keypress', function (e) {
            // enter key code is 13
            if (e.which === 13) {
                e.preventdefault();
                alert('Enter');
            }
        });
        $scope.alert1 = $localStorage.alert;
        if (!$localStorage.alert && vm.showAlertModal)
            Alertuser.alert('Currently, no agencies in this area are sharing data through CrimeReports. Please try a different area and try again.');
        vm.isSexOffendersEnabled = function (event, status) {
            var sexOffendersTermsAccepted = timeStorage.get('AcceptedSexOffendersTerms');
            if (!sexOffendersTermsAccepted) {
                vm.alert.include_sex_offenders = false;
                var hideSheet = $ionicActionSheet.show({
                    titleText: 'Sex Offender Terms of Use',
                    buttons: [
                        {text: '<p class="sex-offender-terms">Registered Sex Offender data are transmitted only for informational use and are subject to restrictions on use by various publishing states,including prohibition against using such data for retribution against any individual.By proceeding,you agree that you have read and agree to the following disclaimers,including indemnification by you of the operators of the website</p>'},
                        {text: '<p class="accept-btn">Accept</p>'},
                        {text: '<p class="decline-btn">Decline</p>'},
                    ],
                    buttonClicked: function (index) {
                        switch (index) {
                            case 0:
                                return false;
                            case 1:
                                timeStorage.set('AcceptedSexOffendersTerms', true, 24);
                                vm.alert.include_sex_offenders = true;
                                vm.include_sex_offenders = true;
                                return true;
                            case 2:
                                vm.alert.include_sex_offenders = false;
                                vm.include_sex_offenders = false;
                                return true;

                        }
                        return true;
                    }
                });
            } else {
                vm.alert.include_sex_offenders = status;
            }
        };
        vm.submitAlert = function () {

            $scope.ifcreatingAlert = true;
            var viewPortBounds = mapState.getBounds(),
                    mapBounds = {
                        lat1: viewPortBounds._northEast.lat.toString(),
                        lng1: viewPortBounds._northEast.lng.toString(),
                        lat2: viewPortBounds._southWest.lat.toString(),
                        lng2: viewPortBounds._southWest.lng.toString()
                    },
            customFilters = mapState.getFilters();
            vm.alert.query_params = _.extend({zoom: currentZoom}, customFilters, mapBounds);
            vm.alert.query_params['incident_types'] = vm.incidentTypes.join(',');
            if (CURRENT_AGENCY.mode == true) {
                vm.alert.query_params['agency_id'] = CURRENT_AGENCY.agency_id;
                vm.alert.query_params['agency_namespace'] = CURRENT_AGENCY.agency_name;
            }
            //Edit an alert
            if (userAlertData.alertType === 'edit') {
                $http.put(globalConstants.SITE_URL + '/user/alerts/' + userAlertData.alertData.id, {alert: vm.alert}).then(function (result) {
                    Alertuser.alert('Alert for \'' + vm.alert.name + '\' updated', {ttl: 5000});
                    $state.go('app.setting');
                    $timeout(function () {
                        $rootScope.$emit('alert-created', true);
                    }, 500);
                    mapState.setAlert({});
                }, function (error) {
                    Alertuser.alert('Error updating alert ' + vm.alert.name + error.error, {ttl: 5000});
                    mapState.setAlert({});
                });
            } else { // Create an Alert

                smartHttp.alert(globalConstants.SITE_URL + '/user/alerts', {alert: vm.alert}).then(function (result) {
                    if (result.statusText === 'Created') {
                        Alertuser.alert('Alert for ' + vm.alert.name + ' Saved');
                    }
                    $scope.ifcreatingAlert = false;
                    $state.go('app.setting');
                    $timeout(function () {
                        $rootScope.$emit('alert-created', true);
                    }, 500);
                }, function (error) {
                    if (error.error == 'You need to sign in or sign up before continuing.') {
                        Alertuser.alert('Error creating alert ' + vm.alert.name + 'You need to sign in or confirm your account', {ttl: 5000});
                    }
                    Alertuser.alert('Error creating alert ' + vm.alert.name + '. Please try again or contact administrator.', {ttl: 5000});
                    $scope.ifcreatingAlert = false;
                });
            }

        };

    }
})();