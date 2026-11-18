const express = require('express');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  deleteMovie
} = require('../controllers/movieController');
const { authenticate, authorizeAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.post('/', authenticate, authorizeAdmin, createMovie);
router.delete('/:id', authenticate, authorizeAdmin, deleteMovie);

module.exports = router;
