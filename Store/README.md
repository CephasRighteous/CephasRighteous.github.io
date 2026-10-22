# CRighteous Store — Zambia

A responsive static storefront for clothing and phone accessories. Designed for GitHub Pages with WhatsApp order submission.

## Files

- `index.html` — storefront, cart drawer and checkout form
- `styles.css` — responsive dark purple styling
- `products.js` — **edit this file first** to change the WhatsApp number and products
- `script.js` — filtering, cart, and WhatsApp order creation

## 1. Set your WhatsApp number

Open `products.js` and change:

```js
whatsappNumber: "26097XXXXXXX",
```

to your actual WhatsApp number in international format, digits only. For example, a Zambian number is generally written starting with `260`, followed by the number without its leading `0`. Do not publish until you replace the placeholder.

## 2. Edit your products

In `products.js`, edit the entries in `window.STORE_PRODUCTS`.

- `id`: unique identifier; keep it unique
- `name`: product name
- `category`: use `Clothing` or `Phone accessories`
- `price`: price in Zambian kwacha as a number, e.g. `180`
- `badge`: short label, or an empty string
- `description`: short product description
- `image`: full public HTTPS URL to an image you own or have permission to use; leave empty for the built-in CR placeholder
- `options`: sizes, colours, phone models or connector details

The sample products and prices are examples only. Replace them with your real stock, accurate prices and real product photos. For each phone case or protector, ask for the exact phone model.

## 3. Publish on your existing GitHub Pages site

1. Back up or download your existing website repository first.
2. Upload `index.html`, `styles.css`, `products.js`, and `script.js` to the root of the repository that publishes `https://cephasrighteous.github.io`.
3. If your existing root already has an `index.html`, replace it only if you want this storefront to become the homepage. Otherwise, put these files in a subfolder such as `store/` and update links accordingly.
4. Commit the changes. Wait for GitHub Pages to deploy, then open your website and test on both phone and computer.
5. Test an order with a low-value/sample item before sharing the link.

## 4. Payments and orders

This starter version does **not** take online payments or verify mobile-money payments. Customers select a preferred payment method and send the order to WhatsApp. Confirm availability, delivery fees and the final amount before giving payment instructions. Never ask customers to send their mobile-money PIN or one-time password.

For automatic payments, use a payment provider that explicitly supports Zambia and your account type. Transaction fees and merchant verification may apply.

## 5. Important limitations

- Cart contents are stored in the visitor's browser, not in a central database.
- Orders are not stored on your website; the customer must actually press Send in WhatsApp.
- There is no admin panel. Product edits are made in `products.js` and then republished.
- Use only product images you own or have permission to use.
- GitHub Pages is static hosting; do not put private keys, payment secrets or customer records in public repository files.
