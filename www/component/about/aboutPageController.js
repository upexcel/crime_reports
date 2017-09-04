(function () {
    'use strict';
    angular.module('about')
            .controller('aboutPageController', function ($scope, $state, $ionicPlatform, globalConstants, $ionicScrollDelegate) {

                var vm = this;
                vm.socrataEmail = globalConstants.SOCRATA_EMAIL;
                vm.socrataNumber = globalConstants.SOCRATA_NUMBER;
                vm.scrollToId = function (elementId) {
                    var currentPageHeight = $('.about-page').scrollTop(), appHeaderHeight = $('.app-header').height();
                    $('.about-page').animate({
                        scrollTop: $(elementId).offset().top + currentPageHeight - appHeaderHeight
                    }, 'slow');
                };

                vm.gotoTermsOfService = function () {
                    $state.go('app.termsOfService', {});
                };
                $scope.iconCreditsCollapsed = true;
                $ionicPlatform.onHardwareBackButton(function (event) {
                    event.preventDefault();
                    $state.go('app.map');
                });
                vm.iconCredits = function () {
                    $scope.iconCreditsCollapsed = !$scope.iconCreditsCollapsed;
                    $ionicScrollDelegate.resize();
                };
            });
})();