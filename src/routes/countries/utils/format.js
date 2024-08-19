export function formatResponse(suggestions) {
  return {
    matches: suggestions,
    items: {
      total: suggestions.length,
    },
  };
}