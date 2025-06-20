const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();

app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
// Middleware to parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// admin coupon related routes 
app.use('/admin/coupons', require('./routes/admin/coupon.routes'));
// customers coupon related routes
app.use('/admin/customers/coupons', require('./routes/customers/coupon.routes'));

// run application on port 
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
