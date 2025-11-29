// A type for the constructor options to ensure they are passed correctly.
interface IPoissonDiskSamplingOptions {
  shape: [number, number];
  minDistance: number;
  tries?: number;
}

// A type alias for a 2D point for clarity.
type Point = [number, number];

/**
 * A custom implementation of the Poisson-Disk Sampling algorithm in TypeScript.
 * This generates points that are randomly placed but no closer to each other
 * than a specified minimum distance, resulting in a more natural, uniform distribution.
 */
export class PoissonDiskSampling {
  private width: number;
  private height: number;
  private minDist: number;
  private maxTries: number;
  private cellSize: number;
  private grid: (Point | null)[];
  private gridWidth: number;
  private gridHeight: number;
  private points: Point[] = [];
  private active: Point[] = [];

  constructor(options: IPoissonDiskSamplingOptions) {
    this.width = options.shape[0];
    this.height = options.shape[1];
    this.minDist = options.minDistance;
    this.maxTries = options.tries || 30;
    this.cellSize = this.minDist / Math.sqrt(2);
    this.gridWidth = Math.ceil(this.width / this.cellSize);
    this.gridHeight = Math.ceil(this.height / this.cellSize);
    this.grid = new Array(this.gridWidth * this.gridHeight).fill(null);
  }

  public fill(): Point[] {
    this.addPoint([Math.random() * this.width, Math.random() * this.height]);

    while (this.active.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.active.length);
      const currentPoint = this.active[randomIndex];
      let found = false;

      for (let i = 0; i < this.maxTries; i++) {
        const newPoint = this.generateRandomPointAround(currentPoint);
        if (this.isValid(newPoint)) {
          this.addPoint(newPoint);
          found = true;
        }
      }

      if (!found) {
        this.active.splice(randomIndex, 1);
      }
    }
    return this.points;
  }

  private addPoint(point: Point): void {
    this.points.push(point);
    this.active.push(point);
    const gridPos = this.pointToGridPos(point);
    this.grid[gridPos.x + gridPos.y * this.gridWidth] = point;
  }

  private generateRandomPointAround(center: Point): Point {
    const angle = Math.random() * 2 * Math.PI;
    const radius = this.minDist + Math.random() * this.minDist;
    const newX = center[0] + radius * Math.cos(angle);
    const newY = center[1] + radius * Math.sin(angle);
    return [newX, newY];
  }

  private isValid(point: Point): boolean {
    const [x, y] = point;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    const gridPos = this.pointToGridPos(point);
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const neighborGridX = gridPos.x + i;
        const neighborGridY = gridPos.y + j;

        if (
          neighborGridX >= 0 &&
          neighborGridX < this.gridWidth &&
          neighborGridY >= 0 &&
          neighborGridY < this.gridHeight
        ) {
          const neighbor = this.grid[neighborGridX + neighborGridY * this.gridWidth];
          if (neighbor) {
            const dist = Math.sqrt(
              (neighbor[0] - x) ** 2 + (neighbor[1] - y) ** 2
            );
            if (dist < this.minDist) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  private pointToGridPos(point: Point): { x: number; y: number } {
    return {
      x: Math.floor(point[0] / this.cellSize),
      y: Math.floor(point[1] / this.cellSize),
    };
  }
}