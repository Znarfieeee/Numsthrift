# ThriftShop - E-commerce Platform for Pre-Loved Items

A comprehensive React-based thrift shop platform with role-based authentication and full CRUD functionality, powered by Supabase.

## Features

### Authentication & User Roles
- **Buyers**: Browse products, add to cart, manage shopping cart
- **Sellers**: Create and manage product listings, track inventory
- **Admins**: Full platform management, user management, product oversight

### Core Functionality
- User authentication (signup/login) with role selection
- Product browsing with search and filters
- Shopping cart management (add, update quantity, remove items)
- Seller dashboard for product CRUD operations
- Admin dashboard for platform management
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Database Schema

### Tables

#### profiles
- Extended user information with roles (admin, seller, buyer)
- Linked to Supabase Auth users
- Stores full name, email, role, contact info

#### categories
- Product categories (Clothing, Accessories, Books, etc.)
- Pre-seeded with 10 common categories

#### products
- Product listings with details
- Links to sellers and categories
- Supports multiple images, conditions, status tracking
- Includes price, quantity, brand, size

#### cart_items
- Shopping cart functionality
- Links users to products with quantities
- Unique constraint per user-product combination

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5174 in your browser

## Application Structure

```
src/
├── components/
│   ├── Navbar.jsx           # Navigation bar with auth state
│   └── ProtectedRoute.jsx   # Route protection wrapper
├── contexts/
│   └── AuthContext.jsx      # Authentication context & hooks
├── pages/
│   ├── Landing.jsx          # Landing page
│   ├── Login.jsx            # Login page
│   ├── Signup.jsx           # Signup with role selection
│   ├── Shop.jsx             # Product browsing (all users)
│   ├── Cart.jsx             # Shopping cart (buyers)
│   ├── SellerDashboard.jsx  # Seller product management
│   └── AdminDashboard.jsx   # Admin panel
├── lib/
│   └── supabase.js          # Supabase client configuration
└── App.jsx                  # Main app with routing
```

## User Flows

### For Buyers
1. Sign up selecting "Buy items" role
2. Browse products on Shop page
3. Add items to cart
4. View and manage cart
5. (Checkout coming soon)

### For Sellers
1. Sign up selecting "Sell items" role
2. Access Seller Dashboard
3. Create product listings with details
4. Manage inventory (edit, delete, update status)
5. Track product views

### For Admins
1. Sign up and get admin role assigned
2. Access Admin Dashboard
3. View platform statistics
4. Manage all users and their roles
5. Manage all products across the platform

## Key Features Implemented

- ✅ Role-based authentication (admin, seller, buyer)
- ✅ Landing page with hero section and features
- ✅ Product browsing with search and filters
- ✅ Shopping cart with quantity management
- ✅ Seller product CRUD operations
- ✅ Admin dashboard with user/product management
- ✅ Responsive design
- ✅ Row Level Security (RLS) policies
- ✅ Real-time data synchronization

## Coming Soon

- 🔄 Checkout functionality
- 🔄 Payment processing
- 🔄 Order management
- 🔄 Product reviews and ratings
- 🔄 Image upload functionality
- 🔄 Advanced analytics dashboard

## Supabase Configuration

The database includes:
- Row Level Security (RLS) enabled on all tables
- Policies for role-based access control
- Automatic profile creation on user signup
- Triggers for timestamp management

## Security

- All sensitive operations protected by RLS policies
- Authentication required for cart and dashboard access
- Role-based route protection
- SQL injection prevention via Supabase client

## Development Notes

- Uses Vite for fast development and hot reload
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Supabase for backend-as-a-service

## Contributing

This is a school project. Feel free to fork and extend!

## License

MIT

---

Built with ❤️ using React and Supabase
