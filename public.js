// --- Suli Public App ---
document.addEventListener('DOMContentLoaded', () => {
    const PublicApp = {
        BASE_PATH: '/SuliHome', // ВАЖНО: Убедитесь, что это соответствует вашему URL на GitHub Pages (например, '/S' или '/SuliHome')
        appEl: document.getElementById('app-container'),
        currentLanguage: 'ru',

        async init() {
            this.appEl.innerHTML = this.templates.loadingPlaceholder(); // Показываем скелет загрузки сразу
            await SuliApp.store.init();
            this.router.init();
            this.addEventListeners();
            console.log("Public App Initialized");
        },

        templates: {
             _productCard(product) {
                const lang = PublicApp.currentLanguage;
                const productName = product[`name_${lang}`] || product.name;
                const productUrl = `${PublicApp.BASE_PATH}/${lang}/product/${product.id}`; // Упрощенный URL для примера
                const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
                const hasSecondImage = product.images && product.images.length > 1;

                return `
                <a href="${productUrl}" class="product-card" data-product-id="${product.id}">
                    ${discount > 0 || product.isBestseller ? `<div class="product-badges">
                        ${product.isBestseller ? '<span class="badge bestseller">Хит</span>' : ''}
                        ${discount > 0 ? `<span class="badge discount">-${discount}%</span>` : ''}
                    </div>` : ''}
                    <div class="card-top-icons">
                        <div class="favorite-btn" data-product-id="${product.id}"><i class="far fa-heart"></i></div>
                        <div class="quick-view" data-product-id="${product.id}"><i class="fas fa-eye"></i></div>
                    </div>
                    <div class="product-image">
                        <img src="${product.images[0]}" alt="${productName}">
                        ${hasSecondImage ? `<div class="product-image-hover"><img src="${product.images[1]}" alt="${productName}"></div>` : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-name">${productName}</div>
                        <div class="product-footer">
                            <div class="price-block">
                                <span class="product-price">${product.price} ₾</span>
                                ${product.originalPrice ? `<span class="old-price">${product.originalPrice} ₾</span>` : ''}
                            </div>
                            <button class="btn add-to-cart-btn-card" data-product-id="${product.id}"><i class="fas fa-shopping-cart"></i> В корзину</button>
                        </div>
                    </div>
                </a>`;
             },
             home() {
                const categories = SuliApp.store.get('categories').filter(c => !c.parentId);
                const bestsellers = SuliApp.store.get('products').filter(p => p.isBestseller);
                
                return `
                <div class="hero">
                    <div class="hero-bg"></div>
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <h1>Создайте дом вашей мечты</h1>
                        <a href="${this.BASE_PATH}/catalog" class="btn btn-accent">Смотреть каталог</a>
                    </div>
                </div>
                <h2 class="section-title">Категории</h2>
                <div class="categories">
                    ${categories.map(cat => {
                        const catName = cat[`name_${this.currentLanguage}`] || cat.name;
                        return `<a href="${this.BASE_PATH}/category/${cat.id}" class="category-card" style="background-image: url('${cat.image}')">
                            <span class="category-name">${catName}</span>
                        </a>`
                    }).join('')}
                </div>
                <div class="bestsellers-container">
                    <div class="bestsellers-header">
                        <h2 class="section-title">Бестселлеры</h2>
                        <a href="${this.BASE_PATH}/catalog" class="view-all">Смотреть все <i class="fas fa-chevron-right"></i></a>
                    </div>
                    <div class="bestsellers">
                        ${bestsellers.map(p => this._productCard(p)).join('')}
                    </div>
                </div>`;
             },
             cartPage() {
                 return `<h1 class="section-title">Корзина</h1><p>Здесь будет страница корзины.</p>`;
             },
             loadingPlaceholder() {
                 return `
                    <div class="skeleton-grid">
                        ${Array(4).fill('<div class="skeleton-card category"></div>').join('')}
                    </div>
                    <h2 class="section-title" style="margin-top: 24px;">Бестселлеры</h2>
                    <div style="display: flex; gap: 16px; overflow: hidden;">
                        ${Array(2).fill('<div class="skeleton-card product"><div class="skeleton-image"></div><div class="skeleton-text"></div><div class="skeleton-text skeleton-text-small"></div></div>').join('')}
                    </div>`;
             }
        },

        router: {
            init() {
                // Слушаем изменения URL (кнопки "вперед/назад" в браузере)
                window.addEventListener('popstate', () => this.handleRouteChange());
                // Перехватываем клики по ссылкам для SPA-навигации
                document.body.addEventListener('click', e => {
                    const link = e.target.closest('a');
                    if (link && link.href.startsWith(window.location.origin) && link.target !== '_blank') {
                        e.preventDefault();
                        const targetPath = link.pathname;
                        // Проверяем, не является ли ссылка на админку
                        if (targetPath.includes('/admin')) {
                            window.location.href = targetPath; // Обычный переход для админки
                        } else {
                            this.navigate(targetPath);
                        }
                    }
                });
                // Запускаем роутер для текущей страницы при первой загрузке
                this.handleRouteChange();
            },
            
            navigate(path) {
                history.pushState(null, '', path);
                this.handleRouteChange();
            },
            
            render(html) {
                PublicApp.appEl.innerHTML = html;
                window.scrollTo(0, 0);
            },
            
            handleRouteChange() {
                const path = window.location.pathname;
                const cleanPath = path.startsWith(PublicApp.BASE_PATH) 
                    ? path.substring(PublicApp.BASE_PATH.length) 
                    : path;

                // Простой роутинг
                if (cleanPath === '/' || cleanPath.match(/^\/(ru|en|ka)?\/?$/)) {
                    this.render(PublicApp.templates.home());
                } else if (cleanPath.startsWith('/cart')) {
                    this.render(PublicApp.templates.cartPage());
                } else {
                    // По умолчанию показываем главную страницу, если маршрут не найден
                    this.render(PublicApp.templates.home());
                }
            }
        },
        
        addEventListeners() {
            // Глобальный обработчик кликов для динамических элементов
            this.appEl.addEventListener('click', e => {
                const addToCartBtn = e.target.closest('.add-to-cart-btn-card');
                if(addToCartBtn) {
                    e.preventDefault();
                    console.log(`Adding product ${addToCartBtn.dataset.productId} to cart.`);
                    SuliApp.utils.showToast("Товар добавлен в корзину!");
                }
            });
        }
    };
    
    PublicApp.init();
});