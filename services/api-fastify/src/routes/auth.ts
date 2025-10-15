import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

interface LoginBody {
  email: string
  password: string
}

const loginSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  },
  required: ['email', 'password']
}

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post<{ Body: LoginBody }>('/login', {
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
      const { email, password } = request.body

      // Demo authentication - replace with real authentication
      if (email === 'admin@yeelo.com' && password === 'admin123') {
        const token = fastify.jwt.sign(
          { 
            userId: 'admin-1', 
            role: 'ADMIN',
            email: email
          },
          { expiresIn: '24h' }
        )

        return {
          access_token: token,
          token_type: 'Bearer',
          expires_in: 86400
        }
      }

      reply.status(401).send({
        success: false,
        error: 'Invalid credentials'
      })
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Login failed'
      })
    }
  })

  // Get current user info
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      
      
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any
      
      return {
        success: true,
        data: {
          id: user.userId,
          email: user.email,
          role: user.role,
          name: 'Admin User'
        }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500).send({
        success: false,
        error: 'Failed to get user info'
      })
    }
  })
}
