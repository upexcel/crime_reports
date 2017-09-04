(function() {
    var module = this;

    module.directive('betterTimePicker', function() {
        return {
            restrict: 'AE',
            replace: true,
            templateUrl: 'lib/datePicker/better-time-picker.html',
            scope: {},
            bindToController: {
                selectedHourDate: '=',
                startAm: '=',
                endAm: '=',
                startTimePicker: '='
            },
            controllerAs: 'betterTimePicker',
            controller: function($scope, $rootScope) {
                var betterTimePicker = this;
                betterTimePicker.initializeTime = function(date) {
                    betterTimePicker.PageState = {};
                    betterTimePicker.PageState.times = [];
                    var currentDate = new Date(date);
                    if (!currentDate) {
                        currentDate = new Date();
                    } else if (typeof date == "string") {
                        currentDate = new Date(date);
                    }
                    betterTimePicker.UserSelection = {
                        selectedDate: currentDate,
                        selectedHour: currentDate.getHours()
                    };
                    betterTimePicker.setSelectedHour(currentDate.getHours());
                    betterTimePicker.setSelectedMinute(currentDate.getMinutes());
                    betterTimePicker.setSelectedMinute(currentDate.getSeconds());
                    betterTimePicker.selectHourPicker();
                };

                betterTimePicker.bindDate = function() {
                    betterTimePicker.date = betterTimePicker.UserSelection.selectedDate;
                }

                betterTimePicker.clearTimeCircle = function() {
                    betterTimePicker.PageState.times = [];
                    betterTimePicker.PageState.hourPickerEnabled = false;
                    betterTimePicker.PageState.minutePickerEnabled = false;
                    betterTimePicker.PageState.secondPickerEnabled = false;
                };

                betterTimePicker.selectHourPicker = function() {
                    betterTimePicker.clearTimeCircle();
                    betterTimePicker.PageState.hourPickerEnabled = true;
                    var items = 12;
                    for (var i = 1; i <= items; i++) {
                        var x = 91 + 95 * Math.cos(2 * Math.PI * i / items - (Math.PI / 2));
                        var y = 93 + 95 * Math.sin(2 * Math.PI * i / items - (Math.PI / 2));
                        betterTimePicker.PageState.times.push({x: x, y: y, value: i});
                    }
                };

                betterTimePicker.selectMinutePicker = function() {
                    betterTimePicker.clearTimeCircle();
                    betterTimePicker.PageState.minutePickerEnabled = true;
                    var items = 12;
                    for (var i = 0; i < items; i++) {
                        var x = 38 + 60 + 104 * Math.cos(2 * Math.PI * i / items - (Math.PI / 2)),
                                y = 50 + 60 - 12 + 104 * Math.sin(2 * Math.PI * i / items - (Math.PI / 2)),
                                value = i * 5;
                        betterTimePicker.PageState.times.push({x: x, y: y, value: value});
                    }
                };

                betterTimePicker.toggleAmPm = function(meridian) {
                    var hour = betterTimePicker.UserSelection.selectedDate.getHours();
                    if (meridian == "Am") {
                        if (hour >= 12)
                            hour = hour - 12;
                        if (betterTimePicker.startTimePicker) {
                            betterTimePicker.startAm = true;
                        } else {
                            betterTimePicker.endAm = true;
                        }
                    } else {
                        if (hour < 12)
                            hour = hour + 12;
                        if (betterTimePicker.startTimePicker) {
                            betterTimePicker.startAm = false;
                        } else {
                            betterTimePicker.endAm = false;
                        }
                    }

                    betterTimePicker.UserSelection.selectedDate.setHours(hour);
                    betterTimePicker.UserSelection.selectedHour = hour;
                };
                betterTimePicker.setMeridian = function() {

                }
                betterTimePicker.setSelectedHour = function(hour) {
                    if (betterTimePicker.startTimePicker) {
                        if (!betterTimePicker.startAm) {
                            hour = hour + 12;
                        } else {
                            if (hour == 12)
                                hour = 0;
                        }
                    } else {
                        if (!betterTimePicker.endAm) {
                            hour = hour + 12;
                            hour = (hour == 24) ? 12 : hour;
                        } else {
                            if (hour == 12)
                                hour = 0;
                        }
                    }
                    betterTimePicker.UserSelection.selectedDate.setHours(hour);
                    betterTimePicker.UserSelection.selectedHour = hour;
                };

                betterTimePicker.setSelectedMinute = function(minute) {
                    betterTimePicker.UserSelection.selectedDate.setMinutes(minute);
                };

                betterTimePicker.setSelectedSecond = function(second) {
                    betterTimePicker.UserSelection.selectedDate.setSeconds(second);
                };

                betterTimePicker.setSelectedTime = function(time) {
                    betterTimePicker.hideAfterSelection && betterTimePicker.clearTimeCircle();
                    if (betterTimePicker.PageState.hourPickerEnabled) {
                        betterTimePicker.setSelectedHour(time);
                    } else if (betterTimePicker.PageState.minutePickerEnabled) {
                        betterTimePicker.setSelectedMinute(time);
                    } else if (betterTimePicker.PageState.secondPickerEnabled) {
                        betterTimePicker.setSelectedSecond(time);
                    }
                };
                $scope.$watch(angular.bind(betterTimePicker, function() {
                    return this.UserSelection.selectedHour;
                }), function(hours) {
                    betterTimePicker.UserSelection.selectedDate.setHours(hours);
                    $rootScope.selectedHourDate = betterTimePicker.UserSelection.selectedDate;
                });
            }
            ,
            link: function(scope, element, attrs, betterTimePicker) {
                betterTimePicker.initializeTime(betterTimePicker.selectedHourDate);
                if (attrs.selectedHourDate) {
                    betterTimePicker.bindDate();
                }
            }
        }
    })
}).call(angular.module('betterTimePicker', []));
