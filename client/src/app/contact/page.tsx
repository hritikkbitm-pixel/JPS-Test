import React from 'react';

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-10 uppercase tracking-tight text-gray-900">Contact Us</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <p className="text-lg text-gray-700">
                        For any queries, support, or assistance, please reach out to us. We are here to help you build your dream PC.
                    </p>

                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Store Name</label>
                            <p className="text-xl font-bold text-gray-900">JPS Enterprise</p>
                        </div>
                        <div className="border-b pb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Owner</label>
                            <p className="text-lg text-gray-900">Pawan Kumar Singh</p>
                        </div>
                        <div className="border-b pb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                            <p className="text-lg text-gray-900">Shop 7 & 11, Upper Ground Floor,<br />Shree Chambers, Lalbagh, Lucknow – 226001</p>
                        </div>
                        <div className="border-b pb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                            <p className="text-lg text-brand-red font-bold">
                                <a href="tel:9415409650">9415409650</a>
                            </p>
                        </div>
                        <div className="border-b pb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <p className="text-lg text-brand-red font-bold">
                                <a href="mailto:pawan@jpsenterprises.in">pawan@jpsenterprises.in</a>
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm font-medium">
                        <i className="fas fa-clock mr-2"></i> We aim to respond to all queries within 24–48 working hours.
                    </div>
                </div>

                {/* Optional Map or Contact Form Placeholder */}
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                    <div className="text-center">
                        <i className="fas fa-map-marked-alt text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-500">Visit us at our store in Lalbagh, Lucknow.</p>
                        <a
                            href="https://www.google.com/maps/place/JPS+Enterprises/@26.8487471,80.9386101,17z"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 text-brand-red font-bold hover:underline"
                        >
                            Get Directions &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
