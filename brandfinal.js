const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Replace with your actual MongoDB connection string
const mongoURI = 'mongodb+srv://sehran:9a4CiWgwjpuagbUj@cx360test.yv346id.mongodb.net/cx360?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define the Brand Schema based on your collection structure
const BrandSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  brand: String,
  key_phrase_frequencies: Object,
  brand_summary: String
}, { collection: 'brand_aggregated_data' });

const Brand = mongoose.model('Brand', BrandSchema);

// Middleware to parse JSON
app.use(express.json());

// Define the helper functions used in server-side HTML generation
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatBrandSummary(summary) {
  return summary.replace(/\n/g, '<br>').replace(/- /g, '&nbsp;&nbsp;- ');
}

// Serve the main page
app.get('/', async (req, res) => {
  try {
    // Fetch all brands
    const brands = await Brand.find({}, { _id: 1, brand: 1, brand_summary: 1 });

    // Check if brands were fetched
    if (!brands || brands.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Cx360</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div class="flex flex-col min-h-screen">
            <header class="bg-white shadow-md">
              <div class="container mx-auto px-4 py-4 flex justify-between items-center">
                <a href="#" class="text-2xl font-bold text-blue-600">Cx360</a>
              </div>
            </header>
            <main class="flex-grow text-center py-20">
              <h1 class="text-4xl font-bold">No brands available</h1>
            </main>
          </div>
        </body>
        </html>
      `);
    }

    // Generate the brand list for the sidebar
    let brandListItems = brands.map((brand, index) => `
      <li>
        <button onclick="selectBrand(${index})" class="w-full text-left p-2 rounded hover:bg-blue-100 transition-colors">
          ${capitalizeFirstLetter(brand.brand)}
        </button>
      </li>
    `).join('');

    // Generate the HTML content with the left sidebar
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Cx360</title>
      <!-- Include Tailwind CSS via CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* Custom CSS for Sidebar */
        .sidebar {
          width: 16rem;
          transition: all 0.3s;
        }
        .sidebar.collapsed {
          width: 4rem;
        }
        .main-content {
          margin-left: 16rem;
          transition: all 0.3s;
        }
        .main-content.collapsed {
          margin-left: 4rem;
        }
        .sidebar .toggle-btn {
          cursor: pointer;
        }
      </style>
    </head>
    <body class="flex">
      <!-- Left Sidebar -->
      <aside id="sidebar" class="sidebar fixed top-0 left-0 h-full bg-white shadow-md overflow-y-auto z-40">
        <div class="flex items-center justify-between p-4">
          <h2 id="sidebarTitle" class="text-xl font-bold">Brands</h2>
          <span onclick="toggleSidebar()" class="text-gray-600 hover:text-blue-600 toggle-btn">
            &laquo;
          </span>
        </div>
        <ul class="space-y-2 px-2">
          ${brandListItems}
        </ul>
      </aside>

      <!-- Main Content Area -->
      <div id="mainContent" class="main-content flex-grow">
        <div class="flex flex-col min-h-screen">
          <!-- Header -->
          <header id="header" class="bg-transparent fixed top-0 left-0 right-0 z-30 transition-all duration-300">
            <div class="container mx-auto px-4 py-4 flex justify-between items-center">
              <a href="#" class="text-2xl font-bold text-white">Cx360</a>
              <nav>
                <ul class="flex space-x-4">
                  <li><a href="#" class="text-white hover:text-blue-200">Home</a></li>
                  <li><a href="#" class="text-white hover:text-blue-200">About Us</a></li>
                  <li><a href="#" class="text-white hover:text-blue-200">Brands</a></li>
                  <li><a href="#" class="text-white hover:text-blue-200">Contact</a></li>
                </ul>
              </nav>
            </div>
          </header>

          <!-- Hero Section -->
          <section class="relative h-screen flex items-center justify-center overflow-hidden bg-blue-600 text-white">
            <div class="relative z-10 text-center">
              <h1 class="text-6xl font-bold mb-4">Welcome to Cx360</h1>
              <p class="text-2xl mb-8">Discover. Explore. Experience Top Brands.</p>
              <button class="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg">Learn More</button>
            </div>
          </section>

          <!-- Search and Brand Display Section -->
          <section class="py-16 bg-gray-100">
            <div class="container mx-auto px-4">
              <!-- Search Bar -->
              <div class="max-w-2xl mx-auto mb-12 relative">
                <input
                  type="text"
                  placeholder="Search brands..."
                  id="searchInput"
                  class="w-full text-lg py-3 px-4 pr-12 rounded-full border-2 border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button id="searchButton" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <!-- Search Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              <!-- Brand Card -->
              <div class="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                <div class="p-8">
                  <h2 class="text-3xl font-bold mb-4" id="brandName">${capitalizeFirstLetter(brands[0].brand)}</h2>
                  <p class="text-lg mb-8" id="brandSummary">${formatBrandSummary(brands[0].brand_summary)}</p>
                  <div class="flex justify-between items-center">
                    <button class="border border-gray-300 rounded-full p-2" id="prevBrand">
                      <!-- Left Arrow Icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button class="border border-gray-300 rounded-full p-2" id="nextBrand">
                      <!-- Right Arrow Icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <footer class="bg-gray-800 text-white py-8">
            <div class="container mx-auto px-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
                  <ul class="space-y-2">
                    <li><a href="#" class="hover:text-blue-400">Home</a></li>
                    <li><a href="#" class="hover:text-blue-400">About Us</a></li>
                    <li><a href="#" class="hover:text-blue-400">Brands</a></li>
                    <li><a href="#" class="hover:text-blue-400">Contact</a></li>
                  </ul>
                </div>
                <!-- Additional footer columns can be added here -->
                <div>
                  <p>&copy; 2024 Cx360. All rights reserved.</p>
                </div>
              </div>
            </div>
          </footer>

          <!-- Back to Top Button -->
          <button id="backToTop" class="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg">
            <!-- Up Arrow Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- JavaScript -->
      <script>
        let brands = ${JSON.stringify(brands)};
        let currentBrandIndex = 0;
        let isSidebarCollapsed = false;

        const brandNameElement = document.getElementById('brandName');
        const brandSummaryElement = document.getElementById('brandSummary');
        const prevBrandButton = document.getElementById('prevBrand');
        const nextBrandButton = document.getElementById('nextBrand');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const backToTopButton = document.getElementById('backToTop');
        const header = document.getElementById('header');

        function capitalizeFirstLetter(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }

        function formatBrandSummary(summary) {
          return summary.replace(/\\n/g, '<br>').replace(/- /g, '&nbsp;&nbsp;- ');
        }

        function updateBrand() {
          const brand = brands[currentBrandIndex];
          brandNameElement.textContent = capitalizeFirstLetter(brand.brand);
          brandSummaryElement.innerHTML = formatBrandSummary(brand.brand_summary);
        }

        function selectBrand(index) {
          currentBrandIndex = index;
          updateBrand();
          // Optionally, scroll to the brand card
          // document.getElementById('brandCard').scrollIntoView({ behavior: 'smooth' });
        }

        function toggleSidebar() {
          isSidebarCollapsed = !isSidebarCollapsed;
          if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('collapsed');
          } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('collapsed');
          }
        }

        prevBrandButton.addEventListener('click', () => {
          currentBrandIndex = (currentBrandIndex - 1 + brands.length) % brands.length;
          updateBrand();
        });

        nextBrandButton.addEventListener('click', () => {
          currentBrandIndex = (currentBrandIndex + 1) % brands.length;
          updateBrand();
        });

        searchButton.addEventListener('click', () => {
          const query = searchInput.value.toLowerCase().trim();
          const foundBrandIndex = brands.findIndex(brand => brand.brand.toLowerCase().includes(query));
          if (foundBrandIndex !== -1) {
            currentBrandIndex = foundBrandIndex;
            updateBrand();
          } else {
            alert('Brand not found');
          }
        });

        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchButton.click();
          }
        });

        backToTopButton.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Header scroll effect
        window.addEventListener('scroll', () => {
          if (window.scrollY > 50) {
            header.classList.add('bg-white', 'shadow-md');
            header.classList.remove('bg-transparent');
            header.querySelectorAll('a').forEach(a => a.classList.remove('text-white'));
            header.querySelectorAll('a').forEach(a => a.classList.add('text-gray-600'));
          } else {
            header.classList.remove('bg-white', 'shadow-md');
            header.classList.add('bg-transparent');
            header.querySelectorAll('a').forEach(a => a.classList.add('text-white'));
            header.querySelectorAll('a').forEach(a => a.classList.remove('text-gray-600'));
          }
        });

        // Initialize
        if (brands.length > 0) {
          updateBrand();
        } else {
          brandNameElement.textContent = 'No brands available';
          brandSummaryElement.textContent = '';
        }
      </script>
    </body>
    </html>
    `;

    // Send the HTML content
    res.send(htmlContent);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).send('Error fetching brands');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running at http://localhost:' + PORT);
});
