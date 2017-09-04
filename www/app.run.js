function DeepLinkHandler(data) {
    //deep linking
}
(function () {
    'use strict';
    angular
            .module('crimeApp')
            .run(runBlock);
    /** @ngInject */
    function runBlock($ionicPlatform, timeStorage, $ionicHistory, $http, $ionicPopup, $state, Alertuser, $rootScope, $localStorage, globalConstants, constantFactory, urlParamsAdapter) {

        // Constant download on app opening
        $http({
            method: "GET",
            url: "https://www.crimereports.com/api/global_constants.json"
        }).success(function (data) {
            constantFactory.setData(data);
        })

        // Load external links in the system browser
        $('body').on('click', '.has-external-link a, .open-link-in-system-browser', function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.open($(this).attr('href'), '_system');
        });
        $localStorage.partialCategoryFilter = '';
        // Reinitialing localstorage
    $localStorage['apiFilters'] = urlParamsAdapter.getDefaultParams({});
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        // A confirm dialog
        document.addEventListener('deviceready', onDeviceReady, false);
        function onDeviceReady() {
            StatusBar.overlaysWebView(false);
            StatusBar.styleLightContent();
            StatusBar.backgroundColorByHexString('#000000');
        }
        $rootScope.Loggeduser = {
            UserName: '',
            accountType: ''
        };
        function startUserSession(userdata) {
            timeStorage.set('login', userdata, 48);
            $rootScope.Loggeduser.UserName = userdata.first_name ? userdata.first_name + ' ' + userdata.last_name : userdata.email;
            $rootScope.Loggeduser.accountType = 'user';
            $rootScope.log = true;
        }

        $ionicPlatform.ready(function () {
            if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
                if (analytics) {
                    analytics.startTrackerWithId("UA-85533724-1");
                } else {
                    console.log("Google Analytics Unavailable");
                }
            }
            if ($localStorage.login) {
                var user = {email: $localStorage.login.email, password: ''};
            }
            else
                user = {email: '', password: ''};
            $http({
                method: 'POST',
                url: globalConstants.SITE_URL + '/signin.json',
                data: {
                    'authenticity_token': 'oops',
                    'user': user
                },
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': 'application/json, text/plain'
                }
            }).then(function (result) {
                startUserSession(result.data);
            }, function(err){
                console.log(err.status);
            });


            if (ionic.Platform.isWebView()) {
                navigator.splashscreen.hide();
            }
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            $rootScope.$on('$stateChangeStart', function (ev, toState, toParam, fromState) {

                $ionicPlatform.registerBackButtonAction(function (event) {
                    if (toState.name == 'app.map' || toState.name == 'setlocation') {
                        event.preventDefault();
                        if ($rootScope.backButtonPressedOnceToExit) {
                            ionic.Platform.exitApp();
                        } else {
                            $rootScope.backButtonPressedOnceToExit = true;
                            window.plugins.toast.showShortCenter(
                                    'Press back button again to exit', function (a) {
                                    }, function (b) {
                            }
                            );
                            setTimeout(function () {
                                $rootScope.backButtonPressedOnceToExit = false;
                            }, 2000);
                        }
                    }
                    else
                        $ionicHistory.goBack();
                }, 100);

            });
            /*
             * Check internet connection
             */
            if (ionic.Platform.platforms[0] != 'browser')
                universalLinks.subscribe('myevent', function (eventData) {
                    if (eventData.url == "https://www.crimereports.com/camera_registration#/")
                        cordova.InAppBrowser.open(eventData.url, '_blank', 'location=yes');
                    else {
                        $localStorage.shareUrl = eventData.url;
                        $localStorage.location = 'user';
                        setTimeout(function () {
                            $rootScope.$emit('shareurl');
                        }, 100);
                        $state.go('app.map');
                    }
                });
            if ($localStorage.shareUrl) {
                $state.go('app.map');
            }
            else {
                $state.go('setlocation');
            }

            if (window.Connection) {
                if (navigator.connection.type == Connection.NONE) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Internet Disconnected',
                        template: 'The internet is disconnected on your device.'
                    });
                    alertPopup.then(function (res) {
                        ionic.Platform.exitApp();
                    });
                }
            }
            var options = {
                enableHighAccuracy: true,
                timeout: 1000,
                maximumAge: 0
            };
        });
    }
})();