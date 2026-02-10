export const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Logueamos el stack trace para debug

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        return res.status(400).json({
            error: messages.join(', '),
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Entrada duplicada detectada',
        });
    }

    // Si el error tiene un status code definido, lo usamos. Si no, 500.
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(statusCode).json({
        error: message,
    });
};
