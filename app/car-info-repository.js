'use strict';

const objectHash = require('object-hash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//conts
const MAX_CACHE_VALID_DAYS = 30;

const dateHelper = require('./../lib/date');
const requestMolicar = require('./../lib/soap-molicar').request;

const CarsInfoModel = mongoose.model('CarsInfoModel', new Schema({
    hash: String,
    zone: Number,
    modelYear: Number,
    versionId: Number,
    created: {
        type: Date,
        default: Date.now
    },
    carInfo: {}
}));

const save = function (zone = 1, modelYear, versionId, carInfo) {
    return CarsInfoModel.create({
        hash: objectHash(carInfo),
        zone: zone,
        modelYear: modelYear,
        versionId: versionId,
        carInfo: carInfo
    }).then(x => x.carInfo);
};

const getCachedCarsInfo = function (zone = 1, modelYear, versionId) {
    return CarsInfoModel.findOne({
        zone: zone,
        modelYear: modelYear,
        versionId: versionId,
        carInfo: {$ne: null},
        created: {
            $gte: dateHelper.addDays(new Date(), -MAX_CACHE_VALID_DAYS),
            $lt: new Date()
        }
    }).sort({created: -1});
};

const getNewCarInfos = function (zone = 1, modelYear, versionId) {
    const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soap:Body><ConsultaVersao xmlns="http://tempuri.org/">' +
        '<plngCodVersao>' + versionId + '</plngCodVersao>' +
        '<plngCodAnoModelo>' + modelYear + '</plngCodAnoModelo>' +
        '<pblnIndZeroKM>false</pblnIndZeroKM>' +
        '<plngCodCliente>1</plngCodCliente>' +
        '<pstrDscSenha>azeriff</pstrDscSenha>' +
        '</ConsultaVersao></soap:Body></soap:Envelope>';
    return requestMolicar(body)
        .then(x => {
            let version = x['soap:Body']['ConsultaVersaoResponse']['ConsultaVersaoResult']['diffgr:diffgram']['DocumentElement']['Versao'];
            return {
                qtdPassageiro: parseInt(version['QtdPassageiro']),
                qtdQuiloPeso: parseInt(version['QtdQuiloPeso']),
                qtdCCMotor: parseInt(version['QtdCCMotor']),
                valCotacao: parseFloat(version['ValCotacao']),
                valCotacaoCompleto: parseFloat(version['ValCotacaoCompleto']),
                codMolicar: version['CodMolicar'],
                qtdCV: parseInt(version['QtdCV']),
                codCategoria: parseInt(version['CodCategoria']),
                codMarca: parseInt(version['CodMarca']),
                codModelo: parseInt(version['CodModelo']),
                codMacroCategoria: parseInt(version['CodMacroCategoria'])
            };
        })
        .then(carInfo => save(zone, modelYear, versionId, carInfo));
};

const getCarsInfo = function (zone = 1, modelYear, versionId) {
    return getCachedCarsInfo(zone, modelYear, versionId)
        .then(cachedCarsInfo => {
            if(cachedCarsInfo) {
                return cachedCarsInfo.carInfo;
            } else {
                return getNewCarInfos(zone, modelYear, versionId);
            }
        })
};

module.exports = {getCarsInfo};