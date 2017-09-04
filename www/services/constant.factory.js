(function () {
    'use strict';
    angular.module('crimeApp')
            .service('constantFactory', function (globalConstants) {
                return {
                    setData: function (data) {
                        _.forEach(data, function (value, key) {
                            globalConstants[key] = data[key];
                        });
                    }
                }
            });
})();