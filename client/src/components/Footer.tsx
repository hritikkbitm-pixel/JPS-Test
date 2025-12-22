import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-brand-dark text-gray-400 pt-16 pb-8 border-t-4 border-brand-red mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="text-3xl font-black text-white mb-6 tracking-tighter">JPS <span className="text-brand-red">ENTERPRISES</span></div>
                        <p className="text-sm leading-relaxed mb-4">India's premier destination for high-end custom PC builds. We deliver performance, reliability, and the latest hardware from Intel, AMD, and NVIDIA.</p>
                        <a
                            href="https://www.youtube.com/@PCSetupIndia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition group"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            <span className="text-sm font-bold">Check out PCSetupIndia</span>
                        </a>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/about" className="hover:text-brand-red transition">About Us</a></li>
                            <li><a href="/privacy-policy" className="hover:text-brand-red transition">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-brand-red transition">Terms & Conditions</a></li>
                            <li><a href="/refund-policy" className="hover:text-brand-red transition">Refund/Cancellation Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Customer Care</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/contact" className="hover:text-brand-red transition">Contact Us</a></li>
                            <li><a href="/shipping-policy" className="hover:text-brand-red transition">Delivery Information</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Store Info</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="relative group cursor-pointer">
                                <a href="https://www.google.com/maps/place/JPS+Enterprises/@26.8487471,80.9386101,17z" target="_blank" rel="noopener noreferrer" className="flex items-start">
                                    <i className="fas fa-map-marker-alt mt-1 mr-3 text-brand-red"></i>
                                    <span>Shop 7 and 11,<br />Upper Ground Floor, Shree Chambers<br />Lalbagh, Lucknow - 226001</span>
                                </a>
                            </li>
                            <li className="flex items-center">
                                <i className="fas fa-phone-alt mr-3 text-brand-red"></i>
                                <a href="tel:+919415409650" className="hover:text-white transition">9415409650</a>
                            </li>
                            <li className="flex items-center">
                                <i className="fas fa-envelope mr-3 text-brand-red"></i>
                                <a href="mailto:pawan@jpsenterprises.in" className="hover:text-white transition">pawan@jpsenterprises.in</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
                    <p>&copy; 2025 JPS Enterprises. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
