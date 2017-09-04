(function () {
    'use strict';
    angular.module('setting')
            .controller('settingController', settingController);
    function settingController($scope, mapState, smartHttp, removeMap, $timeout, $rootScope, Alertuser, $http, timeStorage, globalConstants, $state) {
        $rootScope.hideTabs = true;
        removeMap.checkMapAndRemove();
        var vm = this;
        vm.setting = {};
        vm.userData = timeStorage.get('login');

        vm.newUserData = {};
        vm.userAlerts = [];
        vm.save = function () {
        };
        vm.openEditInfo = function () {
            vm.showEdit = true;
        };
        $scope.ifuserInfoSelected = true;
        $rootScope.$on('alert-created', function (e, data) {
            $scope.ifuserInfoSelected = false;
        });
        vm.saveUserInfo = function () {
            $http.put(globalConstants.SITE_URL + '/user/update', {user: vm.userData}).then(function (result) {
                vm.showEdit = false;
            }, function (error) {
                Alertuser.alert('Error while updating user info');
            });
        };
        vm.savePassword = function () {
            var params = {current_password: '', password: '', password_confirmation: ''};
            $http.put(globalConstants.SITE_URL + '/update_credentials', {user: vm.newUserData}).then(function (result) {
                vm.showPasswordEdit = false;
                vm.newUserData = {};
            }, function (error) {
                Alertuser.alert('Error while updating password');
            });
        };
        vm.cancelPassword = function () {
            vm.showPasswordEdit = false;
        };
        vm.cancelUserInfo = function () {
            vm.showEdit = false;
            vm.newUserData = {};
        };
        vm.validatePasswordData = function (newPasswordData) {
            return (newPasswordData['current_password'] && newPasswordData['password'] && newPasswordData['password_confirmation']);
        };
        vm.closeModal = function () {
        };
        vm.createAlert = function () {
            mapState.setAlert({alertType: 'create', alertData: {}});
            $state.go('app.alert');
        };
        function formattedMapBoundObject(alertObject) {
            return {
                'lat1': alertObject.query_params.lat1,
                'lat2': alertObject.query_params.lat2,
                'lng1': alertObject.query_params.lng1,
                'lng2': alertObject.query_params.lng2
            };
        }

        vm.createAlert2 = function () {
        };
        //Get user Alerts
        smartHttp.get(globalConstants.SITE_URL + '/user/alerts').then(function (result) {
            if (!_.isEmpty(result.data)) {
                vm.userAlerts = result.data;
                _.each(vm.userAlerts, function (alert) {
                    alert.mapBounds = formattedMapBoundObject(alert);
                });
            } else {
                vm.userAlerts = [];
            }
        });
        //Delete an Alert
        vm.deleteAlert = function (alertId) {
            $http.delete(globalConstants.SITE_URL + '/user/alerts/' + alertId).then(function (result) {
                if (result.status === 200) {
                    var index = 0;
                    index = _.findIndex(vm.userAlerts, function (userAlert) {
                        return userAlert.id === alertId;
                    });
                    var deletedAlert = vm.userAlerts.splice(index, 1);
                    Alertuser.alert(deletedAlert[0].name + ' is deleted Successfully');
                }
            });
        };
        vm.pauseAlert = function (alertId) {
            var index = 0;
            index = _.findIndex(vm.userAlerts, function (userAlert) {
                return userAlert.id === alertId;
            });
            var currentUserAlert = vm.userAlerts[index];
            currentUserAlert.is_paused = !currentUserAlert.is_paused;
            $http.put(globalConstants.SITE_URL + '/user/alerts/' + alertId, {alert: currentUserAlert}).then(function (result) {
                //success
            });
        };
        //Edit Alerts
        vm.editAlert = function (alert) {
            mapState.setAlert({alertType: 'edit', alertData: alert});
            $state.go('app.alert');
        };
        $scope.$watch(angular.bind(vm, function () {
            return this.userAlerts;
        }), function (userAlerts) {
            vm.showCreateButton = _.isEmpty(userAlerts);
        }, true);
        vm.onAlertsTabActivation = function () {
            $scope.$broadcast('Static::Map::InvalidateSize');
        };
    }
})();
