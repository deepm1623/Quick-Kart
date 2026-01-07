const KartUI = (() => {
  const state = {
    products: [],
    allProducts: [],
    filteredProducts: [],
    cart: [],
    wishlist: [],
    productGridId: 'product-grid',
    searchMode: 'category',
    searchTimeout: null,
  };

  const els = {};

  const getEl = (key, selector) => {
    if (!els[key]) {
      els[key] = document.querySelector(selector);
    }
    return els[key];
  };

  const toast = (message) => {
    const toastEl = getEl('toast', '#toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
  };

  const findProduct = (id) => state.products.find((item) => item.id === id);

  const renderProducts = (productsToRender = null) => {
    const grid = document.getElementById(state.productGridId);
    if (!grid) return;
    
    const products = productsToRender || state.filteredProducts.length > 0 ? state.filteredProducts : state.products;
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--muted);"><i class="bx bx-search" style="font-size: 4rem; margin-bottom: 20px; display: block; opacity: 0.3;"></i><p style="font-size: 1.1rem; font-weight: 500;">No products found. Try a different search term.</p></div>';
      return;
    }
    
    grid.className = 'product-grid';
    if (products.length === 1) {
      grid.style.gridTemplateColumns = 'minmax(280px, 320px)';
      grid.style.justifyContent = 'center';
    } else if (products.length === 2) {
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 320px))';
      grid.style.justifyContent = 'center';
    } else if (products.length === 3) {
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 300px))';
      grid.style.justifyContent = 'center';
    } else {
      grid.style.gridTemplateColumns = '';
      grid.style.justifyContent = '';
    }
    
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      const meta = product.meta || '';
      const category = product.category || '';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="product-meta">
          <span>${category}</span>
          <span>${meta}</span>
        </div>
        <h3>${product.name}</h3>
        <div class="price">₹${Number(product.price).toFixed(2)}</div>
        <div class="card-actions">
          <button class="btn-cart" data-product="${product.id}">Add to cart</button>
          <button class="btn-wishlist" data-wishlist="${product.id}">
            <i class='bx bx-heart'></i>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  const updateCartUI = () => {
    const cartItemsEl = getEl('cartItems', '#cart-items');
    const cartCountEl = getEl('cartCount', '#cart-count');
    const cartTotalEl = getEl('cartTotal', '#cart-total');
    const panelTotalEl = getEl('panelTotal', '#panel-total');

    if (cartItemsEl) {
      cartItemsEl.innerHTML = '';
      if (!state.cart.length) {
        cartItemsEl.innerHTML = '<p style="color: var(--muted);">Your cart is empty.</p>';
      }
      state.cart.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'panel-item';
        row.innerHTML = `
          <div>
            <strong>${item.name}</strong>
            <small>₹${item.price.toFixed(2)} • Qty: ${item.qty}</small>
          </div>
          <div>
            <button style="border:none;background:none;cursor:pointer;" aria-label="Decrease" data-qty="${item.id}" data-delta="-1">-</button>
            <button style="border:none;background:none;cursor:pointer;" aria-label="Increase" data-qty="${item.id}" data-delta="1">+</button>
          </div>
        `;
        cartItemsEl.appendChild(row);
      });
    }

    const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartTotalEl) cartTotalEl.textContent = `₹${totalPrice.toFixed(2)}`;
    if (panelTotalEl) panelTotalEl.textContent = `₹${totalPrice.toFixed(2)}`;
  };

  const updateWishlistUI = () => {
    const wishlistItemsEl = getEl('wishlistItems', '#wishlist-items');
    const wishlistCountEl = getEl('wishlistCount', '#wishlist-count');

    if (wishlistItemsEl) {
      wishlistItemsEl.innerHTML = '';
      if (!state.wishlist.length) {
        wishlistItemsEl.innerHTML = '<p style="color: var(--muted);">No saved items yet.</p>';
      }
      state.wishlist.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'panel-item';
        row.innerHTML = `
          <div>
            <strong>${item.name}</strong>
            <small>₹${item.price.toFixed(2)}</small>
          </div>
          <button style="border:none;background:none;color:var(--accent);cursor:pointer;" data-add="${item.id}">Add</button>
        `;
        wishlistItemsEl.appendChild(row);
      });
    }

    if (wishlistCountEl) wishlistCountEl.textContent = state.wishlist.length;
  };

  const addToCart = (id) => {
    const product = findProduct(id);
    if (!product) return;
    const existing = state.cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    toast('Added to cart');
  };

  const toggleWishlist = (id) => {
    const product = findProduct(id);
    if (!product) return;
    const index = state.wishlist.findIndex((item) => item.id === id);
    if (index > -1) {
      state.wishlist.splice(index, 1);
      toast('Removed from wishlist');
    } else {
      state.wishlist.push(product);
      toast('Saved to wishlist');
    }
    updateWishlistUI();
  };

  const updateQuantity = (id, delta) => {
    const entry = state.cart.find((item) => item.id === id);
    if (!entry) return;
    entry.qty += delta;
    if (entry.qty <= 0) {
      const idx = state.cart.findIndex((item) => item.id === id);
      state.cart.splice(idx, 1);
    }
    updateCartUI();
  };

  const moveWishlistToCart = () => {
    state.wishlist.forEach((item) => addToCart(item.id));
    state.wishlist.length = 0;
    updateWishlistUI();
  };

  const openPanel = (panelId) => {
    const overlay = getEl('overlay', '#overlay');
    document.querySelectorAll('.side-panel').forEach((panel) => panel.classList.remove('open'));
    const panel = document.getElementById(panelId);
    if (panel && overlay) {
      panel.classList.add('open');
      overlay.classList.add('active');
    }
  };

  const closePanels = () => {
    const overlay = getEl('overlay', '#overlay');
    document.querySelectorAll('.side-panel').forEach((panel) => panel.classList.remove('open'));
    if (overlay) overlay.classList.remove('active');
  };

  const handleClick = (event) => {
    const productTrigger = event.target.closest('[data-product]');
    if (productTrigger) {
      addToCart(Number(productTrigger.dataset.product));
      return;
    }

    const wishlistTrigger = event.target.closest('[data-wishlist]');
    if (wishlistTrigger) {
      toggleWishlist(Number(wishlistTrigger.dataset.wishlist));
      return;
    }

    const targetPanel = event.target.closest('[data-target]');
    if (targetPanel) {
      openPanel(targetPanel.dataset.target);
      return;
    }

    const closeTrigger = event.target.closest('[data-close]');
    if (closeTrigger) {
      closePanels();
      return;
    }

    const qtyTrigger = event.target.closest('[data-qty]');
    if (qtyTrigger) {
      const id = Number(qtyTrigger.dataset.qty);
      const delta = Number(qtyTrigger.dataset.delta);
      updateQuantity(id, delta);
      return;
    }

    const addFromWishlist = event.target.closest('[data-add]');
    if (addFromWishlist) {
      addToCart(Number(addFromWishlist.dataset.add));
      return;
    }
  };

  const searchProducts = (query) => {
    if (!query || query.trim() === '') {
      state.filteredProducts = [];
      renderProducts();
      const shopSection = document.getElementById('shop');
      if (shopSection) shopSection.style.display = 'none';
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const productsToSearch = state.searchMode === 'global' ? state.allProducts : state.products;
    
    state.filteredProducts = productsToSearch.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const meta = (product.meta || product.grams || '').toLowerCase();
      
      return name.includes(searchTerm) || 
             category.includes(searchTerm) || 
             meta.includes(searchTerm);
    });
    
    renderProducts();
    
    const shopSection = document.getElementById('shop');
    const resultsCount = document.getElementById('search-results-count');
    if (shopSection) {
      shopSection.style.display = 'block';
      if (resultsCount) {
        const count = state.filteredProducts.length;
        resultsCount.textContent = count > 0 ? `${count} product${count !== 1 ? 's' : ''} found` : 'No products found';
      }
      setTimeout(() => {
        shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const initSearch = (searchMode = 'category') => {
    state.searchMode = searchMode;
    const searchInput = document.querySelector('.search input[type="search"]');
    const searchButton = document.querySelector('.search button');
    
    if (!searchInput) return;

    const performSearch = () => {
      const query = searchInput.value;
      if (state.searchTimeout) {
        clearTimeout(state.searchTimeout);
      }
      state.searchTimeout = setTimeout(() => {
        searchProducts(query);
      }, 300);
    };

    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });

    if (searchButton) {
      searchButton.addEventListener('click', performSearch);
    }
  };

  const setGlobalProducts = (allProducts) => {
    state.allProducts = allProducts.map((product, index) => ({
      id: product.id ?? index + 1,
      category: product.category ?? '',
      meta: product.meta ?? product.grams ?? '',
      ...product,
    }));
  };

  const mountProducts = (products = [], options = {}) => {
    state.productGridId = options.targetId || 'product-grid';
    state.products = products.map((product, index) => ({
      id: product.id ?? index + 1,
      category: product.category ?? '',
      meta: product.meta ?? product.grams ?? '',
      ...product,
    }));
    state.filteredProducts = [];
    renderProducts();
  };

  const init = () => {
    document.addEventListener('click', handleClick);
    const overlay = getEl('overlay', '#overlay');
    if (overlay) overlay.addEventListener('click', closePanels);
    updateCartUI();
    updateWishlistUI();
  };

  return {
    init,
    mountProducts,
    moveWishlistToCart,
    initSearch,
    setGlobalProducts,
    searchProducts,
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  KartUI.init();
  window.moveWishlistToCart = KartUI.moveWishlistToCart;
});

