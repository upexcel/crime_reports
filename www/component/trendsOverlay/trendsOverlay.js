(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('trendOverlay', trendOverlay);

  function trendOverlay($document, safeApply, PLUS_CUSTOMER_AGENCY, mixpanelHelper, urlParamsAdapter) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/trendsOverlay/trends-overlay-html.html',
      bindToController: {
        urlParams: '=',
        historicData: '=',
        barData: '=',
        tableData: '=',
        sexOffendersCount: '=',
        isTrendsLoading: '=',
        trendsListActive: '=',
        partialCategoryFilter: '=',
        exploreAgencyMode: '='
      },
      link: linkFn,
      controller: controllerFn,
      controllerAs: 'trendOverlay'
    };

    function controllerFn($scope) {
    }

    function linkFn($scope, $element, $attrs, ctrl) {
      var vm = ctrl;
      vm.filterText = 'Filter';
      vm.showFilter = false;
      vm.filterDateText = '';
      vm.trendBtnText = 'See crime trends for ' + PLUS_CUSTOMER_AGENCY.agency_name;
      vm.showResetButton = false;

      $scope.$watch(angular.bind(vm, function () {
        return this.urlParams;
      }), function (urlParams) {
        if (_.isUndefined(urlParams)) {
          vm.filterDateText = '';
          return;
        }
        vm.disableResetButton = _.isEmpty(_.difference(getParamValues(urlParamsAdapter.getDefaultParams()), getParamValues(urlParams)));
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
      }, true);

      $document.on('click', function (e) {
        if ($(e.target).parents('.trend-overlay').length === 0 && $(e.target).parents('.declaimer-modal').length === 0) {
          //If click outside sidebar
          closeFilerDropDown();
        }
      });

      $scope.$watch(angular.bind(vm, function () {
        return this.historicData;
      }), function (data) {
        vm.incidentsCount = _.inject(data, function (sum, datum) {
          return sum + (_.isUndefined(datum.count) ? 1 : datum.count);
        }, 0);
      }, true);

      vm.isChartActive = function (crimeCategory) {
        return !vm.partialCategoryFilter || crimeCategory === vm.partialCategoryFilter;
      };

      vm.toggleFilter = function () {
        vm.showFilter = !vm.showFilter;
        if (vm.showFilter) {
          vm.filterText = 'Apply';
          vm.showResetButton = true;
        } else {
          vm.filterText = 'Filter';
          vm.showResetButton = false;
          $scope.$broadcast('CustomFilterDropDown::Closing');
          $scope.$broadcast('CustomFilter::ApplyChanges');
        }
      };

      vm.getTipsyText = function (category, count) {
        return count + ' ' + titleCaseString(category) + ' crimes<br/>over ' + vm.days + ' days';
      };

      vm.onChartSelect = function (crimeCategory) {
        if (vm.partialCategoryFilter && vm.partialCategoryFilter == crimeCategory) {
          $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', null);
        } else {
          mixpanelHelper.trackEvent('Spark Line Chart Clicked', {crimeName: crimeCategory});
          $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', crimeCategory);
        }
      };

      vm.resetPartialCategoryFilter = function () {
        if (vm.partialCategoryFilter) {
          $scope.$emit('CustomFilter::PartiallyShowCrimeCategory', null);
        }
      };

      vm.resetFilters = function () {
        closeFilerDropDown();
        $scope.$emit('customFilters::changed', urlParamsAdapter.getDefaultParams({}));
      };

      vm.toggleTrendList = function () {
        vm.showTrendsList = !vm.showTrendsList;
        if (vm.showTrendsList) {
          mixpanelHelper.trackEvent('Trends Panel Viewed');
        }
      };

      function titleCaseString(input) {
        return capitalizeEachWord(input.replace(/-/g, ' '));
      }

      function capitalizeEachWord(input) {
        return input.replace(/\w\S*/g, function (input) {
          return input.charAt(0).toUpperCase() + input.substr(1).toLowerCase();
        });
      }

      function closeFilerDropDown() {
        safeApply($scope, function () {
          vm.showFilter = false;
          vm.filterText = 'Filter';
          vm.showResetButton = false;
          $scope.$broadcast('CustomFilterDropDown::Closing');
        });
      }

      function getParamValues(params) {
        return _.chain(params).values().flatten().sortBy().value();
      }

    }
  }
})();


