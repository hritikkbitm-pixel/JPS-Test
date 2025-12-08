import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-gray-900">Privacy Policy</h1>

            <div className="prose prose-lg text-gray-700">
                <p className="mb-6">
                    <strong>JPS Enterprise</strong> (“we”, “our”, “us”) is committed to protecting your privacy.
                    This Privacy Policy outlines how we collect, use, store, and safeguard your personal information.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Information We Collect</h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Name, phone number, email address</li>
                    <li>Billing/shipping address</li>
                    <li>Device & browser information</li>
                    <li>Payment information (processed securely by payment gateways — we do <strong>NOT</strong> store card details)</li>
                </ul>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>To process and deliver orders</li>
                    <li>To communicate order updates and support</li>
                    <li>To improve website performance</li>
                    <li>To prevent fraud and ensure secure transactions</li>
                </ul>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Cookies</h2>
                <p className="mb-6">
                    We use cookies for analytics, personalized experience, and smooth website functionality.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Data Sharing</h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>We do <strong>NOT</strong> sell your data.</li>
                    <li>We only share information with trusted partners such as delivery services and payment gateways for order fulfillment.</li>
                </ul>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">Your Rights</h2>
                <p className="mb-2">You may request:</p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Data correction</li>
                    <li>Data deletion</li>
                    <li>Information on how your data is used</li>
                </ul>

                <div className="bg-gray-50 border-t-4 border-gray-800 p-6 mt-10">
                    <h3 className="text-lg font-bold uppercase mb-4">Contact for Privacy Concerns</h3>
                    <p><strong>Email:</strong> <a href="mailto:pawan@jpsenterprises.in" className="text-brand-red">pawan@jpsenterprises.in</a></p>
                    <p><strong>Phone:</strong> 9415409650</p>
                </div>
            </div>
        </div>
    );
}
