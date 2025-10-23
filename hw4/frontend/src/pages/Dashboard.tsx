import { useState, useEffect } from 'react';
import { listingsService } from '@/services/listings.service';
import { Listing } from '@/types';

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await listingsService.getAllListings();
      setListings(data.listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Rental Listings Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{listing.address}</p>
            <p className="text-2xl font-bold text-primary">${listing.price}/month</p>
            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
              <span>{listing.bedrooms} beds</span>
              <span>{listing.bathrooms} baths</span>
              <span>{listing.area_sqft} sq ft</span>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No listings available yet.</p>
        </div>
      )}
    </div>
  );
}

