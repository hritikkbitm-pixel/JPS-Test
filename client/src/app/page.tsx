'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import SidebarFilter from '@/components/SidebarFilter';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoBanner from '@/components/PromoBanner';
import { Product } from '@/lib/data';

function HomeContent() {
  const { products, banners } = useShop();
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryFromUrl = searchParams.get('category') || 'all';

  // State for catalog view
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState('default');

  // Initial load of products based on category
  useEffect(() => {
    let initialProducts;
    if (categoryFromUrl === 'all') {
      initialProducts = products;
    } else {
      initialProducts = products.filter(p => p.category === categoryFromUrl);
    }
    setCatalogProducts(initialProducts);
    setDisplayProducts(initialProducts); // Initialize displayProducts as well
  }, [products, categoryFromUrl]);

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

  // LANDING PAGE VIEW
  if (categoryFromUrl === 'all') {
    // Filter banners by type
    const heroBanners = banners.filter(b => b.type === 'hero');
    const promoBanners = banners.filter(b => b.type === 'promo' || b.type === 'product-grid');

    return (
      <div key="landing-page">
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
  return (
    <div className="animate-fade-in" key={categoryFromUrl}>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-brand-red"><i className="fas fa-home"></i></Link>
        <span>/</span>
        <span className="font-bold text-gray-700 uppercase">{categoryFromUrl}</span>
      </div>

      <h1 className="text-3xl font-bold uppercase mb-6 border-b pb-2">{categoryFromUrl === 'gpu' ? 'Graphics Card' : categoryFromUrl === 'psu' ? 'Power Supply' : categoryFromUrl === 'case' ? 'Cabinet' : categoryFromUrl}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <SidebarFilter
            products={catalogProducts}
            onFilterChange={handleFilterChange}
            category={categoryFromUrl}
          />
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Toolbar */}
          <div className="bg-gray-100 p-3 rounded mb-6 flex justify-between items-center border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold">{displayProducts.length}</span> products
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
          {displayProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
              <i className="fas fa-search text-4xl mb-4 text-gray-300"></i>
              <p>No products match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination (Mock) */}
          {displayProducts.length > 0 && (
            <div className="mt-10 flex justify-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center bg-brand-red text-white rounded text-sm font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300">2</button>
              <button className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300"><i className="fas fa-angle-right"></i></button>
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
