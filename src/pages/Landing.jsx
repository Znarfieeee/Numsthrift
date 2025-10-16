import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Heart,
  TrendingUp,
  Shield,
  Sparkles,
  Tag,
  Users,
  Phone,
  Mail,
  Facebook,
  Instagram,
} from 'lucide-react'

import HERO from '@/assets/hero.jpg'
import COMMUNITY from '@/assets/community.jpg'

export const Landing = () => {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-hero)' }}>
        <div className="bg-grid-slate-100 absolute inset-0 -z-10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="items-center lg:grid lg:grid-cols-12 lg:gap-8">
                <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
                  <div className="mb-4 flex items-center gap-2 sm:justify-center lg:justify-start">
                    <Sparkles className="text-primary h-6 w-6" />
                    <span className="text-secondary font-semibold">
                      Sustainable Fashion Marketplace
                    </span>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Discover Unique</span>
                    <span className="text-accent block">Pre-Loved Treasures</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-600 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                    Welcome to{' '}
                    <span className="font-bold" style={{ color: 'var(--accent-light)' }}>
                      Numsthrift
                    </span>{' '}
                    - where style meets sustainability. Buy and sell pre-loved items with ease, and
                    join our community of conscious consumers.
                  </p>
                  <div className="mt-5 gap-3 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow-lg">
                      <Link
                        to="/shop"
                        className="bg-primary text-primary-foreground hover:bg-primary-hover flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium transition-all duration-200 md:px-10 md:py-4 md:text-lg"
                      >
                        Start Shopping
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <Link
                        to="/signup"
                        className="border-accent hover:bg-bg-card-purple flex w-full items-center justify-center rounded-md border-2 bg-white px-8 py-3 text-base font-medium transition-all duration-200 md:px-10 md:py-4 md:text-lg"
                        style={{ color: 'var(--accent-light)' }}
                      >
                        Join Now
                      </Link>
                    </div>
                  </div>
                  {/* <div className="mt-8 flex items-center gap-8 text-sm sm:justify-center lg:justify-start">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-pastel-pink-light"></div>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-secondary"></div>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-primary"></div>
                      </div>
                      <span className="text-gray-600 font-medium">1000+ Happy Thrifters</span>
                    </div>
                  </div> */}
                </div>
                <div className="relative mt-12 lg:col-span-6 lg:mt-0">
                  <div className="relative mx-auto w-full rounded-lg shadow-2xl lg:max-w-md">
                    <div className="relative block aspect-square w-full overflow-hidden rounded-lg">
                      <img
                        src={HERO}
                        alt="numsthrift hero"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-accent text-3xl font-extrabold sm:text-4xl">
              Why Choose Numsthrift?
            </h2>
            <p className="mt-4 text-xl text-gray-600">The best platform for sustainable shopping</p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-bg-card-pink flex flex-col items-center rounded-xl p-6 transition-shadow hover:shadow-lg">
                <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">Easy Shopping</h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Browse thousands of pre-loved items with our intuitive interface
                </p>
              </div>

              <div className="bg-bg-card-purple flex flex-col items-center rounded-xl p-6 transition-shadow hover:shadow-lg">
                <div className="bg-secondary flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg">
                  <Heart className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">Sustainable</h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Reduce waste and give items a second life
                </p>
              </div>

              <div className="bg-bg-card-pink flex flex-col items-center rounded-xl p-6 transition-shadow hover:shadow-lg">
                <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg">
                  <Tag className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">Sell Easily</h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  List your items in minutes and reach thousands of buyers
                </p>
              </div>

              <div className="bg-bg-card-purple flex flex-col items-center rounded-xl p-6 transition-shadow hover:shadow-lg">
                <div className="bg-secondary flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">Secure</h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Shop with confidence with our secure platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Hero Section */}
      <div className="py-16" style={{ backgroundColor: 'var(--bg-hero)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="items-center lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="relative h-64 overflow-hidden rounded-2xl shadow-2xl sm:h-80 lg:h-96">
              <img
                src={COMMUNITY}
                alt="numsthrift community"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-8 lg:mt-0">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Join Our Growing <span className="text-accent">Community</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Connect with like-minded thrifters, discover unique styles, and make sustainable
                choices together. Every purchase makes a difference.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700">Verified sellers with quality products</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-secondary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700">Secure transactions and buyer protection</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700">Easy listing process for sellers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block" style={{ color: 'var(--bg-card-pink)' }}>
              Join Numsthrift community today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow-xl">
              <Link
                to="/signup"
                className="hover:bg-bg-card-pink inline-flex items-center justify-center rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium transition-all duration-200"
                style={{ color: 'var(--accent-light)' }}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Need Assistance Section */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">NEED ASSISTANCE?</h3>
              <div className="space-y-2">
                <a
                  href="tel:032-3497959"
                  className="hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>032-3526078</span>
                </a>
                <a
                  href="tel:09636415211"
                  className="hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>09321234567</span>
                </a>
                <a
                  href="mailto:support@numsthrift.com"
                  className="hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>support@numsthrift.com</span>
                </a>
              </div>
            </div>

            {/* Terms & Conditions Section */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">TERMS & CONDITIONS</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-primary transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund" className="hover:text-primary transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:text-primary transition-colors">
                    Accessibility Statement
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Connected Section */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">STAY CONNECTED</h3>
              <div className="flex gap-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 by Numsthrift. Powered and secured by Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
