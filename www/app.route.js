(function () {
  'use strict';
  angular
    .module('crimeApp')
    .config(routeConfig);
  
  function routeConfig($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('initialLocation', {
        url: '/initialLocation',
        cache: false,
        templateUrl: 'component/initialLocation/initialLocation.html',
        controller: 'InitialLocationCtrl',
        controllerAs: 'initialLocationCtrl'
      })
      .state('searchlocation', {
        url: '/searchlocation',
        cache: false,
        templateUrl: 'component/searchlocation/searchlocation.html',
        controller: 'searchlocationCtrl',
        controllerAs: 'searchlocationCtrl'
      })
      .state('setlocation', {
        url: '/setlocation',
        cache: false,
        templateUrl: 'component/setlocation/setlocation.html',
        controller: 'setlocationCtrl',
        controllerAs: 'setlocationCtrl'
      })
      .state('maintenance', {
        url: '/maintenance',
        cache: false,
        templateUrl: 'component/maintenance/maintenance.html',
        controller: 'maintenanceCtrl',
        controllerAs: 'maintenanceCtrl'
      })
      .state('app', {
        url: '/app',
        abstract: true,
        cache: true,
        templateUrl: 'component/menu/menu.html',
        controller: 'MainCtrl',
        controllerAs: 'map'
      })
      .state('app.map', {
        url: '/map/:agency',
        cache: false,
        templateUrl: 'component/map/map.html'
      })
      .state('app.about', {
        url: '/about',
        cache: false,
        templateUrl: 'component/about/about-page-temp.html',
        controller: 'aboutPageController',
        controllerAs: 'aboutPage'
      })
      .state('app.agencySubmission', {
        url: '/agencySubmission',
        cache: false,
        templateUrl: 'component/agencySubmission/agency.submission.html',
        controller: 'agencySubmissionCtrl',
        controllerAs: 'agencySubmissionCtrl'
      })
      .state('app.alert', {
        url: '/alert',
        cache: false,
        templateUrl: 'component/alerts/alert.temp.html',
        controller: 'alertController',
        controllerAs: 'alertModelCtrl'
      })
      .state('app.filter', {
        url: '/filter',
        cache: false,
        templateUrl: 'component/filters/filters1.html',
        controller: 'filterCtrl'
      })
       .state('app.search', {
        url: '/search',
        cache: false,
        templateUrl: 'component/search/searchview.html',
        controller: 'searchCtrl'
      })
      .state('app.list', {
        url: '/list/:dataid',
        cache: false,
        templateUrl: 'component/list/list1.html',
        controller: 'ListController'
      })
      .state('app.menu', {
        url: '/menu',
        cache: false,
        templateUrl: 'component/menu/sidemenu.html',
        controller: 'sideMenuCtrl'
      })
      .state('app.setting', {
        url: '/setting',
        cache: false,
        templateUrl: 'component/settings/setting.temp.html',
        controller: 'settingController'
      })
      .state('app.signin', {
        url: '/signin',
        cache: false,
        templateUrl: 'component/signin/signin.html',
        controller: 'signinController'
      })
      .state('app.signup', {
        url: '/signup',
        cache: false,
        templateUrl: 'component/signup/signup.html',
        controller: 'signupController'
      })
      .state('app.termsOfService', {
        url: '/terms-of-service',
        cache: false,
        templateUrl: 'component/terms-condition/terms-of-service-tmpl.html',
        controller: 'termsAndPrivacyController'
      })
      .state('app.trends', {
        url: '/trends',
        cache: false,
        templateUrl: 'component/trends/trends.html',
        controller: 'TrendsController'
      });

  }
})();