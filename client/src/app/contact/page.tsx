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
                            <p className="text-xl font-bold text-gray-900">JPS Enterprises</p>
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

                {/* Google Maps Embed */}
                <div className="rounded-lg overflow-hidden shadow-lg">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d222.48288378591448!2d80.94128574116215!3d26.848661428112592!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bfda7c321361d%3A0x78b91ac21523ac7!2sJPS%20Enterprises!5e0!3m2!1sen!2sin!4v1767074232543!5m2!1sen!2sin"
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="JPS Enterprises Store Location"
                    ></iframe>
                    <div className="bg-gray-900 text-white p-4">
                        <p className="font-bold">JPS Enterprises</p>
                        <p className="text-gray-400 text-sm">Shop 7 & 11, Shree Chambers, Lalbagh, Lucknow</p>
                        <a
                            href="https://www.google.com/maps/place/JPS+Enterprises/@26.8487471,80.9386101,17z"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-brand-red font-bold text-sm hover:underline"
                        >
                            <i className="fas fa-directions mr-1"></i> Get Directions
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
