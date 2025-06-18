// components/GridBackground.js
import React from 'react';

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 20;

const GridBackground = ({ visible }:{visible:boolean}) => {
  if (!visible) return null;

  const lines = [];
  
  // 세로 격자 선
  for (let i = 0; i <= STAGE_WIDTH / GRID_SIZE; i++) {
    lines.push(
      <line
        key={`v${i}`}
        x1={i * GRID_SIZE}
        y1={0}
        x2={i * GRID_SIZE}
        y2={STAGE_HEIGHT}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }
  
  // 가로 격자 선
  for (let i = 0; i <= STAGE_HEIGHT / GRID_SIZE; i++) {
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={i * GRID_SIZE}
        x2={STAGE_WIDTH}
        y2={i * GRID_SIZE}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        pointerEvents: 'none',
      }}
    >
      {lines}
    </svg>
  );
};

export default GridBackground;