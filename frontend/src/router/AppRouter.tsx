import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/progress/DashboardPage';
import { StatsPage } from '@/features/progress/StatsPage';
import { DecksListPage } from '@/features/decks/DecksListPage';
import { DeckDetailPage } from '@/features/decks/DeckDetailPage';
import { DeckEditorPage } from '@/features/decks/DeckEditorPage';
import { GamePickerPage } from '@/features/games/GamePickerPage';
import { FlashcardsPage } from '@/features/games/flashcards/FlashcardsPage';
import { TestGamePage } from '@/features/games/test/TestGamePage';
import { MatchGamePage } from '@/features/games/match/MatchGamePage';
import { SpellingGamePage } from '@/features/games/spelling/SpellingGamePage';
import { ScrambleGamePage } from '@/features/games/scramble/ScrambleGamePage';
import { StoriesListPage } from '@/features/stories/StoriesListPage';
import { StoryReaderPage } from '@/features/stories/StoryReaderPage';
import { StoryQuizPage } from '@/features/stories/StoryQuizPage';
import { CoursesListPage } from '@/features/courses/CoursesListPage';
import { CourseDetailPage } from '@/features/courses/CourseDetailPage';
import { LessonDetailPage } from '@/features/courses/LessonDetailPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AdminPage } from '@/features/admin/AdminPage';
import { AdminLanguageFormPage } from '@/features/admin/AdminLanguageFormPage';
import { AdminCourseFormPage } from '@/features/admin/AdminCourseFormPage';
import { AdminStoryFormPage } from '@/features/admin/AdminStoryFormPage';
import { ProtectedRoute, AdminRoute } from './guards';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/decks" element={<DecksListPage />} />
          <Route path="/decks/new" element={<DeckEditorPage />} />
          <Route path="/decks/:id" element={<DeckDetailPage />} />
          <Route path="/decks/:id/edit" element={<DeckEditorPage />} />
          <Route path="/decks/:id/play" element={<GamePickerPage />} />
          <Route path="/decks/:id/play/flashcards" element={<FlashcardsPage />} />
          <Route path="/decks/:id/play/test" element={<TestGamePage />} />
          <Route path="/decks/:id/play/match" element={<MatchGamePage />} />
          <Route path="/decks/:id/play/spelling" element={<SpellingGamePage />} />
          <Route path="/decks/:id/play/scramble" element={<ScrambleGamePage />} />
          <Route path="/courses" element={<CoursesListPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={<LessonDetailPage />}
          />
          <Route path="/stories" element={<StoriesListPage />} />
          <Route path="/stories/:id" element={<StoryReaderPage />} />
          <Route path="/stories/:id/quiz" element={<StoryQuizPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/languages/new" element={<AdminLanguageFormPage />} />
            <Route path="/admin/languages/:id/edit" element={<AdminLanguageFormPage />} />
            <Route path="/admin/courses/new" element={<AdminCourseFormPage />} />
            <Route path="/admin/courses/:id/edit" element={<AdminCourseFormPage />} />
            <Route path="/admin/stories/new" element={<AdminStoryFormPage />} />
            <Route path="/admin/stories/:id/edit" element={<AdminStoryFormPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
