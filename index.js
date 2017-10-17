'use strict';

const app = require('express')();
const cors = require('cors');
const mongoose = require('mongoose');
const env = process.env;

let mongoURI = env.OPENSHIFT_MONGODB_DB_URL + 'molicar';

if(env.NODE_ENV !== 'production'){
    mongoURI = 'mongodb://localhost:27017/molicar';
}

mongoose.connect(mongoURI);
mongoose.Promise = global.Promise;

mongoose.connection.once('open', function() {
  console.log('we are connected o/');
});

//enable cors
app.use(cors());

//molicar api
app.use('/api/v1', require('./app/controller-v1'));

//redirect to home page documentation
app.get('/', function(req, res){
    res.send('Hello World');
});

//needed to check the health of the server
app.get('/health', function(req, res){
    res.sendStatus(200);
});

app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost' , function () {
    console.log(`Application worker ${process.pid} started...`);
});