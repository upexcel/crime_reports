angular.module('app.filter', [])
  .filter('titleCase', function () {
    return function (input) {
      if (input) {
        input = input.replace(/-/g, ' ');
        input = input || '';
        return input.replace(/\w\S*/g, function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      }
    };
  })
  .filter('stop911', function () {
    return function (input, view) {
      if (input === 'Other') {
        var text = view == 'trends' ? 'Stops and 911 Calls' : 'Stops / 911';
        return text;
      } else {
        return input;
      }
    };
  })
  .filter('replace', function () {
    return function (input) {
        if(input){
            return input.toLowerCase().replace(/[ /]/g, '-');
        } else{
            return input;
        }
    };
  })
  .filter('startFrom', function () {
    return function (input, start) {
      start = +start; // parse to int
      return input.slice(start);
    };
  })
  .filter('removetag', function () {
    return function (input) {
      if (input)
        return input.replace(/<\/?[^>]+(>|$)/g, ' ');
    };
  })
  .filter('dateformat', function () {
    return function (input) {
      var arr = input.split('-');
      var month = arr[1];
      switch (arr[1]) {
        case '01':
          month = 'Jan';
          break;
        case '02':
          month = 'Feb';
          break;
        case '03':
          month = 'Mar';
          break;
        case '04':
          month = 'Apr';
          break;
        case '05':
          month = 'May';
          break;
        case '06':
          month = 'Jun';
          break;
        case '07':
          month = 'Jul';
          break;
        case '08':
          month = 'Aug';
          break;
        case '09':
          month = 'Sep';
          break;
        case '10':
          month = 'Oct';
          break;
        case '11':
          month = 'Nov';
          break;
        case '12':
          month = 'Dec';
          break;

      }
      if (arr[2] < 10)
        arr[2] = arr[2].replace(/^0/, '');
      var date = month + ' ' + arr[2] + ', ' + arr[0];
      return date;
    };
  })
  .filter('errormsg', function () {
    return function (input) {
//                return input.replace(/<\/?[^>]+(>|$)/g, " ");
    };
  })
  .filter('className', className)
  .filter('sortlistby', function () {
    return function (data, allData, sortby, startindex, lastindex) {
      var sortedData;
      switch (sortby) {
        case 'incident_type_primary': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.incident_type_primary;

            if (o.sex_offender_id)
              return o.type;
          });
          break;
        }
        case '-incident_type_primary': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.incident_type_primary;

            if (o.sex_offender_id)
              return o.type;
          });
          sortedData = sortedData.reverse();
          break;
        }
        case 'created_at': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.incident_datetime;
            if (o.sex_offender_id)
              return o.created_at;
          });
          sortedData = sortedData.reverse();
          break;
        }
        case '-created_at': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.incident_datetime;
            if (o.sex_offender_id)
              return o.created_at;
          });

          break;
        }
        case 'parent_incident_type': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.parent_incident_type;
            if (o.sex_offender_id)
              return o.type;
          });
          break;
        }
        case '-parent_incident_type': {
          sortedData = _.sortBy(allData, function (o) {
            if (o.incident_id)
              return o.parent_incident_type;
            if (o.sex_offender_id)
              return o.type;
          });
          sortedData = sortedData.reverse();
          break;
        }
      }
      var redata = sortedData.slice(startindex, lastindex);
      startindex = lastindex;
      return redata;
    };
  });
function className() {
  return function (input) {
    return (prependUnderscore(input || '')).toLowerCase().replace(/[^a-z0-9_]/g, '-');
  };
}
function prependUnderscore(inputString) {
  var firstLetter = Number(inputString.split('')[0]),
    formattedString = inputString;
  if (_.isNumber(firstLetter) && !_.isNaN(firstLetter)) {
    formattedString = '_' + inputString;
  }
  return formattedString;
}