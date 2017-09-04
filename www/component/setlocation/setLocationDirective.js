(function () {
    'use strict';
    angular.module('setlocation').directive('locationsHeight', function ($timeout) {
        var dir = {};
        dir.replace = true;
        dir.scope = {};
        dir.bindToController = {
            savedLocationData: "="
        };
        dir.controller = controllerFn;
        dir.controllerAs = 'lh';

        function controllerFn($scope) {
        }
        dir.link = function (scope, elem, attr, ctrl) {

            var vm = ctrl;
            scope.$watch(angular.bind(vm, function () {
                return this.savedLocationData;
            }), function (newVals) {
                elem.css('opacity', '0');
                $timeout(function () {
                    var window_Height = $(window).height();
                    var hleft = window_Height - ((0.3 * window_Height) + 280);
                    var child = elem.find('button');
                    var eleHeight = 0;
                    for (var i = 0; i < 3 && i < child.length; i++) {
                        var height = child[i].offsetHeight;
                        if (eleHeight + height + 10 < hleft)
                            eleHeight = eleHeight + height + 10;
                        else
                            break;
                    }
                    elem.css('height', eleHeight + 1 + 'px');
                    elem.css('opacity', '1');
                }, 100);
            }, true);

        };
        return dir;
    });
})();
