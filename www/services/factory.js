angular.module('app.factory', [])
  .factory('ApiParams', [function () {
    var data = {};
    var getData = function () {
      return data;
    };
    var setData = function (value) {
      data = value;
    };
    return {
      getData: getData,
      setData: setData
    };
  }]);