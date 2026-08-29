module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm build && pnpm preview',
      url: ['http://localhost:4173/'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:pwa': ['error', { minScore: 1 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};