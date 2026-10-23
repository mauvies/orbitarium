import type { Vec2 } from "./types";

export const ZERO: Vec2 = { x: 0, y: 0 };

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(vector: Vec2, factor: number): Vec2 {
  return { x: vector.x * factor, y: vector.y * factor };
}

export function lengthSquared(vector: Vec2): number {
  return vector.x * vector.x + vector.y * vector.y;
}

export function isFiniteVec(vector: Vec2): boolean {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y);
}
