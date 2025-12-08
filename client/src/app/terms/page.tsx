import React from 'react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-gray-900">Terms & Conditions</h1>

            <p className="text-lg mb-8 text-gray-700">
                By using our website (<strong>JPS Enterprise</strong>), you agree to the following terms:
            </p>

            <div className="space-y-10 text-gray-700">
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">1</span>
                        Product Information
                    </h2>
                    <p>We strive to provide accurate product details. However, specifications may change based on manufacturer updates.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">2</span>
                        Pricing & Availability
                    </h2>
                    <ul className="list-disc pl-14 space-y-2">
                        <li>Prices can change without prior notice.</li>
                        <li>An item added to the cart is not reserved until purchase is completed.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">3</span>
                        Payments
                    </h2>
                    <ul className="list-disc pl-14 space-y-2">
                        <li>We accept secure online payments and COD (if enabled).</li>
                        <li>Orders are processed only after payment confirmation.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">4</span>
                        Shipping
                    </h2>
                    <p className="pl-14">Delivery timelines may vary based on location and courier conditions.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">5</span>
                        Warranty
                    </h2>
                    <ul className="list-disc pl-14 space-y-2">
                        <li>All products come with brand warranty only.</li>
                        <li>Physical damage is <strong>NOT</strong> covered under warranty.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">6</span>
                        Limitation of Liability
                    </h2>
                    <p className="pl-14 mb-2">JPS Enterprise is not responsible for:</p>
                    <ul className="list-disc pl-14 space-y-2">
                        <li>Delays caused by courier partners</li>
                        <li>Damages resulting from improper use of products</li>
                        <li>Loss due to manufacturer defects (covered through warranty)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded mr-3 text-lg">7</span>
                        Governing Law
                    </h2>
                    <p className="pl-14">These terms are governed by the laws of India.</p>
                </section>
            </div>
        </div>
    );
}
