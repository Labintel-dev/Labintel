'use strict';
/**
 * validateBody — Zod schema validation middleware.
 * Strips unexpected fields from request body before it reaches the controller.
 *
 * Usage: validateBody(myZodSchema)
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error:   'Validation failed',
        details: result.error.flatten(),
      });
    }

    req.body = result.data; // cleaned, typed, and stripped
    next();
  };
}

module.exports = validateBody;
