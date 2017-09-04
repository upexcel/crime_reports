(function () {
  'use strict';
  angular.module('map')
    .directive('mapLayers', mapLayers);
//IS_SINGLE_AGENCY_MODE
  function mapLayers($rootScope, safeApply, $timeout, $filter, mixpanelHelper, globalConstants, urlParamsAdapter, CURRENT_AGENCY, resourceUrls, $document) {
    return {
      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: 'component/map/map-layers-tmpl.html',
      bindToController: {
        shapeGroups: '='
      },
      link: linkFn,
      controller: controllerFn,
      controllerAs: 'mapLayers'
    };

    function controllerFn() {
    }

    function linkFn($scope, $element, $attrs, ctrl) {
      var vm = ctrl,
        shapeGroupNameToConfigMap = {},
        scrollElementIntoViewScrollTopMargin = 150;

      vm.showOverlay = false;
      vm.crimeCategories = globalConstants.CRIME_CATEGORIES;
      vm.crime_details = {};
      vm.shapeGroupNames = [];
      vm.currentShapeIds = {};
      vm.shapeGroupNameToShapesMap = [];
      vm.shapeGroupsLoaded = false;
      vm.layerType = 'map-view';
      vm.mapViewImgUrl = resourceUrls.mapView;
      vm.satViewImgUrl = resourceUrls.satView;
      vm.terrainViewImgUrl = resourceUrls.terrainView;

      $rootScope.$on('MapLayers:ScrollToIncident', function (e, incident_type) {
        vm.showOverlay = true;
        vm.scrollToIncident(incident_type);
      });

      $document.on('click', function (e) {
        safeApply($scope, function () {
          if ($(e.target).parents('.map-layers').length === 0) {
            //If click outside map layers overlay
            vm.showOverlay = false;

          }
        });
      });

      vm.scrollToIncident = function (elementId) {
        $timeout(function () {
          var $selectedIncident = $element.find('#' + $filter('className')(elementId)),
            scrollContainer = $element.find('.map-layers-container'),
            elementOffsetTop = $selectedIncident.offset().top;

          scrollContainer.animate({
            scrollTop: elementOffsetTop + scrollContainer[0].scrollTop - scrollContainer.offset().top - scrollElementIntoViewScrollTopMargin
          }, 300);
          $selectedIncident.addClass('highlight');
          setTimeout(function () {
            $selectedIncident.removeClass('highlight');
          }, 2000);
        }, 300);
      };

      vm.toggleOverlay = function () {
        mixpanelHelper.trackEvent('Map View Option Clicked');
        vm.showOverlay = !vm.showOverlay;
      };

      vm.getDescription = function (crimeType) {
        return _.findWhere(vm.incident_details, {incident_type: crimeType});
      };
//IS_SINGLE_AGENCY_MODE
      if (!_.isEmpty(CURRENT_AGENCY)) {
        if (!_.isEmpty(CURRENT_AGENCY.shapes)) {
          vm.shapeGroupNames = ['City Boundaries'];
          _.each(CURRENT_AGENCY.shapes, function (shapeGroupConfig) {
            shapeGroupNameToConfigMap[shapeGroupConfig.name] = shapeGroupConfig;
            vm.shapeGroupNames.push(shapeGroupConfig.name);
          });
        }
      }

      $scope.$watch(angular.bind(vm, function () {
        return this.shapeGroups;
      }), function (shapeGroups) {
        if (_.isUndefined(shapeGroups)) {
          return;
        } else {
          vm.shapeGroupNameToShapesMap = {};
          _.each(shapeGroups, function (shapeGroup) {
            vm.shapeGroupNameToShapesMap[shapeGroup.name] = shapeGroup;
          });
          vm.shapeGroupsLoaded = true;
        }
      });

      vm.selectShapeGroup = function (newShapeGroupName) {
        var oldShapeGroupName = vm.currentShapeGroupName,
          enabledShapeIds = _.chain(vm.currentShapeIds)
            .omit(function (isTrueValue) {
              return !isTrueValue;
            }).keys().without('false').value(),
          newShapeGroupObjects = getShapeObjects(newShapeGroupName);

        if (newShapeGroupName === oldShapeGroupName) {
          if (enabledShapeIds.length === newShapeGroupObjects.length) {
            //All selected => Unselect All
            vm.currentShapeIds = {};
          } else {
            //Some selected => Select All
            selectAllShapesIn(newShapeGroupName);
          }
          return;
        }

        vm.currentShapeGroupName = newShapeGroupName;
        selectAllShapesIn(newShapeGroupName);
        mixpanelHelper.trackEvent('Map Layer Changed', {shapeGroup: newShapeGroupName});
      };

      $scope.$watchCollection(angular.bind(vm, function () {
        return this.currentShapeIds;
      }), function (newShapeIds) {
        var enabledShapeIds,
          expandedShapeGroupName = (vm.currentShapeGroupName || vm.lastShapeGroupName),
          expandedShapeGroupClassName = $filter('className')(expandedShapeGroupName),
          currentShapeGroupCheckbox = $($element).find('#shape-group-name-' + expandedShapeGroupClassName),
          currentShapeGroupObjects = getShapeObjects(expandedShapeGroupName);

        if (_.isUndefined(newShapeIds)) {
          return;
        }

        enabledShapeIds = _.chain(newShapeIds)
          .omit(function (isTrueValue) {
            return !isTrueValue;
          }).keys().without('false').value();

        if (vm.currentShapeGroupName === '' && enabledShapeIds.length > 0 && vm.lastShapeGroupName) {
          vm.currentShapeGroupName = vm.lastShapeGroupName;
        }

        $($element).find('.shape-group-selector').prop('indeterminate', false);
        vm.currentShapeGroupIndeterminate = false;
        if (enabledShapeIds.length === 0 && currentShapeGroupObjects.length !== 0) {
          // All unselected
          vm.lastShapeGroupName = vm.currentShapeGroupName;
          vm.currentShapeGroupName = '';
        } else if (enabledShapeIds.length < currentShapeGroupObjects.length) {
          // Some selected
          currentShapeGroupCheckbox.prop('indeterminate', true);
          vm.currentShapeGroupIndeterminate = true;
        }

        urlParamsAdapter.update({shapeGroup: vm.currentShapeGroupName, shapeIds: enabledShapeIds.join(',')});
        $timeout(function () {
          $scope.$emit('ShapeFilter::Changed', {
            enabledShapeIds: enabledShapeIds,
            shapeGroupConfig: shapeGroupNameToConfigMap[vm.currentShapeGroupName],
            currentShapeGroupName: vm.currentShapeGroupName,
            shapeGroup: vm.shapeGroupNameToShapesMap[vm.currentShapeGroupName]
          });
        }, 0);
      }, true);

      vm.showShapeGroup = function (shapeGroupName) {
        return vm.currentShapeGroupName === shapeGroupName ||
          (vm.lastShapeGroupName === shapeGroupName && vm.currentShapeGroupName === '');
      };

      vm.getShapeObjects = getShapeObjects;

      vm.mapLayerChanged = function (type) {
        if (type === vm.layerType) {
          return;
        }
        mixpanelHelper.trackEvent('Map Layer Changed', {LayerType: type});
        vm.layerType = type;
        $rootScope.$emit('MapLayer::changed', type);
      };

      function selectAllShapesIn(shapeGroupName) {
        vm.currentShapeIds = {};
        _.each(vm.getShapeObjects(shapeGroupName), function (shapeObj) {
          vm.currentShapeIds[shapeObj.shape_id] = true;
        });
      }

      function getShapeObjects(shapeGroupName) {
        return (vm.shapeGroupNameToShapesMap[shapeGroupName] || {shapes: []}).shapes;
      }
    }
  }
})();