const prisma = require('../config/prisma');

const getAllMovies = async (req, res, next) => {
  try {
    const { search, genre, language } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { genre: { contains: search } }
      ];
    }

    if (genre) {
      where.genre = { contains: genre };
    }

    if (language) {
      where.language = { equals: language };
    }

    const movies = await prisma.movie.findMany({
      where,
      orderBy: { releaseDate: 'desc' }
    });

    return res.status(200).json({ movies });
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

    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        shows: {
          include: {
            screen: {
              include: {
                theatre: true
              }
            }
          }
        }
      }
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    return res.status(200).json({ movie });
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

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        posterUrl,
        bannerUrl: bannerUrl || posterUrl,
        genre,
        duration: parseInt(duration, 10),
        language,
        rating: rating ? parseFloat(rating) : 8.5,
        releaseDate: releaseDate ? new Date(releaseDate) : new Date()
      }
    });

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

    await prisma.movie.delete({
      where: { id }
    });

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
