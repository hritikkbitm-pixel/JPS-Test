
export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12">
                {/* Left: Image Skeleton */}
                <div className="w-full lg:w-1/2">
                    <div className="aspect-square bg-gray-200 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <i className="fas fa-image text-4xl"></i>
                        </div>
                    </div>
                </div>

                {/* Right: Info Skeleton */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>

                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                    </div>

                    <div className="mt-auto">
                        <div className="h-12 bg-gray-200 rounded w-full"></div>
                    </div>
                </div>
            </div>

            {/* Content/Specs Skeleton */}
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/3">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
                <div className="w-full lg:w-1/3">
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
