(function () {
    'use strict';
    angular.module('signin')
            .config(['$httpProvider', function ($httpProvider) {
                    $httpProvider.defaults.withCredentials = true;
                }])
            .controller('signinController', function (removeMap, vcRecaptchaService, $ionicPlatform, $ionicModal, $ionicHistory, errorHelper, validator, globalConstants, $interval, $q, user, $scope, $timeout, $state, $http, $log, Alertuser, loginConstants, timeStorage, $rootScope, $cordovaOauth) {
                $rootScope.hideTabs = true;
                removeMap.checkMapAndRemove();
                var backbutton = false;

                backbutton = $ionicPlatform.registerBackButtonAction(function (event) {
                    $scope.goBack();
                }, 100);

                var site_url = globalConstants.SITE_URL;
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

                $scope.goBack = function () {
                    if (backbutton)
                        backbutton();
                    if ($ionicHistory.backView() == null) {
                        $state.go('app.map');
                    } else {
                        $ionicHistory.goBack();
                    }
                };

                $rootScope.showTabs = true;

                $scope.user = {
                    email: '',
                    password: '',
                };

                $scope.log = {
                    errorMsg: ''
                };

                $rootScope.ifFilterview = false;
                $rootScope.ifAlertView = false;
                $scope.ifSigningIn = false;
                $scope.signInSpinner = false;
                $scope.userUnconfirmed = false;

                $scope.submit = function () {
                    $scope.ifSigningIn = true;
                    $scope.signInSpinner = true;

                    if ($scope.user.email && $scope.user.password) {
                        $scope.user.remember_me = '1';
                        $http({
                            method: 'POST',
                            url: site_url + '/signin.json',
                            data: {
                                'authenticity_token': 'oops',
                                'user': $scope.user
                            },
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Content-Type': 'application/json;charset=UTF-8',
                                'Accept': 'application/json, text/plain'
                            }
                        }).then(function (result) {
                            $scope.signInSpinner = false;
                            startUserSession(result.data);
                        }, function (error) {
                            var msg = (error.data || {}).error;
                            if (msg === 'You have to confirm your email address before continuing.') {
                                $scope.userUnconfirmed = true;
                            } else {
                                $scope.userUnconfirmed = false;
                            }
                            $scope.ifSigningIn = false;
                            $scope.signInSpinner = false;
                            $scope.log.errorMsg = error.data.error;
                        });
                    }
                };

                var resendConfirmationModal;

                $ionicModal.fromTemplateUrl('component/signin/resend-confirmation.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    resendConfirmationModal = modal;
                });

                $scope.resendConfirmation = function () {
                    resendConfirmationModal.show();
                };

                $scope.closeResendConfirmationModal = function () {
                    resendConfirmationModal.hide();
                    $scope.formSubmitted = false;
                };

                $scope.resend = {
                    user: {email: ''},
                    mobile: ''
                };

                $scope.resendConfirmationSubmit = function () {
                    $scope.getPasswordSpinner = true;
                    $scope.sendingPassword = true;

                    $scope.resend.mobile = 'true';
                    $http.post(site_url + '/resend_confirmation.json', $scope.resend).then(function (result) {
                        $scope.formSubmitted = true;
                        $scope.sendingPassword = false;
                        $scope.getPasswordSpinner = false;
                    }, function (error) {
                        $scope.sendingPassword = false;
                        if (error) {
                            if (error.data.errors)
                                var msg = error.data.errors.email[0];
                        }
                        else
                            msg = 'Something went wrong contact administrator';
                        Alertuser.alert(msg);
                        $scope.getPasswordSpinner = false;
                    });
                };

                var opt = {
                    client_id: '857970319855-8h8q2t80gqdlmve2anmucjmsumjfae64.apps.googleusercontent.com',
                    redirect_uri: 'http://localhost/crime_ionic/CrimeApp/www/',
                    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me',
                    secret: 'NQ8eIPbqRLS09SK1OovBzn5u'
                };

                var pollTimer;
                $scope.googlelogin = function () {
                    var url = globalConstants.SITE_URL + socialLoginRoutes['google'],
                            loginWindow = cordova.InAppBrowser.open(url, '_blank', 'location=no,height=470,width=420,scrollbars=yes,hidden=yes');
                    $scope.spinner = 'google';
                    loginWindow.addEventListener('loadstop', function (data) {
                        $scope.spinner = false;
                        loginWindow.show();
                        if (pollTimer)
                            $interval.cancel(pollTimer);
                        pollTimer = $interval(function () {
                            if (data.url) {
                                var url = data.url;
                                var access_code = glup(url, 'code');
                                if (access_code) {
                                    $interval.cancel(pollTimer);
                                    getuserInfo(loginWindow);
                                    loginWindow.close();
                                }
                            }
                        }, 1000);
                    });
                    loginWindow.addEventListener('exit', function (data) {
                        loginWindow.close();
                    });
                };

                var self = this;

                function checkSignUpWindow(loginWindow) {
                    var intervalId = setInterval(function () {
                        if (getWindowProperty(loginWindow, 'closed')) {
                            loginWindow.close();
                            clearInterval(intervalId);
                        }
                    }, 2000);

                    loginWindow.addEventListener('loadstart', function (data) {
                    });
                }

                function getWindowProperty(window, propertyName) {
                    try {
                        return window[propertyName];
                    } catch (err) {
                        console.warn('caught error' + err);
                    }
                }

                var socialLoginRoutes = {
                    twitter: '/users/auth/twitter',
                    facebook: '/users/auth/facebook',
                    google: '/users/auth/google_oauth2'
                };

                $scope.facebookLogin = function () {
                    var url = globalConstants.SITE_URL + socialLoginRoutes['facebook'],
                            loginWindow = window.open(url, '_blank', 'location=no,height=470,width=420,scrollbars=yes,status=no');

                    loginWindow.addEventListener('loadstop', function (data) {
                        if (pollTimer)
                            $interval.cancel(pollTimer);
                        pollTimer = $interval(function () {
                            if (data.url) {
                                var url = data.url;
                                var access_code = glup(url, 'code');
                                if (access_code) {
                                    $interval.cancel(pollTimer);
                                    getuserInfo(loginWindow);
                                }
                            }
                        }, 2000);
                    });
                };

                function glup(url, name) {
                    url = url.substring(url.indexOf('?') + 1, url.length);
                    var found = url.search('code=');
                    if (found == -1) {
                        return false;
                    } else {
                        return true;
                    }
                }

                function twitterGlup(url, name) {
                    var found = url.search('callback?');

                    if (found == -1) {
                        return false;
                    } else {
                        return true;
                    }
                }
                function deniedTwitterGlup(url) {
                    var denied = url.search('denied');
                    if (denied == -1) {
                        return false;
                    } else {
                        return true;
                    }
                }

                function getuserInfo(loginWindow) {
                    $timeout(function () {
                        $http.get(globalConstants.SITE_URL + '/user/details').then(function (result) {
                            if (_.isEmpty(result) || _.isEmpty(result.data)) {
                            } else {
                                $timeout(function () {
                                    loginWindow.close();
                                    startUserSession(result.data);
                                });
                            }
                        });
                    }, 1000);
                }

                $scope.twitterLogin = function () {
                    var url = globalConstants.SITE_URL + socialLoginRoutes['twitter'],
                            loginWindow = cordova.InAppBrowser.open(url, '_blank', 'location=no,height=470,width=420,scrollbars=yes,hidden=yes');
                    $scope.spinner = 'twitter';
                    loginWindow.addEventListener('loadstop', function (data) {
                        $scope.spinner = false;
                        if (!deniedTwitterGlup(data.url))
                            loginWindow.show();
                        if (pollTimer)
                            $interval.cancel(pollTimer);
                        pollTimer = $interval(function () {
                            if (data.url) {
                                var url = data.url;
                                var access_code = twitterGlup(url, 'code');

                                if (access_code) {
                                    $interval.cancel(pollTimer);
                                    getuserInfo(loginWindow);
                                }
                            }
                        }, 2000);
                    });
                    loginWindow.addEventListener('loadstart', function (data) {
                        if (deniedTwitterGlup(data.url))
                            loginWindow.close();
                    });
                };

                self.getData = function () {
                    facebookConnectPlugin.api('/me', ['public_profile'], function (data) {
                        $log.info(data);

                        $scope.$apply(function () {
                            $scope.fb_data = data;
                        });

                        var name = 'login';
                        data.account = 'facebook';
                        timeStorage.set(name, data, 48);
                        $rootScope.Loggeduser.UserName = data.name;
                        $rootScope.Loggeduser.accountType = data.account;
                        $rootScope.$emit('login');
                        if ($ionicHistory.backView() == null) {
                            $state.go('app.map');
                        } else {
                            $ionicHistory.goBack();
                        }
                        $rootScope.log = true;
                    });
                };

                function startUserSession(userdata) {
                    timeStorage.set('login', userdata, 48);
                    $rootScope.Loggeduser.UserName = userdata.first_name ? userdata.first_name + ' ' + userdata.last_name : userdata.email;
                    $rootScope.Loggeduser.accountType = 'user';
                    $rootScope.log = true;
                    $scope.ifSigningIn = false;
                    Alertuser.alert('User successfully logged in');
                    saveUser();

                    if (backbutton)
                        backbutton();
                    if ($ionicHistory.backView() == null) {
                        $state.go('app.map');
                    } else {
                        $ionicHistory.goBack();
                    }
                }

                function saveUser(data) {
                    var checkLogin = $q.defer();
                    checkLogin.resolve(user.getLoggedinUser());
                    checkLogin.promise.then(function (result) {
                        var checkIfAdmin = user.checkIsAdminUser(result.data);
                        checkIfAdmin.then(function (data) {
                        });
                    });
                }

                $ionicModal.fromTemplateUrl('component/signin/forgot.password.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.forgotPasswordmodal = modal;
                });

                $scope.forgotPassword = function () {
                    if (backbutton)
                        backbutton();
                    $scope.forgotPasswordmodal.show();
                };

                $scope.closeforgotPasswordModal = function () {
                    $scope.forgotPasswordmodal.hide();
                    $scope.formSubmitted = false;
                };

                $scope.formSubmitted = false;
                $scope.forgot = {
                    user: {email: ''},
                    mobile: ''
                };


                $scope.signIn = function () {
                    $scope.closeforgotPasswordModal();
                };

                $scope.signUp = function () {
                    if (backbutton)
                        backbutton();
                    $state.go('app.signup');
                };

                $scope.reCaptchaWidgetId = null;
                $scope.getPasswordSpinner = false;

                $scope.getPassword = function () {
                    $scope.getPasswordSpinner = true;
                    $scope.sendingPassword = true;
                    $scope.forgot.mobile = 'true';
                    $http.post(site_url + '/reset_password.json', $scope.forgot).then(function (result) {
                        $scope.formSubmitted = true;
                        $scope.sendingPassword = false;
                        $scope.getPasswordSpinner = false;
                    }, function (error) {
                        $scope.sendingPassword = false;
                        if (error) {
                            if (error.data.errors) {
                                var msg = error.data.errors.email[0];
                            }
                        } else {
                            msg = 'Something went wrong contact administrator';
                        }

                        Alertuser.alert(msg);
                        $scope.getPasswordSpinner = false;
                    });
                };

                $scope.validateEmail = function (email) {
                    return validator.validateEmail(email);
                };

                $scope.cbExpiration = function () {
                    vcRecaptchaService.reload($scope.reCaptchaWidgetId);
                    $scope.recaptcahaKey = null;
                };
            });
})();