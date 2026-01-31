import mongoose, { Schema, Document } from 'mongoose';

// Event interface for TypeScript typing
export interface IEvent extends Document {
  title: string;
  slug?: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Event schema with validation and indexes
const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [1, 'Description cannot be empty']
  },
  overview: {
    type: String,
    required: [true, 'Overview is required'],
    trim: true,
    minlength: [1, 'Overview cannot be empty']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true,
    minlength: [1, 'Image URL cannot be empty']
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
    minlength: [1, 'Venue cannot be empty']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [1, 'Location cannot be empty']
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true,
    minlength: [1, 'Date cannot be empty']
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    trim: true,
    minlength: [1, 'Time cannot be empty']
  },
  mode: {
    type: String,
    required: [true, 'Mode is required'],
    trim: true,
    minlength: [1, 'Mode cannot be empty']
  },
  audience: {
    type: String,
    required: [true, 'Audience is required'],
    trim: true,
    minlength: [1, 'Audience cannot be empty']
  },
  agenda: {
    type: [String],
    required: [true, 'Agenda is required'],
    validate: {
      validator: function(agenda: string[]) {
        return agenda.length > 0 && agenda.every(item => item.trim().length > 0);
      },
      message: 'Agenda must contain at least one non-empty item'
    }
  },
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true,
    minlength: [1, 'Organizer cannot be empty']
  },
  tags: {
    type: [String],
    required: [true, 'Tags are required'],
    validate: {
      validator: function(tags: string[]) {
        return tags.length > 0 && tags.every(tag => tag.trim().length > 0);
      },
      message: 'Tags must contain at least one non-empty item'
    }
  }
}, {
  timestamps: true // Enable automatic createdAt and updatedAt
});

// Add unique index to slug for faster queries

// Pre-save hook for slug generation and date/time normalization
eventSchema.pre<IEvent>('save', async function () {
  try {
    const event = this;

    // Generate slug
    if (event.isModified('title') || !event.slug) {
      event.slug = event.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const existingEvent = await mongoose.models.Event.findOne({
        slug: event.slug,
        _id: { $ne: event._id }
      });

      if (existingEvent) {
        let counter = 1;
        let uniqueSlug = `${event.slug}-${counter}`;

        while (
          await mongoose.models.Event.findOne({
            slug: uniqueSlug,
            _id: { $ne: event._id }
          })
        ) {
          counter++;
          uniqueSlug = `${event.slug}-${counter}`;
        }

        event.slug = uniqueSlug;
      }
    }

    // Normalize date
    if (event.isModified('date')) {
      const parsedDate = new Date(event.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      event.date = parsedDate.toISOString().split('T')[0];
    }

    // Normalize time
    if (event.isModified('time')) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(event.time)) {
        throw new Error('Time must be in HH:MM format');
      }
      const [h, m] = event.time.split(':');
      event.time = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }

  } catch (error) {
    throw error;
  }
});

// Create and export the Event model
export const Event =
  mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);
