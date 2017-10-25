import { HexCoord } from '../../engine/utils/hex-coord.js';
import { HexGrid } from '../../engine/utils/hex-grid.js';

/**
 * Some of the scale computations are magic number-y right now because
 * I did the vertical scaling wrong somewhere. For now, the magic number
 * stuff is living in this special subclass ~ cdata@
 */
export class MagicHexGrid extends HexGrid {
  constructor(width, height, cellSize) {
    super(width, height, cellSize);

    this.pixelWidth = this.width * this.cellSize * 0.75 +
        0.25 * this.cellSize;
    this.pixelHeight = this.height * this.cellSize * 0.75 +
        0.5 * this.cellSize;
  }

  // UV conversions
  uvToPixel(uv, pixel = new HexCoord()) {
    const { x, y } = uv;

    pixel.x = (x * 0.999 - 0.5 / this.width)
        * this.pixelWidth;

    pixel.y = (y * 1.155 - 0.5 / this.height)
        * this.pixelHeight;

    return pixel;
  }

  uvToIndex(uv) {
    return this.pixelToIndex(this.uvToPixel(uv, HexGrid.intermediateHexCoord));
  }

  // Index conversions
  indexToPixel(index, pixel = new HexCoord()) {
    const offset = this.indexToOffset(index, pixel);
    pixel.multiplyScalar(this.cellSize);
    return pixel;
  }

  indexToOffset(index, offset = new HexCoord()) {
    return this.cubeToOffset(this.indexToCube(index, offset), offset);
  }

  cubeToOffset(cube, offset = new HexCoord()) {
    const scaleX = 0.5;
    const scaleY = 0.4325; // Warning: here be magic
    const { x, z } = cube;

    offset.x = 0.5 + 1.5 * x * scaleX;
    offset.y = 0.5 + (HexGrid.SQRT_THREE / 2 * x + HexGrid.SQRT_THREE * z) * scaleY;
    offset.z = 0;

    return offset;
  }
};
