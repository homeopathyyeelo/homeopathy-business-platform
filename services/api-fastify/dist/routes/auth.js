"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const loginSchema = {
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
    },
    required: ['email', 'password']
};
async function authRoutes(fastify) {
    fastify.post('/login', {
        schema: {
            body: loginSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        access_token: { type: 'string' },
                        token_type: { type: 'string' },
                        expires_in: { type: 'number' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { email, password } = request.body;
            if (email === 'admin@yeelo.com' && password === 'admin123') {
                const token = fastify.jwt.sign({
                    userId: 'admin-1',
                    role: 'ADMIN',
                    email: email
                }, { expiresIn: '24h' });
                return {
                    access_token: token,
                    token_type: 'Bearer',
                    expires_in: 86400
                };
            }
            reply.status(401).send({
                success: false,
                error: 'Invalid credentials'
            });
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Login failed'
            });
        }
    });
    fastify.get('/me', {
        preHandler: [fastify.authenticate],
        schema: {}
    }, async (request, reply) => {
        try {
            const user = request.user;
            return {
                success: true,
                data: {
                    id: user.userId,
                    email: user.email,
                    role: user.role,
                    name: 'Admin User'
                }
            };
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({
                success: false,
                error: 'Failed to get user info'
            });
        }
    });
}
//# sourceMappingURL=auth.js.map