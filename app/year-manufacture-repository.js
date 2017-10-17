'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const manufactureYearsModel = mongoose.model('ManufactureYear', new Schema({
    hash: String,
    category: Number,
    zone: Number,
    brand: Number,
    created: {
        type: Date,
        default: Date.now
    },
    manufactureYears: []
}));

const save = function (zone = 1, category = 1, brand, years) {
    return manufactureYearsModel.create({
        hash: objectHash(years),
        zone: parseInt(zone, 10),
        category: parseInt(category, 10),
        brand: parseInt(brand, 10),
        manufactureYears: years
    }).then(x => x.manufactureYears);
};

const getCachedManufactureYears = function (zone = 1, category = 1, brand) {
    return manufactureYearsModel.findOne({
        zone: zone,
        category: category,
        brand: brand,
        manufactureYears: {$ne: null},
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        }
    }).sort({created: -1});
};

const getNewManufactureYears = function (zone = 1, category = 1, brand) {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body><ListaAnoFabricacao xmlns="http://tempuri.org/">' +
        '<plngCodMarca>' + brand + '</plngCodMarca>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '<plngCodMacroCategoria>' + category + '</plngCodMacroCategoria>' +
        '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>' +
        '</ListaAnoFabricacao>' +
        '</soap:Body></soap:Envelope>';
    // console.log('body', body);
    return requestMolicar(body)
        .then(x => {
            let years = x['soap:Body']['ListaAnoFabricacaoResponse']['ListaAnoFabricacaoResult']['diffgr:diffgram']['DocumentElement']['AnoModelo'];
            return years.map(year => {
                return {
                    codigo: parseInt(year['CodAnoModelo'], 10),
                    nome: year['NomAnoModelo']
                };
            });
        })
        .then(years => save(zone, category, brand, years));
};

const getManufactureYears = function (zone = 1, category = 1, brand) {
    return getCachedManufactureYears(zone, category, brand)
        .then(years => {
            if (years) {
                return years.manufactureYears;
            } else {
                return getNewManufactureYears(zone, category, brand);
            }
        })
};

module.exports = { getManufactureYears };