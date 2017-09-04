(function () {
  'use strict';
  angular.module('crimeApp').factory('clusterMapConfig', function ($filter) {

    return {
      createMapWithDefaultConfig: createMapWithDefaultConfig,
      markerIconFor: markerIconFor,
      createClusterGroupWithDefaultConfig: createClusterGroupWithDefaultConfig,
      createPolygons: createPolygons,
      createShapeLayerGroup: createShapeLayerGroup,
      stylePolygonShape: stylePolygonShape
    };
    function createShapeLayerGroup () {
      return L.layerGroup();
    }

    function stylePolygonShape (shapeId, shapeObj, isSelected, isPlusCustomerMode) {
      shapeObj.layer.setStyle({
        clickable: false,
        fill: false,
        color: false,
        className: 'shape ' + shapeObj.type + ' ' + shapeId + (isSelected ? ' selected' : '')
      });
    }

    function createMapWithDefaultConfig (mapElement, locationArgs) {
      var map = L.mapbox.map(mapElement, 'mapbox.emerald', {
        attributionControl: {
          compact: true
        },
        zoomControl: false,
        minZoom: 1
      });
      // --For integration test--
      mapElement.mapboxMap = map;
      // --For integration test--
      new L.Control.Zoom({
        position: 'bottomleft'
      }).addTo(map);
      map.setView(locationArgs.centerOnLoad, locationArgs.zoomOnLoad);
      return map;
    }

    function createClusterGroupWithDefaultConfig (args) {
      var clusterGroup = new L.MarkerClusterGroup(_.merge(args, {}, {
        chunkedLoading: true,
        animateAddingMarkers: true,
        animate: true,
        removeOutsideVisibleBounds: true,
        chunkInterval: 200,
        chunkDelay: 25,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        spiderfyDistanceMultiplier: 1.5,

        iconCreateFunction: function (cluster) {
          var markers = cluster.getAllChildMarkers(),
            type = (markers[0].position.type),
            counts = {},
            totalCount = 0,
            iconParams = {};
          _.each(markers, function (cluster) {
            counts[cluster.position.category] = (counts[cluster.position.category] || 0) + (cluster.position.count || 1);
            totalCount = totalCount + (cluster.position.count || 1);
          }, 0);
          cluster.clusterType = type;
          return L.divIcon(clusterMarkerIcon(counts, totalCount, type));
        }
      }));
      return clusterGroup;
    }

    function stripString (str) {
      return (str || '').replace(/^\s*/g, '').replace(/\s+$/g, '');
    }

    function hypenatedString (str) {
      return stripString(str).replace('/', '').toLowerCase().replace(/\s+/g, '-');
    }

    function getClusterClassForCount (count) {
      if (count >= 100) {
        return 'high';
      } else if (count >= 10) {
        return 'medium';
      } else {
        return 'low';
      }
    }

    function markerIconFor (position, isPlusCustomerMode) {
      var iconParams = {
        iconSize: null,
        html: '',
        className: ''
      };

      if (position.type === 'cluster') {
        var counts = {};
        counts[position.category] = [position.count];
        iconParams = clusterMarkerIcon(counts, position.count, 'cluster');
      } else {
        iconParams.className = iconParams.className + ' marker-id-' + position.id + ' icon-' + position.subCategory;

        if (position.subCategory == 'no-data-agency') {
          var displayText = '<div class="no-data-pin">No data for ' + position.baseData.agency_name + '</div>',
            onHoverText = '<p class="no-data-flyout">This department is not currently sharing data through CrimeReports. <a href="javascript:void(0)">Click to learn more.</a></p>';
          iconParams.html = iconParams.html + displayText + onHoverText;
          iconParams.className = iconParams.className + ' no-icon-font';
        } else if (position.type === 'agency') {
          iconParams.className = iconParams.className + ' no-icon-font';
          if (position.baseData.plus_enabled) {
            iconParams.className = iconParams.className + ' plus-customer';
          }
          if (isPlusCustomerMode && IS_WIDGET) {
            iconParams.className += ' hide-agency-icon';
          }
          if (position.baseData.plus_enabled && !isPlusCustomerMode) {
            var exploreText = '<strong>Explore <span>the data<br/>' + position.baseData.agency_name + '</span></strong>';
            iconParams.html = iconParams.html + exploreText;
          }
        } else if (position.type === 'crime' || position.type === 'sex-offender') {
          iconParams.className = iconParams.className + ' category-' + $filter('className')(position.category || '');
        }
      }

      return L.divIcon(iconParams);
    }

    function clusterMarkerIcon (counts, totalCount, type) {
      var density = getClusterClassForCount(totalCount),
        iconParams = {
          iconSize: null
        },
        countsArray = _.map(counts, function (count, type) {
          return {
            count: count,
            type: $filter('className')(type || ''),
            title: type.replace(/[^\w\s&]/gi, ' ')
          };
        });

      if (type === 'agency') {
        iconParams.html = totalCount;
        iconParams.className = 'marker-cluster type-agency density-' + density;
      } else if (type === 'cluster') {
        iconParams.html = getDonutHtml(countsArray, totalCount, density);
        iconParams.className = 'donut-marker-cluster';
      } else {
        iconParams.html = '<span>' + totalCount + '</span>';
        iconParams.className = 'marker-cluster type-crime density-' + density;
      }


      return iconParams;
    }

    function pieChartRadius (density) {
      switch (density) {
        case 'high':
          return 23;
        case 'medium':
          return 18;
        default:
          return 14;
      }
    }

    function getDonutHtml (countsArray, totalCount, density) {
      var radius = pieChartRadius(density),
        innerHoleRadius = radius - 8,
        arc = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(radius),
        layout = d3.layout.pie().value(function (d) {
          return d.count;
        }).sort(null),
        stacks = layout(countsArray);

      return '<svg width="' + (radius * 2) + 'px" height="' + (radius * 2) + 'px">' +
        '<g transform="translate(' + radius + ',' + radius + ')">' +
        _.map(stacks, function (stack) {
          return '<path class="pie ' + stack.data.type + '" d="' + arc(stack) + '"></path>';
        }).join('') +
        '<circle class="hole" cx="0" cy="0" r="' + innerHoleRadius + '"></circle>' +
        '<text x="0" y="3" class="count">' + totalCount + '</text>' +
        '</g>' +
        '</svg>';
    }


    function vendorPrefixer (key, value) {
      var vendors = ['webkit', 'moz', 'ms', 'o'],
        vendorStyles = '';

      $.each(vendors, function (index, vendor) {
        vendorStyles += '-' + vendor + '-' + key + ': ' + value + '; ';
      });
      vendorStyles += key + ': ' + value + ';';
      return vendorStyles;
    }

    function createPolygons (shapeId, shapeObj, isSelected, isPlusCustomerMode) {
      if (shapeObj) {
        // For more options https://www.mapbox.com/mapbox.js/api/v2.2.3/l-path/
        var polylineOptions = {
            clickable: false,
            color: '#4285f4',
            weight: '1',
            fill: true,
            fillColor: 'rgba(66,133,244,0.8)',
            opacity: 0.8,
            dashArray: '4, 4'
          },
          entireWorldShape = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        if (isPlusCustomerMode && shapeObj.type !== 'agency') {
          var shapePoints = [];
          shapePoints.push(entireWorldShape);
          _.each(shapeObj.shapeCoords, function (coords) {
            shapePoints.push(coords);
          });
          return [L.polygon(shapePoints, polylineOptions)];
        } else {
          return _.chain(shapeObj.shapeCoords).map(function (coords) {
            if (coords && coords.length > 0) {
              return L.polygon(coords, polylineOptions);
            } else {
              console.warn('Invalid Shape : ' + shapeObj);
              return null;
            }
          }).compact().value();
        }
      } else {
        return [];
      }
    }

  });
})();