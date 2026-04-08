import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useQuiz } from './hooks/useQuiz';
import { fetchQuestions, fetchProfessions, fetchUniversities, fetchQuests } from './api/client';
import { getHistory } from './utils/history';
import { showToast } from './components/Toast';

import Toast from './components/Toast';
import WelcomeScreen from './screens/WelcomeScreen';
import QuizScreen from './screens/QuizScreen';
import TransitionScreen from './screens/TransitionScreen';
import CompletionScreen from './screens/CompletionScreen';
import ResultsScreen from './screens/ResultsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthorsModal from './components/AuthorsModal';
import QuestScreen from './screens/QuestScreen';
import QuestsListScreen from './screens/QuestsListScreen';

export default function App() {
  const { tg, ready, expand, haptic, sendData, setHeaderColor, setBackgroundColor } = useTelegram();

  // User state — читается после ready()
  const [user, setUser] = useState(null);

  // Data
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [uniMap, setUniMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Screen
  const [screen, setScreen] = useState('welcome');
  const [showAuthors, setShowAuthors] = useState(false);
  const [transitionCat, setTransitionCat] = useState(null);
  const [transitionCatIndex, setTransitionCatIndex] = useState(0);
  const [historyEntry, setHistoryEntry] = useState(null);
  const [quests, setQuests] = useState({});
  const [activeQuestId, setActiveQuestId] = useState(null);

  // Quiz hook
  const quiz = useQuiz(questions, categories, professions, user?.id);

  // Init
  useEffect(() => {
    ready();
    expand();
    setHeaderColor('#0F0F1A');
    setBackgroundColor('#0F0F1A');

    // Читаем user после инициализации SDK
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) setUser(tgUser);

    async function loadData() {
      try {
        const [qData, pData, uData, questData] = await Promise.all([
          fetchQuestions(), fetchProfessions(), fetchUniversities(), fetchQuests().catch(() => ({ quests: {} })),
        ]);
        setQuests(questData.quests || {});

        setCategories(qData.categories);
        setProfessions(pData.professions || pData);
        setUniversities(uData.universities);
        setUniMap(uData.profession_university_map || {});

        // Flatten questions with category info
        const flat = [];
        qData.categories.forEach(cat => {
          cat.questions.forEach(q => {
            flat.push({ ...q, categoryId: cat.id, categoryName: cat.name, categoryEmoji: cat.emoji });
          });
        });
        setQuestions(flat);
      } catch (e) {
        console.error('Init error:', e);
        showToast('Қате! Қайта ашып көріңіз.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Start quiz
  const handleStart = useCallback(() => {
    quiz.startQuiz();
    setHistoryEntry(null);

    // Show first category transition
    if (categories.length > 0) {
      setTransitionCat(categories[0]);
      setTransitionCatIndex(0);
      setScreen('transition');
    } else {
      setScreen('quiz');
    }
  }, [quiz, categories]);

  // Select answer
  const handleSelect = useCallback((originalIndex) => {
    const result = quiz.selectOption(originalIndex);
    if (!result) return;

    haptic?.impactOccurred?.('light');

    if (result.warning) {
      showToast(result.warning);
    }

    if (result.finished) {
      haptic?.notificationOccurred?.('success');
      // Сразу показываем результаты (не completion)
      setScreen('results');
    } else if (result.categoryChanged) {
      // Find the new category
      const nextQ = questions[quiz.currentIndex];
      const catIndex = categories.findIndex(c => c.id === nextQ?.categoryId);
      setTransitionCat(categories[catIndex]);
      setTransitionCatIndex(catIndex);
      setScreen('transition');
    }
  }, [quiz, questions, categories, haptic]);

  // Transition done
  const handleTransitionDone = useCallback(() => {
    setScreen('quiz');
  }, []);

  // Start quest
  const handleStartQuest = useCallback((professionId) => {
    if (quests[professionId]) {
      setActiveQuestId(professionId);
      setScreen('quest');
    }
  }, [quests]);

  // Share results
  const handleShare = useCallback(() => {
    const top1 = quiz.matchedResults[0];
    const name = top1?.profession?.name || 'мамандық';
    const text = `🎓 Мен «Кім боламын?» тестін тапсырдым!\n🥇 Менің №1 мамандығым: ${name}\n\nСен де тапсырып көр! 👇`;
    const botUsername = tg?.initDataUnsafe?.user ? `propickerbot` : '';
    const url = botUsername ? `https://t.me/${botUsername}` : '';

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    } else {
      // Fallback — copy to clipboard
      navigator.clipboard?.writeText(text + '\n' + url).then(() => {
        showToast('📋 Көшірілді!');
      });
    }
  }, [quiz, tg]);

  // Submit results to bot
  const handleSubmit = useCallback(() => {
    const payload = quiz.buildPayload();
    try {
      if (tg?.sendData) {
        tg.sendData(JSON.stringify(payload));
        // sendData закрывает Mini App, если не закрылось — fallback
        setTimeout(() => {
          showToast('✅ Нәтиже жіберілді! Ботты тексеріңіз.');
        }, 500);
      } else {
        showToast('Нәтижені көру үшін ботқа оралыңыз');
        setTimeout(() => tg?.close?.(), 1500);
      }
    } catch (e) {
      console.error('sendData error:', e);
      showToast('Ботқа оралыңыз');
      setTimeout(() => tg?.close?.(), 1500);
    }
  }, [quiz, tg]);

  // View history entry
  const handleViewHistory = useCallback((entry) => {
    // Reconstruct matched results from history
    const restored = (entry.top5 || []).map(item => {
      const prof = professions.find(p => p.id === item.profId);
      if (!prof) return null;
      return { profession: prof, score: item.score, matchPct: item.matchPct };
    }).filter(Boolean);

    if (restored.length > 0) {
      // Temporarily set these as quiz results for display
      setHistoryEntry({ matched: restored, entry });
      setScreen('results');
    }
  }, [professions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10" style={{
        background: `
          radial-gradient(ellipse 600px 400px at 20% 10%, rgba(56,217,169,0.08), transparent),
          radial-gradient(ellipse 500px 500px at 85% 80%, rgba(240,180,41,0.06), transparent)
        `
      }} />

      <Toast />

      {screen === 'welcome' && (
        <WelcomeScreen
          user={user}
          hasQuests={Object.keys(quests).length > 0}
          onStart={handleStart}
          onProfile={() => setScreen('profile')}
          onQuests={() => setScreen('quests-list')}
          onAuthors={() => setShowAuthors(true)}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          questions={questions}
          categories={categories}
          currentIndex={quiz.currentIndex}
          getShuffledOptions={quiz.getShuffledOptions}
          onSelect={handleSelect}
        />
      )}

      {screen === 'transition' && transitionCat && (
        <TransitionScreen
          category={transitionCat}
          catIndex={transitionCatIndex}
          totalCategories={categories.length}
          onDone={handleTransitionDone}
        />
      )}

      {screen === 'completion' && (
        <CompletionScreen
          totalQuestions={questions.length}
          totalTimeMs={quiz.getTotalTime()}
          onSubmit={handleSubmit}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          matchedResults={historyEntry ? historyEntry.matched : quiz.matchedResults}
          universities={universities}
          uniMap={uniMap}
          totalTimeMs={historyEntry ? 0 : quiz.getTotalTime()}
          totalQuestions={questions.length}
          userName={user?.first_name}
          availableQuests={quests}
          onSend={handleSubmit}
          onShare={handleShare}
          onStartQuest={handleStartQuest}
          onQuests={() => setScreen('quests-list')}
          onProfile={() => setScreen('profile')}
          isHistoryView={!!historyEntry}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          user={user}
          tagScores={quiz.tagScores}
          onBack={() => setScreen('welcome')}
          onStart={handleStart}
          onViewHistory={handleViewHistory}
        />
      )}

      {screen === 'quests-list' && (
        <QuestsListScreen
          quests={quests}
          professions={professions}
          onStartQuest={handleStartQuest}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'quest' && activeQuestId && quests[activeQuestId] && (
        <QuestScreen
          quest={quests[activeQuestId]}
          professionId={activeQuestId}
          onBack={() => setScreen('quests-list')}
        />
      )}

      {showAuthors && <AuthorsModal onClose={() => setShowAuthors(false)} />}
    </>
  );
}
