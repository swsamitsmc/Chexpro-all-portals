export const validateInputLength = (fields) => (req, res, next) => {
    for (const field of fields) {
        const { name, maxLength } = field;
        if (req.body[name] && req.body[name].length > maxLength) {
            return res.status(400).json({ error: `Input for ${name} exceeds maximum length of ${maxLength} characters.` });
        }
    }
    next();
};