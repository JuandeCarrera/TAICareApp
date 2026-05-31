/**
 * Convierte un texto a formato "Title Case" (Ej: "juan pérez" -> "Juan Pérez")
 */
export const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/\s+/g, ' ') // Elimina dobles espacios
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Convierte un texto a formato "Sentence case" (Ej: "tomar la pastilla" -> "Tomar la pastilla")
 */
export const toSentenceCase = (str) => {
    if (!str || typeof str !== 'string') return str;
    const trimmed = str.trim().replace(/\s+/g, ' ');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Limpia y estandariza un email
 */
export const formatEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    return email.trim().toLowerCase();
};

/**
 * Sanitiza texto básico para evitar inyección XSS en cadenas de texto
 * Escapa los caracteres < y >
 */
export const sanitizeText = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/**
 * Formatea un texto largo: Sanitiza XSS + Aplica Sentence Case
 */
export const formatLongText = (str) => {
    if (!str || typeof str !== 'string') return str;
    const sanitized = sanitizeText(str);
    return toSentenceCase(sanitized);
};
