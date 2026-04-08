import { useState, useCallback, useRef } from 'react';
import { generateShuffleMap } from '../utils/shuffle';
import { calculateResults } from '../utils/scoring';
import { calculateConfidence, checkLiveAntiCheat } from '../utils/antiCheat';
import { saveToHistory } from '../utils/history';

export function useQuiz(questions, categories, professions, userId) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timings, setTimings] = useState([]);
  const [matchedResults, setMatchedResults] = useState([]);
  const [tagScores, setTagScores] = useState({});
  const [confidence, setConfidence] = useState(0);
  const questionStartTime = useRef(Date.now());
  const testStartTime = useRef(Date.now());
  const shuffleMapsRef = useRef([]);

  const initShuffleMaps = useCallback(() => {
    const seed = (userId || 0) + Math.floor(Date.now() / 86400000);
    shuffleMapsRef.current = questions.map((q, i) =>
      generateShuffleMap(q.options.length, seed + i)
    );
  }, [questions, userId]);

  const startQuiz = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setTimings([]);
    setMatchedResults([]);
    setTagScores({});
    setConfidence(0);
    testStartTime.current = Date.now();
    questionStartTime.current = Date.now();
    initShuffleMaps();
  }, [initShuffleMaps]);

  const getShuffledOptions = useCallback((qIndex) => {
    const q = questions[qIndex];
    if (!q) return [];
    const map = shuffleMapsRef.current[qIndex] || q.options.map((_, i) => i);
    return map.map(i => ({ ...q.options[i], originalIndex: i }));
  }, [questions]);

  const selectOption = useCallback((originalIndex) => {
    const q = questions[currentIndex];
    if (!q) return null;

    const timeMs = Date.now() - questionStartTime.current;
    const newAnswer = { question_id: q.id, option_index: originalIndex, time_ms: timeMs };
    const newAnswers = [...answers, newAnswer];
    const newTimings = [...timings, timeMs];

    setAnswers(newAnswers);
    setTimings(newTimings);
    questionStartTime.current = Date.now();

    // Live anti-cheat
    const warning = checkLiveAntiCheat(newAnswers);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // Check if quiz finished
    if (nextIndex >= questions.length) {
      const { top, tagScores: ts } = calculateResults(newAnswers, categories, professions);
      const conf = calculateConfidence(newAnswers, newTimings);
      setMatchedResults(top);
      setTagScores(ts);
      setConfidence(conf);
      saveToHistory(top, newTimings, ts);
      return { finished: true, warning };
    }

    // Check if new category
    const prevCatId = questions[currentIndex].categoryId;
    const nextCatId = questions[nextIndex]?.categoryId;
    const categoryChanged = prevCatId !== nextCatId;

    return { finished: false, categoryChanged, warning };
  }, [currentIndex, answers, timings, questions, categories, professions]);

  const getTotalTime = useCallback(() => {
    return Date.now() - testStartTime.current;
  }, []);

  const buildPayload = useCallback(() => ({
    answers: answers.map(a => ({ question_id: a.question_id, option_index: a.option_index, time_ms: a.time_ms })),
    timings,
    total_time_ms: getTotalTime(),
    version: '3.0',
  }), [answers, timings, getTotalTime]);

  return {
    currentIndex, answers, timings,
    matchedResults, tagScores, confidence,
    startQuiz, selectOption, getShuffledOptions,
    getTotalTime, buildPayload,
    isFinished: currentIndex >= questions.length && matchedResults.length > 0,
  };
}
