var mongoose    =   require("mongoose");
//first_db is the mongo db previously created in earlier steps
//if you are running this outside the container, ensure you add in /etc/hosts: 127.0.0.7  orders-mongo-db
// For localhost Modify /usr/local/etc/mongod.conf for mongo to listen in desired IPs
// In kubernetes orders-mongo-db = Service name for Mongo
mongoose.connect('mongodb://orders-mongo-db:27017/ordersMS_db');
// create instance of Schema
var schema =   mongoose.Schema;

// create schema: more info on http://mongoosejs.com/docs/schematypes.html

//Customer object
var customerVar = {
  customer_id: String,
  first_name: String,
  last_name: String,
  phone: String,
  email: String
};

//Address object
var addressVar = {
  //before used the "type" instead of "name" but mongo didn't like it as its a reserved name
  name: String,
  line_1: String,
  line_2: String,
  city: String,
  county: String,
  postcode: String,
  country: { type: String, default: 'GB' }
};

//Order lines object
var linesVar = {
  line_id: Number,
  product_id: String,
  product_name: String,
  description: String,
  quantity: Number,
  price: Number,
  dimensions: String,
  colour: String,
  sku: String
};
//Order schema
var orderVar  = new schema(
  {
    order: {
      order_id: String,
      status: { type: String, default: 'CREATED' },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now },
      total_price: Number,
      currency: { type: String, default: 'GBP' },
      customer: customerVar,
      address: [addressVar],
      line_items: [linesVar]
    }
  }
);

// create model if not exists
module.exports = mongoose.model('OrderMS',orderVar);
