// Simple API documentation generator
export const generateApiDocs = () => {
  return {
    info: {
      title: 'ChexPro API',
      version: '1.0.0',
      description: 'Background screening services API'
    },
    endpoints: {
      '/health': {
        method: 'GET',
        description: 'Health check endpoint',
        auth: 'Bearer token (optional)',
        response: { status: 'ok', timestamp: 'ISO string' }
      },
      '/api/form/csrf-token': {
        method: 'GET',
        description: 'Get CSRF token for form submissions',
        response: { csrfToken: 'string' }
      },
      '/api/form/contact': {
        method: 'POST',
        description: 'Submit contact form',
        headers: { 'x-csrf-token': 'required' },
        body: {
          firstName: 'string',
          lastName: 'string',
          email: 'string',
          phone: 'string (optional)',
          companyName: 'string (optional)',
          message: 'string'
        }
      },
      '/api/form/demo': {
        method: 'POST',
        description: 'Submit demo request',
        headers: { 'x-csrf-token': 'required' },
        body: {
          firstName: 'string',
          lastName: 'string',
          jobTitle: 'string',
          companyName: 'string',
          workEmail: 'string',
          phone: 'string',
          screeningsPerYear: 'string',
          servicesOfInterest: 'string',
          message: 'string (optional)'
        }
      },
      '/api/auth/login': {
        method: 'POST',
        description: 'User login',
        headers: { 'x-csrf-token': 'required' },
        body: {
          username: 'string',
          password: 'string',
          rememberMe: 'boolean (optional)'
        }
      }
    }
  };
};