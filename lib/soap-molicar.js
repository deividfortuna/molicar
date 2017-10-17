const http = require('./http');
const parseString = require('xml2js').parseString;

//consts
const URL = 'http://www.molicar.com.br/wsconsultamolicar.asmx';

function requestMolicar(body) {
    const options = {
        url: URL,
        method: 'POST',
        headers: {"Content-Type": "text/xml"},
        body: body
    };
    console.log('options:', options);
    return http.request(options)
        .then(result => {
            return new Promise((resolve, reject) => {
                // console.log('result', result);
                parseString(result, {
                    ignoreAttrs: true,
                    explicitArray: false,
                    explicitRoot: false
                }, (err, x) => {
                    if (!err) {
                        console.log('x', JSON.stringify(x));
                        resolve(x);
                    }
                    reject(err);
                });
            });
        });
}

module.exports = {
    request: requestMolicar
};