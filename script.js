let cart = {};

const drugs = [];
document.addEventListener('DOMContentLoaded', function() {
    fetchShops();
    document.getElementById('shopsTab').addEventListener('click', () => switchTab('shops'));
    document.getElementById('cartTab').addEventListener('click', () => switchTab('cart'));
});

function switchTab(tab) {
    const shopsSection = document.getElementById('selection');
    const cartSection = document.getElementById('cart');
    if (tab === 'shops') {
        shopsSection.style.display = '';
        cartSection.style.display = 'none';
    } else {
        shopsSection.style.display = 'none';
        cartSection.style.display = '';
        updateCartUI();
    }
}


function addToCart(drugId) {
    drugId = Number(drugId);
    
    const drug = drugs.find(d => d.id === drugId);
      
    if (!drug) {
      console.error('Drug not found for ID:', drugId);
      return;
    }
  
    if (cart[drugId]) {
      cart[drugId].quantity += 1;
    } else {
      cart[drugId] = {...drug, quantity: 1};
    }
    
    updateCartUI();
}


function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = ''; 
  
    Object.entries(cart).forEach(([drugId, drug]) => {
      const drugElement = document.createElement('div');
      drugElement.className = 'cart-item';
      drugElement.innerHTML = `
      <div class="cart-item-image">
        <img src="${drug.imagelink}" alt="${drug.name}" style="width:150px; height:auto;">
      </div>
      <div class="cart-item-info">
        <p>${drug.name}</p>
        <p>Price per 1 item: $${drug.price}</p>
        <p>Total price: $${drug.price * drug.quantity}</p>
        <div>
            <button onclick="decrementQuantity(${drugId})">-</button>
            <span>Quantity: ${drug.quantity}</span>
            <button onclick="incrementQuantity(${drugId})">+</button>
        </div>
      </div>
    `;
      cartItemsContainer.appendChild(drugElement);
    });
}


function fetchShops() {
    fetch('https://eliftech-test-task-b9og.onrender.com/api/shops')
        .then(response => response.json())
        .then(data => {
            const shopsContainer = document.getElementById('shops');
            shopsContainer.innerHTML = '';
            data.forEach(shop => {
                const shopElement = document.createElement('div');
                shopElement.innerText = shop.name;
                shopElement.onclick = function() { fetchDrugs(shop.id); };
                shopsContainer.appendChild(shopElement);
            });
        });
}

function fetchDrugs(shopId) {
    let url = 'https://eliftech-test-task-b9og.onrender.com/api/drugs';
    if (shopId) {
        url += `?shopId=${shopId}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const drugsContainer = document.getElementById('drugs');
            drugsContainer.innerHTML = '';

            drugs.length = 0; 
            data.forEach(drug => {
                drugs.push(drug); 

                const drugElement = document.createElement('div');
                drugElement.className = 'drug';
                drugElement.innerHTML = `
                    <img src="${drug.imagelink}" alt="${drug.name}" style="width:100px; height:auto;">
                    <h3>${drug.name}</h3>
                    <p>Price: $${drug.price}</p>
                    <p>${drug.description}</p>
                    <div class="add-to-cart" onclick="addToCart('${drug.id}')">Add to Cart</div>
                `;
                drugsContainer.appendChild(drugElement);
            });
        });
}


function submitOrder() {
    const name = document.getElementById('customerName').value;
    const email = document.getElementById('customerEmail').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;
    
    const orderDetails = Object.entries(cart).map(([drugId, { quantity }]) => ({
        drugId: parseInt(drugId),
        quantity,
    }));

    fetch('https://eliftech-test-task-b9og.onrender.com/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, address, orderDetails }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Order submission response:', data);
        // You might want to clear the cart or show a success message here.
    })
    .catch(error => {
        console.error('Error submitting order:', error);
    });
}


function incrementQuantity(drugId) {
    if (cart[drugId]) {
        cart[drugId].quantity += 1;
        updateCartUI();
    }
}

function decrementQuantity(drugId) {
    if (cart[drugId] && cart[drugId].quantity > 1) {
        cart[drugId].quantity -= 1;
        updateCartUI();
    } else if (cart[drugId] && cart[drugId].quantity === 1) {
        delete cart[drugId]; 
        updateCartUI();
    }
}