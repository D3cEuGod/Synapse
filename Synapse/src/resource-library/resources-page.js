import {
  getAllResources,
  getAvailableTypes,
  getAvailableCategories
} from "./resource-service.js";

function createResourceCard(resource) {
  return `
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-md">
      <div class="flex justify-between items-start gap-4 mb-3">
        <div>
          <h3 class="text-lg font-semibold text-white">${resource.title}</h3>
          <p class="text-sm text-gray-400 mt-1">${resource.description}</p>
        </div>
        <span class="text-xs px-3 py-1 rounded-full bg-[#177a64]/20 text-[#8ee4d2] border border-[#177a64]/40">
          ${resource.type}
        </span>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <span class="text-xs px-2 py-1 rounded-md bg-gray-700 text-gray-300">
          ${resource.category}
        </span>
        <span class="text-xs px-2 py-1 rounded-md bg-gray-700 text-gray-300">
          Target: ${resource.targetRiskLevel}
        </span>
      </div>

      <a
        href="${resource.url}"
        class="inline-flex items-center px-4 py-2 rounded-lg bg-[#177a64] hover:bg-[#0b4533] text-white text-sm font-medium transition-colors"
      >
        Open Resource
      </a>
    </div>
  `;
}

function renderResourceList(resources) {
  const listContainer = document.getElementById("resource-list");

  if (!listContainer) return;

  if (!resources.length) {
    listContainer.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center text-gray-400 md:col-span-2">
        No resources found.
      </div>
    `;
    return;
  }

  listContainer.innerHTML = resources.map(createResourceCard).join("");
}

function populateFilters() {
  const typeSelect = document.getElementById("resource-type-filter");
  const categorySelect = document.getElementById("resource-category-filter");

  if (typeSelect) {
    getAvailableTypes().forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });
  }

  if (categorySelect) {
    getAvailableCategories().forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }
}

function getFilteredResources() {
  const searchInput = document.getElementById("resource-search");
  const typeSelect = document.getElementById("resource-type-filter");
  const categorySelect = document.getElementById("resource-category-filter");

  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedType = typeSelect ? typeSelect.value : "";
  const selectedCategory = categorySelect ? categorySelect.value : "";

  return getAllResources().filter(resource => {
    const matchesSearch =
      !searchTerm ||
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm) ||
      resource.category.toLowerCase().includes(searchTerm);

    const matchesType = !selectedType || resource.type === selectedType;
    const matchesCategory = !selectedCategory || resource.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });
}

function applyFilters() {
  const filteredResources = getFilteredResources();
  renderResourceList(filteredResources);
}

function setupFiltersAndSearch() {
  const searchInput = document.getElementById("resource-search");
  const typeSelect = document.getElementById("resource-type-filter");
  const categorySelect = document.getElementById("resource-category-filter");

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", applyFilters);
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", applyFilters);
  }
}

export function renderResourcesPage() {
  const container = document.getElementById("app-main-content");

  if (!container) return;

  container.innerHTML = `
    <section class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white">Wellbeing Resource Library</h2>
        <p class="text-gray-400 mt-2">
          Search and explore articles, videos, and modules recommended for employee wellbeing.
        </p>
      </div>

      <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          id="resource-search"
          type="text"
          placeholder="Search resources..."
          class="px-4 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-[#5f9f87] focus:border-[#5f9f87]"
        />

        <select
          id="resource-type-filter"
          class="px-4 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
        >
          <option value="">All Types</option>
        </select>

        <select
          id="resource-category-filter"
          class="px-4 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white"
        >
          <option value="">All Categories</option>
        </select>
      </div>

      <div id="resource-list" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
    </section>
  `;

  populateFilters();
  setupFiltersAndSearch();
  renderResourceList(getAllResources());
}