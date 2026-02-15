import { Schema, model, Document } from 'mongoose';
import { MissingPersonStatus, Gender } from '@overwatch/shared';

/**
 * MongoDB Schema for Missing Person with GeoJSON 2dsphere index
 * Supports geographic queries for mapping display
 */
interface IMissingPerson extends Document {
  name: string;
  age: number;
  gender: Gender;
  lastSeenDate: Date;
  lastKnownLocation: string;
  geolocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: MissingPersonStatus;
  description?: string;
  photoUrl?: string;
  contactName?: string;
  contactPhone?: string;
  sourceURL: string;
  sourceState: string;
  dataHash: string; // SHA256 hash for deduplication
  createdAt: Date;
  updatedAt: Date;
}

const MissingPersonSchema = new Schema<IMissingPerson>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [255, 'Name cannot exceed 255 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age must be non-negative'],
      max: [150, 'Age must be realistic'],
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(Gender),
        message: `Gender must be one of: ${Object.values(Gender).join(', ')}`,
      },
      required: true,
    },
    lastSeenDate: {
      type: Date,
      required: [true, 'Last seen date is required'],
    },
    lastKnownLocation: {
      type: String,
      required: [true, 'Last known location is required'],
      trim: true,
    },
    geolocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function (v: number[]) {
            return (
              Array.isArray(v) &&
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message: 'Coordinates must be [longitude, latitude] within valid ranges',
        },
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MissingPersonStatus),
        message: `Status must be one of: ${Object.values(MissingPersonStatus).join(', ')}`,
      },
      required: true,
      default: MissingPersonStatus.MISSING,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    photoUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Photo URL must be a valid HTTP(S) URL',
      },
    },
    contactName: {
      type: String,
      maxlength: [255, 'Contact name cannot exceed 255 characters'],
      trim: true,
    },
    contactPhone: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[0-9+\-\s()]+$/.test(v);
        },
        message: 'Invalid phone number format',
      },
    },
    sourceURL: {
      type: String,
      required: [true, 'Source URL is required'],
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Source URL must be a valid HTTP(S) URL',
      },
    },
    sourceState: {
      type: String,
      required: [true, 'Source state is required'],
      trim: true,
    },
    dataHash: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      // SHA256 hash prevents duplicate entries from scraper
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    collection: 'missing_persons',
  }
);

/**
 * Indexes for optimal query performance
 */

// GeoJSON 2dsphere index for geographic queries (map display)
MissingPersonSchema.index({ 'geolocation.coordinates': '2dsphere' });

// Status and date range queries (common filtering)
MissingPersonSchema.index({ status: 1, lastSeenDate: -1 });

// State-based queries (state-wise filtering)
MissingPersonSchema.index({ sourceState: 1, status: 1 });

// Gender and age range queries
MissingPersonSchema.index({ gender: 1, age: 1, status: 1 });

// Deduplication check
MissingPersonSchema.index({ dataHash: 1 }, { unique: true, sparse: true });

// TTL index: automatically delete records after 5 years (optional archival)
// MissingPersonSchema.index({ createdAt: 1 }, { expireAfterSeconds: 157680000 });

export const MissingPersonModel = model<IMissingPerson>(
  'MissingPerson',
  MissingPersonSchema
);

export type { IMissingPerson };
