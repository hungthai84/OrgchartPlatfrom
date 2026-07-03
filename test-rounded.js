function getRoundedPath(c, settings) {
  const dx = c.to.x - c.from.x;
  const dy = c.to.y - c.from.y;
  const r = Math.min(10, Math.abs(dx) / 2, Math.abs(dy) / 2);
  const dirX = dx > 0 ? 1 : -1;
  const dirY = dy > 0 ? 1 : -1;
  
  if (r === 0) {
    if (settings.layoutDirection === 'TB') {
      const midY = c.from.y + dy * 0.5;
      return `M ${c.from.x} ${c.from.y} L ${c.from.x} ${midY} L ${c.to.x} ${midY} L ${c.to.x} ${c.to.y}`;
    } else {
      const midX = c.from.x + dx * 0.5;
      return `M ${c.from.x} ${c.from.y} L ${midX} ${c.from.y} L ${midX} ${c.to.y} L ${c.to.x} ${c.to.y}`;
    }
  }

  if (settings.layoutDirection === 'TB') {
    const midY = c.from.y + dy * 0.5;
    return `M ${c.from.x} ${c.from.y} L ${c.from.x} ${midY - r * dirY} Q ${c.from.x} ${midY} ${c.from.x + r * dirX} ${midY} L ${c.to.x - r * dirX} ${midY} Q ${c.to.x} ${midY} ${c.to.x} ${midY + r * dirY} L ${c.to.x} ${c.to.y}`;
  } else {
    const midX = c.from.x + dx * 0.5;
    return `M ${c.from.x} ${c.from.y} L ${midX - r * dirX} ${c.from.y} Q ${midX} ${c.from.y} ${midX} ${c.from.y + r * dirY} L ${midX} ${c.to.y - r * dirY} Q ${midX} ${c.to.y} ${midX + r * dirX} ${c.to.y} L ${c.to.x} ${c.to.y}`;
  }
}
