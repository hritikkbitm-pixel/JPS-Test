'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
            <div className="text-center max-w-md">
                <div className="bg-brand-red text-white font-black text-6xl px-4 py-2 rounded-sm transform -skew-x-12 shadow-lg inline-block mb-8">
                    JPS
                </div>
                <h1 className="text-3xl font-black text-gray-800 mb-4">You're Offline</h1>
                <p className="text-gray-600 mb-8">
                    It looks like you've lost your internet connection.
                    Please check your connection and try again.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider transition shadow-lg"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
