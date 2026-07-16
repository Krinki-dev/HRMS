const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body against the schema
    const validated = schema.parse(req.body);
    req.body = validated; // replace with validated data
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

module.exports = { validate };