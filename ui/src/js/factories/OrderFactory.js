define(['ojs/ojcore'],
function (oj) {
    
    var OrderFactory = {

        setOrderURI: function(orderId) {
          return "https://private-anon-2453842a28-sttcordersms.apiary-mock.com/api/orders/" + orderId;
        },
        createOrderModel: function(orderId) {
            var Order = oj.Model.extend({
                urlRoot: this.setOrderURI(orderId),
                parse: function(response) {

                    // return {
                    //     "headerId": response.headerId,
                    //     "headerNumber": response.headerNumber,
                    //     "headerType": response.headerType,
                    //     "name": response.name,
                    //     "cardType": response.cardType,
                    //     "isTask": response.isTask,
                    //     "createdBy": createdBy,
                    //     "creationDate": creationDate,
                    //     "updatedBy": response.updatedBy,
                    //     "updatedDate": response.updatedDate,
                    //     "ageGroup": response.ageGroup,
                    //     "room": response.room,
                    //     "status": status,
                    //     "group": group,
                    //     "contentDetail": response.contentDetail
                    // };

                    return response;

                },
                parseSave: function(request) {
                    
                    return {
                        "headerId": request.headerId,
                        "headerNumber": request.headerNumber,
                        "headerType": request.headerType,
                        "name": request.name,
                        "cardType": request.cardType,
                        "isTask": request.isTask,
                        "createdBy": request.createdBy,
                        "creationDate": request.creationDate,
                        "updatedBy": request.updatedBy,
                        "updatedDate": request.updatedDate,
                        "ageGroup": request.ageGroup,
                        "room": request.room,
                        "contentDetail": request.contentDetail
                    };

                },
                idAttribute: 'headerId'
            });
            return new Order();
        }
    };

    return OrderFactory;

});