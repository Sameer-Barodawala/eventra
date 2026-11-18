const db = require('../config/db');

const getAllMovies = async (req, res, next) => {
  try {
    const { search, genre, language } = req.query;

    let query = `
      SELECT id, title, description, poster_url AS posterUrl, banner_url AS bannerUrl,
             genre, duration, language, rating, release_date AS releaseDate, created_at AS createdAt
      FROM movies
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR genre LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (genre) {
      query += ` AND genre LIKE ?`;
      params.push(`%${genre}%`);
    }

    if (language) {
      query += ` AND language = ?`;
      params.push(language);
    }

    query += ` ORDER BY release_date DESC`;

    const [movies] = await db.query(query, params);

    return res.status(200).json({ movies: movies || [] });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    const [movies] = await db.query(
      `SELECT id, title, description, poster_url AS posterUrl, banner_url AS bannerUrl,
              genre, duration, language, rating, release_date AS releaseDate, created_at AS createdAt
       FROM movies WHERE id = ?`,
      [id]
    );

    if (!movies || movies.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    return res.status(200).json({ movie: movies[0] });
  } catch (error) {
    next(error);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      posterUrl,
      bannerUrl,
      genre,
      duration,
      language,
      rating,
      releaseDate
    } = req.body;

    if (!title || !description || !posterUrl || !genre || !duration || !language) {
      return res.status(400).json({ message: 'Missing required movie fields.' });
    }

    const [result] = await db.query(
      `INSERT INTO movies (title, description, poster_url, banner_url, genre, duration, language, rating, release_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        posterUrl,
        bannerUrl || posterUrl,
        genre,
        parseInt(duration, 10),
        language,
        rating ? parseFloat(rating) : 8.5,
        releaseDate || new Date()
      ]
    );

    const movie = {
      id: result.insertId,
      title,
      description,
      posterUrl,
      bannerUrl: bannerUrl || posterUrl,
      genre,
      duration: parseInt(duration, 10),
      language,
      rating: rating ? parseFloat(rating) : 8.5
    };

    return res.status(201).json({ message: 'Movie created successfully.', movie });
  } catch (error) {
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    await db.query('DELETE FROM movies WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Movie deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  deleteMovie
};
