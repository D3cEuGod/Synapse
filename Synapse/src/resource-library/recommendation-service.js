const recommendations = [];

export function recommendResourceToEmployee({
  employeeId,
  ambassadorId,
  resourceId,
  message
}) {
  const recommendation = {
    id: `rec-${Date.now()}`,
    employeeId,
    ambassadorId,
    resourceId,
    message: message || "",
    recommendedAt: new Date().toISOString(),
    isRead: false
  };

  recommendations.push(recommendation);
  return recommendation;
}

export function getRecommendationsForEmployee(employeeId) {
  return recommendations.filter(
    recommendation => recommendation.employeeId === employeeId
  );
}

export function markRecommendationAsRead(recommendationId) {
  const recommendation = recommendations.find(item => item.id === recommendationId);

  if (recommendation) {
    recommendation.isRead = true;
  }

  return recommendation || null;
}