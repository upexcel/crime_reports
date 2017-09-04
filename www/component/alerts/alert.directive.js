angular.module('alert').directive('noCursor', noCursor);
function noCursor($timeout) {
    var noc = {};
    noc.link = function (scope, ele, $attr) {
        $timeout(function () {
            var p = $('#' + ele[0].id);
            $('#alertThis').scroll(function () {
                var position = p.position();
                if (position.top < 20) {
                    p.blur();
                }
            });
            p.blur();
        }, 500);

    };
    return noc;
}