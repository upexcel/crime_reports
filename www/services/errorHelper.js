(function () {
  'use strict';
  angular.module('crimeApp')
    .service('errorHelper', function ($filter) {
      var key = '', value = '';

      return {
        getDeviseErrorMessage: function (error) {
          if (_.isUndefined(error)) {
            return;
          }
          if (error.data == null) {
            return 'Check your internet connection.';
          }


          if (!_.isUndefined(error.data) || !null) {
            if (!_.isUndefined(error.data.errors)) {
              key = $filter('titleCase')(_.flatten(_.keys(error.data.errors))[0]);
              value = _.flatten(_.values(error.data.errors))[0];
              value = value.split('Email:');
              return key + '' + value[1];
            } else {
              return _.values(error.data)[0];
            }
          } else {
            return _.values(error)[0];
          }
        }
      };
    });
})();