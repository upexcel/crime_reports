(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('timeRangePicker', timeRangePicker);

  function timeRangePicker($ionicPopup, $ionicScrollDelegate, $rootScope, ClosePopupService) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/ui/timeRangePicker/time-range-picker-tmpl.html',
      bindToController: {
        onUpdate: '='
      },
      link: linkFn,
      controller: controllerFn,
      require: ['timeRangePicker', 'ngModel'],
      controllerAs: 'timeRangePicker'
    };

    function controllerFn($scope) {
    }

    function linkFn($scope, $element, $attrs, ctrls) {
      var vm = ctrls[0],
        ngModel = ctrls[1];

      vm.presetTimeRanges = [
        {
          id: 'all',
          display: 'All',
          displayRange: '12:00am - 11:59pm',
          startTime: 0,
          endTime: 11,
          startAm: true,
          endAm: false
        },
        {
          id: 'morning',
          display: 'Morning Commute',
          displayRange: '5:00am - 9:59am',
          startTime: 5,
          endTime: 9,
          startAm: true,
          endAm: true
        },
        {
          id: 'school',
          display: 'School Hours',
          displayRange: '8:00am - 2:59pm',
          startTime: 8,
          endTime: 2,
          startAm: true,
          endAm: false
        },
        {
          id: 'evening',
          display: 'Evening Commute',
          displayRange: '4:00pm - 6:59pm',
          startTime: 4,
          endTime: 6,
          startAm: false,
          endAm: false
        },
        {
          id: 'bar',
          display: 'Bar Hours',
          displayRange: '9:00pm - 2:59am',
          startTime: 9,
          endTime: 2,
          startAm: false,
          endAm: true
        }
      ];

      vm.timeRanges = [
        {label: '12:00', endLabel: '1:00', hourOfDay: 0},
        {label: '1:00', endLabel: '2:00', hourOfDay: 1},
        {label: '2:00', endLabel: '3:00', hourOfDay: 2},
        {label: '3:00', endLabel: '4:00', hourOfDay: 3},
        {label: '4:00', endLabel: '5:00', hourOfDay: 4},
        {label: '5:00', endLabel: '6:00', hourOfDay: 5},
        {label: '6:00', endLabel: '7:00', hourOfDay: 6},
        {label: '7:00', endLabel: '8:00', hourOfDay: 7},
        {label: '8:00', endLabel: '9:00', hourOfDay: 8},
        {label: '9:00', endLabel: '10:00', hourOfDay: 9},
        {label: '10:00', endLabel: '11:00', hourOfDay: 10},
        {label: '11:00', endLabel: '12:00', hourOfDay: 11}
      ];

      vm.startTime = vm.startTime || 0;
      vm.endTime = vm.endTime || 23;
      vm.startAm = true;
      vm.endAm = false;
      vm.presetTimeId = '';
      vm.enablePresetTimeRange = false;

      vm.selectStartTime = function () {
        $scope.startTime = new Date();
        $scope.startTime.setHours(vm.startTime);
        $scope.startTime = $scope.startTime.getTime();
        var datePopup = $ionicPopup.confirm({
          template: '<better-time-picker start-time-picker="true" start-am="' + vm.startAm + '" end-am="' + vm.endAm + '" selected-hour-date="' + $scope.startTime + '"></better-time-picker>',
          cssClass: 'time-picker',
          buttons: [
            {
              text: 'Done',
              onTap: function (e) {
                return e;
              }
            }]
        });
        ClosePopupService.register(datePopup);
        datePopup.then(function (res) {
          if (res) {
            if (vm.startAm > 12) {
              vm.startAm = false;
            } else {
              vm.startAm = true;
            }
            vm.startTime = new Date($rootScope.selectedHourDate).getHours();
          }
        });
      };
      vm.selectEndTime = function () {
        $scope.endTime = new Date();
        $scope.endTime.setHours(vm.endTime);
        $scope.endTime.setMinutes(0);
        $scope.endTime = $scope.endTime.getTime();
        var datePopup = $ionicPopup.confirm({
          template: '<better-time-picker start-time-picker="false" start-am="' + vm.startAm + '" end-am="' + vm.endAm + '" selected-hour-date="' + $scope.endTime + '"></better-time-picker>',
          cssClass: 'time-picker',
          buttons: [
            {
              text: 'Done',
              onTap: function (e) {
                return e;
              }
            }]
        });
        ClosePopupService.register(datePopup);
        datePopup.then(function (res) {
          if (res) {
            var endTime = new Date($rootScope.selectedHourDate).getHours();
            if (endTime >= 12) {
              vm.endAm = false;
              vm.endTime = endTime;
            } else {
              vm.endAm = true;
              vm.endTime = endTime;
            }
          }
        });
      };
      $scope.$watch(angular.bind(vm, function () {
        return this.presetTimeId;
      }), function (presetTimeId) {
        var presetTimeRange = _.find(vm.presetTimeRanges, function (presetTimeRange) {
          return presetTimeRange.id === presetTimeId;
        });
        if (presetTimeRange) {
          vm.startTime = presetTimeRange.startTime;
          vm.startAm = presetTimeRange.startAm;
          vm.endTime = presetTimeRange.endTime;
          vm.endAm = presetTimeRange.endAm;
        }
         $ionicScrollDelegate.resize();
      });
      $scope.$watch(function () {
        return ngModel.$modelValue;
      }, function (newRange, oldRange) {
        newRange = newRange || [];
        var railwayStartTime = newRange[0] || 0,
          railwayEndTime = _.isUndefined(newRange[1]) ? 23 : newRange[1];
        vm.startAm = railwayStartTime <= 11;
        vm.endAm = railwayEndTime <= 11;

        vm.startTime = railwayStartTime % 12;
        vm.endTime = railwayEndTime % 12;
        var presetTime = _.find(vm.presetTimeRanges, function (presetTimeRange) {
          return (vm.startTime == presetTimeRange.startTime && vm.endTime == presetTimeRange.endTime && vm.startAm == presetTimeRange.startAm && vm.endAm == presetTimeRange.endAm);
        });
        vm.presetTimeId = _.isUndefined(presetTime) ? '' : presetTime['id'];
      });
      $rootScope.$on('customFilters::reset', function (ev, defaultparms) {
        vm.presetTimeId = vm.presetTimeRanges[0].id;
      });
      $scope.$watchCollection(angular.bind(vm, function () {
        return [this.startTime, this.endTime, this.startAm, this.endAm];
      }), function (params) {
        var startAm = params[2],
          endAm = params[3],
          railwayStartTime = params[0] + (startAm ? 0 : 12),
          railwayEndTime = params[1] + (endAm ? 0 : 12);
        if (railwayStartTime > 23)
          railwayStartTime = railwayStartTime - 12;
        if (railwayEndTime > 23)
          railwayEndTime = railwayEndTime - 12;
        ngModel.$setViewValue([railwayStartTime, railwayEndTime]);
      });
    }
  }
})
();