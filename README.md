<div align="center">
<img width="1200" height="475" alt="Tajer Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Tajer — Firebase E-Commerce Platform

**A flexible, feature-rich e-commerce app built with React, TypeScript, and Firebase.**

</div>

---

## ✨ Features

### 🎨 UI & Pages
- Custom, themeable UI components with Tailwind CSS
- Multi-variant display for product cards and category cards — suitable for food delivery, fashion, electronics, and more
- Visual page builder powered by **[Puck Editor](https://puckeditor.com/)** for pages like Shop, About, FAQ, Policy, and any custom page

### 📦 Products & Categories
- **Custom product containers** with flexible filtering — fixed filters or dynamic via search params
- Multiple display modes: **Carousel**, **Grid**, and **Infinite List**
- Infinite list with **virtual list** support (via react-virtuoso) for large datasets
- Product types inspired by WooCommerce:
  - **Standard** — direct pay orders
  - **WhatsApp** — redirect customer to owner WhatsApp for direct orders
  - **Quote** — redirect customer to owner WhatsApp to request a quote
- Same flexible container and display options available for **category cards**

### 🔐 Authentication
- Firebase **Phone**, **Google**, and **Email/Password** authentication

### 💳 Payments
- Built-in **PayMob** payment gateway integration
- Extensible via **payment adapters** — add new providers with minimal effort

### ⚙️ App & Store Settings
- Customize splash screen, app title, colors, and branding
- Enable/disable **marketplace mode** to support multiple vendors

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Routing | React Router v6 |
| Backend / DB | Firebase (Firestore, Auth, Storage) |
| Page Builder | Puck Editor |
| Carousel | Embla Carousel |
| Virtual Lists | react-virtuoso |
| Animations | Motion |
| Maps | Leaflet / React Leaflet |
| Payments | PayMob (adapter-based) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- A [Firebase](https://firebase.google.com/) project with Firestore, Auth, and Storage enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/boyhax/tajer.git
   cd tajer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase credentials and any other required keys in `.env.local`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:** [http://localhost:5173](http://localhost:5173)

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run TypeScript type checks |
| `npm run clean` | Remove the `dist` folder |

---

## 🔥 Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore**, **Authentication** (Phone, Google, Email), and **Storage**.
3. Copy your Firebase config values into `.env.local`.
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.
