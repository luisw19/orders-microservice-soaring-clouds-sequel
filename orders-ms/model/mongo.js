var mongoose    =   require("mongoose");
//first_db is the mongo db previously created in earlier steps
//if you are running this outside the container, ensure you add in /etc/hosts: 127.0.0.7  orders-mongo-db
// For localhost Modify /usr/local/etc/mongod.conf for mongo to listen in desired IPs
// In kubernetes orders-mongo-db = Service name for Mongo
mongoose.connect('mongodb://orders-mongo-db:27017/ordersMS_db');
// create instance of Schema
var schema =   mongoose.Schema;

// create schema: more info on http://mongoosejs.com/docs/schematypes.html

//Address object
var addressVar = {
  //before used the "type" instead of "name" but mongo didn't like it as its a reserved name
  name: String,
  line_1: String,
  line_2: String,
  city: String,
  county: String,
  postcode: String,
  country: { type: String, default: "GB" }
};

//Order lines object
var dimensionsVar = {
  unit: String,
  length: Number,
  height: Number,
  width: Number
};

//Order lines object
var linesVar = {
  line_id: Number,
  product_id: String,
  product_code: String,
  product_name: String,
  description: String,
  quantity: Number,
  price: Number,
  size: Number,
  weight: Number,
  dimensions: dimensionsVar,
  color: String,
  sku: String
};

//Customer object
var customerVar = {
  customer_id: String,
  loyalty_level: String,
  first_name: String,
  last_name: String,
  phone: String,
  email: String
};

//Payment object
var paymentVar = {
  name_on_card: String,
  card_type: String,
  card_number: String,
  start_year: Number,
  start_month: Number,
  expiry_year: Number,
  expiry_month: Number
};

//Customer object
var shippingVar = {
  first_name: String,
  last_name: String,
  shipping_method: String,
  price: Number,
  ETA: String
};

//Customer object
var specialVar = {
  personal_message: String,
  gift_wrapping: Boolean,
  delivery_notes: String,
};

//HATEOAS links
var hrefVar = {
  href: String
}

var linksVar = {
    self: hrefVar
}

//Order schema
var orderVar  = new schema(
  {
    order: {
      order_id: String,
      shoppingCart_id: String,
      status: { type: String, default: "SHOPPING_CART" },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now },
      total_price: Number,
      discount: Number,
      currency: { type: String, default: "GBP" },
      payment: paymentVar,
      customer: customerVar,
      address: [addressVar],
      shipping: shippingVar,
      special_details: specialVar,
      line_items: [linesVar],
      _links: linksVar
    }
  }
);

// create model if not exists
module.exports = mongoose.model('OrderMS',orderVar);
