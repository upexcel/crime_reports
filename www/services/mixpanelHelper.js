(function () {
  'use strict';
  angular.module('crimeApp')
    .service('mixpanelHelper', function ($rootScope) {
      return {
        trackFilterChanges: function (oldFilters, newFilters) {
          var trackParams = {
            'Day of week Changed': false,
            'Data Filter Changed': false,
            'Time Filter Changed': false,
            'Incident Filter Changed': false,
            'Sex Offender Changed': false
          };
          if (!_.isEqual(oldFilters.start_date, newFilters.start_date) || !_.isEqual(oldFilters.end_date, newFilters.end_date)) {
            trackParams['Data Filter Changed'] = true;
          }
          if (!_.isEqual(oldFilters.start_time, newFilters.start_time) || !_.isEqual(oldFilters.end_time, newFilters.end_time)) {
            trackParams['Time Filter Changed'] = true;
          }
          if (!_.isEqual(oldFilters.incident_types, newFilters.incident_types)) {
            trackParams['Incident Filter Changed'] = true;
          }
          if (!_.isEqual(oldFilters.days, newFilters.days)) {
            trackParams['Day of week Changed'] = true;
          }
          if (!_.isEqual(oldFilters.include_sex_offenders, newFilters.include_sex_offenders) && !(_.isUndefined(oldFilters.include_sex_offenders) && (newFilters.include_sex_offenders == 'false'))) {
            trackParams['Sex Offender Changed'] = true;
          }
          $rootScope.$emit('trackedUserAction', {
            eventName: 'Filters Changed',
            params: trackParams
          });
        },
        trackMapClick: function (position) {
          if (!_.isUndefined(position))
            if (position.type === 'agency') {
              $rootScope.$emit('trackedUserAction', {
                eventName: 'Agency clicked',
                params: {
                  plusAgency: (position.baseData.plus_enabled == 'true' || position.baseData.plus_enabled == true),
                  name: position.baseData.agency_name
                }
              });
            } else {
              $rootScope.$emit('trackedUserAction', {
                eventName: 'Map Icon clicked',
                params: {
                  type: position.type,
                  category: position.category,
                  subCategory: position.subCategory,
                  incidentType: position.incidentType
                }
              });
            }
        },
        trackEvent: function (eventName, params) {
          var trackParams = {};
          if (_.isUndefined(eventName)) {
            return;
          }
          trackParams['eventName'] = eventName;
          if (!_.isUndefined(params)) {
            trackParams['params'] = params;
          }
          $rootScope.$emit('trackedUserAction', trackParams);
        }
      };
    });
})
();
