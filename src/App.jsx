import React, { useEffect, useState } from 'react';
import Search from './components/Search';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if (data.RESPONSE === 'False') {
        setErrorMsg(data.ERROR || 'Failed to fetch movies.');
        setMovieList([]);
        return;
      }
      setMovieList(data.results);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setErrorMsg('Error fetching movies. Please try again latter.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className='pattern bg-linear-to-r from-white-500 to-blue-500'>
        <div className='wrapper'>
          <header>
            <img
              src='./hero.png'
              alt='Hero Banner'
            />
            <h1>
              Find <span className='text-gradient'>Movies</span> You'll Enjoy
              without Hassel
            </h1>
            <Search
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </header>
          {trendingMovies.length > 0 && (
            <section className='trending'>
              <h2>Trending Movies</h2>

              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className='all-movies'>
            <h2>All Movies</h2>

            {isLoading ? (
              <Spinner />
            ) : errorMsg ? (
              <p className='text-red-500'>{errorMsg}</p>
            ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default App;
