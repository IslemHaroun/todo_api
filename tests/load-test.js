import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration du test
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Montée progressive à 10 utilisateurs
    { duration: '1m', target: 50 },    // Maintien à 50 utilisateurs  
    { duration: '30s', target: 100 },  // Pic à 100 utilisateurs
    { duration: '30s', target: 0 },    // Descente progressive
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% d'erreurs
  },
};

const BASE_URL = 'http://localhost:3000';

export default function() {
  // 1. Créer une tâche (70% des requêtes)
  if (Math.random() < 0.7) {
    const payload = JSON.stringify({
      title: `Task ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: `Generated during load test at ${new Date().toISOString()}`
    });
    
    const createResponse = http.post(`${BASE_URL}/todos`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    check(createResponse, {
      'Create status is 201': (r) => r.status === 201,
      'Create response has id': (r) => r.json().id !== undefined,
    });
  }
  
  // 2. Lister les tâches (20% des requêtes)
  if (Math.random() < 0.2) {
    const listResponse = http.get(`${BASE_URL}/todos`);
    
    check(listResponse, {
      'List status is 200': (r) => r.status === 200,
      'List returns array': (r) => Array.isArray(r.json()),
    });
  }
  
  // 3. Marquer comme terminé (10% des requêtes)
  if (Math.random() < 0.1) {
    // Utiliser un ID aléatoire entre 1 et 50
    const randomId = Math.floor(Math.random() * 50) + 1;
    const doneResponse = http.patch(`${BASE_URL}/todos/${randomId}/done`);
    
    check(doneResponse, {
      'Done operation completed': (r) => r.status === 200 || r.status === 404,
    });
  }
  
  // Pause aléatoire entre requêtes
  sleep(Math.random() * 2);
}

// Fonction de setup - créer quelques tâches de base
export function setup() {
  const setupTasks = [
    { title: 'Setup Task 1', description: 'Initial task for load testing' },
    { title: 'Setup Task 2', description: 'Another initial task' },
    { title: 'Setup Task 3', description: 'Third initial task' }
  ];
  
  setupTasks.forEach(task => {
    http.post(`${BASE_URL}/todos`, JSON.stringify(task), {
      headers: { 'Content-Type': 'application/json' }
    });
  });
  
  console.log('Setup completed - created initial tasks');
}
