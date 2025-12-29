/**
 * Avatar characters from movies and TV series
 * Each avatar has an identifier, name, and emoji representation
 */

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  category: 'movies' | 'series' | 'anime' | 'games';
}

export const AVAILABLE_AVATARS: AvatarOption[] = [
  // Movies
  { id: 'batman', name: 'Batman', emoji: '🦇', category: 'movies' },
  { id: 'ironman', name: 'Iron Man', emoji: '🦾', category: 'movies' },
  { id: 'spiderman', name: 'Spider-Man', emoji: '🕷️', category: 'movies' },
  { id: 'superman', name: 'Superman', emoji: '🦸', category: 'movies' },
  { id: 'harrypotter', name: 'Harry Potter', emoji: '⚡', category: 'movies' },
  { id: 'yoda', name: 'Yoda', emoji: '👽', category: 'movies' },
  { id: 'vader', name: 'Darth Vader', emoji: '🎭', category: 'movies' },
  { id: 'thor', name: 'Thor', emoji: '⚡', category: 'movies' },
  { id: 'wolverine', name: 'Wolverine', emoji: '🐺', category: 'movies' },
  { id: 'joker', name: 'Joker', emoji: '🃏', category: 'movies' },
  
  // Series
  { id: 'walter', name: 'Walter White', emoji: '🧪', category: 'series' },
  { id: 'sherlock', name: 'Sherlock', emoji: '🔍', category: 'series' },
  { id: 'jon', name: 'Jon Snow', emoji: '⚔️', category: 'series' },
  { id: 'tyrion', name: 'Tyrion', emoji: '🍷', category: 'series' },
  { id: 'rick', name: 'Rick', emoji: '🔬', category: 'series' },
  { id: 'morty', name: 'Morty', emoji: '😱', category: 'series' },
  { id: 'stranger', name: 'Stranger Things', emoji: '🎲', category: 'series' },
  { id: 'eleven', name: 'Eleven', emoji: '🧠', category: 'series' },
  { id: 'sherlock_holmes', name: 'Sherlock Holmes', emoji: '🕵️', category: 'series' },
  { id: 'daredevil', name: 'Daredevil', emoji: '👁️', category: 'series' },
  
  // Anime
  { id: 'naruto', name: 'Naruto', emoji: '🍜', category: 'anime' },
  { id: 'luffy', name: 'Luffy', emoji: '🏴‍☠️', category: 'anime' },
  { id: 'goku', name: 'Goku', emoji: '💪', category: 'anime' },
  { id: 'saitama', name: 'Saitama', emoji: '👊', category: 'anime' },
  { id: 'eren', name: 'Eren', emoji: '🔪', category: 'anime' },
  { id: 'levi', name: 'Levi', emoji: '⚔️', category: 'anime' },
  { id: 'ichigo', name: 'Ichigo', emoji: '🗡️', category: 'anime' },
  { id: 'light', name: 'Light Yagami', emoji: '📓', category: 'anime' },
  { id: 'l', name: 'L', emoji: '🍰', category: 'anime' },
  { id: 'edward', name: 'Edward Elric', emoji: '⚗️', category: 'anime' },
  
  // Games
  { id: 'mario', name: 'Mario', emoji: '🍄', category: 'games' },
  { id: 'link', name: 'Link', emoji: '🗡️', category: 'games' },
  { id: 'master', name: 'Master Chief', emoji: '🛡️', category: 'games' },
  { id: 'kratos', name: 'Kratos', emoji: '⚔️', category: 'games' },
  { id: 'sonic', name: 'Sonic', emoji: '💨', category: 'games' },
  { id: 'pacman', name: 'Pac-Man', emoji: '🟡', category: 'games' },
  { id: 'pikachu', name: 'Pikachu', emoji: '⚡', category: 'games' },
  { id: 'ryu', name: 'Ryu', emoji: '🥋', category: 'games' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', category: 'games' },
  { id: 'doom', name: 'Doom Slayer', emoji: '🔥', category: 'games' },
];

export const getAvatarById = (id: string): AvatarOption | undefined => {
  return AVAILABLE_AVATARS.find(avatar => avatar.id === id);
};

export const getAvatarEmoji = (id: string | undefined): string => {
  if (!id) return '👤'; // Default avatar
  const avatar = getAvatarById(id);
  return avatar?.emoji || '👤';
};

export const getAvatarsByCategory = (category: AvatarOption['category']): AvatarOption[] => {
  return AVAILABLE_AVATARS.filter(avatar => avatar.category === category);
};

