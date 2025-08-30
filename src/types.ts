export interface Point {
  id: string;
  title: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cover: string;
  timestamp: any; // Firestore Timestamp
  url?: string;
}
