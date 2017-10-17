'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const ModelModel = mongoose.model('Model', new Schema({
    hash: String,
    zone: Number,
    category: Number,
    brand: Number,
    modelYear: Number,
    created: {
        type: Date,
        default: Date.now
    },
    models: []
}));

const save = function (zone = 1, category = 1, brand, modelYear, models) {
    return ModelModel.create({
        hash: objectHash(models),
        zone: zone,
        category: category,
        brand: brand,
        modelYear: modelYear,
        models: models
    }).then(x => x.models);
};

const getCachedModels = function (zone = 1, category = 1, brand, modelYear) {
    return ModelModel.findOne({
        zone: zone,
        category: category,
        brand: brand,
        modelYear: modelYear,
        models: {$ne: null},
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        }
    }).sort({created: -1});
};

const getNewModels = function (zone = 1, category = 1, brand, modelYear) {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body><ListaModelo xmlns="http://tempuri.org/">' +
        '<plngCodMarca>' + brand + '</plngCodMarca>' +
        '<plngCodAnoModelo>' + modelYear + '</plngCodAnoModelo>' +
        '<pblnIndZeroKM>false</pblnIndZeroKM>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '<plngCodMacroCategoria>' + category + '</plngCodMacroCategoria>' +
        '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>' +
        '</ListaModelo></soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            let models = x['soap:Body']['ListaModeloResponse']['ListaModeloResult']['diffgr:diffgram']['DocumentElement']['Modelo'];
            return models.map(model => {
                return {
                    codigo: parseInt(model['CodModelo'], 10),
                    nome: model['NomModelo'].trim(),
                };
            });
        })
        .then(models => save(zone, category, brand, modelYear, models));
};

const getModels = function (zone, category, brand, modelYear) {
    return getCachedModels(zone, category, brand, modelYear)
        .then(years => {
            if (years) {
                return years.models;
            } else {
                return getNewModels(zone, category, brand, modelYear);
            }
        })
};

module.exports = {getModels};