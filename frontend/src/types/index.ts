export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string | null;
  native_language?: string | null;
  learning_language?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Deck {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  source_lang: string;
  target_lang: string;
  level?: string | null;
  topic?: string | null;
  is_public: boolean;
  course_id?: number | null;
  created_at: string;
  updated_at: string;
  cards_count: number;
}

export interface DeckList {
  items: Deck[];
  total: number;
  page: number;
  page_size: number;
}

export interface Card {
  id: number;
  deck_id: number;
  term: string;
  definition: string;
  transcription?: string | null;
  example?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  term: string;
  definition: string;
  transcription?: string | null;
  example?: string | null;
  position?: number;
}

export type GameType = 'flashcards' | 'test' | 'match' | 'spelling' | 'gravity';

export interface FlashcardItem {
  card_id: number;
  term: string;
  definition: string;
  transcription?: string | null;
}

export interface TestQuestion {
  card_id: number;
  term: string;
  definition: string;
  options: string[];
}

export interface GameStartResponse {
  session_token: string;
  deck_id: number;
  items: FlashcardItem[] | TestQuestion[];
}

export interface StoryWord {
  id: number;
  story_id: number;
  word: string;
  translation: string;
  note?: string | null;
  position_in_text: number;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  audio_url?: string | null;
  level?: string | null;
  topic?: string | null;
  source_lang: string;
  target_lang: string;
  author_id?: number | null;
  deck_id?: number | null;
  course_id?: number | null;
  is_published: boolean;
  created_at: string;
  words: StoryWord[];
}

export interface StoryListItem {
  id: number;
  title: string;
  audio_url?: string | null;
  level?: string | null;
  topic?: string | null;
  source_lang: string;
  target_lang: string;
  is_published: boolean;
  deck_id?: number | null;
  course_id?: number | null;
  created_at: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name?: string | null;
  flag?: string | null;
  color?: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  courses_count: number;
}

export interface Course {
  id: number;
  title: string;
  description?: string | null;
  level?: string | null;
  topic?: string | null;
  source_lang: string;
  target_lang: string;
  cover_color?: string | null;
  is_published: boolean;
  position: number;
  language_id?: number | null;
  author_id?: number | null;
  created_at: string;
  decks_count: number;
  stories_count: number;
}

export interface CourseDeckItem {
  id: number;
  title: string;
  description?: string | null;
  level?: string | null;
  is_public: boolean;
  cards_count: number;
}

export interface CourseStoryItem {
  id: number;
  title: string;
  level?: string | null;
  is_published: boolean;
}

export interface CourseDetail extends Course {
  decks: CourseDeckItem[];
  stories: CourseStoryItem[];
}

export interface Lesson {
  id: number;
  course_id: number;
  position: number;
  title: string;
  passing_score: number;
  deck_id?: number | null;
  story_id?: number | null;
}

export interface LessonStatus extends Lesson {
  locked: boolean;
  passed: boolean;
  best_score: number;
  attempts: number;
  last_attempt_at?: string | null;
}

export interface LessonAttemptResult {
  lesson_id: number;
  best_score: number;
  attempts: number;
  passed: boolean;
  just_passed: boolean;
  next_lesson_id?: number | null;
}

export interface CourseProgress {
  total_lessons: number;
  passed_lessons: number;
  percent: number;
  next_lesson_id?: number | null;
}

export interface QuizQuestion {
  word: string;
  correct: string;
  options: string[];
}

export interface StoryQuiz {
  story_id: number;
  questions: QuizQuestion[];
}

export interface ProgressSummary {
  total_cards: number;
  learning: number;
  mastered: number;
  due_now: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface DueCard {
  id: number;
  deck_id: number;
  term: string;
  definition: string;
  transcription?: string | null;
  next_review_at: string | null;
  mastery_level: number;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  score: number;
  duration_seconds: number;
  completed_at: string;
}
