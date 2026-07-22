// GA4 Enhanced Ecommerce - Complete gtag.js / dataLayer Implementation
// Paste in <head> after gtag.js config, or push to dataLayer if using GTM

// ============================================
// 1. VIEW_ITEM - Page produit
// ============================================
function trackViewItem(product) {
  gtag('event', 'view_item', {
    currency: product.currency || 'EUR',
    value: product.price,
    items: [{
      item_id: product.item_id,           // Requis: SKU unique
      item_name: product.item_name,       // Requis: Nom produit
      price: product.price,               // Requis: Prix unitaire (number)
      quantity: product.quantity || 1,    // Défaut: 1
      item_category: product.item_category, // Requis: Catégorie principale
      item_category2: product.item_category2, // Optionnel: Sous-catégorie
      item_category3: product.item_category3, // Optionnel: Sous-sous-catégorie
      item_brand: product.item_brand,     // Optionnel: Marque
      item_variant: product.item_variant, // Optionnel: Variante (ex: "Noir", "32Go")
      item_list_name: product.item_list_name, // Optionnel: Liste d'origine (ex: "Recherche", "Catégorie")
      item_list_id: product.item_list_id,     // Optionnel: ID de la liste
      index: product.index || 0           // Optionnel: Position dans la liste (0-based)
    }]
  });

  // Alternative dataLayer (GTM)
  /*
  dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: product.currency || 'EUR',
      value: product.price,
      items: [{
        item_id: product.item_id,
        item_name: product.item_name,
        price: product.price,
        quantity: product.quantity || 1,
        item_category: product.item_category,
        item_category2: product.item_category2,
        item_category3: product.item_category3,
        item_brand: product.item_brand,
        item_variant: product.item_variant,
        item_list_name: product.item_list_name,
        item_list_id: product.item_list_id,
        index: product.index || 0
      }]
    }
  });
  */
}

// Exemple d'appel sur page produit :
// trackViewItem({
//   item_id: 'SKU_12345',
//   item_name: 'Sony WH-1000XM5',
//   price: 349.99,
//   quantity: 1,
//   item_category: 'Audio',
//   item_category2: 'Casques',
//   item_brand: 'Sony',
//   item_variant: 'Noir',
//   item_list_name: 'Produits similaires',
//   item_list_id: 'related_products',
//   index: 0,
//   currency: 'EUR'
// });


// ============================================
// 2. ADD_TO_CART - Clic "Ajouter au panier"
// ============================================
function trackAddToCart(product, cart) {
  const items = cart ? cart.items.map(item => ({
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.item_category,
    item_category2: item.item_category2,
    item_category3: item.item_category3,
    item_brand: item.item_brand,
    item_variant: item.item_variant
  })) : [{
    item_id: product.item_id,
    item_name: product.item_name,
    price: product.price,
    quantity: product.quantity || 1,
    item_category: product.item_category,
    item_category2: product.item_category2,
    item_category3: product.item_category3,
    item_brand: product.item_brand,
    item_variant: product.item_variant
  }];

  const value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  gtag('event', 'add_to_cart', {
    currency: product.currency || 'EUR',
    value: value,
    items: items
  });

  // Alternative dataLayer (GTM)
  /*
  dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: product.currency || 'EUR',
      value: value,
      items: items
    }
  });
  */
}

// Exemple d'appel sur clic "Ajouter au panier" :
// trackAddToCart({
//   item_id: 'SKU_12345',
//   item_name: 'Sony WH-1000XM5',
//   price: 349.99,
//   quantity: 1,
//   item_category: 'Audio',
//   item_category2: 'Casques',
//   item_brand: 'Sony',
//   item_variant: 'Noir',
//   currency: 'EUR'
// }, currentCart); // optionnel: panier complet si multi-articles


