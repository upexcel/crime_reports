(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('removeMap', removeMap);

    function removeMap() {
        var service = {};
        service.checkMapAndRemove = function () {
            try {
                if (Map) {
                    Map.removeLayer(persistentMarkerClusterGroupLayer);
                    Map.removeLayer(shapeLayerGroup)
                    Map.removeLayer(markerClusterGroupLayer)
                    Map.removeLayer(noDataMarkerClusterGroupLayer);
                    Map.remove();
                    Map = false;
                }
            }
            catch (err) {
                console.log(err);
            }
        };
        return service;
    }
})();

