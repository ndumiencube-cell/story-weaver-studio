import { Link } from "react-router-dom";
import { Headphones, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-brown text-cream">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <Headphones className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                Izwi<span className="text-gold">Lami</span>
              </span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed">
              Bringing the rich tradition of African storytelling to life through 
              audio. Listen to stories in isiZulu, created by African authors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/library" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Browse Library
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  New Releases
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* For Authors */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For Authors</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/author" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Author Dashboard
                </Link>
              </li>
              <li>
                <Link to="/author" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Upload Audiobook
                </Link>
              </li>
              <li>
                <Link to="/author" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Generate Covers
                </Link>
              </li>
              <li>
                <Link to="/author" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Earnings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-gold transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/50 text-sm">
            © 2024 IzwiLami. All rights reserved. Celebrating African voices.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-cream/50 hover:text-gold transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-cream/50 hover:text-gold transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-cream/50 hover:text-gold transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-cream/50 hover:text-gold transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
