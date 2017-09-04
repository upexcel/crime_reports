(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('daysOfWeekSelector', daysOfWeekSelector);

  function daysOfWeekSelector($ionicScrollDelegate) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/ui/daysOfWeekSelector/days-of-week-selector-tmpl.html',
      bindToController: {
        onUpdate: '='
      },
      link: linkFn,
      controller: controllerFn,
      require: ['daysOfWeekSelector', 'ngModel'],
      controllerAs: 'daysOfWeekSelector'
    };

    function controllerFn($scope) {
    }

    function linkFn($scope, $element, $attrs, ctrls) {
      var vm = ctrls[0],
        ngModel = ctrls[1];

      vm.days = [];
      vm.daysOfWeek = [
        {label: 'S', value: 'sunday'},
        {label: 'M', value: 'monday'},
        {label: 'Tu', value: 'tuesday'},
        {label: 'W', value: 'wednesday'},
        {label: 'Th', value: 'thursday'},
        {label: 'F', value: 'friday'},
        {label: 'Sa', value: 'saturday'}
      ];

      $scope.$watchCollection(function () {
        return ngModel.$modelValue;
      }, function (newDays) {
        _.each(vm.daysOfWeek, function (dayOfWeek, index) {
          vm.days[index] = _.contains(newDays, dayOfWeek.value);
        });
      });

      $scope.$watchCollection(angular.bind(vm, function () {
        return this.days;
      }), function (newDays) {
           $ionicScrollDelegate.resize();
        var enabledDays = [];
        _.each(vm.daysOfWeek, function (dayOfWeek, index) {
          if (vm.days[index]) {
            enabledDays.push(dayOfWeek.value);
          }
        });
        ngModel.$setViewValue(enabledDays);
      });
    }
  }
})
();