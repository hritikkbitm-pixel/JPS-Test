// Global Error Handler for Debugging
window.onerror = function (msg, url, line, col, error) {
    const errorMsg = `Error: ${msg}\nLine: ${line}\nCol: ${col}\nStack: ${error ? error.stack : 'N/A'}`;
    console.error(errorMsg);
    alert(errorMsg); // Show alert to user since console might be hidden
    return false;
};

// --- A. DATABASE LAYER ---
// Safe User Parsing
let savedUser = null;
try {
    savedUser = JSON.parse(localStorage.getItem('jps_user'));
} catch (e) {
    console.error('Corrupted user data, clearing...', e);
    localStorage.removeItem('jps_user');
}

window.DB = {
    products: [],
    cart: [],
    orders: [],
    banners: [], // Main Hero Slider
    categoryGrid: [], // Featured Categories
    promoStrips: [], // Promo Banners
    user: savedUser
};

// --- B. UTILITIES ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `text-white px-6 py-3 rounded shadow-lg font-bold text-sm toast-enter ${bgColor}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- C. CONTROLLERS ---

class StoreController {
    constructor() {
        this.carouselIndex = 0;
        this.carouselInterval = null;
    }

    render(category = 'all') {
        const container = document.getElementById('app-root');
        let products = window.DB.products;
        if (category !== 'all') {
            products = products.filter(p => p.category === category);
        } else {
            products = products.slice(0, 8);
        }

        // Get Promos
        const promos = window.DB.promoStrips || [];
        const p1 = promos.find(p => p.position === 1);
        const p2 = promos.find(p => p.position === 2);
        const p3 = promos.find(p => p.position === 3);

        let html = `
        <div class="fade-in">
            ${category === 'all' ? this.renderCarousel() : ''}
            
            ${category === 'all' ? this.renderCategoryGrid() : ''}

            ${category === 'all' && p1 ? this.renderPromo(p1) : ''}

            <div class="flex items-end justify-between mb-6 border-b border-gray-200 pb-2 mt-10">
                <h2 class="text-2xl font-bold uppercase tracking-wide text-gray-900">${category === 'all' ? 'Featured Products' : category.toUpperCase()}</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${products.map(p => this.createProductCard(p)).join('')}
            </div>

            ${category === 'all' && p2 ? this.renderPromo(p2) : ''}
            ${category === 'all' && p3 ? this.renderPromo(p3) : ''}
        </div>`;
        container.innerHTML = html;
        window.scrollTo(0, 0);
        if (category === 'all') this.startCarousel();
    }

