import { mockResources } from "./resource-data.js";

export function getAllResources() {
  return mockResources;
}

export function getResourceById(resourceId) {
  return mockResources.find(resource => resource.id === resourceId) || null;
}

export function searchResources(keyword = "") {
  const searchTerm = keyword.trim().toLowerCase();

  if (!searchTerm) {
    return mockResources;
  }

  return mockResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm) ||
    resource.category.toLowerCase().includes(searchTerm) ||
    resource.description.toLowerCase().includes(searchTerm)
  );
}

export function filterResources({ type = "", category = "" } = {}) {
  return mockResources.filter(resource => {
    const matchesType = !type || resource.type === type;
    const matchesCategory = !category || resource.category === category;
    return matchesType && matchesCategory;
  });
}

export function getAvailableTypes() {
  return [...new Set(mockResources.map(resource => resource.type))];
}

export function getAvailableCategories() {
  return [...new Set(mockResources.map(resource => resource.category))];
}