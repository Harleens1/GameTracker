import React, { useState } from 'react';
import { Search, Calendar, Star, Gamepad2, X, ExternalLink, Users, Trophy, Clock } from 'lucide-react';

const GameSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const searchGames = async (query) => {
    if (!query.trim()) {
      setGames([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // RAWG API endpoint - you'll need to get a free API key from https://rawg.io/apidocs
      const response = await fetch(
        `https://api.rawg.io/api/games?key=30e7a2720a29469abca2ab7964bdf523&search=${encodeURIComponent(query)}&page_size=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data.results || []);
    } catch (err) {
      setError('Error searching games. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchGames(searchTerm);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Clear games if search term is empty
    if (value.trim() === '') {
      setGames([]);
      return;
    }
    
    // Add debounced search as user types
    if (value.length > 2) {
      const timeoutId = setTimeout(() => searchGames(value), 500);
      setSearchTimeout(timeoutId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).getFullYear();
  };

  const fetchGameDetails = async (gameId) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games/${gameId}?key=30e7a2720a29469abca2ab7964bdf523`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }
      
      const data = await response.json();
      setGameDetails(data);
    } catch (err) {
      console.error('Error fetching game details:', err);
      setGameDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
    fetchGameDetails(game.id);
  };

  const closeModal = () => {
    setSelectedGame(null);
    setGameDetails(null);
  };

  const formatPlaytime = (hours) => {
    if (!hours) return 'Unknown';
    return `${hours} hours`;
  };

  const formatMetacriticScore = (score) => {
    if (!score) return null;
    let colorClass = 'bg-gray-600';
    if (score >= 75) colorClass = 'bg-green-600';
    else if (score >= 50) colorClass = 'bg-yellow-600';
    else if (score < 50) colorClass = 'bg-red-600';
    
    return (
      <span className={`px-2 py-1 rounded text-white text-sm font-bold ${colorClass}`}>
        {score}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="text-blue-400" />
            GameTracker+
          </h1>
          <p className="text-gray-400">Search and track your favorite games</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Search for games..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* API Key Notice */}
        {error && error.includes('API') && (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
            <p className="text-yellow-200">
              <strong>Note:</strong> You'll need to replace "YOUR_API_KEY_HERE" with your actual RAWG API key.
              Get one free at <a href="https://rawg.io/apidocs" className="text-blue-400 hover:underline">rawg.io/apidocs</a>
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-400">Searching games...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Games Grid */}
        {games.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div 
                key={game.id} 
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer transform hover:scale-105 duration-200"
                onClick={() => handleGameClick(game)}
              >
                {/* Game Image */}
                <div className="aspect-video bg-gray-700 relative">
                  {game.background_image ? (
                    <img
                      src={game.background_image}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Game Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{game.name}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(game.released)}
                    </div>
                    {game.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {game.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Platforms */}
                  {game.platforms && game.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {game.platforms.slice(0, 3).map((platform) => (
                        <span
                          key={platform.platform.id}
                          className="px-2 py-1 bg-gray-700 rounded text-xs"
                        >
                          {platform.platform.name}
                        </span>
                      ))}
                      {game.platforms.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          +{game.platforms.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Genres */}
                  {game.genres && game.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {game.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre.id}
                          className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && searchTerm && games.length === 0 && !error && (
          <div className="text-center py-8">
            <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No games found for "{searchTerm}"</p>
          </div>
        )}

        {/* Game Details Modal */}
        {selectedGame && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold">{selectedGame.name}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {detailsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-400">Loading game details...</p>
                  </div>
                ) : gameDetails ? (
                  <div className="space-y-6">
                    {/* Game Image and Basic Info */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-1/2">
                        {gameDetails.background_image ? (
                          <img
                            src={gameDetails.background_image}
                            alt={gameDetails.name}
                            className="w-full rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Gamepad2 className="w-16 h-16 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="lg:w-1/2 space-y-4">
                        {/* Release Date and Rating */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{gameDetails.released || 'TBA'}</span>
                          </div>
                          {gameDetails.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{gameDetails.rating.toFixed(1)}/5</span>
                            </div>
                          )}
                          {gameDetails.playtime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatPlaytime(gameDetails.playtime)}</span>
                            </div>
                          )}
                        </div>

                        {/* Metacritic Score */}
                        {gameDetails.metacritic && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm">Metacritic:</span>
                            {formatMetacriticScore(gameDetails.metacritic)}
                          </div>
                        )}

                        {/* Platforms */}
                        {gameDetails.platforms && gameDetails.platforms.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Platforms:</h4>
                            <div className="flex flex-wrap gap-1">
                              {gameDetails.platforms.map((platform) => (
                                <span
                                  key={platform.platform.id}
                                  className="px-2 py-1 bg-gray-700 rounded text-xs"
                                >
                                  {platform.platform.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Genres */}
                        {gameDetails.genres && gameDetails.genres.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Genres:</h4>
                            <div className="flex flex-wrap gap-1">
                              {gameDetails.genres.map((genre) => (
                                <span
                                  key={genre.id}
                                  className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
                                >
                                  {genre.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Developer and Publisher */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {gameDetails.developers && gameDetails.developers.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-1">Developer:</h4>
                              <p className="text-gray-400">{gameDetails.developers[0].name}</p>
                            </div>
                          )}
                          {gameDetails.publishers && gameDetails.publishers.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-1">Publisher:</h4>
                              <p className="text-gray-400">{gameDetails.publishers[0].name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {gameDetails.description_raw && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">About</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {gameDetails.description_raw.length > 500 
                            ? gameDetails.description_raw.substring(0, 500) + '...' 
                            : gameDetails.description_raw}
                        </p>
                      </div>
                    )}

                    {/* Website Link */}
                    {gameDetails.website && (
                      <div className="flex justify-center">
                        <a
                          href={gameDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit Official Website
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Failed to load game details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSearch;
