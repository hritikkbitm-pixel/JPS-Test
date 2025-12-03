import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-brand-dark text-gray-400 pt-16 pb-8 border-t-4 border-brand-red mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="text-3xl font-black text-white mb-6 tracking-tighter">JPS <span className="text-brand-red">ENTERPRISE</span></div>
                        <p className="text-sm leading-relaxed mb-6">India's premier destination for high-end custom PC builds. We deliver performance, reliability, and the latest hardware from Intel, AMD, and NVIDIA.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-brand-red transition">About Us</a></li>
                            <li><a href="#" className="hover:text-brand-red transition">Delivery Information</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Customer Care</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-brand-red transition">Contact Us</a></li>
                            <li><a href="#" className="hover:text-brand-red transition">Returns</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Store Info</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="relative group cursor-pointer">
                                <a href="https://maps.app.goo.gl/PcuEDN9OsXGCFfzLJ" target="_blank" rel="noopener noreferrer" className="flex items-start">
                                    <i className="fas fa-map-marker-alt mt-1 mr-3 text-brand-red"></i>
                                    <span>Shop 7 and 11,<br />Upper Ground Floor, Shree Chambers<br />Naza Market, Lalbagh<br />Lucknow 226001</span>
                                </a>
                                {/* Map Popup */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-80 h-64 bg-white p-1 shadow-2xl rounded-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border-2 border-brand-red">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src="https://maps.google.com/maps?q=Shop+7+and+11,+Upper+Ground+Floor,+Shree+Chambers,+Naza+Market,+Lalbagh,+Lucknow+226001&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                        className="rounded"
                                    ></iframe>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-brand-red rotate-45"></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
                    <p>&copy; 2025 JPS Enterprise. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
