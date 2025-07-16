import React, { useState } from 'react';
import { Search, Calendar, Star, Gamepad2 } from 'lucide-react';

const GameSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        `https://api.rawg.io/api/games?key=API_KEY_HERE&search=${encodeURIComponent(query)}&page_size=10`
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
    
    // Optional: Add debounced search as user types
    if (value.length > 2) {
      const timeoutId = setTimeout(() => searchGames(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).getFullYear();
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
              <div key={game.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
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
      </div>
    </div>
  );
};

export default GameSearch;
