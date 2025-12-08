import React from 'react';

export default function ShippingPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-12 uppercase tracking-tight text-gray-900">Shipping & Delivery</h1>

            <div className="space-y-12 text-gray-700">

                {/* Products Policy */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 uppercase border-b-2 border-brand-red inline-block pb-1">Shipping & Delivery Policy (Products)</h2>
                    <p className="leading-relaxed mb-4">
                        For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only. Orders are shipped within 15 working days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company/post office norms.
                    </p>
                    <p className="leading-relaxed mb-4">
                        <strong>JPS ENTERPRISE</strong> is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 15 working days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
                    </p>
                    <p className="leading-relaxed mb-4">
                        Delivery of all orders will be to the registered address of the buyer as per the credit/debit card only at all times (Unless specified at the time of Order). <strong>JPS ENTERPRISE</strong> is in no way responsible for any damage to the order while in transit to the buyer.
                    </p>
                    <p className="leading-relaxed">
                        <strong>JPS ENTERPRISE</strong> is proud to use fast, easy, and efficient secure payments gateways. All major cards are accepted.
                    </p>
                </section>

                {/* Services Policy */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 uppercase border-b-2 border-brand-red inline-block pb-1">Shipping & Delivery Policy (Services)</h2>
                    <p className="leading-relaxed mb-4">
                        Delivery of our services will be confirmed on your mail ID as specified during registration. For any issues in utilizing our logistic services, you may contact our helpdesk on <a href="tel:9415409650" className="font-bold text-brand-red">9415409650</a> (Within 10:00 AM to 5:00 PM / Monday To Saturday) or mail us at <a href="mailto:pawan@jpsenterprises.in" className="font-bold text-brand-red">pawan@jpsenterprises.in</a>.
                    </p>
                </section>

                {/* Calculation */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 uppercase border-b-2 border-brand-red inline-block pb-1">Calculation of Delivery Charge</h2>
                    <p className="leading-relaxed mb-4 font-bold">
                        How the delivery charge is calculated for multiple units and some products:
                    </p>
                    <p className="leading-relaxed mb-4">
                        The shipping charge is based on the weight of the product. For multiple products ordered from the same category, the program adds up the weight of all the units ordered and charges a single delivery fee.
                    </p>
                    <div className="bg-gray-50 border-l-4 border-gray-300 p-4 mb-4 italic">
                        Thus, a customer who orders three items weighing 200gms, 250gms, and 400gms is charged a single delivery fee of a consignment weighing more than 500gms but less than one kg. The customer is not charged for three different consignments weighing less than 500gms each. Thus the customer will pay a delivery fee of Rs 85 for ordering the three items as a single order instead of Rs 142 if he orders them separately.
                    </div>
                    <p className="leading-relaxed">
                        The weight of the product has been built-in into the delivery charge of each product. This will automatically be added to the product cost at the payment stage.
                    </p>
                </section>

            </div>
        </div>
    );
}
