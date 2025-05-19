const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const validateSchema = require('../middleware/validateSchema');
const idempotency = require('../middleware/idempotency');

// Schémas de validation
const schemas = {
  createTodo: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 }
    },
    additionalProperties: false
  }
};

// Routes CRUD
router.post('/', 
  validateSchema(schemas.createTodo),
  idempotency,
  todoController.createTodo
);

router.get('/', todoController.getAllTodos);

router.patch('/:id/done', todoController.markTodoAsDone);

module.exports = router;