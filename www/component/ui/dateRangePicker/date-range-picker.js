(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('dateRangePicker', dateRangePicker);

  function dateRangePicker($ionicPopup, $rootScope, $timeout,$ionicScrollDelegate) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/ui/dateRangePicker/date-range-picker-tmpl.html',
      bindToController: {
        onUpdate: '='
      },
      link: linkFn,
      controller: controllerFn,
      require: ['dateRangePicker', 'ngModel'],
      controllerAs: 'dateRangePicker'
    };

    function controllerFn($scope, $ionicPopup, $rootScope) {
      var vm = this;

    }

    function linkFn($scope, $element, $attrs, ctrls) {
      var vm = ctrls[0],
        ngModel = ctrls[1],
        $$elem = $($element),
        datePickerElems = $$elem.find('.date-picker-input'),
        endDatePickerElem = $$elem.find('.end-date'),
        startDatePickerElem = $$elem.find('.start-date'),
        dateFormat = 'MM/DD/YYYY',
        currentDate = moment().format(dateFormat);

      $timeout(function () {
        var startDate = vm.dateRange[0].split('/'),
          endDate = vm.dateRange[1].split('/');
        $rootScope.test.myFromDate = new Date(startDate[2], startDate[0] - 1, startDate[1]);
        $rootScope.test.myToDate = new Date(endDate[2], endDate[0] - 1, endDate[1]);

      });

      $scope.minDate = '10/01/2015';
      startDatePickerElem.on('click', function () {
        var datePopup = $ionicPopup.confirm({
          template: '<div pickadate ng-model="test.myFromDate" format="mm/dd/yyyy" min-date="dateLimits.minDate" max-date="dateLimits.maxDate"></div>'
        });
        datePopup.then(function (res) {
          if (res) {
            var dateString = $rootScope.test.myFromDate;
            vm.dateRange[0] = dateString;
          }
        });
      });
      endDatePickerElem.on('click', function () {
        var datePopup = $ionicPopup.confirm({
          template: '<div pickadate ng-model="test.myToDate" format="mm/dd/yyyy" min-date="dateLimits.minDate" max-date="dateLimits.maxDate"></div>'
        });
        datePopup.then(function (res) {
          if (res) {
            var dateString = $rootScope.test.myToDate;
            vm.dateRange[1] = dateString;
          }
        });
      });

      vm.range = [];
      vm.presetDateId = '';

      vm.presetDateRanges = [
        {id: '3-days', displayText: 'Past 3 days', start_date: getPreviousDateByDays(3), end_date: currentDate},
        {id: '3-months', displayText: 'Past 3 months', start_date: getPreviousDateByDays(90), end_date: currentDate},
        {id: 'week', displayText: 'Past week', start_date: getPreviousDateByDays(7), end_date: currentDate},
        {id: '6-months', displayText: 'Past 6 months', start_date: getPreviousDateByDays(180), end_date: currentDate},
        {id: 'month', displayText: 'Past month', start_date: getPreviousDateByDays(30), end_date: currentDate}
      ];

      $scope.$on('DateRangePicker::Close', function () {
        datePickerElems.datepicker('hide');
      });

      $scope.$watch(angular.bind(vm, function () {
        return this.presetDateId;
      }), function (presetDateId) {
        var presetDateRange = _.find(vm.presetDateRanges, function (presetDateRange) {
          return presetDateRange.id === presetDateId;
        });
        if (presetDateRange) {
          vm.dateRange = [presetDateRange['start_date'], presetDateRange['end_date']];
        }
         $ionicScrollDelegate.resize();
      });

      $scope.$watchCollection(function () {
        return ngModel.$modelValue;
      }, function (newDateRange) {
        if (!_.isEqual(newDateRange, [].concat(vm.dateRange).reverse())) {
          vm.dateRange = $.extend([], newDateRange);
        }
      });

      $scope.$watchCollection(angular.bind(vm, function () {
        return this.dateRange;
      }), function (newDateRange, oldDataRange) {
        if (_.isUndefined(newDateRange[0])) {
          newDateRange[0] = oldDataRange[0];
        }
        if (_.isUndefined(newDateRange[1])) {
          newDateRange[1] = oldDataRange[1];
        }
        var presetDateRange = _.find(vm.presetDateRanges, function (presetDateRange) {
          return presetDateRange.start_date === newDateRange[0] && presetDateRange.end_date == newDateRange[1];
        });
        if (presetDateRange) {
          vm.presetDateId = presetDateRange['id'];
        } else {
          vm.presetDateId = '';
        }
        ngModel.$setViewValue($.extend([], newDateRange));
      });

      function getPreviousDateByDays(days) {
        return moment().subtract(days, 'days').format(dateFormat);
      }

      //fix for ipad close issue
      startDatePickerElem.on('click', function () {
      });
      endDatePickerElem.on('click', function () {
      });
    }
  }
})();