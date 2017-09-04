(function () {
  'use strict';
  angular.module('crimeApp')
    .factory('urlParamsAdapter', function ($location, globalConstants) {
      var getDefaultParams = function (params) {
        var newParams = {};
        if (_.isEmpty(params) || _.isUndefined(params.incident_types) || _.isEmpty(params.incident_types)) {
          newParams['incident_types'] = _.chain(globalConstants.CRIME_CATEGORIES).omit('911-or-other').values().map(function (subCategorization) {
            return _.values(subCategorization);
          }).flatten().sortBy().value().join(',');
        }
        if (_.isEmpty(params) || (_.isUndefined(params.start_date) && _.isUndefined(params.end_date))) {
          var startDate = moment().subtract(globalConstants.DEFAULT_SEARCH_TIMEFRAME, 'days').toDate();
          newParams['start_date'] = moment(startDate).format('YYYY-MM-DD');
          newParams['end_date'] = moment().format('YYYY-MM-DD');
        }
        if (_.isEmpty(params) || _.isUndefined(params.days) || _.isEmpty(params.days)) {
          newParams['days'] = 'sunday,monday,tuesday, wednesday, thursday, friday, saturday';
        }
        if (_.isEmpty(params) || _.isUndefined(params.days) || _.isEmpty(params.days)) {
          newParams['days'] = 'sunday,monday,tuesday,wednesday,thursday,friday,saturday';
        }
        if (_.isEmpty(params) || (_.isUndefined(params.start_time) && _.isUndefined(params.end_time))) {
          newParams['start_time'] = 0;
          newParams['end_time'] = 23;
        }
        if (_.isEmpty(params) || _.isUndefined(params.include_sex_offenders) || _.isEmpty(params.include_sex_offenders)) {
          newParams['include_sex_offenders'] = 'false';
        }
        if (_.isEmpty(params) || _.isUndefined(params.shape_column) || _.isEmpty(params.shape_column)) {
          newParams['shape_column'] = '';
        }
        if (_.isEmpty(params) || _.isUndefined(params.shape_ids) || _.isEmpty(params.shape_ids)) {
          newParams['shape_ids'] = '';
        }
        if (_.isEmpty(params) || _.isUndefined(params.zoom) || _.isEmpty(params.zoom)) {
          newParams['zoom'] = 14;
        }
        return newParams;
      };
      return {
        getLatLngZoom: function (vanityAgency) {
          var urlParams = $location.search();
          if (!_.isEmpty(urlParams.lat) && !_.isEmpty(urlParams.lng) && !_.isEmpty(urlParams.zoom)) {
            return {
              centerOnLoad: new L.LatLng(Number(urlParams.lat), Number(urlParams.lng)),
              zoomOnLoad: Number(urlParams.zoom),
              isDefault: false
            };
          } else if (vanityAgency && vanityAgency.plus_enabled && vanityAgency.center && vanityAgency.center.coordinates && vanityAgency.center.coordinates.length == 2) {
            return {
              centerOnLoad: new L.LatLng(vanityAgency.center.coordinates[1], vanityAgency.center.coordinates[0]),
              zoomOnLoad: globalConstants.VANITY_AGENCY_DEFAULT_MAP_ZOOM,
              isDefault: false
            };
          } else {
            return {
              centerOnLoad: new L.LatLng(globalConstants.DEFAULT_MAP_LOCATION.latitude, globalConstants.DEFAULT_MAP_LOCATION.longitude),
              zoomOnLoad: globalConstants.DEFAULT_MAP_ZOOM,
              isDefault: true
            };
          }
        },
        update: function (newParams) {
          $location.search($.extend({}, $location.search(), newParams));
        },
        setDefaultParams: function () {
          var newParams = getDefaultParams($location.search());
          $location.search($.extend({}, $location.search(), newParams));
        },
        getDefaultParams: getDefaultParams
      };
    });
})();