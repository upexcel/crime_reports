(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('customFilter', customFilter);

  function customFilter(customFilterParamsAdapter, timeStorage, $state, $ionicHistory,  CURRENT_AGENCY, $ionicActionSheet, globalConstants, urlParamsAdapter) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/filters/custom-filter-tmpl.html',
      bindToController: {
        urlParams: '='
      },
      link: linkFn,
      controller: controllerFn,
      controllerAs: 'customFilter'
    };

    function controllerFn($scope) {
      var vm = this,
        defaultFilters = {
          dateRange: [],
          timeRange: [],
          days: [],
          incidentTypes: [],
          includeSexOffenders: 'false'
        };

      vm.crimeTypeCollapsed = false;
      vm.filters = defaultFilters;

      $scope.$watch(angular.bind(vm, function () {
        return this.urlParams;
      }), function (params) {
        if (_.isUndefined(params) || _.isEmpty(params)) {
          vm.filters = defaultFilters;
        } else {
         vm.filters= $.extend(true, vm.filters, customFilterParamsAdapter.parseFilterParamsFromUrlParams(params, vm.filters));
     
        }
      });
    }

    function linkFn($scope, $element, $attrs, ctrl) {
      var vm = ctrl;
     var crimeTypes = globalConstants.CRIME_CATEGORIES;
      vm.filterText = 'Filter';
      vm.showFilter = false;
      vm.filterDateText = '';
      vm.filtersDisabled =  _.isEmpty(CURRENT_AGENCY);
      vm.trendBtnText = 'See all incident trends';
      vm.showResetButton = false;
      vm.crimeCountForClusters = globalConstants.API_INDIVIDUAL_CRIME_THRESHOLD;
      $scope.$watch(angular.bind(vm, function () {
        return this.urlParams;
      }), function (urlParams) {
        if (_.isUndefined(urlParams)) {
          vm.filterDateText = '';
          return;
        }
        var getDefaultParam=urlParamsAdapter.getDefaultParams();
        getDefaultParam.zoom=urlParams.zoom;
        vm.disableResetButton = _.isEmpty(_.difference(getParamValues(getDefaultParam), getParamValues(urlParams)));
        setDateText(urlParams);
        if (!_.isUndefined(urlParams.incident_types)) {
          checkPartialFilter(urlParams.incident_types.split(','));
        }
      }, true);
          function setDateText (urlParams) {
        var start_date = moment(urlParams.start_date),
          end_date = moment(urlParams.end_date);
        vm.days = end_date.diff(start_date, 'days');

        if (!_.isUndefined(urlParams.start_date)) {
          if (_.isUndefined(urlParams.end_date)) {
            vm.filterDateText = 'From : ' + moment(urlParams.start_date).format('MMM D, YYYY');
          } else {
            vm.filterDateText = moment(urlParams.start_date).format('MMM D, YYYY');
          }
        }
        if (!_.isUndefined(urlParams.end_date)) {
          if (_.isUndefined(urlParams.start_date)) {
            vm.filterDateText = 'Till : ' + moment(urlParams.end_date).format('MMM D, YYYY');
          } else {
            vm.filterDateText += ' - ' + moment(urlParams.end_date).format('MMM D, YYYY');
          }
        }
      }
        function checkPartialFilter (incidentTypes) {
        if (_.isUndefined(vm.partialCategoryFilter) || vm.partialCategoryFilter === null || vm.partialCategoryFilter === '') {
          return;
        }
        var partialFilterCrimeTypes = _.flatten(_.values(crimeTypes[vm.partialCategoryFilter]));
        if (_.isEqual(partialFilterCrimeTypes, _.difference(partialFilterCrimeTypes, incidentTypes))) {
          $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', null);
        }
      }
      function getParamValues (params) {
        return _.chain(params).values().flatten().sortBy().value();
      }
      function applyAndEmitChanges() {
        if (!_.isUndefined(vm.filters)) {
          if (_.isEmpty(vm.filters.incidentTypes)) {
            vm.filters.incidentTypes = ['false'];
          }
          if (_.isEmpty(vm.filters.days)) {
            vm.filters.days = ['false'];
          }
        }
        $scope.$emit('customFilters::changed', customFilterParamsAdapter.formatFilterParamsToUrlParams(vm.filters));
      }

      $scope.$on('TrendOverlay::Closing', function () {
        $scope.$broadcast('DateRangePicker::Close');
      });

      $scope.$watch(angular.bind(vm, function () {
        return this.filters.includeSexOffenders;
      }), function(isEnabled){
        vm.includeSexOffenders = isEnabled;
      });

      $scope.$watch(angular.bind(vm, function () {
        return this.includeSexOffenders;
      }), toggleSexOffenders);

      $scope.$watch(angular.bind(vm, function () {

        return this.filters;
      }), function () {
        applyAndEmitChanges();
      }, true);
      vm.resetFilters = function () {
          var defaultparms = urlParamsAdapter.getDefaultParams({});
          $.extend(true, vm.filters, customFilterParamsAdapter.parseFilterParamsFromUrlParams(defaultparms, vm.filters));
          vm.crimeTypeCollapsed = false;
          $scope.$emit('customFilters::changed', defaultparms);
          $scope.$emit('customFilters::reset');
      };
      vm.closeFilters = function () {
        if ($ionicHistory.backView() === null) {
          $state.go('app.map');
        } else {
          $ionicHistory.goBack();
        }
      };
      function toggleSexOffenders(isEnabled) {
        if (typeof (isEnabled) == 'string') {
          return false;
        }

        if (_.isUndefined(isEnabled) || isEnabled == 'false' || isEnabled == false) {
          return;
        } else {
          var ifSexOffenderTermsAccepted = timeStorage.get('AcceptedSexOffendersTerms');
          ifSexOffenderTermsAccepted = ifSexOffenderTermsAccepted ? ifSexOffenderTermsAccepted : false;

          if (ifSexOffenderTermsAccepted) {
            vm.filters.includeSexOffenders = true;
            return true;
          } else {
            // Show the action sheet
            vm.filters.includeSexOffenders = false;
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
                    vm.filters.includeSexOffenders = true;
                    return true;
                  case 2:
                    vm.filters.includeSexOffenders = false;
                    return true;

                }
                return true;
              }
            });
          }
        }
      }
    }

    //Link Ends
  }
})();