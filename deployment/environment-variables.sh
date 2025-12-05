#!/bin/bash
# System Environment Variables for Production Deployment
# Save this as: /etc/environment.d/yeelo-homeopathy.conf
# Or add to /etc/profile.d/yeelo-homeopathy.sh

# Database Configuration
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=yeelo_homeopathy

# Google My Business OAuth
export GMB_CLIENT_ID=43246824970-hmep0a9q6j33qmormjfipufvslb0a25q.apps.googleusercontent.com
export GMB_CLIENT_SECRET=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
export GMB_REDIRECT_URIS=http://localhost:3005/api/social/gmb/oauth/callback
export GMB_AUTH_URI=https://accounts.google.com/o/oauth2/auth
export GMB_TOKEN_URI=https://oauth2.googleapis.com/token
export GMB_JAVASCRIPT_ORIGINS=http://localhost:3000

# Application Configuration
export FRONTEND_URL=http://localhost:3000
export BACKEND_PORT=3005
export JWT_SECRET=your-secret-key-change-in-production