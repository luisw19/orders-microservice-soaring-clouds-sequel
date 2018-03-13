define(['ojs/ojcore'],
function (oj) {

    var LineItemFactory = {

        setLineItemURI: function(orderId, lineItemId) {
          return "API-GW-PLACEHOLDER/api/orders/" + orderId + "/lines/" + lineItemId;
        },
        createLineItemModel: function(orderId, lineItemId) {
            var LineItem = oj.Model.extend({
                urlRoot: this.setLineItemURI(orderId, lineItemId),
                idAttribute: 'line_id'
            });
            return new LineItem();
        }
    };

    return LineItemFactory;

});
