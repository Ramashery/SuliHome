// --- SuliApp Global Object ---
const SuliApp = {
    // 1. FIREBASE CONFIG & INITIALIZATION
    config: { /* ... ваш конфиг ... */ },

    initFirebase() { /* ... без изменений ... */ },

    // 2. SHARED UTILITIES
    utils: { /* ... без изменений ... */ },
    
    // 3. AUTHENTICATION MODULE
    auth: { /* ... без изменений ... */ },
    
    // 4. DATA STORE MODULE (С УЛУЧШЕНИЯМИ)
    store: {
        data: { categories: [], products: [], cart: [], favorites: [] },
        
        async init() {
            try {
                // Используем Promise.all для параллельной загрузки
                const [categoriesSnapshot, productsSnapshot] = await Promise.all([
                    SuliApp.db.collection('categories').get(),
                    SuliApp.db.collection('products').get()
                ]);

                // Проверяем и "засеиваем" категории, если нужно
                if (categoriesSnapshot.empty) {
                    console.log("[Firestore] Seeding 'categories' collection...");
                    const defaultCategories = this.getDefaultData().categories;
                    const batch = SuliApp.db.batch();
                    defaultCategories.forEach(item => {
                        const docRef = SuliApp.db.collection('categories').doc(String(item.id));
                        batch.set(docRef, item);
                    });
                    await batch.commit();
                    const newSnapshot = await SuliApp.db.collection('categories').get();
                    this.data.categories = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    this.data.categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                // Проверяем и "засеиваем" товары, если нужно
                if (productsSnapshot.empty) {
                     console.log("[Firestore] Seeding 'products' collection...");
                    const defaultProducts = this.getDefaultData().products;
                    const batch = SuliApp.db.batch();
                    defaultProducts.forEach(item => {
                        const docRef = SuliApp.db.collection('products').doc(String(item.id));
                        batch.set(docRef, item);
                    });
                    await batch.commit();
                    const newSnapshot = await SuliApp.db.collection('products').get();
                    this.data.products = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    this.data.products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                const localData = localStorage.getItem('suli-home-local');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    this.data.cart = parsed.cart || [];
                    this.data.favorites = parsed.favorites || [];
                }
                console.log("Store initialized successfully.");
            } catch (error) {
                console.error("Error initializing store:", error);
                SuliApp.utils.showToast("Ошибка загрузки данных", "error");
            }
        },
        
        // ... остальные методы store без изменений (get, getItem, saveItem, deleteItem) ...
        
        getDefaultData() {
            return { 
                categories: [ 
                    { id: 1, name: 'Kitchen', name_ru: 'Кухня', name_ka: 'სამზარეულო', parentId: null, image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80' }, 
                    { id: 2, name: 'Bathroom', name_ru: 'Ванная', name_ka: 'აბაზანა', parentId: null, image: 'https://images.unsplash.com/photo-1583947215259-38e34be8751f?auto=format&fit=crop&w=400&q=80' }, 
                    { id: 3, name: 'Decor', name_ru: 'Декор', name_ka: 'დეკორი', parentId: null, image: 'https://images.unsplash.com/photo-1541123437800-1a710d19c213?auto=format&fit=crop&w=400&q=80' }
                ], 
                products: [ 
                    { id: '101', name: 'Ceramic Pot', name_ru: 'Керамический горшок', price: 85, originalPrice: 110, categoryId: 3, images: ['https://images.unsplash.com/photo-1590550608562-587655a6d3f2?auto=format&fit=crop&w=400&q=80', 'https://images.unsplash.com/photo-1588694883921-6a2c301b0f5b?auto=format&fit=crop&w=400&q=80'], stock: 15, isBestseller: true }, 
                    { id: '102', name: 'Mug Set', name_ru: 'Набор кружек', price: 120, originalPrice: 150, categoryId: 1, images: ['https://images.unsplash.com/photo-1617991395342-733355554abd?auto=format&fit=crop&w=300&q=80', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=300&q=80'], stock: 32, isBestseller: true }, 
                ] 
            }; 
        }
    }
};

SuliApp.initFirebase();