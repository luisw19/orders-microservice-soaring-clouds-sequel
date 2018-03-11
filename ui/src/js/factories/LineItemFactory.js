define(['ojs/ojcore'],
function (oj) {
    
    var LineItemFactory = {

        setLineItemURI: function(orderId, lineItemId) {
          return "https://oc-144-21-82-92.compute.oraclecloud.com:9129/api/orders/" + orderId + "/lines/" + lineItemId;
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