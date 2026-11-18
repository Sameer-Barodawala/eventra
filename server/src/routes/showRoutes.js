const express = require('express');
const {
  getShowsByMovieId,
  getShowById,
  createShow
} = require('../controllers/showController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/movie/:movieId', getShowsByMovieId);
router.get('/:id', getShowById);
router.post('/', authenticate, authorizeAdmin, createShow);

module.exports = router;
