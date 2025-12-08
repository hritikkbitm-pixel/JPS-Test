import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-brand-dark text-gray-400 pt-16 pb-8 border-t-4 border-brand-red mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="text-3xl font-black text-white mb-6 tracking-tighter">JPS <span className="text-brand-red">ENTERPRISE</span></div>
                        <p className="text-sm leading-relaxed mb-6">India's premier destination for high-end custom PC builds. We deliver performance, reliability, and the latest hardware from Intel, AMD, and NVIDIA.</p>
                        <div className="text-sm font-semibold text-white">Owner: Pawan Kumar Singh</div>
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
