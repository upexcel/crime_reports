(function () {
    'use strict';
    angular.module('crimeApp').factory('Position', function (util, $sce) {
        return function (data, type, count, meta) {
            var position = this;

            position.id = data.primary_key;
            position.type = type;
            position.subType = getSubType(data, type);
            position.meta = meta || {}; // For crime positions, meta will be the agency where the incident ocurred.
            position.location = getLocation(data, type);
            position.count = count || 1;
            position.baseData = data;

            if (position.baseData && position.baseData.incident_description) {
                var description = position.baseData.incident_description || '';
                position.baseData.incident_description = description.replace(/<br\/?>(\s*<br\/?>)*/, '<br/>');
            }

            if (position.type === 'sex-offender') {
                var desc = 'Name: ' + position.baseData.name + ', ';
                desc = desc + 'Race: ' + position.baseData.race + ', ';
                desc = desc + 'Sex: ' + position.baseData.sex + ', ';
                desc = desc + 'Age: ' + position.baseData.age + ', ';
                desc = desc + 'Height: ' + position.baseData.height + ', ';
                desc = desc + 'Weight: ' + position.baseData.weight + ', ';
                desc = desc + 'Eye Color: ' + position.baseData.eye_color + ', ';
                desc = desc + 'Hair Color: ' + position.baseData.hair_color;
                position.combinedSexOffenderDescription = desc;
            }

            if (position.type === 'agency') {
                position.category = 'agency';
                if (position.baseData.account_type == 'Missing') {
                    position.subCategory = 'no-data-agency';
                } else {
                    position.subCategory = (position.baseData.agency_type === 'Police Dept') ? 'agency' : 'sheriff';
                }
                position.incidentType = position.subCategory;
            } else if (data.categorization) {
                position.category = data.categorization.category;
                position.subCategory = data.categorization.sub_category;
                position.incidentType = data.categorization.incident_type;
            } else {
                position.category = data.category || type;
                position.subCategory = type;
                position.incidentType = type;
            }
        };

        function getSubType(data, type) {
            if (type === 'agency') {
                return 'agency';
            } else if (type === 'cluster') {
                return 'cluster';
            } else if (type === 'sex-offender') {
                return 'sex-offender';
            } else if (type === 'crime') {
                return util.hypenatedString(data.crime_category || 'na');
            } else {
                return 'na';
            }
        }

        function getLocation(data, type) {
            if (type === 'agency' && data.center) {
                return {
                    longitude: data.center.coordinates[0],
                    latitude: data.center.coordinates[1]
                };
            } else if (type === 'cluster' && data.snap) {
                return {
                    longitude: data.snap.coordinates[0],
                    latitude: data.snap.coordinates[1]
                };
            } else if ((type === 'sex-offender' || type === 'crime') && data.location) {
                return {
                    longitude: data.location.coordinates[0],
                    latitude: data.location.coordinates[1]
                };
            } else {
                console.warn('Location info not found for ' + type);
                //console.warn(data)
            }
        }
    });
})();