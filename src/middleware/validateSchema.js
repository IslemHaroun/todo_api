const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

// Middleware de validation JSON Schema
function validateSchema(schema) {
  return (req, res, next) => {
    const validate = ajv.compile(schema);
    const valid = validate(req.body);
    
    if (!valid) {
      return res.status(400).json({
        error: 'Validation error',
        details: validate.errors
      });
    }
    
    next();
  };
}

module.exports = validateSchema;