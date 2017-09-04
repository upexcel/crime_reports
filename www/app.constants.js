(function () {
    'use strict';
    angular
            .module('crimeApp')
            .constant('loginConstants', {
                'twitter_consumerKey': 'wpKd3aR5GqUaJ7bhxPbTCzWpm',
                'consumerSecretKey': 'ANHGyuVeN0Q2Ja6Gf6DJlh5tht6JQRLj2WnOt3AvAXx3WzAAfd'
            })
            .constant('PLUS_CUSTOMER_AGENCY', {})
            .constant('resourceUrls', {
                motorola: 'img/images/motorola.svg',
                socrata: 'img/images/socrata.svg',
                crimeReports: 'img/images/crimereports.svg'
            })
            .constant('CURRENT_AGENCY', {})
            .constant('globalConstants', {
                'accessToken': 'pk.eyJ1Ijoic29jcmF0YSIsImEiOiJjaW45aHd3b2YwNDYxdW5raXQ1bDFnNGF6In0.kwjUkJJQvHbeEyYtwaee5g',
                'default_lat': '38.30718056188316',
                'default_lng': '-98.2177734375',
                API_CALL_WAIT_TIME: 10 * 100,
                 DATA_RETRIEVAL_BUFFER_BOUNDS : 0,
                'APP_TOKEN': 'v1SkHrbzQcyFmlkL9D5W1UXfT',
                'OTHER_CRIMES': ['other', 'proactive policing', 'fire', 'emergency', 'traffic', 'fire', 'road traffic collisions', 'safer neighbourhood activity', 'proactive partnerships', 'other', 'alarm', 'missing person', 'weapons offense', 'community policing', 'vehicle stop', 'pedestrian stop', 'fatal', 'serious injury', 'slight injury', 'damage only', 'historic meeting', 'next meeting', 'historic problems/issues', 'current problems/issues', 'stop/searches', 'local enforcement', 'criminal justice outcomes'],
                'PROPERTY_CRIMES': ['property crime', 'theft of vehicle', 'breaking \u0026 entering', 'theft from vehicle', 'theft', 'vehicle recovery', 'burglary', 'damage', 'theft', 'vehicle crime', 'property crime residential', 'property crime commercial', 'property crime', 'arson', 'house burglary', 'other burglary', 'arson', 'other damage', 'shop theft', 'theft other', 'theft from motor vehicle', 'theft of motor vehicle'],
                'QUALITY_OF_LIFE_CRIMES': ['quality of life', 'anti social behavior', 'drugs', 'disorder', 'liquor', 'drugs', 'littering/drugs paraphernalia', 'neighbours', 'noise', 'nuisance communications', 'rowdy and inconsiderate behaviour', 'street drinking', 'trespass', 'vehicle related nuisance', 'misc asb'],
                'VIOLENT_CRIMES': ['sexual offense', 'assault', 'robbery', 'homicide', 'violence', 'robbery', 'other sexual offense', 'sexual assault', 'assault', 'assault with deadly weapon', 'death', 'family offense', 'kidnapping', 'assault with less serious injury', 'common assaults', 'public order and harrasment', 'serious violence', 'other violence'],
                'CRIME_FILTER': ['Property Crime', 'Property Crime Commercial', 'Property Crime Residential', 'Disorder', 'Drugs', 'Quality of Life', 'Homicide', 'Assault with Deadly Weapon', 'Assault', 'Theft of Vehicle', 'Theft', 'Robbery', 'Breaking & Entering', 'Liquor', 'Theft from Vehicle', 'Kidnapping', 'Sexual Offense', 'Sexual Assault', 'Other Sexual Offense'],
                'CRIME_TYPES': ['Property Crimes', 'Violent Crimes', 'Quality Of Life Crimes', 'Other Crimes', 'Sex Offenders'],
                'TRENDS_ORDER': ['violent', 'property', 'quality-of-life', '911-or-other', 'sex-offender'],
                'DEFAULT_MAP_LOCATION': {'latitude': 39, 'longitude': -95},
                'SEARCH_SELECT_ZOOM': {'1000': 16, '10000': 14, '100000': 12, '250000': 9, '5000000': 5, '10000000': 3},
                'DEFAULT_MAP_ZOOM': 3,
                'DEFAULT_SEARCH_TIMEFRAME': 7,
                'USER_GEOCODE_ZOOM': 12,
                'AGENCY_CENTER_IN_VIEWPORT_BUFFER': 0.7,
                'AGENCIES_VIEWPORT_DISTANCE': 300000,
                'CLUSTER_VIEWPORT_DISTANCE': 20000,
                'API_INDIVIDUAL_CRIME_THRESHOLD': 500,
                'SHOW_AGENCIES_AS_INDIVIDUAL_MAKERS_STARTING_FROM_ZOOM': 8,
                'SERVER_CRIME_CLUSTER_RADIUS': 80,
                'AGENCY_CLUSTER_RADIUS': 80,
                'AGENCY_VIEWPORT_ZOOM': 11,
                CLUSTER_AGENCIES_TILL_ZOOM: 8,
                'SHOW_AGENCY_SHAPEFILES_FROM_ZOOM': 7,
                'INDIVIDUAL_CRIME_CLUSTER_RADIUS': {
                    '1': 40,
                    '2': 40,
                    '3': 40,
                    '4': 40,
                    '5': 40,
                    '6': 40,
                    '7': 40,
                    '8': 40,
                    '9': 40,
                    '10': 40,
                    '11': 40,
                    '12': 13,
                    '13': 13,
                    '14': 15,
                    '15': 15,
                    '16': 15,
                    '17': 15,
                    '18': 17,
                    '19': 17,
                    '20': 20,
                    '21': 20,
                    '22': 20,
                    '23': 20
                },
                'CLUSTER_CRIMES_TILL_ZOOM': 21,
                'CRIME_CATEGORIES': {
                    'violent': {
                        'assault': ['Assault', 'Assault with Deadly Weapon'],
                        'homicide': ['Homicide'],
                        'kidnapping': ['Kidnapping'],
                        'robbery': ['Robbery'],
                        'sexual-offense': ['Other Sexual Offense', 'Sexual Assault', 'Sexual Offense']
                    },
                    'property': {
                        'breaking-and-entering': ['Breaking \u0026 Entering'],
                        'property': ['Property Crime', 'Property Crime Commercial', 'Property Crime Residential'],
                        'theft': ['Theft'],
                        'vehicle': ['Theft from Vehicle', 'Theft of Vehicle']
                    },
                    'quality-of-life': {'disorder': ['Disorder', 'Quality of Life'], 'drugs': ['Drugs'], 'liquor': ['Liquor']},
                    '911-or-other': {
                        'other': ['Alarm', 'Arson', 'Death', 'Family Offense', 'Missing Person', 'Other', 'Pedestrian Stop', 'Vehicle Recovery', 'Vehicle Stop', 'Weapons Offense'],
                        'proactive-policing': ['Community Policing', 'Proactive Policing'],
                        'emergency': ['Emergency'],
                        'fire': ['Fire'],
                        'traffic': ['Traffic']
                    }
                },
                'CRIME_CATEGORIZATION_MAP': {
                    'Assault': {
                        'category': 'violent',
                        'sub_category': 'assault',
                        'incident_type': 'Assault'
                    },
                    'Assault with Deadly Weapon': {
                        'category': 'violent',
                        'sub_category': 'assault',
                        'incident_type': 'Assault with Deadly Weapon'
                    },
                    'Homicide': {'category': 'violent', 'sub_category': 'homicide', 'incident_type': 'Homicide'},
                    'Kidnapping': {'category': 'violent', 'sub_category': 'kidnapping', 'incident_type': 'Kidnapping'},
                    'Robbery': {'category': 'violent', 'sub_category': 'robbery', 'incident_type': 'Robbery'},
                    'Other Sexual Offense': {
                        'category': 'violent',
                        'sub_category': 'sexual-offense',
                        'incident_type': 'Other Sexual Offense'
                    },
                    'Sexual Assault': {'category': 'violent', 'sub_category': 'sexual-offense', 'incident_type': 'Sexual Assault'},
                    'Sexual Offense': {'category': 'violent', 'sub_category': 'sexual-offense', 'incident_type': 'Sexual Offense'},
                    'Breaking \u0026 Entering': {
                        'category': 'property',
                        'sub_category': 'breaking-and-entering',
                        'incident_type': 'Breaking \u0026 Entering'
                    },
                    'Property Crime': {'category': 'property', 'sub_category': 'property', 'incident_type': 'Property Crime'},
                    'Property Crime Commercial': {
                        'category': 'property',
                        'sub_category': 'property',
                        'incident_type': 'Property Crime Commercial'
                    },
                    'Property Crime Residential': {
                        'category': 'property',
                        'sub_category': 'property',
                        'incident_type': 'Property Crime Residential'
                    },
                    'Theft': {'category': 'property', 'sub_category': 'theft', 'incident_type': 'Theft'},
                    'Theft from Vehicle': {
                        'category': 'property',
                        'sub_category': 'vehicle',
                        'incident_type': 'Theft from Vehicle'
                    },
                    'Theft of Vehicle': {'category': 'property', 'sub_category': 'vehicle', 'incident_type': 'Theft of Vehicle'},
                    'Disorder': {'category': 'quality-of-life', 'sub_category': 'disorder', 'incident_type': 'Disorder'},
                    'Quality of Life': {
                        'category': 'quality-of-life',
                        'sub_category': 'disorder',
                        'incident_type': 'Quality of Life'
                    },
                    'Drugs': {'category': 'quality-of-life', 'sub_category': 'drugs', 'incident_type': 'Drugs'},
                    'Liquor': {'category': 'quality-of-life', 'sub_category': 'liquor', 'incident_type': 'Liquor'},
                    'Alarm': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Alarm'},
                    'Arson': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Arson'},
                    'Death': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Death'},
                    'Family Offense': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Family Offense'},
                    'Missing Person': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Missing Person'},
                    'Other': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Other'},
                    'Pedestrian Stop': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Pedestrian Stop'},
                    'Vehicle Recovery': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Vehicle Recovery'},
                    'Vehicle Stop': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Vehicle Stop'},
                    'Weapons Offense': {'category': '911-or-other', 'sub_category': 'other', 'incident_type': 'Weapons Offense'},
                    'Community Policing': {
                        'category': '911-or-other',
                        'sub_category': 'proactive-policing',
                        'incident_type': 'Community Policing'
                    },
                    'Proactive Policing': {
                        'category': 'other',
                        'sub_category': 'proactive-policing',
                        'incident_type': 'Proactive Policing'
                    },
                    'Emergency': {'category': '911-or-other', 'sub_category': 'emergency', 'incident_type': 'Emergency'},
                    'Fire': {'category': 'other', 'sub_category': 'fire', 'incident_type': 'Fire'},
                    'Traffic': {'category': '911-or-other', 'sub_category': 'traffic', 'incident_type': 'Traffic'}
                },
                'CLUSTER_GRID_PRECISION': 0.0005,
                'FORCED_CLUSTER_GRID_PRECISION': {
                    '1': 10,
                    '2': 8,
                    '3': 5,
                    '4': 2,
                    '5': 0.2,
                    '6': 0.5,
                    '7': 0.05,
                    '8': 0.005,
                    '9': 0.005,
                    '10': 0.005,
                    '11': 0.005,
                    '12': 0.005,
                    '13': 0.005,
                    '14': 0.0001,
                    '15': 0.0001,
                    '16': 0.0001,
                    '17': 5.0e-06,
                    '18': 5.0e-06,
                    '19': 5.0e-06,
                    '20': 1.0e-07,
                    '21': 1.0e-07,
                    '22': 1.0e-07,
                    '23': 1.0e-07
                },
                'SITE_URL': 'https://www.crimereports.com',
//                   "SITE_URL": "https://staging-crimereports-refactor.herokuapp.com",
//                 "SITE_URL": "http://rc-crimereports.herokuapp.com",
                'SOCRATA_EMAIL': 'publicsafety@socrata.com',
                'SOCIAL_EMAIL': 'publicsafety@socrata.com',
                'SOCRATA_NUMBER': '1-206-340-8008',
                'RECAPTCHA_KEY': '6LekPx0TAAAAAIOwkSNjstDvtZeTVFjsLMqc6v32'
            });
})();
