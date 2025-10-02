// --- SuliApp Global Object ---
const SuliApp = {
    // 1. FIREBASE CONFIG & INITIALIZATION
    config: {
        firebase: {
            apiKey: "AIzaSyCXl1pRh-k1pvC0BiyeENGBjY342Vxx99M", // Используйте переменные окружения в реальном проекте
            authDomain: "suli-home.firebaseapp.com",
            projectId: "suli-home",
            storageBucket: "suli-home.appspot.com",
            messagingSenderId: "799949754331",
            appId: "1:799949754331:web:8e9dfbff946a5ed62661fe",
        }
    },

    initFirebase() {
        if (!firebase.apps.length) {
            firebase.initializeApp(this.config.firebase);
        }
        this.db = firebase.firestore();
        this.auth.instance = firebase.auth();
    },

    // 2. SHARED UTILITIES
    utils: {
        showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        },
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        slugify(text) {
             return text.toString().toLowerCase()
                .replace(/\s+/g, '-')       // Replace spaces with -
                .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
                .replace(/\-\-+/g, '-')     // Replace multiple - with single -
                .replace(/^-+/, '')         // Trim - from start of text
                .replace(/-+$/, '');        // Trim - from end of text
        }
    },
    
    // 3. AUTHENTICATION MODULE
    auth: {
        instance: null,
        onAuthStateChanged(callback) {
            return this.instance.onAuthStateChanged(callback);
        },
        signIn(email, password) {
            return this.instance.signInWithEmailAndPassword(email, password);
        },
        signOut() {
            return this.instance.signOut();
        }
    },
    
    // 4. DATA STORE MODULE
    store: {
        data: { categories: [], products: [], cart: [], favorites: [] },
        
        async init() {
            // Fetch data from Firestore
            try {
                const categoriesSnapshot = await SuliApp.db.collection('categories').get();
                this.data.categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const productsSnapshot = await SuliApp.db.collection('products').get();
                this.data.products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Load local data (cart, favorites)
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
        
        get(collection) {
            return this.data[collection] || [];
        },
        
        getItem(collection, id) {
            if (!id || !this.data[collection]) return null;
            return this.data[collection].find(item => item.id == id);
        },
        
        async saveItem(collection, itemData) {
            try {
                const docRef = itemData.id ? SuliApp.db.collection(collection).doc(itemData.id) : SuliApp.db.collection(collection).doc();
                await docRef.set({ ...itemData, id: docRef.id }, { merge: true });
                
                // Update local cache
                const index = this.data[collection].findIndex(i => i.id === docRef.id);
                if (index > -1) {
                    this.data[collection][index] = { ...this.data[collection][index], ...itemData, id: docRef.id };
                } else {
                    this.data[collection].push({ ...itemData, id: docRef.id });
                }
                return { ...itemData, id: docRef.id };
            } catch (error) {
                console.error(`[Firestore] Error saving to ${collection}:`, error);
                SuliApp.utils.showToast("Ошибка сохранения данных", "error");
                throw error;
            }
        },

        async deleteItem(collection, id) {
             try {
                await SuliApp.db.collection(collection).doc(id).delete();
                // Update local cache
                this.data[collection] = this.data[collection].filter(item => item.id !== id);
            } catch (error) {
                console.error(`[Firestore] Error deleting from ${collection}:`, error);
                SuliApp.utils.showToast("Ошибка удаления", "error");
                throw error;
            }
        }
        // ... (можно добавить методы update, toggleArchive и т.д. по аналогии)
    }
};

// Initialize Firebase as soon as the script loads
SuliApp.initFirebase();