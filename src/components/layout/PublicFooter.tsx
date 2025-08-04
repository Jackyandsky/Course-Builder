import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-[#f5f5f7] py-10 px-5 mt-[30px] text-[11px] text-[#6e6e73]">
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Courses */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Courses</h4>
            <ul className="space-y-2">
              <li><Link href="/admin/courses?category=reading-writing" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Reading & Writing</Link></li>
              <li><Link href="/admin/courses?category=close-reading" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Close Reading</Link></li>
              <li><Link href="/admin/courses?category=systematic-writing" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Systematic Writing</Link></li>
              <li><Link href="/admin/courses?category=test-prep" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Test Preparation</Link></li>
            </ul>
          </div>

          {/* Library */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Library</h4>
            <ul className="space-y-2">
              <li><Link href="/library?category=Virtual%20Library" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Virtual Library</Link></li>
              <li><Link href="/library?category=Physical%20Library" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Physical Library</Link></li>
              <li><Link href="/library" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Browse All Books</Link></li>
            </ul>
          </div>

          {/* Store */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Store</h4>
            <ul className="space-y-2">
              <li><Link href="/store?category=Decoders" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Decoders</Link></li>
              <li><Link href="/store?category=Complete%20Study%20Packages" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Study Packages</Link></li>
              <li><Link href="/store?category=Standardizers" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Standardizers</Link></li>
              <li><Link href="/store?category=LEX" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">LEX Vocabulary</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/booking/diagnosis" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Book Diagnosis</Link></li>
              <li><Link href="/booking/progress-review" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Progress Review</Link></li>
              <li><Link href="#about" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#d2d2d7] pt-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2.5">
            <p className="m-0 text-[11px] leading-[1.5] text-[#6e6e73]">
              Copyright © {new Date().getFullYear()} GRAMMATICOS PLATFORM SOLUTION. All rights reserved.
            </p>
            <p className="m-0 text-[11px] leading-[1.5]">
              <Link href="/privacy" className="text-[#6e6e73] no-underline hover:underline">Privacy Policy</Link>
              {' | '}
              <Link href="/terms" className="text-[#6e6e73] no-underline hover:underline">Terms of Use</Link>
              {' | '}
              <Link href="/sitemap" className="text-[#6e6e73] no-underline hover:underline">Sitemap</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}