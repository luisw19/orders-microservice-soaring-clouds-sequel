//HTTP vars
var querystring = require('querystring');
//var https = require('https');
var http = require('http');
var apiHost = "localhost";
var apiPort = 3000;
var response = {};
var order = {};
var orderCheck = {};
var productItem = {};
var href = "";

////////////////////////////////////////////////////////////////
// Function to make REST Calls
////////////////////////////////////////////////////////////////
function performRequest(uri, method, data, response) {

  //set header for use in verts <> GET
  var headers = {};
  //convert JSON object to string
  var dataString = JSON.stringify(data);

  //If method is GET then convert data to query string and add to URI
  if (method == 'GET') {
    uri += '?' + querystring.stringify(data);
    headers = {
      'Content-Type': 'text/plain',
      'Content-Length': dataString.length
    };
  } else {
    headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': dataString.length
    };
  }

  //set the call properties
  var options = {
    host: apiHost,
    port: apiPort,
    path: uri,
    method: method,
    headers: headers
  };
  //log
  console.log("performing the folowing call: "+ JSON.stringify(options));
  //make the HTTP call
  var req = http.request(options, function(res) {

    res.setEncoding('utf-8');
    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      //capture response
      var responseObject = JSON.parse(responseString);
      response(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

//Step 1, check if the shopping cart exists
function upsertShoppingCart() {
  performRequest("/orders", "GET", orderCheck, function(response) {
    console.log('searchOrder response: ' + JSON.stringify(response));
    if(response.metadata.result_count==0){
      //Step 2, if it doesn't exist create the shopping basket
      performRequest("/orders", "POST", order, function(response) {
        console.log('screateOrder response: ' + JSON.stringify(response));
        //get Hateoas link from result of creating the order
        href = response._links.self.href;
        addProductItem(href);
      });
    }else {
      //get Hateoas link from the order that was found
      href = response.orders[0].order._links.self.href;
      addProductItem(href);
    }
  });
}


//Step 3 add product to basket regardless
function addProductItem(href) {
  console.log("step 3");
  performRequest(href + "/lines", "POST", productItem, function(response) {
    console.log('addProductItem response: ' + JSON.stringify(response));
  });
}

//set Order Header Details
order = {
  shoppingCart_id: 'CUST0001',
  total_price: 0,
  currency: 'GBP',
  status: 'SHOPPING_CART',
  customer: {
    customer_id: 'CUST0001',
    first_name: 'Luis',
    last_name: 'Weir',
    phone: '+44 (0) 757 5333 777',
    email: 'myemail@email.com'
  }
};

//Set Order Query
orderCheck = {
  shoppingCart_id: 'CUST0001',
  status: 'SHOPPING_CART'
};

//Set Product line item
productItem = {
	product_id: "AX330T",
	product_name: "Light Brown Men Shoe 1",
	description: "Light Brown Men Shoe 1",
	quantity: 2,
	price: 68.39,
	size: 43,
	weight: 0,
	dimensions: {
		unit: "cm",
		length: 10.2,
		height: 10.4,
		width: 5.4
	},
	color: "White",
	sku: "S15T-Flo-RS"
};

//Functions to create shopping cart (if one doesn't exist) and add item
upsertShoppingCart();
