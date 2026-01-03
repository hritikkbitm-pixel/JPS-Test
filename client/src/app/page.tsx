'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useShop } from '@/context/ShopContext';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { Product, Banner } from '@/lib/data';
import { API_URL } from '@/config';

// Dynamic imports for below-fold components (reduces initial JS bundle)
const CategoryGrid = dynamic(() => import('@/components/CategoryGrid'), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
});
const SidebarFilter = dynamic(() => import('@/components/SidebarFilter'));
const FeaturedProducts = dynamic(() => import('@/components/FeaturedProducts'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});
const PromoBanner = dynamic(() => import('@/components/PromoBanner'));

interface ActiveSeason {
  id: string;
  name: string;
  slug: string;
  hero_banner_image: string;
  subtitle: string;
}

function HomeContent() {
  const { products, banners } = useShop();
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryFromUrl = searchParams.get('category') || 'all';
  const seriesFromUrl = searchParams.get('series') || '';
  const brandFromUrl = searchParams.get('brand') || '';
  const productIdsFromUrl = searchParams.get('productIds') || '';
  const [activeSeason, setActiveSeason] = useState<ActiveSeason | null>(null);

  // Fetch active season
  useEffect(() => {
    const fetchActiveSeason = async () => {
      try {
        const res = await fetch(`${API_URL}/seasons/active`);
        if (res.ok) {
          const data = await res.json();
          setActiveSeason(data);
        }
      } catch (err) {
        console.error('Failed to fetch active season:', err);
      }
    };
    fetchActiveSeason();
  }, []);

  // State for catalog view
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState('default');

  // Pagination state - must be declared before any conditional returns
  const ITEMS_PER_PAGE = 16;
  const [currentPage, setCurrentPage] = useState(1);

  // Initial load of products based on category or productIds filter
  useEffect(() => {
    let initialProducts: Product[];

    // If productIds is specified (from banner click), filter by those IDs
    if (productIdsFromUrl) {
      const ids = productIdsFromUrl.split(',');
      initialProducts = products.filter(p => ids.includes(p.id || ''));
    } else if (categoryFromUrl === 'all') {
      initialProducts = products;
    } else {
      initialProducts = products.filter(p => p.category === categoryFromUrl);
    }
    setCatalogProducts(initialProducts);
    setDisplayProducts(initialProducts); // Initialize displayProducts as well
  }, [products, categoryFromUrl, productIdsFromUrl]);

  // Handle sort
  useEffect(() => {
    // Re-sort the current displayProducts when sortOption changes
    let sorted = [...displayProducts]; // Start with the currently displayed products
    if (sortOption === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Only update if the order actually changed to prevent unnecessary re-renders
    // This check is a simple way to avoid infinite loops if displayProducts were in dependency array,
    // but since it's not, we can just set it.
    setDisplayProducts(sorted);
  }, [sortOption]); // Removed displayProducts from dependency to avoid loop, logic handled in filter callback

  // Reset page when category or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFromUrl, displayProducts.length]);

  const handleCategorySelect = (category: string) => {
    router.push(`/?category=${category}`);
  };

  const handleFilterChange = useCallback((filtered: Product[]) => {
    // Apply sort to filtered results
    let sorted = [...filtered];
    if (sortOption === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    setDisplayProducts(sorted);
  }, [sortOption]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // LANDING PAGE VIEW
  if (categoryFromUrl === 'all' && !productIdsFromUrl) {
    // Filter banners by type
    const heroBanners = banners.filter(b => b.type === 'hero');
    const promoBanners = banners.filter(b => b.type === 'promo' || b.type === 'product-grid');

    return (
      <div key="landing-page">
        {/* Seasonal Master Banner - Fixed Aspect Ratio Container */}
        {activeSeason && activeSeason.hero_banner_image && (
          <Link href={`/season/${activeSeason.slug}`} className="block w-full mb-4">
            <div className="relative w-full aspect-[21/6] bg-gradient-to-r from-gray-100 to-gray-200 overflow-hidden group cursor-pointer">
              <Image
                src={activeSeason.hero_banner_image}
                alt={activeSeason.name}
                fill
                sizes="100vw"
                priority
                className="object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                unoptimized={activeSeason.hero_banner_image.includes('freepik.com')}
              />
            </div>
          </Link>
        )}

        {/* Hero Carousel */}
        <HeroCarousel banners={heroBanners} />

        {/* Promotional Banners from Admin Panel */}
        {promoBanners.map((banner, idx) => (
          <PromoBanner key={idx} banner={banner} products={products} />
        ))}

        {/* Category Grid */}
        <CategoryGrid onSelectCategory={handleCategorySelect} />

        {/* Featured Products Section */}
        <FeaturedProducts products={products} />
      </div>
    );
  }

  // CATALOG PAGE VIEW
  // Computed pagination values
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = displayProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in" key={categoryFromUrl}>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-red"><i className="fas fa-home"></i></Link>
        <span>/</span>
        <span className="font-bold text-gray-700 uppercase">{productIdsFromUrl ? 'Featured Collection' : categoryFromUrl}</span>
      </div>

      <h1 className="text-3xl font-bold uppercase mb-6 border-b pb-2">
        {productIdsFromUrl ? 'Featured Collection' : categoryFromUrl === 'gpu' ? 'Graphics Card' : categoryFromUrl === 'psu' ? 'Power Supply' : categoryFromUrl === 'case' ? 'Cabinet' : categoryFromUrl}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <SidebarFilter
            products={catalogProducts}
            onFilterChange={handleFilterChange}
            category={categoryFromUrl}
            initialSeries={seriesFromUrl}
            initialBrand={brandFromUrl}
          />
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Toolbar */}
          <div className="bg-gray-100 p-3 rounded mb-6 flex justify-between items-center border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, displayProducts.length)}</span> of <span className="font-bold">{displayProducts.length}</span> products
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">Sort By:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="text-sm border rounded p-1 focus:outline-none focus:border-brand-red bg-white"
              >
                <option value="default">Default</option>
                <option value="price-low">Price (Low &gt; High)</option>
                <option value="price-high">Price (High &gt; Low)</option>
                <option value="name-asc">Name (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
              <i className="fas fa-search text-4xl mb-4 text-gray-300"></i>
              <p>No products match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                <i className="fas fa-angle-left"></i>
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition ${page === currentPage ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-400">...</span>;
                }
                return null;
              })}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                <i className="fas fa-angle-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
