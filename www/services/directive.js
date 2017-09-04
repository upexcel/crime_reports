angular.module('app.directive', [])
        .directive('focusMe', function ($timeout, $rootScope) {
            return {
                restrict: 'EA',
                link: function (scope, element, attrs) {
                    if (attrs.focusMeDisable === 'true') {
                        return;
                    }
                    $timeout(function () {
                        element[0].focus();
                        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                            cordova.plugins.Keyboard.show(); //open keyboard manually

                        }
                    }, 5);
                }
            };
        });