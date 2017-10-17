'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 180;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const VersionModel = mongoose.model('Versions', new Schema({
    hash: String,
    zone: Number,
    brand: Number,
    modelYear: Number,
    model: Number,
    created: {
        type: Date,
        default: Date.now
    },
    versions: []
}));

const save = function (zone = 1, brand, yearModel, model, versions) {
    return VersionModel.create({
        hash: objectHash(versions),
        zone: zone,
        brand: brand,
        modelYear: yearModel,
        model: model,
        versions: versions
    }).then(x => x.versions);
};

const getCachedVersions = function (zone = 1, brand, yearModel, model) {
    return VersionModel.findOne({
        zone: zone,
        brand: brand,
        modelYear: yearModel,
        model: model,
        versions: {$ne: null},
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        },
    }).sort({created: -1});
};

const getNewVersions = function (zone = 1, brand, yearModel, model) {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body><ListaVersao xmlns="http://tempuri.org/">' +
        '<plngCodMarca>' + brand + '</plngCodMarca>' +
        '<plngCodAnoModelo>' + yearModel + '</plngCodAnoModelo>' +
        '<plngCodModelo>' + model + '</plngCodModelo>' +
        '<pblnIndZeroKM>false</pblnIndZeroKM>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '<pblnIndCotacaoGratis>true</pblnIndCotacaoGratis>' +
        '</ListaVersao></soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            let versions = x['soap:Body']['ListaVersaoResponse']['ListaVersaoResult']['diffgr:diffgram']['DocumentElement']['Versao'];
            return versions.map(version => {
                return {
                    codigo: parseInt(version['CodVersao'], 10),
                    nome: version['NomVersao'].trim(),
                };
            })
        })
        .then(versions => save(zone, brand, yearModel, model, versions));
};

const getVersions = function (zone, brand, yearModel, model) {
    return getCachedVersions(zone, brand, yearModel, model)
        .then(cachedVersions => {
            if (cachedVersions) {
                return cachedVersions.versions;
            } else {
                return getNewVersions(zone, brand, yearModel, model);
            }
        })
};

module.exports = {getVersions};