// ============================================
// 3. BEGIN_CHECKOUT - Entrée dans le tunnel
// ============================================
function trackBeginCheckout(cart, coupon) {
  const items = cart.items.map(item => ({
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.item_category,
    item_category2: item.item_category2,
    item_category3: item.item_category3,
    item_brand: item.item_brand,
    item_variant: item.item_variant
  }));

  const value = cart.subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  gtag('event', 'begin_checkout', {
    currency: cart.currency || 'EUR',
    value: value,
    coupon: coupon || '',
    items: items
  });

  // Alternative dataLayer (GTM)
  /*
  dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: cart.currency || 'EUR',
      value: value,
      coupon: coupon || '',
      items: items
    }
  });
  */
}

// Exemple d'appel sur clic "Commander" / page checkout étape 1 :
// trackBeginCheckout({
//   currency: 'EUR',
//   subtotal: 349.99,
//   items: [{
//     item_id: 'SKU_12345',
//     item_name: 'Sony WH-1000XM5',
//     price: 349.99,
//     quantity: 1,
//     item_category: 'Audio',
//     item_category2: 'Casques',
//     item_brand: 'Sony',
//     item_variant: 'Noir'
//   }]
// }, 'WELCOME10'); // coupon optionnel


// ============================================
// 4. PURCHASE - Confirmation commande (OBLIGATOIRE)
// ============================================
function trackPurchase(order) {
  const items = order.items.map(item => ({
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.item_category,
    item_category2: item.item_category2,
    item_category3: item.item_category3,
    item_brand: item.item_brand,
    item_variant: item.item_variant
  }));

  gtag('event', 'purchase', {
    transaction_id: order.transaction_id,      // REQUIS: ID unique commande
    currency: order.currency || 'EUR',         // REQUIS: ISO 4217
    value: order.value,                        // REQUIS: Total TTC (produits + shipping + tax)
    items: items,                              // REQUIS: Array d'articles
    shipping: order.shipping || 0,             // Requis pour rapports livraison
    tax: order.tax || 0,                       // Requis pour rapports TVA
    coupon: order.coupon || '',                // Optionnel
    payment_type: order.payment_type,          // Optionnel: 'credit_card', 'paypal', 'apple_pay'...
    shipping_tier: order.shipping_tier         // Optionnel: 'standard', 'express', 'pickup'
  });

  // Alternative dataLayer (GTM)
  /*
  dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.transaction_id,
      currency: order.currency || 'EUR',
      value: order.value,
      items: items,
      shipping: order.shipping || 0,
      tax: order.tax || 0,
      coupon: order.coupon || '',
      payment_type: order.payment_type,
      shipping_tier: order.shipping_tier
    }
  });
  */
}

// Exemple d'appel sur page confirmation commande :
// trackPurchase({
//   transaction_id: 'ORD_20250722_00123',
//   currency: 'EUR',
//   value: 359.98,                    // 349.99 + 9.99 shipping + 0 tax
//   shipping: 9.99,
//   tax: 0,
//   coupon: 'WELCOME10',
//   payment_type: 'credit_card',
//   shipping_tier: 'express',
//   items: [{
//     item_id: 'SKU_12345',
//     item_name: 'Sony WH-1000XM5',
//     price: 349.99,
//     quantity: 1,
//     item_category: 'Audio',
//     item_category2: 'Casques',
//     item_brand: 'Sony',
//     item_variant: 'Noir'
//   }]
// });


// ============================================
// HELPER: Initialisation gtag (si pas déjà fait)
// ============================================
// window.dataLayer = window.dataLayer || [];
// function gtag(){dataLayer.push(arguments);}
// gtag('js', new Date());
// gtag('config', 'G-XXXXXXXXXX', {
//   send_page_view: true,
//   currency: 'EUR'  // Définit la devise par défaut
// });


// ============================================
// HELPER: Debug - Voir les events dans console
// ============================================
// gtag('set', 'debug_mode', true); // Active DebugView GA4 en temps réel