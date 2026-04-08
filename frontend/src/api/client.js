import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export const fetchQuestions = () => api.get('/api/questions').then(r => r.data);
export const fetchProfessions = () => api.get('/api/professions').then(r => r.data);
export const fetchUniversities = () => api.get('/api/universities').then(r => r.data);

export const fetchQuests = () => api.get('/api/quests').then(r => r.data);

export const fetchCard =(userName, topProfessions, lang = 'kk') =>
  api.post('/api/card', { user_name: userName, top_professions: topProfessions, lang }, { responseType: 'blob' })
    .then(r => URL.createObjectURL(r.data));
