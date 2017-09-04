(function () {
    'use strict';
    angular.module('signup')
            .controller('signupController', function (removeMap, $q, user, Alertuser, $scope, $timeout, smartHttp, globalConstants, $state, timeStorage, $rootScope, $http, $ionicHistory) {
                removeMap.checkMapAndRemove();
                var site_url = globalConstants.SITE_URL;
                $scope.back = function () {
                    $ionicHistory.goBack();
                };
                $scope.user = {
                    email: '',
                    password: '',
                    password_confirmation: '',
                    first_name: '',
                    last_name: ''
                };
                $rootScope.ifFilterview = false;
                if (ionic.Platform.isWebView()) {
                    if (cordova.plugins.Keyboard.isVisible) {
                        cordova.plugins.Keyboard.close();
                    }
                }
                $scope.scrollStart = function () {
                    document.body.style.cursor = 'none';
                };
                $scope.scrollEnd = function () {
                    document.body.style.cursor = 'block';
                };
                $scope.submit = function () {
                    if ($scope.user.password == $scope.user.password_confirmation) {
                        $scope.errmsg = '';
                        $scope.apiCalled = true;
                        $http({
                            method: 'POST',
                            url: site_url + '/register.json',
                            data: {user: $scope.user}
                        }).then(function (result) {
                            Alertuser.alert('You will receive an email with instructions to confirm your email address shortly.');
                            $state.go('app.map');
                            $scope.apiCalled = false;
                        }, function (error) {
                            $scope.apiCalled = false;
                            $timeout(function () {
                                $scope.error = error.data.errors;
                            });
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                        });
                    } else {
                        $scope.errmsg = 'Password not matched';
                    }

                };
                function getLoggedinUser(data) {
                    $http({
                        method: 'GET',
                        url: site_url + '/user/details',
                    }).then(function (result) {
                        checkIsAdminUser(result.data);
                    }, function (error) {

                    });
                }

                function checkIsAdminUser(data) {
                    $http({
                        method: 'GET',
                        url: site_url + '/user/is_admin_user?email=' + data.email,
                    }).then(function (result) {
                    }, function (error) {

                    });
                }
            });
})();


