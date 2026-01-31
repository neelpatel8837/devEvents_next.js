import mongoose, { Schema, Document } from 'mongoose';
import { Event } from './event.model';

// Booking interface for TypeScript typing
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema with validation and indexes
const bookingSchema = new Schema<IBooking>({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
    index: true // Add index for faster queries
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address'
    }
  }
}, {
  timestamps: true // Enable automatic createdAt and updatedAt
});

// Pre-save hook to validate that the referenced event exists
bookingSchema.pre('save', async function(this: IBooking, next: any) {
  const booking = this;
  
  // Skip validation if eventId is not modified
  if (!booking.isModified('eventId')) {
    return next();
  }
  
  try {
    // Verify that the referenced event exists
    const event = await Event.findById(booking.eventId);
    if (!event) {
      throw new Error(`Event with ID ${booking.eventId} does not exist`);
    }
    
    next();
  } catch (error) {
    throw new Error('Error validating event reference');
  }
});

// Create and export the Booking model
export const Booking =
  mongoose.models.Booking ||
  mongoose.model<IBooking>('Booking', bookingSchema);