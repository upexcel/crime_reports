(function () {
  'use strict';
  angular.module('crimeApp')
    .directive('crimeTypePicker', crimeTypePicker);
  function crimeTypePicker(globalConstants, $rootScope, $timeout, $ionicScrollDelegate) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/ui/crimeTypePicker/crime-type-picker-tmpl.html',
      bindToController: {},
      link: linkFn,
      controller: controllerFn,
      require: ['crimeTypePicker', 'ngModel'],
      controllerAs: 'crimeTypePicker'
    };
    function controllerFn($scope) {
    }

    function linkFn($scope, $element, $attrs, ctrls) {
      var vm = ctrls[0],
        ngModel = ctrls[1],
        all_incidents = document.getElementById('all_incidents');
      vm.crimeCategories = globalConstants.CRIME_CATEGORIES;
      vm.crimeTypes = {};
      vm.reset = false;
      $rootScope.$on('customFilters::reset', function () {
        vm.reset = true;
        $timeout(function () {
          var diff = _.difference(getAllCrimeCategories(), globalConstants.CRIME_FILTER);
          _.each(diff, function (crimeType) {
            vm.crimeTypes[crimeType] = false;
          });
          _.each(globalConstants.CRIME_FILTER, function (crimeType) {
            vm.crimeTypes[crimeType] = true;
          });
        }, 100);

      });
      vm.toggleCrimeSubCategory = function (crimeTypes) {
        var allEnabled = _.every(crimeTypes, function (crimeType) {
          return vm.crimeTypes[crimeType];
        });
        _.each(crimeTypes, function (crimeType) {
          vm.crimeTypes[crimeType] = allEnabled ? false : true;
        });
      };
      $scope.$watchCollection(function () {
        return ngModel.$modelValue;
      }, function (newCrimeTypes) {
        if (!vm.reset) {
          _.each(newCrimeTypes, function (crimeType) {
            vm.crimeTypes[crimeType] = true;
          });
        }
      });
      $scope.$watchCollection(angular.bind(vm, function () {
        return this.crimeTypes;
      }), function (newCrimeTypes) {
        var allCrimeTypes = getAllCrimeCategories();
        var enabledCrimeTypes = _.chain(newCrimeTypes)
          .omit(function (isSelected, _) {
            return !isSelected;
          }).keys().without('false').value();
        if (_.isEmpty(enabledCrimeTypes)) {
          vm.selectAll = false;
          all_incidents.indeterminate = false;
        } else if (allCrimeTypes.length == enabledCrimeTypes.length) {
          vm.selectAll = true;
          all_incidents.indeterminate = false;
        } else {
          vm.selectAll = undefined;
          all_incidents.indeterminate = true;
        }
        ngModel.$setViewValue(enabledCrimeTypes);
         $ionicScrollDelegate.resize();
      });
      $scope.$watchCollection(function () {
        return vm.selectAll;
      }, function (allSelected) {
        if (_.isUndefined(allSelected)) {
          return;
        }
        toggleAllCrimeSubCategory(allSelected);
      });
      function getAllCrimeCategories() {
        var allCrimeCategories = [];

        _.each(_.values(vm.crimeCategories), function (crimeSubCategories) {
          _.each(_.values(crimeSubCategories), function (crimes) {
            _.each(crimes, function (crime) {
              allCrimeCategories.push(crime);
            });
          });
        });
        return allCrimeCategories;
      }

      function getAllCrimeCategories1() {
        return _.flatten(_.map(_.values(vm.crimeCategories), function (crimeSubCategories) {
          return _.values(crimeSubCategories);
        }));
      }

      $scope.$on('CrimeTypePicker::enableCrimeCategories', function (e, crimeTypes) {
        _.each(crimeTypes, function (crimeType) {
          vm.crimeTypes[crimeType] = true;
        });
      });
      function toggleAllCrimeSubCategory(enableAll) {
        var crimesToToggle = getAllCrimeCategories();
        _.each(crimesToToggle, function (crimeType) {
          vm.crimeTypes[crimeType] = enableAll;
        });
      }
    }
  }
})();