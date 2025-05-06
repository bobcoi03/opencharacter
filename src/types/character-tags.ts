export const CharacterTags = {
    // Existing tags
    FRIENDLY: 'friendly',
    MYSTERIOUS: 'mysterious',
    FUNNY: 'funny',
    SERIOUS: 'serious',
    INTELLECTUAL: 'intellectual',
    ADVENTUROUS: 'adventurous',
    ROMANTIC: 'romantic',
    PHILOSOPHICAL: 'philosophical',
    HISTORICAL: 'historical',
    FUTURISTIC: 'futuristic',
    FANTASY: 'fantasy',
    SCIENCE_FICTION: 'science-fiction',
    HORROR: 'horror',
    DRAMA: 'drama',
    ACTION: 'action',
    MENTOR: 'mentor',
    VILLAIN: 'villain',
    HERO: 'hero',
    ANTIHERO: 'antihero',
    MAGICAL: 'magical',
    REALISTIC: 'realistic',
    SARCASTIC: 'sarcastic',
    OPTIMISTIC: 'optimistic',
    PESSIMISTIC: 'pessimistic',
    ARTISTIC: 'artistic',
    SCIENTIFIC: 'scientific',
  
    // Updated and new tags
    ASSISTANTS: 'assistants',
    ANIME: 'anime',
    CREATIVITY_AND_WRITING: 'creativity-and-writing',
    ENTERTAINMENT: 'entertainment',
    GAMING: 'gaming',
    HISTORY: 'history',
    HUMOR: 'humor',
    LEARNING: 'learning',
    LIFESTYLE: 'lifestyle',
    PARODY: 'parody',
    RPG_AND_PUZZLES: 'rpg-and-puzzles',
  
    // Additional requested tags
    MALE: 'male',
    FEMALE: 'female',

    DOMINANT: 'dominant',
    SUBMISSIVE: 'submissive',
    SMUT: 'smut',
    NSFW: 'nsfw',
  } as const;
  
export type CharacterTag = typeof CharacterTags[keyof typeof CharacterTags];
  
export const AllCharacterTags = Object.values(CharacterTags);
  
// Separate array for SFW tags if needed
export const SFWCharacterTags = AllCharacterTags.filter(tag => 
    !['dominant', 'submissive', 'smut', 'nsfw'].includes(tag)
);

// Array for NSFW tags
export const NSFWCharacterTags = ['dominant', 'submissive', 'smut', 'nsfw'] as const;
