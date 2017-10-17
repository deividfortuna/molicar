'use strict';

const app = require('express').Router(); // eslint-disable-line

const regionRepository = require('./region-repository');
const brandRepository = require('./brand-repository');
const yearManufactureRepository = require('./year-manufacture-repository');
const yearModelRepository = require('./year-model-repository');
const modelRepository = require('./model-repository');
const versionRepository = require('./version-repository');
const carInfoRepository = require('./car-info-repository');

// get molicar regions
app.get('/regioes', function (req, res) {
    return regionRepository.getRegions()
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

app.get('/:category/anos-modelos/:yearModel/versoes/:versionId/info', function (req, res) {
    const zone = 1;
    const category = getCategoryId(req.params.category);
    const yearModel = req.params.yearModel;
    const versionId = req.params.versionId;

    if(!category) return red.sendStatus(400);
    
    return carInfoRepository.getCarsInfo(zone, yearModel, versionId)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

app.get('/:category/marcas/:brandId/anos-modelos/:yearModel/modelos/:modelId/versoes', function (req, res) {
    const zone = 1;
    const category = getCategoryId(req.params.category);
    const brand = req.params.brandId;
    const yearModel = req.params.yearModel;
    const modelId = req.params.modelId;

    if(!category) return red.sendStatus(400);
    
    return versionRepository.getVersions(zone, brand, yearModel, modelId)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

// get molicas models of cars
app.get('/:category/marcas/:brandId/anos-modelos/:yearModel/modelos', function (req, res) {
    const zone = 1;
    const category = getCategoryId(req.params.category);
    const brand = req.params.brandId;
    const yearModel = req.params.yearModel;

    if(!category) return red.sendStatus(400);
    
    return modelRepository.getModels(zone, category, brand, yearModel)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

// get molicar model years of cars
app.get('/:category/marcas/:brandId/anos-fabricacao/:manufacture/anos-modelos', function (req, res) {
    const zone = 1;
    const category = getCategoryId(req.params.category);
    const brand = req.params.brandId;
    const manufacture = req.params.manufacture;

    if(!category) return red.sendStatus(400);
    
    return yearModelRepository.getModelYears(zone, category, brand, manufacture)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

// get molicar manufacture years
app.get('/:category/marcas/:brandId/anos-fabricacao', function (req, res) {
    const zone = 1;
    const category = getCategoryId(req.params.category);
    const brand = req.params.brandId;
    
    if(!category) return red.sendStatus(400);
    
    return yearManufactureRepository.getManufactureYears(zone, category, brand)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

// get molicar brands
app.get('/:category/marcas', function (req, res) {
    // Categories
    // 1 - Cars...
    const zone = 1;
    const category = getCategoryId(req.params.category);
    
    if(!category) return red.sendStatus(400);

    return brandRepository.getBrands(zone, category)
        .then(x => res.send(x)).catch(x => res.sendStatus(500));
});

//convert category name to id
const getCategoryId = function(categoryName) {
    const categories = {
        carros: 1
    };
    const categoryId = categories[categoryName];

    return categoryId;
};

module.exports = app;