import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
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

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot', element: <ForgotPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/decks', element: <DecksListPage /> },
          { path: '/decks/new', element: <DeckEditorPage /> },
          { path: '/decks/:id', element: <DeckDetailPage /> },
          { path: '/decks/:id/edit', element: <DeckEditorPage /> },
          { path: '/decks/:id/play', element: <GamePickerPage /> },
          { path: '/decks/:id/play/flashcards', element: <FlashcardsPage /> },
          { path: '/decks/:id/play/test', element: <TestGamePage /> },
          { path: '/decks/:id/play/match', element: <MatchGamePage /> },
          { path: '/decks/:id/play/spelling', element: <SpellingGamePage /> },
          { path: '/decks/:id/play/scramble', element: <ScrambleGamePage /> },
          { path: '/courses', element: <CoursesListPage /> },
          { path: '/courses/:id', element: <CourseDetailPage /> },
          { path: '/courses/:courseId/lessons/:lessonId', element: <LessonDetailPage /> },
          { path: '/stories', element: <StoriesListPage /> },
          { path: '/stories/:id', element: <StoryReaderPage /> },
          { path: '/stories/:id/quiz', element: <StoryQuizPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              { path: '/admin/languages/new', element: <AdminLanguageFormPage /> },
              { path: '/admin/languages/:id/edit', element: <AdminLanguageFormPage /> },
              { path: '/admin/courses/new', element: <AdminCourseFormPage /> },
              { path: '/admin/courses/:id/edit', element: <AdminCourseFormPage /> },
              { path: '/admin/stories/new', element: <AdminStoryFormPage /> },
              { path: '/admin/stories/:id/edit', element: <AdminStoryFormPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
