const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const Campground = require('../models/campground');
const {isLoggedIn, validateCampground, isAuthor} = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
const campground = require('../models/campground');
const multer = require('multer');
const {storage} = require('../cloudinary/index');   //we don't have to add index.js bc it by default will search about a folder called "index.js" inside the folder
const upload = multer({storage});

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground,  catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))

router.get('/:id/edit', isLoggedIn, isAuthor, upload.array('image'), catchAsync(campgrounds.renderEditForm));

module.exports = router;


