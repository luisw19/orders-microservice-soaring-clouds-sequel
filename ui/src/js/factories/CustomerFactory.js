define(['ojs/ojcore'],
function (oj) {
    
    var CustomerFactory = {

        setCustomerURI: function(customerId) {
        //   return "https://oc-144-21-82-92.compute.oraclecloud.com:9129/api/customer/profile/" + customerId;
          return "data/customerData.json";
        },
        createCustomerModel: function(customerId) {
            var Customer = oj.Model.extend({
                urlRoot: this.setCustomerURI(customerId),
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
                idAttribute: '_id'
            });
            return new Customer();
        }
    };

    return CustomerFactory;

});