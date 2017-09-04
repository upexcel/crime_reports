(function () {
    'use strict';
    angular.module('crimeApp')
            .factory('ClosePopupService', function ($document, $ionicPopup, $timeout) {
                var lastPopup;
                return {
                    register: function (popup) {
                        $timeout(function () {
                            var element = $ionicPopup._popupStack.length > 0 ? $ionicPopup._popupStack[0].element : null;
                            if (!element || !popup || !popup.close)
                                return;
                            element = element && element.children ? angular.element(element.children()[0]) : null;
                            lastPopup = popup;
                            var insideClickHandler = function (event) {
                                event.stopPropagation();
                            };
                            var outsideHandler = function () {
                                popup.close();
                            };
                            element.on('click', insideClickHandler);
                            $document.on('click', outsideHandler);
                            popup.then(function () {
                                lastPopup = null;
                                element.off('click', insideClickHandler);
                                $document.off('click', outsideHandler);
                            });
                        });
                    },
                    closeActivePopup: function () {
                        if (lastPopup) {
                            $timeout(lastPopup.close);
                            return lastPopup;
                        }
                    }
                };
            });
})();