'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const brandModel = mongoose.model('Brand', new Schema({
    hash: String,
    category: Number,
    zone: Number,
    created: {
        type: Date,
        default: Date.now
    },
    brands: []
}));

const save = function (zone, category, brands) {
    const register = {
        hash: objectHash(brands),
        zone: parseInt(zone, 10),
        category: parseInt(category, 10),
        brands: brands
    };

    return brandModel.create(register)
        .then(x => x.brands);
};

const getCachedBrand = function (zone, category) {
    return brandModel.findOne({
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        },
        zone: parseInt(zone, 10),
        category: parseInt(category, 10),
        brands: {$ne: null}
    }).sort({created: -1});
};

//get brands from molicar. Eg. (General Motors, Fiat, Toyota...)
const getNewBrands = function (zone = 1, category = 1) {
    const body = '<?xml version="1.0" encoding="utf-8"?>' +
        '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body>' +
        '<ListaMarca xmlns="http://tempuri.org/">' +
        '<plngCodMacroCategoria>' + category + '</plngCodMacroCategoria>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>' +
        '</ListaMarca>' +
        '</soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            let brands = x['soap:Body']['ListaMarcaResponse']['ListaMarcaResult']['diffgr:diffgram']['DocumentElement']['Marca'];
            return brands.map(brand => {
                return {
                    codigo: parseInt(brand['codMarca'], 10),
                    nome: brand['NomMarca']
                };
            });
        })
        .then(brands => save(1, category, brands));
};

const getBrands = function (zone = 1, category) {
    return getCachedBrand(zone, category)
        .then(cachedBands => {
            if (cachedBands) {
                return cachedBands.brands
            } else {
                return getNewBrands(zone, category);
            }
        });
};

module.exports = { getBrands };