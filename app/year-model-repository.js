'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const YearModelModel = mongoose.model('YearModel', new Schema({
    hash: String,
    zone: Number,
    category: Number,
    brand: Number,
    manufactureYear: Number,
    created: {
        type: Date,
        default: Date.now
    },
    modelYears: []
}));

const save = function (zone = 1, category = 1, brand, manufacture, years) {
    return YearModelModel.create({
        hash: objectHash(years),
        zone: zone,
        category: category,
        brand: brand,
        manufactureYear: manufacture,
        modelYears: years
    }).then(x => x.modelYears);
};

const getCachedModelYears = function (zone = 1, category = 1, brand, manufacture) {
    return YearModelModel.findOne({
        zone: zone,
        category: category,
        brand: brand,
        manufactureYear: manufacture,
        modelYears: {$ne: null},
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        }
    }).sort({created: -1});
};

const getNewModelYears = function (zone = 1, category = 1, brand, manufacture) {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body><ListaAnoModelo xmlns="http://tempuri.org/">' +
        '<plngCodMarca>' + brand + '</plngCodMarca>' +
        '<plngCodAnoFabricacao>' + manufacture + '</plngCodAnoFabricacao>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '<plngCodMacroCategoria>' + category + '</plngCodMacroCategoria>' +
        '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>' +
        '</ListaAnoModelo></soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            let years = x['soap:Body']['ListaAnoModeloResponse']['ListaAnoModeloResult']['diffgr:diffgram']['DocumentElement']['AnoModelo'];
            return years.map(year => {
                return {
                    codigo: parseInt(year['CodAnoModelo'], 10),
                    nome: year['NomAnoModelo'],
                    zeroKm: (year['IndZeroKM'] == 'true')
                };
            });
        })
        .then(years => save(zone, category, brand, manufacture, years));
};

const getModelYears = function (zone = 1, category = 1, brand, manufacture) {
    return getCachedModelYears(zone, category, brand, manufacture)
        .then(years => {
            if (years) {
                return years.modelYears;
            } else {
                return getNewModelYears(zone, category, brand, manufacture);
            }
        })
};

module.exports = {getModelYears};