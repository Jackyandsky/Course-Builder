export default function TestHeaderPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Header Test Page</h1>
        <p className="mb-4">This page tests the new Apple-inspired header design.</p>
        
        <div className="grid gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Header Features:</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Apple-style colors and backdrop blur</li>
              <li>Smooth dropdown animations (0.32s cubic-bezier)</li>
              <li>2-column dropdown layout</li>
              <li>Logo acts as home link (no separate Home menu)</li>
              <li>Small section titles, larger list items</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Try hovering over:</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Courses</strong> - See Popular Courses and Categories</li>
              <li><strong>Library</strong> - See Collections and Resources</li>
              <li><strong>Store</strong> - See Products and Special Offers</li>
              <li><strong>Booking</strong> - See Consultation types and Quick Links</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}