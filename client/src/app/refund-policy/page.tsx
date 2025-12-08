import React from 'react';

export default function RefundPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-16 bg-white max-w-4xl">
            <h1 className="text-4xl font-black mb-12 uppercase tracking-tight text-gray-900">Refund and Cancellation Policy</h1>

            <div className="space-y-16 text-gray-700">

                {/* Cancellation Policy */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-brand-red uppercase border-b-2 border-gray-100 pb-4">Cancellation Policy</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-300 text-xl">01</span>
                            <p>We have a hassle-free cancellation request option available in the order panel, you can place your cancellation request directly from there or you can even drop us a mail or can call us to cancel your order.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-300 text-xl">02</span>
                            <p>The convenience fee charged on the orders is non-refundable only if the order is cancelled by the buyer. Incase of order gets cancelled by us then the complete order amount will be refunded. This charge is only applicable if the buyer wants to cancel the order and opts for a refund.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-300 text-xl">03</span>
                            <p>2% will be deducted as the convenience fee for orders getting cancelled by the buyer before shipping, once the order has been shipped it will be 5% charge if the orders get's cancelled by the buyer. 3% will be deducted if buyer want's to modify the order after being shipped and no charges applicable to modify the order before shipping. These charge will be adjusted from the refund amount. If the buyer opts for refund, then it will be initiated once we receive the product in same condition as it was shipped.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-300 text-xl">04</span>
                            <p>Above mentioned charges are only applicable if the buyer place such requests, no charges will be applicable if such steps are initiated by us.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-gray-300 text-xl">05</span>
                            <p>In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them. JPS ENTERPRISES believes in helping its customers as far as possible, and has therefore a liberal cancellation policy.</p>
                        </div>
                    </div>
                </section>

                {/* Refund Policy */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-brand-red uppercase border-b-2 border-gray-100 pb-4">Return / Refund Policy</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">01</span>
                            <p>We accept return and refund request only if the product delivered by us is in damage condition, wrong product sent, product in dead condition or product is defective. Buyers will have 3 days and 7 days (7 days is applicable on purchase of a complete PC set) after delivery to inform us in case of any dispute in the order to claim for return or refund. Buyer needs to bring the issue to our attention either by emailing us (preferred) or by calling us.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">02</span>
                            <p>For gaming chairs only part replacement is applicable if the product delivered is defective or damaged, no refunds will be there for orders of gaming chairs.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">03</span>
                            <p>If the seal of the product is opened and the product is not faulty then return/refund will not be applicable.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">04</span>
                            <p>Return / Refund request will cancelled if any part or accessory is missing from the product box.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">05</span>
                            <p>Packaging material should be kept by the buyer until the return window is opened as this will help them to pack the product to its original form to avoid any damage during the transit.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">06</span>
                            <p>Product should be packed in a proper way as it was received by the buyer, do not apply tapes or glues directly on the product or on the product box, this may lead to cancellation of your return request.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">07</span>
                            <p>All the accessories which were delivered along with the product should be returned in the same way and along with the product.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">08</span>
                            <p>If the payment was made through our payment gateway, then it will be refunded in same account by which the payment was done, in case of BANK TRANSFER refunds will be done only in buyers bank account. Refunds usually takes 7-10 working days to reflect in your account.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="font-bold text-brand-red opacity-50 text-xl">09</span>
                            <p>5% will be deducted from the order value/total amount if the payment was made using Bajaj EMI, this will only be applicable if the order is cancelled by the buyer.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
