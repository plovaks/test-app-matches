import { useState } from 'react';

// Избранные матчи (по id). Хранятся только в памяти, пока открыто приложение.
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggle = (id: string) => {
  if (favorites.includes(id)) {
    setFavorites(favorites.filter((x) => x !== id)); 
  } else {
    setFavorites([...favorites, id]); 
  }
};

  return { favorites, isFavorite, toggle };
}
