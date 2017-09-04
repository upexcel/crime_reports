(function () {
  'use strict';

  angular.module('crimeApp').factory('zoomHelper', function (globalConstants) {

    return {
      getZoomLevel: getZoomLevel
    };
    function sort(data) {
      var sortedValues = _.sortBy(data, function (value) {
        return value;
      });
      var sortedHash = {}, invertedData = _.invert(data);
      _.each(sortedValues, function (val) {
        sortedHash[invertedData[val]] = val;
      });
      return sortedHash;
    }

    function getZoomLevel(radius) {
      var zoomLevels = sort(globalConstants.SEARCH_SELECT_ZOOM), zoom;
      radius = parseInt(radius);
      zoom = _.find(zoomLevels, function (v, k) {
        if (parseInt(k) > radius) {
          return v;
        }
      });
      return zoom || 18;
    }
  });
})();

