document.addEventListener('DOMContentLoaded', () => {
    const AdminApp = {
        contentArea: document.getElementById('content-area'),
        pageTitle: document.getElementById('page-title'),
        addNewBtn: document.getElementById('add-new-btn'),
        currentPage: 'dashboard',

        init() {
            // AUTH GUARD: Защита админ-панели
            SuliApp.auth.onAuthStateChanged(user => {
                if (user) {
                    this.bootstrap(); // Пользователь вошел, запускаем приложение
                } else {
                    window.location.href = 'login.html'; // Нет пользователя, редирект на логин
                }
            });
        },
        
        async bootstrap() {
            await SuliApp.store.init();
            this.addEventListeners();
            this.renderPage('dashboard');
            this.updateUserInfo();
        },

        updateUserInfo() {
            const user = SuliApp.auth.instance.currentUser;
            if (user) {
                document.getElementById('user-email').textContent = user.email;
                document.getElementById('user-avatar').textContent = user.email.charAt(0).toUpperCase();
            }
        },

        renderPage(page) {
            this.currentPage = page;
            this.pageTitle.textContent = document.querySelector(`.nav-item[data-page="${page}"] span`).textContent;
            
            // Настраиваем кнопку "Добавить"
            const btnTextMap = {
                products: 'Добавить товар',
                categories: 'Добавить категорию',
                orders: 'Создать заказ',
                dashboard: 'Создать отчёт'
            };
            this.addNewBtn.innerHTML = `<i class="fas fa-plus"></i> ${btnTextMap[page] || 'Добавить'}`;

            const template = this.templates[page] ? this.templates[page]() : this.templates.notFound();
            this.contentArea.innerHTML = template;
        },

        templates: {
            dashboard() {
                const products = SuliApp.store.get('products');
                const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
                return `
                    <div class="stats-grid">
                        <div class="stat-card products">
                           <div class="stat-header"><div><div class="stat-value">${products.length}</div><div class="stat-label">Всего товаров</div></div><div class="stat-icon"><i class="fas fa-box"></i></div></div>
                           <div class="stat-change positive"><i class="fas fa-arrow-up"></i> ${totalStock} шт. на складе</div>
                        </div>
                        <div class="stat-card orders"><div class="stat-header"><div><div class="stat-value">0</div><div class="stat-label">Новые заказы</div></div><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div></div></div>
                        <div class="stat-card revenue"><div class="stat-header"><div><div class="stat-value">₾0</div><div class="stat-label">Доход сегодня</div></div><div class="stat-icon"><i class="fas fa-chart-line"></i></div></div></div>
                    </div>
                `;
            },
            products() {
                const products = SuliApp.store.get('products');
                return `
                    <div class="data-section">
                        <table class="data-table">
                            <thead><tr><th>Товар</th><th>Категория</th><th>Цена</th><th>Склад</th><th>Действия</th></tr></thead>
                            <tbody>
                                ${products.map(p => `
                                <tr>
                                    <td>
                                        <div class="product-cell">
                                            <img src="${p.images?.[0]}" class="product-thumb">
                                            <div class="product-info"><div class="product-name">${p.name}</div></div>
                                        </div>
                                    </td>
                                    <td>${SuliApp.store.getItem('categories', p.categoryId)?.name || 'N/A'}</td>
                                    <td><strong>${p.price} ₾</strong></td>
                                    <td>${p.stock} шт</td>
                                    <td><div class="action-buttons">
                                        <button class="action-btn edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
                                    </div></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            },
            // ... другие шаблоны для категорий, заказов...
            notFound() {
                return `<p>Этот раздел находится в разработке.</p>`;
            }
        },

        addEventListeners() {
            // Навигация
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', e => {
                    e.preventDefault();
                    document.querySelector('.nav-item.active').classList.remove('active');
                    item.classList.add('active');
                    this.renderPage(item.dataset.page);
                });
            });

            // Выход
            document.getElementById('logout-btn').addEventListener('click', () => {
                SuliApp.auth.signOut().then(() => window.location.href = 'login.html');
            });
            
            // Обработка кликов в контенте (редактирование, удаление)
            this.contentArea.addEventListener('click', async e => {
                const deleteBtn = e.target.closest('.action-btn.delete');
                if (deleteBtn) {
                    const id = deleteBtn.dataset.id;
                    if (confirm(`Удалить товар с ID: ${id}?`)) {
                        await SuliApp.store.deleteItem('products', id);
                        this.renderPage('products');
                        SuliApp.utils.showToast('Товар удалён');
                    }
                }
            });
        }
    };

    AdminApp.init();
});