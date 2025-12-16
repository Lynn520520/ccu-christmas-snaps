export enum FrameStyle {
  SANTA = 'SANTA',         // Santa + Gift
  GINGERBREAD = 'GINGERBREAD', // Gingerbread + Candy House
  REINDEER = 'REINDEER'    // Reindeer + Tree
}

export interface PhotoData {
  id: string;
  dataUrl: string;
  frameStyle: FrameStyle;
  userName: string;
  timestamp: number;
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
}