    renderCarousel() {
        const banners = window.DB.banners;
        if (banners.length === 0) return '';

        return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
            <div class="lg:col-span-8 relative h-48 md:h-[380px] bg-gray-900 rounded-lg overflow-hidden group cursor-pointer relative">
                 <div id="carousel-track" class="w-full h-full relative">
                    ${banners.map((b, i) => `
                        <div class="carousel-slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" id="slide-${i}">
                            <img src="${b.image}" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-700">
                            <div class="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
                                <span class="text-brand-red font-bold tracking-widest uppercase mb-1 md:mb-2 text-xs md:text-base">Featured</span>
                                <h2 class="text-2xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight line-clamp-2">${b.title}</h2>
                                <p class="text-gray-300 mb-4 md:mb-6 max-w-md text-xs md:text-base line-clamp-2">${b.sub}</p>
                                <button onclick="window.app.store.handleBannerClick('${b.type}', '${b.target}')" class="bg-white text-black px-4 py-2 md:px-8 md:py-3 font-bold w-max hover:bg-brand-red hover:text-white transition uppercase tracking-wider text-xs md:text-sm">Shop Now</button>
                            </div>
                        </div>
                    `).join('')}
                 </div>
                 
                 <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    ${banners.map((_, i) => `<button onclick="window.app.store.setSlide(${i})" class="w-2 h-2 rounded-full bg-white opacity-50 hover:opacity-100 transition"></button>`).join('')}
                 </div>

                 <!-- Navigation Arrows -->
                 <button onclick="window.app.store.prevSlide()" class="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-brand-red text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm group-hover:opacity-100 opacity-0 duration-300">
                    <i class="fas fa-chevron-left text-xs md:text-base"></i>
                 </button>
                 <button onclick="window.app.store.nextSlide()" class="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-brand-red text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm group-hover:opacity-100 opacity-0 duration-300">
                    <i class="fas fa-chevron-right text-xs md:text-base"></i>
                 </button>
            </div>
            <div class="lg:col-span-4 flex flex-col gap-4 h-48 md:h-[380px]">
                 <div class="flex-1 relative bg-gray-800 rounded-lg overflow-hidden group">
                    <div class="absolute inset-0 z-10 p-4 md:p-6 flex flex-col justify-center">
                        <h3 class="text-lg md:text-2xl font-bold text-white italic">PC BUILDER</h3>
                        <p class="text-gray-300 text-xs md:text-sm">Custom Configurator</p>
                        <button onclick="window.app.router.navigate('builder')" class="mt-2 text-brand-red font-bold text-xs md:text-sm hover:underline">Start Building &rarr;</button>
                    </div>
                    <img src="https://img.freepik.com/free-photo/still-life-with-scales-justice_23-2149775044.jpg" class="absolute inset-0 w-full h-full object-cover opacity-40 transition group-hover:opacity-30">
                 </div>
                 <div class="flex-1 relative bg-gray-800 rounded-lg overflow-hidden group">
                    <div class="absolute inset-0 z-10 p-4 md:p-6 flex flex-col justify-center">
                        <h3 class="text-lg md:text-2xl font-bold text-white italic">NEW ARRIVALS</h3>
                        <p class="text-gray-300 text-xs md:text-sm">Check Latest Stock</p>
                    </div>
                    <img src="https://img.freepik.com/free-photo/top-view-motherboard-with-neon-lights_23-2151340260.jpg" class="absolute inset-0 w-full h-full object-cover opacity-40 transition group-hover:opacity-30">
                 </div>
            </div>
        </div>`;
    }

    renderCategoryGrid() {
        const grid = window.DB.categoryGrid || [];
        if (grid.length === 0) return '';

        return `
        <div class="mb-10">
            <h3 class="text-xl font-bold uppercase tracking-wide text-gray-900 mb-4 border-l-4 border-brand-red pl-3">Shop By Category</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                ${grid.map(c => `
                    <div onclick="window.app.store.filterCategory('${c.target}')" class="cursor-pointer group relative rounded-lg overflow-hidden aspect-square border border-gray-200 shadow-sm hover:shadow-md transition">
                        <img src="${c.image}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-3 text-center">
                            <span class="text-white font-bold text-sm uppercase tracking-wider group-hover:text-brand-red transition">${c.label}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    renderPromo(p) {
        return `
        <div class="mb-10 rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer group" onclick="window.app.store.handleBannerClick('promo', '${p.target}')">
            <img src="${p.image}" class="w-full h-auto object-cover transition duration-500 group-hover:opacity-90">
        </div>`;
    }

    startCarousel() {
        if (this.carouselInterval) clearInterval(this.carouselInterval);
        this.carouselInterval = setInterval(() => {
            this.carouselIndex = (this.carouselIndex + 1) % window.DB.banners.length;
            this.updateSlide();
        }, 5000);
    }

    nextSlide() {
        this.carouselIndex = (this.carouselIndex + 1) % window.DB.banners.length;
        this.updateSlide();
        this.startCarousel();
    }

    prevSlide() {
        this.carouselIndex = (this.carouselIndex - 1 + window.DB.banners.length) % window.DB.banners.length;
        this.updateSlide();
        this.startCarousel();
    }

    setSlide(index) {
        this.carouselIndex = index;
        this.updateSlide();
        this.startCarousel(); // Reset timer
    }

    updateSlide() {
        const slides = document.querySelectorAll('.carousel-slide');
        slides.forEach((slide, i) => {
            if (i === this.carouselIndex) {
                slide.classList.remove('opacity-0', 'z-0');
                slide.classList.add('opacity-100', 'z-10');
            } else {
                slide.classList.remove('opacity-100', 'z-10');
                slide.classList.add('opacity-0', 'z-0');
            }
        });
    }

    handleBannerClick(type, target) {
        if (type === 'category') {
            this.filterCategory(target);
        } else if (type === 'product') {
            window.app.cart.add(target);
        } else if (type === 'promo') {
            // Check if target is a product ID
            const product = window.DB.products.find(p => p.id === target);
            if (product) {
                window.app.cart.add(target);
            } else {
                // Assume category
                this.filterCategory(target);
            }
        }
    }

    filterCategory(category) {
        if (this.carouselInterval) clearInterval(this.carouselInterval);
        this.render(category);
    }

    createProductCard(p) {
        const isAvailable = p.available !== false; // Default true if undefined
        return `
        <div class="bg-white border border-gray-100 rounded-lg product-card flex flex-col relative group overflow-hidden ${!isAvailable ? 'opacity-75 grayscale' : ''}">
            <div class="h-48 p-6 flex items-center justify-center relative">
                <img src="${p.image}" class="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-110">
                ${p.stock < 5 && isAvailable ? '<span class="absolute top-2 left-2 text-red-600 text-[10px] font-bold uppercase animate-pulse">Low Stock</span>' : ''}
                ${!isAvailable ? '<span class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-10 text-brand-red font-black text-xl uppercase -rotate-12 border-4 border-brand-red">Unavailable</span>' : ''}
            </div>
            <div class="p-4 flex flex-col flex-grow border-t border-gray-50">
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">${p.brand}</div>
                <h3 class="font-bold text-gray-800 text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5em] group-hover:text-brand-red transition">${p.name}</h3>
                <div class="mt-auto">
                     <div class="flex justify-between items-center mb-3">
                        <span class="text-xs text-gray-400 line-through">₹${Math.round(p.price * 1.1).toLocaleString()}</span>
                        <span class="text-lg font-black text-brand-red">₹${p.price.toLocaleString()}</span>
                     </div>
                     ${isAvailable ? `
                     <button onclick="window.app.cart.add('${p.id}', event)" class="add-btn w-full bg-gray-100 text-gray-800 font-bold py-2 rounded text-xs uppercase tracking-wider hover:shadow-md transition flex items-center justify-center gap-2">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                     </button>
                     ` : `
                     <button disabled class="w-full bg-gray-200 text-gray-400 font-bold py-2 rounded text-xs uppercase tracking-wider cursor-not-allowed">
                        Unavailable
                     </button>
                     `}
                </div>
            </div>
        </div>`;
    }

    handleSearch() {
        const q = document.getElementById('search-input').value.toLowerCase();
        if (!q) return;
        const results = window.DB.products.filter(p => p.name.toLowerCase().includes(q));
        const container = document.getElementById('app-root');
        if (this.carouselInterval) clearInterval(this.carouselInterval);
        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Search: "${q}" (${results.length})</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${results.map(p => this.createProductCard(p)).join('')}
            </div>
        `;
    }
}

class PCBuilder {
    constructor() { this.reset(); }

    reset() {
        this.build = {
            cpu: null, cooler: null, motherboard: null, memory: null,
            storage: null, gpu: null, psu: null, case: null,
            monitor: null, keyboard: null, mouse: null, headset: null
        };
        this.render();
    }

    select(partType, id) {
        const part = window.DB.products.find(p => p.id === id);
        this.build[partType] = part;

        // Reset dependent parts if incompatible changes occur
        if (partType === 'cpu') {
            this.build.motherboard = null;
            this.build.memory = null;
            this.build.cooler = null;
        }
        if (partType === 'motherboard') {
            this.build.memory = null;
            this.build.case = null;
        }

        this.closeModal();
        this.render();
    }

    getValidParts(type) {
        let parts = window.DB.products.filter(p => p.category === type && p.available !== false);
        const b = this.build;

        // 1. CPU: No filter

        // 2. Cooler: Check Socket
        if (type === 'cooler' && b.cpu) {
            parts = parts.filter(p => {
                const support = p.specs.socket_support || [];
                const socket = b.cpu.specs.socket;
                return Array.isArray(support) ? support.includes(socket) : support === socket;
            });
        }

        // 3. Motherboard: Check Socket
        if (type === 'motherboard' && b.cpu) {
            parts = parts.filter(p => p.specs.socket === b.cpu.specs.socket);
        }

        // 4. Memory: Check Type (DDR4/5)
        if (type === 'memory') {
            if (b.motherboard) {
                parts = parts.filter(p => p.specs.memory_type === b.motherboard.specs.memory_type);
            } else if (b.cpu) {
                const cpuMem = b.cpu.specs.memory_type || [];
                parts = parts.filter(p => Array.isArray(cpuMem) ? cpuMem.includes(p.specs.memory_type) : cpuMem === p.specs.memory_type);
            }
        }

        // 5. Storage: Basic check (M.2 vs SATA not strictly enforced yet, but good to have)

        // 6. Case: Check Form Factor
        if (type === 'case' && b.motherboard) {
            parts = parts.filter(p => {
                const supported = p.specs.form_factor || []; // Case supports e.g. ['ATX', 'mATX']
                const moboFactor = b.motherboard.specs.form_factor;
                return Array.isArray(supported) ? supported.includes(moboFactor) : supported === moboFactor;
            });
        }

        return parts;
    }

    calculateWatts() {
        let watts = 0;
        if (this.build.cpu) watts += (this.build.cpu.specs.wattage || 65);
        if (this.build.gpu) watts += (this.build.gpu.specs.wattage || 0);
        // Base system overhead
        watts += 50;
        return watts;
    }

    openModal(type) {
        // Pre-requisite checks
        if (type === 'motherboard' && !this.build.cpu) return showToast("Please select a Processor first.", "error");
        if (type === 'cooler' && !this.build.cpu) return showToast("Please select a Processor first.", "error");
        if (type === 'memory' && !this.build.motherboard) return showToast("Please select a Motherboard first.", "error");
        if (type === 'case' && !this.build.motherboard) return showToast("Please select a Motherboard first.", "error");

        const parts = this.getValidParts(type);
        const modal = document.createElement('div');
        modal.id = 'part-modal';
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4';
        modal.innerHTML = `
            <div class="bg-white w-full max-w-3xl h-[80vh] rounded-lg flex flex-col shadow-2xl overflow-hidden">
                <div class="bg-brand-dark text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold uppercase">Select ${type}</h3>
                    <button onclick="window.app.builder.closeModal()" class="hover:text-red-500 text-xl">&times;</button>
                </div>
                <div class="flex-grow overflow-y-auto p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${parts.length ? parts.map(p => `
                        <div class="bg-white p-4 rounded border hover:border-brand-red cursor-pointer flex gap-4 items-center group" onclick="window.app.builder.select('${type}', '${p.id}')">
                            <img src="${p.image}" class="w-20 h-20 object-contain">
                            <div>
                                <div class="text-[10px] font-bold text-gray-500 uppercase">${p.brand}</div>
                                <div class="font-bold text-sm leading-tight mb-1 group-hover:text-brand-red">${p.name}</div>
                                <div class="font-bold text-brand-red">₹${p.price.toLocaleString()}</div>
                                ${this.renderSpecsPreview(p, type)}
                            </div>
                        </div>
                    `).join('') : '<div class="col-span-2 text-center text-gray-500 mt-10">No compatible parts found.<br><span class="text-xs">Check your previous selections.</span></div>'}
                </div>
            </div>`;
        document.body.appendChild(modal);
    }

    renderSpecsPreview(p, type) {
        const s = p.specs || {};
        if (type === 'motherboard') return `<div class="text-xs text-gray-400 mt-1">Socket: ${s.socket} | RAM: ${s.memory_type}</div>`;
        if (type === 'cpu') return `<div class="text-xs text-gray-400 mt-1">Socket: ${s.socket} | TDP: ${s.wattage}W</div>`;
        if (type === 'memory') return `<div class="text-xs text-gray-400 mt-1">Type: ${s.memory_type}</div>`;
        if (type === 'case') return `<div class="text-xs text-gray-400 mt-1">Fits: ${(s.form_factor || []).join(', ')}</div>`;
        return '';
    }

    closeModal() { const m = document.getElementById('part-modal'); if (m) m.remove(); }

    render() {
        const slots = [
            { id: 'cpu', icon: 'microchip', name: 'Processor' },
            { id: 'cooler', icon: 'fan', name: 'Cooling System' },
            { id: 'motherboard', icon: 'chess-board', name: 'Motherboard' },
            { id: 'memory', icon: 'memory', name: 'Memory (RAM)' },
            { id: 'storage', icon: 'hdd', name: 'Storage' },
            { id: 'gpu', icon: 'film', name: 'Graphics Card' },
            { id: 'psu', icon: 'plug', name: 'Power Supply' },
            { id: 'case', icon: 'box', name: 'Cabinet' },
            { id: 'monitor', icon: 'desktop', name: 'Monitor' },
            { id: 'keyboard', icon: 'keyboard', name: 'Keyboard' },
            { id: 'mouse', icon: 'mouse', name: 'Mouse' },
            { id: 'headset', icon: 'headphones', name: 'Headset' }
        ];

        let total = 0;
        const watts = this.calculateWatts();
        const psuWatts = this.build.psu ? (this.build.psu.specs.wattage || 0) : 0;
        // Buffer: PSU should be > Watts * 1.2
        const requiredPsu = Math.ceil(watts * 1.2);
        const isPowerIssue = this.build.psu && psuWatts < requiredPsu;

        let html = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
            <div class="lg:col-span-2 space-y-4">
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div class="flex justify-between items-end border-b pb-2 mb-4">
                        <h2 class="text-2xl font-bold text-gray-800 uppercase"><i class="fas fa-cogs text-brand-red mr-2"></i>System Configurator</h2>
                        <button onclick="window.app.builder.reset()" class="text-xs text-red-600 font-bold hover:underline">START OVER</button>
                    </div>
                    <div class="mb-2">
                        <div class="flex justify-between text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                            <span>Estimated Power Usage: ${watts}W</span>
                            <span>${this.build.psu ? psuWatts + 'W PSU' : 'No PSU'}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div class="${isPowerIssue ? 'bg-red-600' : 'bg-green-500'} h-3 rounded-full transition-all duration-500 shadow-inner" style="width: ${psuWatts ? Math.min((watts / psuWatts) * 100, 100) : 0}%"></div>
                        </div>
                        ${isPowerIssue ? `<div class="text-xs text-red-600 font-bold mt-1"><i class="fas fa-exclamation-triangle"></i> Warning: Recommended PSU > ${requiredPsu}W</div>` : ''}
                    </div>
                </div>
                ${slots.map(s => {
            const item = this.build[s.id];
            if (item) total += item.price;
            const isLocked = (s.id === 'motherboard' && !this.build.cpu) || (s.id === 'memory' && !this.build.motherboard);
            return `
                    <div class="bg-white p-4 rounded-lg border ${item ? 'border-green-500 shadow-sm' : 'border-gray-200 border-dashed'} flex items-center gap-4 builder-slot ${isLocked ? 'locked' : 'active'}">
                        <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl flex-shrink-0">
                            ${item ? `<img src="${item.image}" class="w-full h-full object-contain p-2">` : `<i class="fas fa-${s.icon}"></i>`}
                        </div>
                        <div class="flex-grow min-w-0">
                            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${s.name}</div>
                            <div class="font-bold text-gray-800 truncate">${item ? item.name : (isLocked ? 'Waiting for previous component...' : 'Not Selected')}</div>
                        </div>
                        <div class="text-right">
                            ${item ? `<div class="font-bold text-sm text-gray-800">₹${item.price.toLocaleString()}</div>` : ''}
                            <button onclick="window.app.builder.openModal('${s.id}')" class="mt-1 text-[10px] font-bold uppercase px-3 py-1 rounded transition ${item ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-brand-red text-white hover:bg-red-700'}">
                                ${item ? 'Change' : 'Select'}
                            </button>
                        </div>
                    </div>`;
        }).join('')}
            </div>
            <div class="lg:col-span-1">
                <div class="bg-white shadow-lg rounded-lg p-6 sticky top-28 border-t-4 border-brand-red">
                    <h3 class="font-bold text-lg mb-4 uppercase">Build Summary</h3>
                    <div class="space-y-2 mb-6 text-sm">
                        <div class="flex justify-between"><span>Compatibility:</span> <span class="text-green-600 font-bold"><i class="fas fa-check"></i> Checked</span></div>
                        <div class="flex justify-between"><span>Est. Wattage:</span> <span class="font-bold text-gray-700">${watts}W</span></div>
                    </div>
                    <div class="flex justify-between items-center mb-4 pt-4 border-t">
                        <span class="font-bold text-gray-600">Total</span>
                        <span class="text-2xl font-black text-brand-red">₹${total.toLocaleString()}</span>
                    </div>
                    <button onclick="window.app.builder.addToCart()" class="w-full bg-brand-dark hover:bg-brand-red text-white font-bold py-3 rounded uppercase tracking-widest transition text-sm">Add Build to Cart</button>
                </div>
            </div>
        </div>`;
        document.getElementById('app-root').innerHTML = html;
        window.scrollTo(0, 0);
    }

    addToCart() {
        let addedCount = 0;
        Object.values(this.build).forEach(part => { if (part) { window.DB.cart.push(part); addedCount++; } });
        if (addedCount > 0) { window.app.cart.updateUI(); showToast(`Successfully added ${addedCount} components to your cart!`); }
        else { showToast("Your build is empty!", "error"); }
    }
}

class AdminController {
    constructor() {
        this.currentView = 'revenue';
        this.tempImages = [];
        this.editingBannerId = null;
        this.editingCategoryId = null;
        this.editingPromoId = null;
        this.uploadedImageData = null;
        this.uploadTarget = null; // 'banner', 'category', 'promo'
    }


    render() {
        const container = document.getElementById('app-root');
        container.innerHTML = `
        <div class="fade-in min-h-[600px]">
            <h1 class="text-3xl font-black text-gray-800 uppercase mb-8 border-l-4 border-brand-red pl-4">Admin Dashboard</h1>
            
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <!-- SIDEBAR NAV -->
                <div class="lg:col-span-1 space-y-2">
                    <button onclick="window.app.admin.switchView('revenue')" class="${this.currentView === 'revenue' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'} w-full p-4 rounded font-bold text-sm text-left transition flex items-center justify-between">
                        <span><i class="fas fa-chart-line w-6 text-center"></i> Revenue</span>
                        <i class="fas fa-chevron-right text-xs opacity-50"></i>
                    </button>
                    <button onclick="window.app.admin.switchView('orders')" class="${this.currentView === 'orders' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'} w-full p-4 rounded font-bold text-sm text-left transition flex items-center justify-between">
                        <span><i class="fas fa-box w-6 text-center"></i> Orders</span>
                        <span class="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full">${window.DB.orders.length}</span>
                    </button>
                    <button onclick="window.app.admin.switchView('inventory')" class="${this.currentView === 'inventory' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'} w-full p-4 rounded font-bold text-sm text-left transition flex items-center justify-between">
                        <span><i class="fas fa-warehouse w-6 text-center"></i> Inventory</span>
                        <i class="fas fa-chevron-right text-xs opacity-50"></i>
                    </button>
                    <button onclick="window.app.admin.switchView('ads')" class="${this.currentView === 'ads' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'} w-full p-4 rounded font-bold text-sm text-left transition flex items-center justify-between">
                        <span><i class="fas fa-ad w-6 text-center"></i> Ads & Offers</span>
                        <i class="fas fa-chevron-right text-xs opacity-50"></i>
                    </button>
                </div>

                <!-- MAIN CONTENT AREA -->
                <div class="lg:col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[500px]">
                    ${this.renderContent()}
                </div>
            </div>
        </div>`;
    }

    switchView(view) {
        this.currentView = view;
        this.render();
    }

    renderContent() {
        switch (this.currentView) {
            case 'revenue': return this.renderRevenue();
            case 'orders': return this.renderOrders();
            case 'inventory': return this.renderInventory();
            case 'ads': return this.renderAds();
            default: return '<div>Select a view</div>';
        }
    }





    renderRevenue() {
        const totalRev = window.DB.orders.reduce((a, b) => a + b.total, 0);
        return `
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gray-50 p-6 rounded border-l-4 border-green-500">
                    <div class="text-xs font-bold text-gray-500 uppercase">Total Revenue</div>
                    <div class="text-2xl font-black text-gray-800">₹${totalRev.toLocaleString()}</div>
                </div>
                <div class="bg-gray-50 p-6 rounded border-l-4 border-blue-500">
                    <div class="text-xs font-bold text-gray-500 uppercase">Orders Processed</div>
                    <div class="text-2xl font-black text-gray-800">${window.DB.orders.length}</div>
                </div>
                <div class="bg-gray-50 p-6 rounded border-l-4 border-purple-500">
                    <div class="text-xs font-bold text-gray-500 uppercase">Avg. Order Value</div>
                    <div class="text-2xl font-black text-gray-800">₹${window.DB.orders.length ? Math.round(totalRev / window.DB.orders.length).toLocaleString() : 0}</div>
                </div>
            </div>
            
            <div class="bg-white p-4 border rounded">
                <h3 class="font-bold text-gray-700 mb-4">Sales Trend (Simulated)</h3>
                <div class="flex items-end justify-between h-40 gap-2 px-2">
                    ${[40, 60, 35, 80, 50, 90, 100].map(h => `
                        <div class="w-full bg-blue-100 rounded-t hover:bg-blue-200 transition relative group">
                            <div style="height: ${h}%" class="absolute bottom-0 w-full bg-brand-dark rounded-t"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                </div>
        </div>`;
    }

    renderOrders() {
        return `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2"><i class="fas fa-shopping-cart mr-2 text-brand-red"></i>Recent Orders</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-xs uppercase text-gray-600 border-b">
                            <th class="p-3">Order ID</th>
                            <th class="p-3">Date</th>
                            <th class="p-3">Customer</th>
                            <th class="p-3">Total</th>
                            <th class="p-3">Status</th>
                            <th class="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${window.DB.orders.map(o => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-3 font-mono text-xs text-gray-500 cursor-pointer hover:text-brand-red hover:underline" onclick="window.app.admin.viewOrderDetails('${o.id}')">#${o.id}</td>
                                <td class="p-3 text-gray-600">${o.date}</td>
                                <td class="p-3 font-bold text-gray-800">${o.shippingAddress ? o.shippingAddress.label : 'Guest'}</td>
                                <td class="p-3 font-bold">₹${o.total.toLocaleString()}</td>
                                <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${o.status === 'Processing' ? 'bg-blue-100 text-blue-600' : (o.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}">${o.status}</span></td>
                                <td class="p-3">
                                    <select onchange="window.app.admin.updateStatus('${o.id}', this.value)" class="border p-1 rounded text-xs bg-white">
                                        <option value="" disabled selected>Update Status</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    viewOrderDetails(orderId) {
        const order = window.DB.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.id = 'order-details-modal';
        modal.className = "fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm fade-in";
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h3 class="font-bold text-2xl text-gray-800">Order #${order.id}</h3>
                        <div class="text-sm text-gray-500">Placed on ${order.date}</div>
                    </div>
                    <button onclick="document.getElementById('order-details-modal').remove()" class="text-gray-400 hover:text-red-600 text-xl"><i class="fas fa-times"></i></button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <!-- Shipping Address -->
                    <div class="bg-gray-50 p-4 rounded border">
                        <h4 class="font-bold text-sm text-gray-700 uppercase mb-3 border-b pb-2">Shipping Address</h4>
                        ${order.shippingAddress ? `
                            <div class="font-bold text-gray-800">${order.shippingAddress.label}</div>
                            <div class="text-sm text-gray-600">${order.shippingAddress.line1}</div>
                            ${order.shippingAddress.line2 ? `<div class="text-sm text-gray-600">${order.shippingAddress.line2}</div>` : ''}
                            <div class="text-sm text-gray-600">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</div>
                            <div class="text-sm font-bold text-brand-red mt-2"><i class="fas fa-phone-alt mr-1"></i> ${order.shippingAddress.phone}</div>
                        ` : '<div class="text-gray-500 italic">No address provided.</div>'}
                    </div>

                    <!-- Invoice Management -->
                    <div class="bg-gray-50 p-4 rounded border">
                        <h4 class="font-bold text-sm text-gray-700 uppercase mb-3 border-b pb-2">Invoice</h4>
                        <div class="text-sm mb-4">
                            ${order.invoice ?
                `<div class="flex items-center gap-2 text-green-600 font-bold mb-2"><i class="fas fa-check-circle"></i> Invoice Uploaded</div>
                                 <a href="${order.invoice}" download="Invoice_${order.id}.pdf" class="text-blue-600 hover:underline text-xs">Download Current Invoice</a>`
                : '<div class="text-gray-500 italic mb-2">No invoice uploaded yet.</div>'}
                        </div>
                        <div class="flex gap-2 items-center">
                            <label class="cursor-pointer bg-brand-dark text-white px-3 py-2 rounded text-xs font-bold hover:bg-gray-800 transition">
                                <i class="fas fa-file-upload mr-1"></i> Upload PDF
                                <input type="file" class="hidden" accept="application/pdf" onchange="window.app.admin.uploadInvoice(event, '${order.id}')">
                            </label>
                            <span class="text-[10px] text-gray-400">PDF Only</span>
                        </div>
                    </div>
                </div>

                <!-- Order Items -->
                <h4 class="font-bold text-lg text-gray-800 mb-4">Order Items</h4>
                <div class="space-y-3 mb-6">
                    ${order.items.map((item, idx) => `
                        <div class="flex items-center gap-4 border p-3 rounded bg-white ${item.unavailable ? 'opacity-50 bg-gray-100' : ''}">
                            <img src="${item.image}" class="w-16 h-16 object-contain border rounded bg-white">
                            <div class="flex-grow">
                                <div class="font-bold text-sm text-gray-800">${item.name}</div>
                                <div class="text-xs text-gray-500">${item.brand}</div>
                                <div class="text-brand-red font-bold text-sm">₹${item.price.toLocaleString()}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold ${item.unavailable ? 'text-red-600' : 'text-green-600'}">${item.unavailable ? 'Unavailable' : 'Available'}</span>
                                <button onclick="window.app.admin.toggleOrderItemStatus('${order.id}', ${idx})" class="p-2 rounded border hover:bg-gray-100 text-gray-500" title="Toggle Availability">
                                    <i class="fas ${item.unavailable ? 'fa-check text-green-600' : 'fa-ban text-red-600'}"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex justify-end">
                     <button onclick="document.getElementById('order-details-modal').remove()" class="bg-gray-200 text-gray-800 px-6 py-2 rounded font-bold text-sm hover:bg-gray-300">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    toggleOrderItemStatus(orderId, itemIndex) {
        const order = window.DB.orders.find(o => o.id === orderId);
        if (order && order.items[itemIndex]) {
            order.items[itemIndex].unavailable = !order.items[itemIndex].unavailable;
            window.app.sync();
            // Re-render modal content simply by closing and reopening (quickest way without complex state binding)
            document.getElementById('order-details-modal').remove();
            this.viewOrderDetails(orderId);
            showToast(`Item marked as ${order.items[itemIndex].unavailable ? 'Unavailable' : 'Available'}`);
        }
    }

    uploadInvoice(event, orderId) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            showToast("Please upload a PDF file.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const order = window.DB.orders.find(o => o.id === orderId);
            if (order) {
                order.invoice = e.target.result; // Store Base64 PDF
                window.app.sync();
                document.getElementById('order-details-modal').remove();
                this.viewOrderDetails(orderId);
                showToast("Invoice uploaded successfully!");
            }
        };
        reader.readAsDataURL(file);
    }

    sendMessage(orderId) {
        const order = window.DB.orders.find(o => o.id === orderId);
        if (order) {
            const msg = prompt("Send message to buyer for Order #" + orderId + ":");
            if (msg) {
                if (!order.messages) order.messages = [];
                order.messages.push({
                    text: msg,
                    date: new Date().toLocaleString(),
                    sender: 'Admin'
                });
                showToast("Message sent successfully.");
                window.app.sync();
            }
        }
    }

    updateStatus(orderId, newStatus) {
        // Find Order
        const order = window.DB.orders.find(o => o.id === orderId);
        if (order) {
            // Prompt for message
            const message = prompt(`Update status to '${newStatus}'? Enter a message for the buyer (optional):`, `Your order is now ${newStatus}.`);

            // Update Order
            order.status = newStatus;
            if (message) {
                if (!order.messages) order.messages = [];
                order.messages.push({
                    text: message,
                    date: new Date().toLocaleString(),
                    sender: 'Admin'
                });
            }

            showToast(`Order #${orderId} updated to ${newStatus}`);
            this.render(); // Re-render admin
            window.app.sync();
        }
    }

    toggleAvailability(productId) {
        const product = window.DB.products.find(p => p.id === productId);
        if (product) {
            product.available = !product.available;
            showToast(`${product.name} is now ${product.available ? 'Available' : 'Unavailable'}`);
            this.render(); // Re-render admin
            window.app.sync();
        }
    }

    downloadProductCSV() {
        const products = window.DB.products;
        if (!products || products.length === 0) {
            showToast("No products to download", "error");
            return;
        }

        const csvData = products.map(p => {
            const specs = p.specs || {};
            return {
                id: p.id,
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: p.category,
                brand: p.brand,
                image: p.image || '',
                socket: specs.socket || '',
                chipset: specs.chipset || '',
                memory_type: Array.isArray(specs.memory_support) ? specs.memory_support.join('|') : (specs.memory_type || ''),
                form_factor: specs.form_factor || '',
                wattage: specs.wattage || '',
                pcie_gen: specs.pcie_gen || '',
                cooler_socket_support: Array.isArray(specs.socket_support) ? specs.socket_support.join('|') : (specs.cooler_socket_support || '')
            };
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "jps_products_compatibility.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data;
                let updatedCount = 0;
                let newCount = 0;

                rows.forEach(row => {
                    if (!row.id || !row.name) return;

                    let product = window.DB.products.find(p => p.id === row.id);
                    const isNew = !product;

                    if (isNew) {
                        product = { id: row.id };
                        window.DB.products.push(product);
                        newCount++;
                    } else {
                        updatedCount++;
                    }

                    product.name = row.name;
                    product.price = parseFloat(row.price) || 0;
                    product.stock = parseInt(row.stock) || 0;
                    product.category = row.category;
                    product.brand = row.brand;
                    if (row.image) product.image = row.image;

                    product.specs = product.specs || {};
                    if (row.socket) product.specs.socket = row.socket;
                    if (row.chipset) product.specs.chipset = row.chipset;
                    if (row.form_factor) product.specs.form_factor = row.form_factor;
                    if (row.wattage) product.specs.wattage = parseInt(row.wattage) || 0;
                    if (row.pcie_gen) product.specs.pcie_gen = row.pcie_gen;

                    if (row.memory_type) {
                        product.specs.memory_type = row.memory_type.includes('|') ? row.memory_type.split('|') : row.memory_type;
                        product.specs.memory_support = Array.isArray(product.specs.memory_type) ? product.specs.memory_type : [product.specs.memory_type];
                    }

                    if (row.cooler_socket_support) {
                        product.specs.socket_support = row.cooler_socket_support.includes('|') ? row.cooler_socket_support.split('|') : [row.cooler_socket_support];
                    }
                });

                window.app.sync();
                showToast(`Imported: ${newCount} new, ${updatedCount} updated.`);
                this.render();
            },
            error: (err) => {
                showToast("Failed to parse CSV", "error");
                console.error(err);
            }
        });
    }

    renderInventory() {
        return `
        <div>
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg text-gray-700">Stock & Compatibility Management</h3>
                <div class="flex gap-2">
                    <button onclick="window.app.admin.downloadProductCSV()" class="bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i> Download CSV
                    </button>
                    <label class="bg-green-600 text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-green-700 cursor-pointer">
                        <i class="fas fa-upload mr-2"></i> Upload CSV
                        <input type="file" accept=".csv" class="hidden" onchange="window.app.admin.handleCSVUpload(event)">
                    </label>
                    <button onclick="document.getElementById('manual-section').classList.toggle('hidden'); window.app.admin.tempImages=[];" class="bg-brand-dark text-white px-3 py-2 rounded text-xs font-bold uppercase hover:bg-gray-800">
                        <i class="fas fa-plus mr-2"></i> Add Product
                    </button>
                </div>
            </div>

            <!-- Manual Upload Section -->
            <div id="manual-section" class="hidden mb-6 bg-gray-50 p-6 rounded border border-gray-300">
                <h4 class="font-bold text-sm mb-4 border-b pb-2">New Product Entry</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <input id="new-id" type="text" placeholder="Product ID (e.g., cpu-ultra9)" class="border p-2 text-sm rounded">
                    
                    <!-- UPDATED: Dropdown Menu for Category -->
                    <select id="new-cat" class="border p-2 text-sm rounded bg-white text-gray-700 focus:outline-none focus:border-brand-red">
                        <option value="" disabled selected>Select Category</option>
                        <option value="cpu">Processor (CPU)</option>
                        <option value="motherboard">Motherboard</option>
                        <option value="memory">Memory (RAM)</option>
                        <option value="gpu">Graphics Card</option>
                        <option value="storage">Storage (SSD/HDD)</option>
                        <option value="case">Cabinet (Case)</option>
                        <option value="psu">Power Supply (SMPS)</option>
                    </select>

                    <input id="new-name" type="text" placeholder="Product Name" class="border p-2 text-sm rounded col-span-2">
                    <input id="new-brand" type="text" placeholder="Brand" class="border p-2 text-sm rounded">
                    <input id="new-price" type="number" placeholder="Price (INR)" class="border p-2 text-sm rounded">
                    <input id="new-stock" type="number" placeholder="Initial Stock" class="border p-2 text-sm rounded">
                </div>
                
                <!-- Image Upload Logic -->
                <div class="mb-4">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Product Images (Max 6)</label>
                    <div class="flex gap-4">
                        <input type="file" id="img-upload" multiple accept="image/*" onchange="window.app.admin.handleImageUpload(event)" class="text-xs">
                    </div>
                    <div id="img-preview" class="flex gap-2 mt-4 flex-wrap">
                        <!-- Thumbnails injected here -->
                    </div>
                </div>

                <button onclick="window.app.admin.addProduct()" class="bg-brand-red text-white px-6 py-2 rounded font-bold text-xs uppercase shadow hover:bg-red-700">Save Product</button>
            </div>

            <!-- Live Stock Table -->
            <div class="overflow-x-auto max-h-[400px] overflow-y-auto border rounded">
                <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 bg-gray-100 shadow-sm z-10">
                        <tr class="text-xs uppercase text-gray-600">
                            <th class="p-3">ID</th>
                            <th class="p-3">Product</th>
                            <th class="p-3">Price</th>
                            <th class="p-3">Stock</th>
                            <th class="p-3">Sold</th>
                            <th class="p-3">Available</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${window.DB.products.map(p => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-3 font-mono text-xs text-gray-500">${p.id}</td>
                                <td class="p-3 font-bold text-gray-800">${p.name}</td>
                                <td class="p-3">₹${p.price.toLocaleString()}</td>
                                <td class="p-3 font-bold ${p.stock < 5 ? 'text-red-600' : 'text-green-600'}">${p.stock || 0}</td>
                                <td class="p-3 font-bold text-gray-700">${p.sold || 0}</td>
                                <td class="p-3 text-xs">
                                    <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle-${p.id}" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" ${p.available !== false ? 'checked' : ''} onclick="window.app.admin.toggleAvailability('${p.id}')"/>
                                        <label for="toggle-${p.id}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    processCSV() {
        const csv = document.getElementById('csv-input').value;
        Papa.parse(csv, {
            complete: (results) => {
                let updated = 0;
                results.data.forEach(row => {
                    if (row.length >= 3) {
                        const p = window.DB.products.find(x => x.id === row[0]);
                        if (p) {
                            p.price = parseInt(row[1]);
                            p.stock = parseInt(row[2]);
                            updated++;
                        }
                    }
                });
                document.getElementById('csv-msg').innerText = `Updated ${updated} items.`;
                document.getElementById('csv-msg').className = "ml-2 text-xs font-bold text-green-600";
                document.getElementById('csv-msg').className = "ml-2 text-xs font-bold text-green-600";
                setTimeout(() => this.render(), 1000); // Refresh view
                window.app.sync();
            }
        });
    }

    handleImageUpload(event, type) {
        if (type) {
            // Single file for Ads
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImageData = e.target.result;
                this.uploadTarget = type;
                let previewId = type === 'banner' ? 'ban-preview' : (type === 'category' ? 'cat-preview' : 'pro-preview');
                let inputId = type === 'banner' ? 'ban-img' : (type === 'category' ? 'cat-img' : 'pro-img');
                const previewContainer = document.getElementById(previewId);
                const inputEl = document.getElementById(inputId);
                if (previewContainer) {
                    previewContainer.classList.remove('hidden');
                    previewContainer.querySelector('img').src = e.target.result;
                }
                if (inputEl) {
                    inputEl.value = '';
                    inputEl.placeholder = "Image Uploaded";
                    inputEl.disabled = true;
                }
                showToast("Image uploaded successfully");
            };
            reader.readAsDataURL(file);
        } else {
            // Multi file for Products
            const files = Array.from(event.target.files);

            if (this.tempImages.length + files.length > 6) {
                showToast("Max 6 images allowed per product.", "error");
                return;
            }

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        // Validation: Check size
                        if (img.width < 300 || img.height < 300) {
                            showToast(`Image ${file.name} is too small! Please upload larger image.`, "error");
                        } else {
                            // Add to temp array
                            this.tempImages.push(e.target.result);
                            this.updateImagePreview();
                        }
                    };
                };
                reader.readAsDataURL(file);
            });
        }
    }

    updateImagePreview() {
        const container = document.getElementById('img-preview');
        container.innerHTML = this.tempImages.map((src, idx) => `
            <div class="relative w-20 h-20 border rounded overflow-hidden group">
                <img src="${src}" class="img-fit-box">
                <button onclick="window.app.admin.removeImage(${idx})" class="absolute top-0 right-0 bg-red-600 text-white text-[10px] p-1 opacity-0 group-hover:opacity-100">&times;</button>
            </div>
        `).join('');
    }

    removeImage(index) {
        this.tempImages.splice(index, 1);
        this.updateImagePreview();
    }

    addProduct() {
        const id = document.getElementById('new-id').value;
        const name = document.getElementById('new-name').value;
        const price = parseInt(document.getElementById('new-price').value);
        const stock = parseInt(document.getElementById('new-stock').value);

        if (!id || !name || !price) {
            showToast("Please fill required fields.", "error");
            return;
        }

        if (this.tempImages.length === 0) {
            showToast("Please upload at least one image.", "error");
            return;
        }

        const newProduct = {
            id, name, price, stock,
            category: document.getElementById('new-cat').value || 'misc',
            brand: document.getElementById('new-brand').value || 'Generic',
            image: this.tempImages[0], // Main image
            images: this.tempImages, // Gallery
            specs: {}, // Empty specs for generic manual add
            sold: 0,
            available: true
        };

        window.DB.products.unshift(newProduct);
        showToast("Product added successfully!");
        this.tempImages = []; // Reset
        this.render(); // Refresh list
        window.app.sync();
    }

    renderAds() {
        return `
        <div class="space-y-10">
            ${this.renderHeroSliderManager()}
            ${this.renderCategoryGridManager()}
            ${this.renderPromoStripsManager()}
        </div>`;
    }

    renderHeroSliderManager() {
        const banners = window.DB.banners;
        const isEditing = this.editingBannerId !== null;

        return `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2"><i class="fas fa-images mr-2 text-brand-red"></i>Top Slider</h3>
            <div class="space-y-4 mb-6">
                ${banners.map((b, i) => `
                    <div class="flex gap-4 border p-3 rounded bg-gray-50 items-center">
                        <img src="${b.image}" class="w-24 h-12 object-cover rounded border bg-white">
                        <div class="flex-grow min-w-0">
                            <div class="font-bold text-sm truncate">${b.title || '(No Title)'}</div>
                            <div class="text-xs text-gray-500 truncate">${b.sub || '(No Subtitle)'}</div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.app.admin.editItem('banner', '${b.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded transition"><i class="fas fa-edit"></i></button>
                            <button onclick="window.app.admin.deleteItem('banner', ${i})" class="text-red-600 hover:bg-red-100 p-2 rounded transition"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${banners.length === 0 ? '<div class="text-xs text-gray-400 italic">No slides added yet.</div>' : ''}
            </div>
            <div class="bg-gray-50 p-4 rounded border border-gray-200" id="banner-form">
                <h4 class="font-bold text-xs uppercase text-gray-600 mb-3">${isEditing ? 'Edit Slide' : 'Add New Slide'}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image</label>
                        <div class="flex gap-2 items-center">
                            <input id="ban-img" type="text" class="flex-grow border p-2 rounded text-xs" placeholder="Image URL">
                            <label class="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-bold">
                                <i class="fas fa-upload"></i>
                                <input type="file" class="hidden" accept="image/*" onchange="window.app.admin.handleImageUpload(event, 'banner')">
                            </label>
                        </div>
                        <div id="ban-preview" class="mt-2 hidden"><img src="" class="h-16 rounded border"></div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title (Optional)</label>
                        <input id="ban-title" type="text" class="w-full border p-2 rounded text-xs" placeholder="Slide Title">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtitle (Optional)</label>
                        <input id="ban-sub" type="text" class="w-full border p-2 rounded text-xs" placeholder="Slide Subtitle">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Link Type</label>
                        <select id="ban-type" onchange="window.app.admin.updateLinkTargets('banner')" class="w-full border p-2 rounded text-xs bg-white">
                            <option value="product">Product</option>
                            <option value="category">Category</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target</label>
                        <select id="ban-target" class="w-full border p-2 rounded text-xs bg-white"></select>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.app.admin.saveHeroSlide()" class="bg-brand-red text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-red-700 transition">${isEditing ? 'Update Slide' : 'Add Slide'}</button>
                    ${isEditing ? `<button onclick="window.app.admin.cancelEdit()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-bold uppercase hover:bg-gray-300">Cancel</button>` : ''}
                </div>
            </div>
        </div>`;
    }

    renderCategoryGridManager() {
        const grid = window.DB.categoryGrid || [];
        const isEditing = this.editingCategoryId !== null;
        const isFull = grid.length >= 6 && !isEditing;

        return `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
                <h3 class="font-bold text-lg text-gray-800"><i class="fas fa-th mr-2 text-brand-red"></i>Featured Categories Grid</h3>
                <span class="text-xs font-bold ${grid.length === 6 ? 'text-red-600' : 'text-green-600'}">${grid.length}/6 Slots Used</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                ${grid.map((c, i) => `
                    <div class="border rounded p-2 relative group bg-gray-50">
                        <img src="${c.image}" class="w-full h-20 object-cover rounded mb-2 bg-white">
                        <div class="font-bold text-xs text-center truncate">${c.label}</div>
                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded gap-2">
                            <button onclick="window.app.admin.editItem('category', '${c.id}')" class="text-white hover:text-blue-300"><i class="fas fa-edit"></i></button>
                            <button onclick="window.app.admin.deleteItem('category', ${i})" class="text-white hover:text-red-300"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${!isFull ? `
            <div class="bg-gray-50 p-4 rounded border border-gray-200" id="cat-form">
                <h4 class="font-bold text-xs uppercase text-gray-600 mb-3">${isEditing ? 'Edit Category Card' : 'Add Category Card'}</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="md:col-span-3">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image (Background)</label>
                        <div class="flex gap-2 items-center">
                            <input id="cat-img" type="text" class="flex-grow border p-2 rounded text-xs" placeholder="Image URL">
                            <label class="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-bold">
                                <i class="fas fa-upload"></i>
                                <input type="file" class="hidden" accept="image/*" onchange="window.app.admin.handleImageUpload(event, 'category')">
                            </label>
                        </div>
                        <div id="cat-preview" class="mt-2 hidden"><img src="" class="h-16 rounded border"></div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Label</label>
                        <input id="cat-label" type="text" class="w-full border p-2 rounded text-xs" placeholder="e.g., Gaming PCs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Category</label>
                        <select id="cat-target" class="w-full border p-2 rounded text-xs bg-white">
                            <option value="cpu">Processors</option>
                            <option value="gpu">Graphics Cards</option>
                            <option value="motherboard">Motherboards</option>
                            <option value="memory">RAM</option>
                            <option value="storage">Storage</option>
                            <option value="case">Cases</option>
                            <option value="psu">Power Supply</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.app.admin.saveCategory()" class="bg-brand-red text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-red-700 transition">${isEditing ? 'Update Card' : 'Add Card'}</button>
                    ${isEditing ? `<button onclick="window.app.admin.cancelEdit()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-bold uppercase hover:bg-gray-300">Cancel</button>` : ''}
                </div>
            </div>` : '<div class="text-center text-xs text-red-500 font-bold p-2 border border-red-100 bg-red-50 rounded">Grid is full (Max 6 items). Delete an item to add more.</div>'}
        </div>`;
    }

    renderPromoStripsManager() {
        const promos = window.DB.promoStrips || [];
        const isEditing = this.editingPromoId !== null;

        return `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2"><i class="fas fa-scroll mr-2 text-brand-red"></i>Promo Banners</h3>
            <div class="space-y-4 mb-6">
                ${promos.sort((a, b) => a.position - b.position).map((p, i) => `
                    <div class="flex gap-4 border p-3 rounded bg-gray-50 items-center">
                        <div class="font-bold text-lg text-gray-400 w-8 text-center">#${p.position}</div>
                        <img src="${p.image}" class="w-32 h-10 object-cover rounded border bg-white">
                        <div class="flex-grow text-xs text-gray-600 truncate">Link: ${p.target}</div>
                        <div class="flex gap-2">
                            <button onclick="window.app.admin.editItem('promo', '${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded transition"><i class="fas fa-edit"></i></button>
                            <button onclick="window.app.admin.deleteItem('promo', ${i})" class="text-red-600 hover:bg-red-100 p-2 rounded transition"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${promos.length === 0 ? '<div class="text-xs text-gray-400 italic">No promo strips added.</div>' : ''}
            </div>
            <div class="bg-gray-50 p-4 rounded border border-gray-200" id="promo-form">
                <h4 class="font-bold text-xs uppercase text-gray-600 mb-3">${isEditing ? 'Edit Promo Strip' : 'Add Promo Strip'}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="col-span-2">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image</label>
                        <div class="flex gap-2 items-center">
                            <input id="pro-img" type="text" class="flex-grow border p-2 rounded text-xs" placeholder="Image URL">
                            <label class="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-bold">
                                <i class="fas fa-upload"></i>
                                <input type="file" class="hidden" accept="image/*" onchange="window.app.admin.handleImageUpload(event, 'promo')">
                            </label>
                        </div>
                        <div id="pro-preview" class="mt-2 hidden"><img src="" class="h-16 rounded border"></div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Position Order</label>
                        <select id="pro-pos" class="w-full border p-2 rounded text-xs bg-white">
                            <option value="1">1 (Top)</option>
                            <option value="2">2 (Middle)</option>
                            <option value="3">3 (Bottom)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Link (Product ID or Category)</label>
                        <input id="pro-target" type="text" class="w-full border p-2 rounded text-xs" placeholder="e.g., cpu1 or cpu">
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.app.admin.savePromo()" class="bg-brand-red text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-red-700 transition">${isEditing ? 'Update Promo' : 'Add Promo'}</button>
                    ${isEditing ? `<button onclick="window.app.admin.cancelEdit()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-bold uppercase hover:bg-gray-300">Cancel</button>` : ''}
                </div>
            </div>
        </div>`;
    }

    updateLinkTargets(type) {
        if (type !== 'banner') return;
        const linkType = document.getElementById('ban-type').value;
        const targetSelect = document.getElementById('ban-target');
        targetSelect.innerHTML = '';
        if (linkType === 'category') {
            const categories = [
                { val: 'cpu', txt: 'Processors' }, { val: 'gpu', txt: 'Graphics Cards' },
                { val: 'motherboard', txt: 'Motherboards' }, { val: 'memory', txt: 'RAM' },
                { val: 'storage', txt: 'Storage' }, { val: 'case', txt: 'Cases' }, { val: 'psu', txt: 'Power Supply' }
            ];
            categories.forEach(c => targetSelect.innerHTML += `<option value="${c.val}">${c.txt}</option>`);
        } else {
            window.DB.products.forEach(p => targetSelect.innerHTML += `<option value="${p.id}">${p.name} (${p.id})</option>`);
        }
    }

    editItem(type, id) {
        this.cancelEdit();
        if (type === 'banner') {
            const item = window.DB.banners.find(i => i.id === id);
            if (!item) return;
            this.editingBannerId = id;
            this.render();
            setTimeout(() => {
                document.getElementById('ban-img').value = item.image;
                document.getElementById('ban-title').value = item.title;
                document.getElementById('ban-sub').value = item.sub;
                document.getElementById('ban-type').value = item.type;
                this.updateLinkTargets('banner');
                document.getElementById('ban-target').value = item.target;
                document.getElementById('banner-form').scrollIntoView({ behavior: 'smooth' });
            }, 0);
        } else if (type === 'category') {
            const item = window.DB.categoryGrid.find(i => i.id === id);
            if (!item) return;
            this.editingCategoryId = id;
            this.render();
            setTimeout(() => {
                document.getElementById('cat-img').value = item.image;
                document.getElementById('cat-label').value = item.label;
                document.getElementById('cat-target').value = item.target;
                document.getElementById('cat-form').scrollIntoView({ behavior: 'smooth' });
            }, 0);
        } else if (type === 'promo') {
            const item = window.DB.promoStrips.find(i => i.id === id);
            if (!item) return;
            this.editingPromoId = id;
            this.render();
            setTimeout(() => {
                document.getElementById('pro-img').value = item.image;
                document.getElementById('pro-pos').value = item.position;
                document.getElementById('pro-target').value = item.target;
                document.getElementById('promo-form').scrollIntoView({ behavior: 'smooth' });
            }, 0);
        }
    }

    cancelEdit() {
        this.editingBannerId = null;
        this.editingCategoryId = null;
        this.editingPromoId = null;
        this.uploadedImageData = null;
        this.uploadTarget = null;
        this.render();
        setTimeout(() => this.updateLinkTargets('banner'), 0);
    }

    deleteItem(type, index) {
        if (!confirm("Are you sure you want to delete this item?")) return;
        if (type === 'banner') window.DB.banners.splice(index, 1);
        else if (type === 'category') window.DB.categoryGrid.splice(index, 1);
        else if (type === 'promo') window.DB.promoStrips.splice(index, 1);
        window.app.sync();
        this.render();
    }

    saveHeroSlide() {
        let img = (this.uploadTarget === 'banner' && this.uploadedImageData) ? this.uploadedImageData : document.getElementById('ban-img').value;
        const title = document.getElementById('ban-title').value;
        const sub = document.getElementById('ban-sub').value;
        const type = document.getElementById('ban-type').value;
        const target = document.getElementById('ban-target').value;
        if (!img || !title || !target) return showToast("Please fill all fields", "error");
        const data = { id: this.editingBannerId || 'b' + Date.now(), image: img, title, sub, type, target };
        if (this.editingBannerId) {
            const idx = window.DB.banners.findIndex(b => b.id === this.editingBannerId);
            if (idx > -1) window.DB.banners[idx] = data;
        } else {
            window.DB.banners.push(data);
        }
        this.finalizeSave();
    }

    saveCategory() {
        let img = (this.uploadTarget === 'category' && this.uploadedImageData) ? this.uploadedImageData : document.getElementById('cat-img').value;
        const label = document.getElementById('cat-label').value;
        const target = document.getElementById('cat-target').value;
        if (!img || !label) return showToast("Please fill all fields", "error");
        const data = { id: this.editingCategoryId || 'c' + Date.now(), image: img, label, target };
        if (this.editingCategoryId) {
            const idx = window.DB.categoryGrid.findIndex(c => c.id === this.editingCategoryId);
            if (idx > -1) window.DB.categoryGrid[idx] = data;
        } else {
            if (window.DB.categoryGrid.length >= 6) return showToast("Grid is full (Max 6)", "error");
            window.DB.categoryGrid.push(data);
        }
        this.finalizeSave();
    }

    savePromo() {
        let img = (this.uploadTarget === 'promo' && this.uploadedImageData) ? this.uploadedImageData : document.getElementById('pro-img').value;
        const position = parseInt(document.getElementById('pro-pos').value);
        const target = document.getElementById('pro-target').value;
        if (!img || !target) return showToast("Please fill all fields", "error");
        const data = { id: this.editingPromoId || 'p' + Date.now(), image: img, position, target };
        if (this.editingPromoId) {
            const idx = window.DB.promoStrips.findIndex(p => p.id === this.editingPromoId);
            if (idx > -1) window.DB.promoStrips[idx] = data;
        } else {
            window.DB.promoStrips.push(data);
        }
        this.finalizeSave();
    }

    finalizeSave() {
        this.uploadedImageData = null;
        this.uploadTarget = null;
        this.editingBannerId = null;
        this.editingCategoryId = null;
        this.editingPromoId = null;
        window.app.sync();
        showToast("Saved Successfully");
        this.render();
        setTimeout(() => this.updateLinkTargets('banner'), 0);
    }
}

class CartController {
    add(id, event) {
        if (event) event.stopPropagation(); // Prevent firing card click if any
        const p = window.DB.products.find(x => x.id === id);
        if (p) {
            window.DB.cart.push(p);
            this.updateUI();
            showToast(`Added <b>${p.name}</b> to cart!`);
        } else { showToast("Error adding item.", "error"); }
    }
    checkout() {
        if (window.DB.cart.length === 0) { showToast("Your cart is empty!", "error"); return; }
        if (!window.DB.user) {
            showToast("Please login to checkout", "error");
            window.app.router.navigate('account');
            window.app.cart.toggleCart();
            return;
        }

        // Check for addresses
        if (!window.DB.user.addresses || window.DB.user.addresses.length === 0) {
            if (confirm("You need a shipping address to checkout. Add one now?")) {
                window.app.router.navigate('account');
                window.app.cart.toggleCart();
                setTimeout(() => {
                    window.app.account.switchTab('addresses');
                    window.app.account.showAddAddressModal();
                }, 500);
            }
            return;
        }

        // Show Address Selection Modal
        this.showShippingModal();
    }

    showShippingModal() {
        const addresses = window.DB.user.addresses;
        const modal = document.createElement('div');
        modal.id = 'shipping-modal';
        modal.className = "fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm fade-in";
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 m-4">
                <h3 class="font-bold text-xl text-gray-800 mb-4">Select Shipping Address</h3>
                <div class="space-y-3 max-h-[60vh] overflow-y-auto mb-6">
                    ${addresses.map((addr, i) => `
                        <label class="flex items-start gap-3 p-4 border rounded cursor-pointer hover:bg-gray-50 transition">
                            <input type="radio" name="shipping_addr" value="${i}" ${i === 0 ? 'checked' : ''} class="mt-1 text-brand-red focus:ring-brand-red">
                            <div>
                                <div class="font-bold text-gray-800">${addr.label}</div>
                                <div class="text-sm text-gray-600">${addr.line1}, ${addr.city}</div>
                                <div class="text-xs text-gray-500">${addr.phone}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="document.getElementById('shipping-modal').remove()" class="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded">Cancel</button>
                    <button onclick="window.app.cart.finalizeOrder()" class="bg-brand-red text-white px-6 py-2 rounded font-bold text-sm hover:bg-red-700 shadow-lg">Place Order</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    finalizeOrder() {
        const selectedIdx = document.querySelector('input[name="shipping_addr"]:checked').value;
        const address = window.DB.user.addresses[selectedIdx];
        document.getElementById('shipping-modal').remove();

        const order = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toLocaleDateString(),
            items: [...window.DB.cart],
            total: window.DB.cart.reduce((a, b) => a + b.price, 0),
            status: 'Processing',
            shippingAddress: address,
            messages: [] // Init message history
        };

        // Update sold counts
        order.items.forEach(item => {
            const product = window.DB.products.find(p => p.id === item.id);
            if (product) {
                product.sold = (product.sold || 0) + 1;
                product.stock--;
            }
        });

        window.DB.orders.unshift(order);
        showToast("Processing your order...", "success");
        setTimeout(() => {
            window.DB.cart = [];
            this.updateUI();
            this.toggleCart();
            showToast("Order placed successfully! Check 'My Account'.", "success");
            window.app.router.navigate('account');
            window.app.sync();
        }, 1500);
    }

    remove(index) { window.DB.cart.splice(index, 1); this.updateUI(); }
    updateUI() {
        document.getElementById('cart-badge').innerText = window.DB.cart.length;
        const total = window.DB.cart.reduce((a, b) => a + b.price, 0);
        document.getElementById('header-total').innerText = `₹${total.toLocaleString()}`;
        document.getElementById('cart-total').innerText = `₹${total.toLocaleString()}`;
        document.getElementById('cart-subtotal').innerText = `₹${total.toLocaleString()}`;
        const list = document.getElementById('cart-items');
        if (window.DB.cart.length === 0) list.innerHTML = '<div class="text-center text-gray-400">Cart is empty</div>';
        else {
            list.innerHTML = window.DB.cart.map((p, i) => `
                <div class="flex gap-4 border-b pb-4">
                    <img src="${p.image}" class="w-16 h-16 object-contain border rounded">
                    <div class="flex-grow">
                        <div class="text-xs font-bold text-gray-500">${p.brand}</div>
                        <div class="text-sm font-bold line-clamp-1">${p.name}</div>
                        <div class="text-brand-red font-bold text-sm mt-1">₹${p.price.toLocaleString()}</div>
                    </div>
                    <button onclick="window.app.cart.remove(${i})" class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }
    }
    toggleCart() {
        const modal = document.getElementById('cart-modal');
        const panel = document.getElementById('cart-panel');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            setTimeout(() => panel.classList.remove('translate-x-full'), 10);
        } else {
            panel.classList.add('translate-x-full');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    }
}

class AccountController {
    render() {
        const container = document.getElementById('app-root');
        if (!window.DB.user) { this.renderAuth(container); } else { this.renderDashboard(container); }
    }
    renderAuth(container) {
        container.innerHTML = `
        <div class="fade-in max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-brand-red mt-10">
            <div class="p-10 border-r border-gray-100">
                <h2 class="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight">Returning Customer</h2>
                <form onsubmit="window.app.account.handleLogin(event)">
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                        <input type="email" required class="w-full border p-3 rounded text-sm focus:border-brand-red focus:outline-none bg-gray-50" placeholder="demo@jps.com">
                    </div>
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                        <input type="password" required class="w-full border p-3 rounded text-sm focus:border-brand-red focus:outline-none bg-gray-50" placeholder="••••••••">
                    </div>
                    <button type="submit" class="w-full bg-brand-dark text-white font-bold py-3 rounded uppercase tracking-wider text-xs hover:bg-brand-red transition shadow-lg">Login</button>
                    
                    <div class="relative my-6">
                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-gray-500">Or</span></div>
                    </div>

                    <!-- Google Button Container -->
                    <div id="google-btn-container" class="flex justify-center h-[44px]"></div>
                </form>
            </div>
            <div class="p-10 bg-gray-50">
                <h2 class="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight">New Customer</h2>
                <button onclick="window.app.account.handleRegister()" class="w-full bg-white border-2 border-brand-dark text-brand-dark font-bold py-3 rounded uppercase tracking-wider text-xs hover:bg-brand-dark hover:text-white transition">Create Account</button>
            </div>
        </div>`;

        // Initialize Google Button after render
        setTimeout(() => this.initGoogleButton(), 100);
    }

    async initGoogleButton() {
        try {
            if (!window.GOOGLE_CLIENT_ID) {
                const res = await fetch('/api/config');
                const data = await res.json();
                window.GOOGLE_CLIENT_ID = data.clientId;
            }

            if (!window.GOOGLE_CLIENT_ID || typeof google === 'undefined') return;

            google.accounts.id.initialize({
                client_id: window.GOOGLE_CLIENT_ID,
                callback: this.handleGoogleResponse.bind(this),
                use_fedcm_for_prompt: true
            });

            const btnContainer = document.getElementById('google-btn-container');
            if (btnContainer) {
                google.accounts.id.renderButton(
                    btnContainer,
                    { theme: "outline", size: "large", width: "100%", text: "sign_in_with" }
                );
            }
        } catch (err) {
            console.error("Google Auth Init Error:", err);
        }
    }

    renderDashboard(container) {
        const user = window.DB.user;
        if (!user.addresses) user.addresses = [];
        const orders = window.DB.orders;

        container.innerHTML = `
        <div class="fade-in">
            <div class="flex flex-col md:flex-row justify-between items-end mb-8 border-b pb-4">
                <div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome Back</div>
                    <h2 class="text-3xl font-black text-gray-800 uppercase tracking-tight">${user.name}</h2>
                </div>
                <button onclick="window.app.account.logout()" class="text-xs font-bold text-brand-red hover:underline mt-4 md:mt-0">LOGOUT</button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Sidebar -->
                <div class="lg:col-span-1 space-y-2">
                    <button onclick="window.app.account.switchTab('orders')" id="tab-orders" class="w-full bg-brand-red text-white p-4 rounded font-bold text-sm flex justify-between items-center shadow-md transition"><span><i class="fas fa-box-open mr-2"></i> My Orders</span><span class="bg-white text-brand-red text-xs px-2 py-0.5 rounded-full">${orders.length}</span></button>
                    <button onclick="window.app.account.switchTab('addresses')" id="tab-addresses" class="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded font-bold text-sm flex justify-between items-center shadow-sm hover:bg-gray-50 transition"><span><i class="fas fa-map-marker-alt mr-2"></i> My Addresses</span></button>
                </div>
                
                <!-- Content Area -->
                <div class="lg:col-span-3" id="account-content">
                    ${this.getOrdersHTML(orders)}
                </div>
            </div>
        </div>`;
    }

    switchTab(tab) {
        const ordersBtn = document.getElementById('tab-orders');
        const addrBtn = document.getElementById('tab-addresses');
        const content = document.getElementById('account-content');

        if (tab === 'orders') {
            ordersBtn.className = "w-full bg-brand-red text-white p-4 rounded font-bold text-sm flex justify-between items-center shadow-md transition";
            addrBtn.className = "w-full bg-white border border-gray-200 text-gray-700 p-4 rounded font-bold text-sm flex justify-between items-center shadow-sm hover:bg-gray-50 transition";
            content.innerHTML = this.getOrdersHTML(window.DB.orders);
        } else {
            addrBtn.className = "w-full bg-brand-red text-white p-4 rounded font-bold text-sm flex justify-between items-center shadow-md transition";
            ordersBtn.className = "w-full bg-white border border-gray-200 text-gray-700 p-4 rounded font-bold text-sm flex justify-between items-center shadow-sm hover:bg-gray-50 transition";
            content.innerHTML = this.getAddressesHTML();
        }
    }

    getOrdersHTML(orders) {
        return `
            <h3 class="font-bold text-lg mb-4 text-gray-700">Order History</h3>
            ${orders.length === 0 ? `<div class="bg-white p-12 text-center rounded border border-dashed border-gray-300"><p class="text-gray-500 font-medium">You haven't placed any orders yet.</p></div>` : `
                <div class="space-y-4">
                    ${orders.map(order => `
                        <div class="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
                            <div class="bg-gray-50 p-4 flex flex-wrap justify-between items-center text-xs text-gray-500 border-b">
                                <div class="flex gap-6">
                                    <div><div class="uppercase font-bold text-[10px]">Order Placed</div><div class="text-gray-800 font-bold">${order.date}</div></div>
                                    <div><div class="uppercase font-bold text-[10px]">Total</div><div class="text-gray-800 font-bold">₹${order.total.toLocaleString()}</div></div>
                                    <div><div class="uppercase font-bold text-[10px]">Order ID</div><div class="text-gray-800 font-bold">#${order.id}</div></div>
                                </div>
                                <div class="mt-2 md:mt-0 flex items-center gap-3">
                                    ${order.invoice ? `<a href="${order.invoice}" download="Invoice_${order.id}.pdf" class="text-blue-600 font-bold hover:underline flex items-center"><i class="fas fa-file-download mr-1"></i> Invoice</a>` : ''}
                                    <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${order.status === 'Processing' ? 'bg-blue-100 text-blue-600' : (order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}">${order.status}</span>
                                </div>
                            </div>
                            <div class="p-4">
                                ${order.items.map(item => `
                                    <div class="flex items-center gap-4 mb-2 last:mb-0 ${item.unavailable ? 'opacity-50' : ''}">
                                        <img src="${item.image}" class="w-12 h-12 object-contain border rounded bg-white">
                                        <div>
                                            <div class="text-xs font-bold text-gray-800">${item.name}</div>
                                            <div class="text-[10px] text-gray-500">${item.brand}</div>
                                            ${item.unavailable ? '<div class="text-[10px] text-red-600 font-bold">Item Unavailable</div>' : ''}
                                        </div>
                                    </div>`).join('')}
                                ${order.shippingAddress ? `<div class="mt-4 pt-4 border-t text-xs text-gray-500"><span class="font-bold">Shipping To:</span> ${order.shippingAddress.label} (${order.shippingAddress.line1}, ${order.shippingAddress.city})</div>` : ''}
                            </div>
                        </div>`).join('')}
                </div>`}
        `;
    }

    getAddressesHTML() {
        const addresses = window.DB.user.addresses || [];
        return `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg text-gray-700">Saved Addresses</h3>
                <button onclick="window.app.account.showAddAddressModal()" class="bg-brand-dark text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-brand-red transition"><i class="fas fa-plus mr-1"></i> Add New</button>
            </div>
            ${addresses.length === 0 ? `<div class="bg-white p-12 text-center rounded border border-dashed border-gray-300"><p class="text-gray-500 font-medium">No addresses saved yet.</p></div>` :
                `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${addresses.map((addr, i) => `
                    <div class="bg-white border rounded p-4 relative group hover:shadow-md transition">
                        <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                            <button onclick="window.app.account.deleteAddress(${i})" class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="font-bold text-gray-800 mb-1">${addr.label}</div>
                        <div class="text-sm text-gray-600">${addr.line1}</div>
                        ${addr.line2 ? `<div class="text-sm text-gray-600">${addr.line2}</div>` : ''}
                        <div class="text-sm text-gray-600">${addr.city}, ${addr.state} ${addr.zip}</div>
                        <div class="text-xs font-bold text-brand-red mt-2 uppercase tracking-wide">${addr.phone}</div>
                    </div>
                `).join('')}
            </div>`}
        `;
    }

    showAddAddressModal() {
        const modal = document.createElement('div');
        modal.id = 'address-modal';
        modal.className = "fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm fade-in";
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 m-4">
                <h3 class="font-bold text-xl text-gray-800 mb-4">Add New Address</h3>
                <form onsubmit="window.app.account.saveAddress(event)">
                    <div class="space-y-3">
                        <input type="text" name="label" placeholder="Label (e.g. Home, Office)" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                        <input type="text" name="line1" placeholder="Address Line 1" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                        <input type="text" name="line2" placeholder="Address Line 2 (Optional)" class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                        <div class="grid grid-cols-2 gap-3">
                            <input type="text" name="city" placeholder="City" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                            <input type="text" name="zip" placeholder="ZIP Code" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                        </div>
                        <input type="text" name="state" placeholder="State" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                        <input type="tel" name="phone" placeholder="Phone Number" required class="w-full border p-2 rounded text-sm focus:border-brand-red focus:outline-none">
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" onclick="document.getElementById('address-modal').remove()" class="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" class="bg-brand-red text-white px-6 py-2 rounded font-bold text-sm hover:bg-red-700 shadow-lg">Save Address</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveAddress(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newAddr = Object.fromEntries(formData.entries());

        if (!window.DB.user.addresses) window.DB.user.addresses = [];
        window.DB.user.addresses.push(newAddr);
        localStorage.setItem('jps_user', JSON.stringify(window.DB.user));

        document.getElementById('address-modal').remove();
        showToast("Address added successfully");
        this.switchTab('addresses');
    }

    deleteAddress(index) {
        if (!confirm("Delete this address?")) return;
        window.DB.user.addresses.splice(index, 1);
        localStorage.setItem('jps_user', JSON.stringify(window.DB.user));
        this.switchTab('addresses');
    }

    handleLogin(e) { e.preventDefault(); window.DB.user = { name: "Demo User", email: "demo@jpsenterprise.com", addresses: [] }; localStorage.setItem('jps_user', JSON.stringify(window.DB.user)); showToast("Login Successful!"); window.app.updateHeader(); this.render(); }
    handleRegister() { window.DB.user = { name: "New User", email: "new@jpsenterprise.com", addresses: [] }; localStorage.setItem('jps_user', JSON.stringify(window.DB.user)); showToast("Account Created Successfully!"); window.app.updateHeader(); this.render(); }
    logout() { window.DB.user = null; localStorage.removeItem('jps_user'); showToast("Logged Out"); window.app.updateHeader(); this.render(); }

    handleAuthClick() {
        if (window.DB.user) {
            this.logout();
        } else {
            window.app.router.navigate('account');
        }
    }

    async handleGoogleResponse(response) {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await res.json();

            if (data.success) {
                window.DB.user = data.user;
                if (!window.DB.user.addresses) window.DB.user.addresses = [];
                localStorage.setItem('jps_user', JSON.stringify(window.DB.user));
                showToast(`Welcome, ${window.DB.user.name}!`);
                window.app.updateHeader();
                this.render();
            } else {
                showToast("Google Login Failed: " + data.error, "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Server error during login", "error");
        }
    }
}

// --- MAIN APP ---
// --- MAIN APP ---
window.app = {
    store: new StoreController(),
    builder: new PCBuilder(),
    cart: new CartController(),
    admin: new AdminController(),
    account: new AccountController(),
    router: {
        navigate: (page) => {
            document.getElementById('mobile-menu').classList.add('hidden');
            const logoText = document.getElementById('logo-text');

            if (page === 'admin') {
                logoText.innerText = "COMMAND";
                document.getElementById('main-nav').classList.add('hidden');
                // Stop carousel if running
                if (window.app.store.carouselInterval) clearInterval(window.app.store.carouselInterval);
            } else {
                logoText.innerText = "ENTERPRISE";
                document.getElementById('main-nav').classList.remove('hidden');
            }

            if (page === 'store') window.app.store.render('all');
            else if (page === 'builder') window.app.builder.render();
            else if (page === 'admin') window.app.admin.render();
            else if (page === 'account') window.app.account.render();
            else alert('Page under construction');
        }
    },
    sync: () => {
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.DB)
        }).then(res => res.json())
            .then(data => console.log('Sync:', data))
            .catch(err => console.error('Sync failed:', err));
    },
    init: () => {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                window.DB.products = data.products || [];
                window.DB.banners = data.banners || [];
                window.DB.categoryGrid = data.categoryGrid || [];
                window.DB.promoStrips = data.promoStrips || [];
                window.DB.orders = data.orders || [];

                window.app.updateHeader(); // Set initial button state
                // Initial Render
                window.app.router.navigate('store');
            })
            .catch(err => {
                console.error('Init failed:', err);
                showToast("Failed to load data from server: " + err.message, "error");
            });
    },
    updateHeader: () => {
        const btn = document.getElementById('header-login-btn');
        if (!btn) return;

        if (window.DB.user) {
            btn.innerHTML = '<i class="fas fa-sign-out-alt text-brand-red"></i> Logout';
            btn.onclick = () => window.app.account.logout();
        } else {
            btn.innerHTML = '<i class="fab fa-google text-brand-red"></i> Login';
            btn.onclick = () => window.app.account.handleAuthClick();
        }
    }
};

function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

// Safe Init
try {
    window.app.init();
} catch (e) {
    console.error("CRITICAL INIT ERROR:", e);
    alert("App Init Failed: " + e.message);
}
