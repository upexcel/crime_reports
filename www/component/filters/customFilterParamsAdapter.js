(function () {
  'use strict';

  angular.module('crimeApp').factory('customFilterParamsAdapter', function () {
    var urlParamsDateFormat = 'YYYY-MM-DD',
      filterParamsDateFormat = 'MM/DD/YYYY';
    return {
      formatFilterParamsToUrlParams: formatFilterParamsToUrlParams,
      parseFilterParamsFromUrlParams: parseFilterParamsFromUrlParams
    };

    function formatDate(date, format) {
      var res = moment(date).format(format || urlParamsDateFormat);
      return res;
    }

    function formatFilterParamsToUrlParams(filterParams) {
      var urlParams = {
        start_date: null,
        end_date: null,
        start_time: null,
        end_time: null,
        days: null,
        incident_types: null,
        include_sex_offenders: 'false',
        shape_column: "",
        shape_ids: "",
        zoom: 14
      };

      if (!_.isEmpty(filterParams.dateRange)) {
        if (!_.isUndefined(filterParams.dateRange[0])) {
          urlParams['start_date'] = formatDate(filterParams.dateRange[0], urlParamsDateFormat);
        }
        if (!_.isUndefined(filterParams.dateRange[1])) {
          urlParams['end_date'] = formatDate(filterParams.dateRange[1], urlParamsDateFormat);
        }
      }
      if (!_.isEmpty(_.compact(filterParams.days))) {
        urlParams['days'] = _.compact(filterParams.days).join(',');
      }
      if (!_.isUndefined(filterParams.timeRange) && !_.isUndefined(filterParams.timeRange[0])) {
        urlParams['start_time'] = filterParams.timeRange[0];
      }
      if (!_.isUndefined(filterParams.timeRange) && !_.isUndefined(filterParams.timeRange[1])) {
        urlParams['end_time'] = filterParams.timeRange[1];
      }
      if (!_.isEmpty(filterParams.incidentTypes)) {
        urlParams['incident_types'] = filterParams.incidentTypes.join(',');
      }
      urlParams.include_sex_offenders = filterParams.includeSexOffenders.toString();
      return urlParams;
    }

    function parseFilterParamsFromUrlParams(urlParams) {
      var filterParams = {
        dateRange: [],
        timeRange: [],
        days: [],
        incidentTypes: [],
        includeSexOffenders: false
      };
      if (_.isUndefined(urlParams) || _.isEmpty(urlParams)) {
        return;
      }
      if (!_.isUndefined(urlParams.start_date)) {
        filterParams.dateRange[0] = formatDate(urlParams.start_date, filterParamsDateFormat);
      }
      if (!_.isUndefined(urlParams.end_date)) {
        filterParams.dateRange[1] = formatDate(urlParams.end_date, filterParamsDateFormat);
      }
      if (!_.isUndefined(urlParams.start_time)) {
        filterParams.timeRange[0] = urlParams.start_time;
      }
      if (!_.isUndefined(urlParams.end_time)) {
        filterParams.timeRange[1] = urlParams.end_time;
      }
      if (!_.isEmpty(urlParams.days)) {
        filterParams.days = urlParams.days.split(',');
      }
      if (!_.isEmpty(urlParams.incident_types)) {
        filterParams.incidentTypes = urlParams.incident_types.split(',');
      }
      filterParams.includeSexOffenders = (urlParams.include_sex_offenders === 'true');
      return filterParams;
    }
  });
})();