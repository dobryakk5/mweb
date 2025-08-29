const fastify = require('fastify')({ logger: true });
const RealtyParserClient = require('./fastify-realty-client');

// Создаем клиент для работы с Python API
const realtyClient = new RealtyParserClient('http://localhost:8008');

// Регистрируем роуты для работы с недвижимостью
fastify.register(async function (fastify, options) {
    
    // Парсинг одного объявления
    fastify.get('/property/parse', async (request, reply) => {
        const { url } = request.query;
        
        if (!url) {
            return reply.code(400).send({ 
                error: 'URL parameter is required' 
            });
        }

        try {
            const result = await realtyClient.parseSingleProperty(url);
            return result;
        } catch (error) {
            fastify.log.error(`Property parsing error: ${error.message}`);
            return reply.code(500).send({ 
                error: 'Failed to parse property',
                details: error.message 
            });
        }
    });

    // Пакетный парсинг по URL
    fastify.post('/properties/parse-urls', async (request, reply) => {
        const { urls } = request.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return reply.code(400).send({ 
                error: 'URLs array is required' 
            });
        }

        try {
            const result = await realtyClient.parsePropertiesByUrls(urls);
            return result;
        } catch (error) {
            fastify.log.error(`Batch parsing error: ${error.message}`);
            return reply.code(500).send({ 
                error: 'Failed to parse properties',
                details: error.message 
            });
        }
    });

    // Парсинг из текста
    fastify.post('/properties/parse-text', async (request, reply) => {
        const { text } = request.body;
        
        if (!text || typeof text !== 'string') {
            return reply.code(400).send({ 
                error: 'Text parameter is required' 
            });
        }

        try {
            const result = await realtyClient.parsePropertiesFromText(text);
            return result;
        } catch (error) {
            fastify.log.error(`Text parsing error: ${error.message}`);
            return reply.code(500).send({ 
                error: 'Failed to parse properties from text',
                details: error.message 
            });
        }
    });

    // Парсинг с retry логикой
    fastify.post('/properties/parse-with-retry', async (request, reply) => {
        const { urls, maxRetries = 3 } = request.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return reply.code(400).send({ 
                error: 'URLs array is required' 
            });
        }

        try {
            const result = await realtyClient.parseWithRetry(urls, maxRetries);
            return result;
        } catch (error) {
            fastify.log.error(`Retry parsing error: ${error.message}`);
            return reply.code(500).send({ 
                error: 'Failed to parse properties after retries',
                details: error.message 
            });
        }
    });

    // Проверка состояния Python API
    fastify.get('/health', async (request, reply) => {
        try {
            const health = await realtyClient.healthCheck();
            return health;
        } catch (error) {
            fastify.log.error(`Health check error: ${error.message}`);
            return reply.code(503).send({ 
                error: 'Python API is not available',
                details: error.message 
            });
        }
    });
});

// Запуск сервера
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Fastify server running on port 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();