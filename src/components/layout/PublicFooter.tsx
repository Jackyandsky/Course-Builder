import Link from 'next/link';

export default function PublicFooter() {

  return (
    <footer className="bg-[#f5f5f7] py-10 px-5 mt-[30px] text-[11px] text-[#6e6e73]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Courses */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Courses</h4>
            <ul className="space-y-2">
              <li><Link href="/courses?category=reading-writing" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Reading & Writing</Link></li>
              <li><Link href="/courses?category=close-reading" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Close Reading</Link></li>
              <li><Link href="/courses?category=systematic-writing" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Systematic Writing</Link></li>
              <li><Link href="/courses?category=test-preparation" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Test Preparation</Link></li>
              <li><Link href="/courses?category=literature-analysis" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Literature Analysis</Link></li>
              <li><Link href="/courses?category=creative-writing" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Creative Writing</Link></li>
              <li><Link href="/courses?category=advanced-reading" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Advanced Reading</Link></li>
            </ul>
          </div>

          {/* Library */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Library</h4>
            <ul className="space-y-2">
              <li><Link href="/library?type=virtual" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Virtual Library</Link></li>
              <li><Link href="/library?type=physical" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Physical Library</Link></li>
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

          {/* Bookings */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Bookings</h4>
            <ul className="space-y-2">
              <li><Link href="/booking/diagnosis" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Diagnostic Assessment</Link></li>
              <li><Link href="/booking/progress-review" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Progress Review</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[#1d1d1f] font-medium text-[13px] mb-3">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/support/faq" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Q&A</Link></li>
              <li><Link href="/support/achievement" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">Achievement</Link></li>
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