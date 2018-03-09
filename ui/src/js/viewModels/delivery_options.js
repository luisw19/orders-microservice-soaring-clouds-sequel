/**
 * Delivery Options module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule'
], function (oj, ko, $) {
    /**
     * The view model for the delivery options view template
     */

    function DeliveryOptionsViewModel() {

        var self = this;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));

        self.handleAttached = function(info) {
            // Read latest Order from controller
        };

    }
    
    return new DeliveryOptionsViewModel();

});
