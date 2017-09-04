(function () {
  'use strict';

  angular.module('crimeApp').factory('geometry', function ($localStorage) {
    return {
      distanceBetween: distanceBetween,
      isCoordinatesSubset: isCoordinatesSubset,
      bufferBounds: bufferBounds,
      getDataListWithinViewPort: getDataListWithinViewPort,
      isValidBounds: isValidBounds,
      bufferBoundsByDiff: bufferBoundsByDiff,
      invertShape: invertShape,
      isPositionsWithinBounds: isPositionsWithinBounds,
      getSexoffenderData: getSexoffenderData
    };
    function bufferBoundsByDiff(bounds, latlngDiff) {
      if (!bounds)
        bounds = $localStorage.viewPort.bounds;
      return new L.latLngBounds(
        L.latLng(bounds._northEast.lat + latlngDiff, bounds._northEast.lng + latlngDiff),
        L.latLng(bounds._southWest.lat - latlngDiff, bounds._southWest.lng - latlngDiff)
      );
    }

    function bufferBounds(bounds, ratio) {
      if (!isValidBounds(bounds)) {
        return bounds;
      }
      var latDiff = bounds._northEast.lat - bounds._southWest.lat,
        lngDiff = bounds._northEast.lng - bounds._southWest.lng,
        newNorthEast = L.latLng(bounds._northEast.lat + (latDiff * ratio), bounds._northEast.lng + (lngDiff * ratio)),
        newSouthWest = L.latLng(bounds._southWest.lat - (latDiff * ratio), bounds._southWest.lng - (lngDiff * ratio));

      return new L.latLngBounds(newNorthEast, newSouthWest);
    }

    function isCoordinatesSubset(masterBounds, testBounds) {
      if (!isValidBounds(masterBounds) || !isValidBounds(testBounds)) {
        return false;
      }
      
      return testBounds._northEast.lat <= masterBounds._northEast.lat &&
        testBounds._northEast.lng <= masterBounds._northEast.lng &&
        testBounds._southWest.lat >= masterBounds._southWest.lat &&
        testBounds._southWest.lng >= masterBounds._southWest.lng;
    }

    function isValidBounds(bounds) {
      return bounds && !_.isUndefined(bounds._northEast) && !_.isUndefined(bounds._northEast.lat) && !_.isUndefined(bounds._northEast.lng) && !_.isUndefined(bounds._southWest) && !_.isUndefined(bounds._southWest.lat) && !_.isUndefined(bounds._southWest.lng);
    }

    function distanceBetween(p1, p2) {
      var R = 6378137; // Earth?s mean radius in meter
      var dLat = rad(p2.lat - p1.lat);
      var dLong = rad(p2.lng - p1.lng);
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = (R * c);
      return d; // returns the distance in meters
    }

    function rad(x) {
      return x * Math.PI / 180;
    }

    function getDataListWithinViewPort(dataList, viewPortBounds) {
      if (!viewPortBounds)
        viewPortBounds = $localStorage.viewPort.bounds;
      var viewPortDataList = [];
      _.each(dataList, function (datum) {
        var markerPoint = getLocation(datum.baseData);
        if (_.isUndefined(markerPoint) || _.isUndefined(markerPoint.latitude) || _.isUndefined(markerPoint.longitude)) {
          // Disabling as it is causing console logging is causing performance issue.
          // Removing ionicconsole plugin is ignoring console.log but it is still printing console.warn...
          // console.warn('Not lat long info found for ');
        } else {
          if (Number(markerPoint.latitude) > viewPortBounds._southWest.lat &&
            Number(markerPoint.longitude) > viewPortBounds._southWest.lng &&
            Number(markerPoint.latitude) < viewPortBounds._northEast.lat &&
            Number(markerPoint.longitude) < viewPortBounds._northEast.lng) {
            datum.baseData.meta=datum.meta;
            viewPortDataList.push(datum.baseData);
          }
        }
      });
      return viewPortDataList;
    }
    
    function getSexoffenderData (dataList, viewPortBounds) {
        if (!viewPortBounds)
        viewPortBounds = $localStorage.viewPort.bounds;
      var filteredList = _.filter(dataList, function (datum) {
        if (_.isUndefined(datum.location) || datum.location === null) {
          return;
        } else {
          return (Number(datum.location.latitude) > viewPortBounds._southWest.lat &&
          Number(datum.location.longitude) > viewPortBounds._southWest.lng &&
          Number(datum.location.latitude) < viewPortBounds._northEast.lat &&
          Number(datum.location.longitude) < viewPortBounds._northEast.lng);
        }
      });
      return filteredList;
    }

    function invertShape(shapeObj) {
      var type = (shapeObj.type || '').toLowerCase();
      if (shapeObj.type === 'MultiPolygon') {
        var exteriorRings = [],
          holes = [],
          entireWorldShape = [[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]],
          invertedCoordinates = [];

        _.each(shapeObj.coordinates, function (polygonCoords) {
          exteriorRings.push(polygonCoords[0]);
          holes = holes.concat(polygonCoords.slice(1, polygonCoords.length));
        });

        invertedCoordinates.push([entireWorldShape].concat(exteriorRings));
        _.each(holes, function (hole) {
          invertedCoordinates.push([hole]);
        });
        return {'type': 'MultiPolygon', 'coordinates': invertedCoordinates};
      } else {
        console.warn('Invalid shapObj, cannot inverse!');
        console.warn(shapeObj);
        return shapeObj;
      }
    }
  });

  //TODO Refactor Extract as service
  function getLocation(marker) {
    if (marker.center && marker.center.coordinates) {
      return {
        longitude: marker.center.coordinates[0],
        latitude: marker.center.coordinates[1]
      };
    } else if (marker.latitude && marker.longitude) {
      return marker;
    } else {
      return marker.center;
    }
  }

  function isPositionsWithinBounds(points, bounds) {
    return (points.coordinates[1] > bounds._southWest.lat &&
    points.coordinates[0] > bounds._southWest.lng &&
    points.coordinates[1] < bounds._northEast.lat &&
    points.coordinates[0] < bounds._northEast.lng);
  }

})();