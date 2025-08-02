// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to the dev_chat database
db = db.getSiblingDB('dev_chat');

// Create a user for the application
db.createUser({
  user: 'devchat_user',
  pwd: 'devchat_password',
  roles: [
    {
      role: 'readWrite',
      db: 'dev_chat',
    },
  ],
});

// Create collections with proper indexes
db.createCollection('messages');
db.createCollection('search_cache');

// Create indexes for better performance
db.messages.createIndex({ channelId: 1, createdAt: -1 });
db.messages.createIndex({ authorId: 1, createdAt: -1 });
db.messages.createIndex({ content: 'text' }); // Full-text search
db.messages.createIndex({ createdAt: -1 });
db.messages.createIndex({ channelId: 1, authorId: 1 });

// Index for search functionality
db.search_cache.createIndex({ query: 1 });
db.search_cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialization completed successfully!');
print('Created database: dev_chat');
print('Created user: devchat_user');
print('Created collections: messages, search_cache');
print('Created indexes for optimal performance');
