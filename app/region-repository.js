'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts 
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const regionModel = mongoose.model('region', new Schema({
    hash: String,
    created: {
        type: Date,
        default: Date.now
    },
    regions: []
}));

const save = function(regions) {
    const hash = objectHash(regions);
    const newRegions = { hash, regions };

    return regionModel.create(newRegions)
        .then(x => x.regions);
};

const getCachedRegions = function() {
    return regionModel.findOne({
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        },
        regions: { $ne: null }
    }).sort({ created: -1 });
};

const getNewRegions = function() {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' + 
                    '<soap:Body><ListaRegiao xmlns="http://tempuri.org/">' +
                    '<plngCodCliente>1</plngCodCliente><pstrDscSenha>azeriff</pstrDscSenha>' +
                    '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>'+
                    '</ListaRegiao></soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            //console.log("retNewRegions:", x);
            let regions = x['soap:Body']['ListaRegiaoResponse']['ListaRegiaoResult']['diffgr:diffgram']['DocumentElement']['Regiao'];
            return regions.map(region => {
                return {
                    codigo: parseInt(region['codRegiao'], 10),
                    nome: region['NomRegiao']
                };
            });
        })
        .then(regions => save(regions));
};

const getRegions = function() {
    return getCachedRegions()
        .then(cachedRegions => {
            // console.log('getRegions:', cachedRegions);
            if(cachedRegions) {
                return cachedRegions.regions;
            } else {
            return getNewRegions();
        }});
};

module.exports = { getRegions };