'use strict';

const request = require('request');
const env = process.env;

let httpRequest = request;

if(env.NODE_ENV !== 'production'){
    //httpRequest = request.defaults({'proxy': 'http://127.0.0.1:8888'});
}

const req = function(options) {
    return new Promise((resolve, reject) => {
        httpRequest(options, (error, response, html) => {
            if (error) {
                reject(error);
            } else {
                resolve(html);
            }
        });
    });
};

module.exports = {
    request: req
};
