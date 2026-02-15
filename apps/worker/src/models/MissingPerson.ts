import { Schema, model, Document } from 'mongoose';
import { MissingPersonStatus, Gender } from '@overwatch/shared';

/**
 * Reuse of MissingPerson model from shared schema
 * This allows worker to write validated data
 */
interface IMissingPerson extends Document {
  name: string;
  age: number;
  gender: string;
  lastSeenDate: Date;
  lastKnownLocation: string;
  geolocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: string;
  description?: string;
  photoUrl?: string;
  contactName?: string;
  contactPhone?: string;
  sourceURL: string;
  sourceState: string;
  dataHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const MissingPersonSchema = new Schema<IMissingPerson>(
  {
    name: { type: String, required: true, maxlength: 255 },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    lastSeenDate: { type: Date, required: true },
    lastKnownLocation: { type: String, required: true },
    geolocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: { type: [Number], required: true },
    },
    status: { 
      type: String, 
      enum: ['missing', 'found'], 
      default: 'missing' 
    },
    description: { type: String, maxlength: 1000 },
    photoUrl: String,
    contactName: { type: String, maxlength: 255 },
    contactPhone: String,
    sourceURL: { type: String, required: true },
    sourceState: { type: String, required: true },
    dataHash: { type: String, required: true, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'missing_persons' }
);

// Indexes
MissingPersonSchema.index({ 'geolocation.coordinates': '2dsphere' });
MissingPersonSchema.index({ status: 1, lastSeenDate: -1 });
MissingPersonSchema.index({ sourceState: 1 });
MissingPersonSchema.index({ dataHash: 1 }, { unique: true, sparse: true });

export const MissingPersonModel = model<IMissingPerson>(
  'MissingPerson',
  MissingPersonSchema
);

export type { IMissingPerson };
