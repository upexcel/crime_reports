(function () {
  'use strict';
  angular.module('crimeApp')
    .service('mapState', function () {
      var bounds = new L.latLngBounds(L.latLng(0, 0), L.latLng(0, 0)), userAlert = {},
        exploreAgencyMode = {}, filters = {}, zoom = 1, mapCenter = [];

      return {
        updateBounds: function (viewPortBounds) {
          bounds = viewPortBounds;
        },
        getBounds: function () {
          return bounds;
        },
        updateFilters: function (updatedFilters) {
          filters = updatedFilters;
        },
        getFilters: function () {
          return filters;
        },
        updateZoom: function (updatedZoom) {
          zoom = updatedZoom;
        },
        getZoom: function () {
          return zoom;
        },
        setExploreAgencyMode: function (exploreAgencyData) {
          exploreAgencyMode = exploreAgencyData;
        },
        getExploreAgencyMode: function () {
          return exploreAgencyMode;
        },
        setAlert: function (alert) {
          userAlert = alert;
        },
        getAlert: function () {
          return userAlert;
        },
        updateMapCenter: function (lat, lng) {
          mapCenter = [lat, lng];
        },
        getMapCenter: function () {
          return mapCenter;
        }

      };
    });
})();