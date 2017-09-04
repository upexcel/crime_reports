(function () {
    'use strict';
    angular.module('crimeApp').directive('gpsLocation', gpsLocation);
    function gpsLocation($rootScope, $localStorage, $state, $q, Alertuser) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'component/gps/gps-tmpl.html',
            bindToController: {
                onMap: '='
            },
            link: linkFn,
            controller: controllerFn,
            controllerAs: 'gpsLocation'
        };
        function controllerFn() {
        }

        function linkFn($scope, $element, $attrs, ctrl) {
            var vm = ctrl;

            //helper function of   $scope.gpsLocation to set gps position
            var options = {
                enableHighAccuracy: true,
                timeout: 5000
            };
            vm.gpsLocation = function () {
                if (!$localStorage.shareUrl) {
                    var def = $q.defer();
                    def.resolve($state.go('app.map'));
                    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, options);
                    def.promise.then(function () {
                        if (navigator && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError, options);
                        }
                    });
                }
            };
            function geolocationSuccess(Position) {
                var view = {
                    lat: Position.coords.latitude,
                    lng: Position.coords.longitude,
                    zoom: 15
                };
                $rootScope.$emit('map.Gpslocation', view);
            }

            function geolocationError(PositionError) {
                Alertuser.alert('Please Enable GPS to access this feature');
            }
        }
    }
})();