import React from 'react';

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-gray-900">About Us</h1>

            <div className="prose prose-lg text-gray-700">
                <p className="lead text-xl mb-6">
                    Welcome to <strong>JPS Enterprise</strong>, your trusted destination for high-quality computer components, electronics, and IT accessories.
                </p>
                <p className="mb-8">
                    Our mission is to deliver genuine products at honest prices with a seamless shopping experience.
                </p>

                <div className="bg-gray-50 p-8 rounded-lg border-l-4 border-brand-red mb-10">
                    <h3 className="text-xl font-bold mb-4 uppercase text-gray-800">Founded by Pawan Kumar Singh</h3>
                    <p className="mb-2">We operate from:</p>
                    <address className="not-italic mb-4 font-medium">
                        Shop 7 & 11, Upper Ground Floor, Shree Chambers,<br />
                        Lalbagh, Lucknow – 226001
                    </address>
                    <p><strong>Contact:</strong> 9415409650</p>
                </div>

                <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">At JPS Enterprise, we focus on:</h2>
                <ul className="list-disc pl-6 space-y-2 mb-10 marker:text-brand-red">
                    <li><strong>100% Genuine & Brand-New Products</strong></li>
                    <li><strong>Transparent Pricing</strong></li>
                    <li><strong>Professional Customer Support</strong></li>
                    <li><strong>Fast & Reliable Service</strong></li>
                </ul>

                <p className="font-medium text-lg border-t pt-6">
                    We aim to build long-term trust with our customers through integrity, technical expertise, and unmatched service quality.
                </p>
            </div>
        </div>
    );
}
