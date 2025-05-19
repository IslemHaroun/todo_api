import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration du test
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Montée en charge
    { duration: '1m', target: 50 },  // Charge constante moyenne
    { duration: '30s', target: 100 }, // Pic de charge
    { duration: '30s', target: 0 },   // Arrêt progressif
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes doivent être sous 500ms
    http_req_failed: ['rate<0.01'],    // Moins de 1% d'erreurs
  },
};

// Variables pour stocker des IDs de tâches
const todoIds = [];

// Fonction principale de test
export default function() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. Créer une nouvelle tâche
  const createPayload = JSON.stringify({
    title: `Tâche de test ${Date.now()}`,
    description: 'Description générée lors du test de charge'
  });
  
  const createHeaders = {
    'Content-Type': 'application/json',
    'Idempotency-Key': `${Date.now()}-${Math.random()}` // Clé d'idempotence unique
  };
  
  const createResponse = http.post(`${baseUrl}/todos`, createPayload, { headers: createHeaders });
  
  check(createResponse, {
    'Création réussie': (r) => r.status === 201,
    'Format JSON valide': (r) => r.json() !== null,
  });
  
  if (createResponse.status === 201) {
    const todoId = createResponse.json().id;
    todoIds.push(todoId);
  }
  
  // 2. Récupérer toutes les tâches
  const getResponse = http.get(`${baseUrl}/todos`);
  
  check(getResponse, {
    'Liste récupérée': (r) => r.status === 200,
    'Format JSON valide': (r) => r.json() !== null,
    'Contient des tâches': (r) => Array.isArray(r.json()) && r.json().length > 0,
  });
  
  // 3. Marquer une tâche comme terminée (si des IDs sont disponibles)
  if (todoIds.length > 0) {
    // Prendre un ID aléatoire dans la liste
    const randomIndex = Math.floor(Math.random() * todoIds.length);
    const idToUpdate = todoIds[randomIndex];
    
    const markDoneResponse = http.patch(`${baseUrl}/todos/${idToUpdate}/done`);
    
    check(markDoneResponse, {
      'Marquage réussi': (r) => r.status === 200,
      'Tâche bien marquée comme terminée': (r) => r.json().done === true,
    });
  }
  
  // Pause entre les itérations
  sleep(Math.random() * 3 + 1); // 1-4 secondes
}