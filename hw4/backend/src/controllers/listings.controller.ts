import { Response } from 'express';
import { ListingModel } from '../models/Listing';
import { AuthRequest } from '../middleware/auth.middleware';
import { ListingFilters } from '../types';

export function getAllListings(req: AuthRequest, res: Response): void {
  try {
    // 處理 amenities 參數
    let amenities: string[] | undefined;
    if (req.query.amenities) {
      if (Array.isArray(req.query.amenities)) {
        amenities = req.query.amenities as string[];
      } else {
        amenities = [req.query.amenities as string];
      }
    }

    const filters: ListingFilters = {
      search: req.query.search as string,
      distance: req.query.distance ? parseFloat(req.query.distance as string) : undefined,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      propertyType: req.query.propertyType as string,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      status: req.query.status as string,
      amenities,
    };

    const listings = ListingModel.findAll(filters);

    res.status(200).json({
      listings,
      total: listings.length
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to retrieve listings' });
  }
}

export function getListingById(req: AuthRequest, res: Response): void {
  try {
    const listingId = parseInt(req.params.id);
    const listing = ListingModel.findByIdWithUser(listingId);

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.status(200).json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to retrieve listing' });
  }
}

export function createListing(req: AuthRequest, res: Response): void {
  try {
    console.log('Create listing request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?.userId);
    
    const userId = req.user?.userId;
    if (!userId) {
      console.log('No user ID found in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const listingData = {
      title: req.body.title,
      description: req.body.description || '',
      address: req.body.address,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      price: parseFloat(req.body.price),
      bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : 0,
      bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : 0,
      area_sqft: req.body.area_sqft ? parseInt(req.body.area_sqft) : 0,
      property_type: req.body.property_type || 'other',
      status: (req.body.status as 'available' | 'rented' | 'pending') || 'available',
      floor: req.body.floor ? parseInt(req.body.floor) : undefined,
      contact_phone: req.body.contact_phone || undefined,
      management_fee: req.body.management_fee ? parseFloat(req.body.management_fee) : undefined,
      amenities: req.body.amenities ? JSON.stringify(req.body.amenities) : undefined,
    };

    console.log('Processed listing data:', JSON.stringify(listingData, null, 2));

    const listing = ListingModel.create(userId, listingData);

    console.log('Listing created successfully:', listing.id);
    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Failed to create listing', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export function updateListing(req: AuthRequest, res: Response): void {
  try {
    const listingId = parseInt(req.params.id);
    const updateData: any = {};

    // Only include provided fields
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.latitude !== undefined) updateData.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude !== undefined) updateData.longitude = parseFloat(req.body.longitude);
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.bedrooms !== undefined) updateData.bedrooms = parseInt(req.body.bedrooms);
    if (req.body.bathrooms !== undefined) updateData.bathrooms = parseInt(req.body.bathrooms);
    if (req.body.area_sqft !== undefined) updateData.area_sqft = parseInt(req.body.area_sqft);
    if (req.body.property_type !== undefined) updateData.property_type = req.body.property_type;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.floor !== undefined) updateData.floor = req.body.floor ? parseInt(req.body.floor) : undefined;
    if (req.body.contact_phone !== undefined) updateData.contact_phone = req.body.contact_phone;
    if (req.body.management_fee !== undefined) updateData.management_fee = req.body.management_fee ? parseFloat(req.body.management_fee) : undefined;
    if (req.body.amenities !== undefined) updateData.amenities = JSON.stringify(req.body.amenities);

    const success = ListingModel.update(listingId, updateData);

    if (!success) {
      res.status(404).json({ error: 'Listing not found or no changes made' });
      return;
    }

    const updatedListing = ListingModel.findById(listingId);

    res.status(200).json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
}

export function deleteListing(req: AuthRequest, res: Response): void {
  try {
    const listingId = parseInt(req.params.id);
    const success = ListingModel.delete(listingId);

    if (!success) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
}

export function getUserListings(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const listings = ListingModel.findByUserId(userId);

    res.status(200).json({
      listings,
      total: listings.length
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Failed to retrieve user listings' });
  }
}

