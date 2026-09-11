export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates a clean 90-degree orthogonal (stepped) path between two card rectangles
 */
export function calculateConnectionPath(
  fromRect: Rect,
  toRect: Rect
): { path: string; startPoint: Point; endPoint: Point; angle: number } {
  const isSameColumn = Math.abs(fromRect.x - toRect.x) < 40;

  let start: Point;
  let end: Point;
  let path = '';
  let angle = 0;

  if (isSameColumn) {
    // Vertical flow within the same day column
    if (fromRect.y <= toRect.y) {
      // Top to bottom
      start = {
        x: Math.round(fromRect.x + fromRect.width / 2),
        y: Math.round(fromRect.y + fromRect.height),
      };
      end = {
        x: Math.round(toRect.x + toRect.width / 2),
        y: Math.round(toRect.y),
      };

      if (Math.abs(start.x - end.x) < 4) {
        path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else {
        const midY = Math.round((start.y + end.y) / 2);
        path = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
      }
      angle = 90; // pointing down
    } else {
      // Bottom to top (loopback)
      start = {
        x: Math.round(fromRect.x + fromRect.width / 2),
        y: Math.round(fromRect.y),
      };
      end = {
        x: Math.round(toRect.x + toRect.width / 2),
        y: Math.round(toRect.y + toRect.height),
      };
      const midY = Math.round((start.y + end.y) / 2);
      path = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
      angle = -90; // pointing up
    }
  } else {
    // Horizontal flow across days
    if (fromRect.x <= toRect.x) {
      // Standard Left-to-Right workflow (e.g. Lunes -> Martes -> Miércoles)
      start = {
        x: Math.round(fromRect.x + fromRect.width),
        y: Math.round(fromRect.y + fromRect.height / 2),
      };
      end = {
        x: Math.round(toRect.x),
        y: Math.round(toRect.y + toRect.height / 2),
      };

      const midX = Math.round((start.x + end.x) / 2);
      // 90-degree Orthogonal Step-Line:
      // 1. Horizontal from start.x to midX
      // 2. Turn 90° vertical from start.y to end.y
      // 3. Turn 90° horizontal from midX to end.x
      path = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
      angle = 0; // pointing right
    } else {
      // Right-to-Left backward flow (loopback)
      start = {
        x: Math.round(fromRect.x),
        y: Math.round(fromRect.y + fromRect.height / 2),
      };
      end = {
        x: Math.round(toRect.x + toRect.width),
        y: Math.round(toRect.y + toRect.height / 2),
      };

      const bypassY = Math.round(Math.max(fromRect.y + fromRect.height, toRect.y + toRect.height) + 24);
      path = `M ${start.x} ${start.y} L ${start.x - 20} ${start.y} L ${start.x - 20} ${bypassY} L ${end.x + 20} ${bypassY} L ${end.x + 20} ${end.y} L ${end.x} ${end.y}`;
      angle = 180; // pointing left
    }
  }

  return { path, startPoint: start, endPoint: end, angle };
}
