// components/KonvaCanvas.js
import React, { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Text, Transformer } from 'react-konva';

// 상수들
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 33320;
const BOUNDARY_PADDING = GRID_SIZE;

// 테이블 컴포넌트
const TableShape = ({ 
  table, 
  isSelected, 
  onSelect, 
  onChange,
  onDelete 
}) => {
  const groupRef = useRef();
  const shapeRef = useRef();
  const textRef = useRef();
  const trRef = useRef();

  // 격자에 맞춰 좌표 정렬 헬퍼 함수
  const snapToGrid = useCallback((value) => Math.round(value / GRID_SIZE) * GRID_SIZE, []);

  // 선택된 테이블에 Transformer 연결 및 업데이트
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, table.width, table.height]); 

  // 크기 조정 종료 시 호출
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return; 

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 새로운 크기 계산 (최소 GRID_SIZE를 유지하며 격자에 스냅)
    let newWidth = Math.max(GRID_SIZE, snapToGrid(table.width * scaleX));
    let newHeight = Math.max(GRID_SIZE, snapToGrid(table.height * scaleY));
    
    // 새로운 위치 계산
    let newX = snapToGrid(node.x());
    let newY = snapToGrid(node.y());

    // 캔버스 경계를 벗어나지 않도록 위치 조정 (BOUNDARY_PADDING 적용)
    if (newX + newWidth > STAGE_WIDTH - BOUNDARY_PADDING) {
        newWidth = STAGE_WIDTH - BOUNDARY_PADDING - newX;
        newWidth = snapToGrid(Math.max(GRID_SIZE, newWidth));
    }
    if (newY + newHeight > STAGE_HEIGHT - BOUNDARY_PADDING) {
        newHeight = STAGE_HEIGHT - BOUNDARY_PADDING - newY;
        newHeight = snapToGrid(Math.max(GRID_SIZE, newHeight));
    }

    newX = snapToGrid(Math.max(0, newX));
    newY = snapToGrid(Math.max(0, newY));

    // 스케일 리셋
    node.scaleX(1);
    node.scaleY(1);
    
    // 내부 Rect와 Text 크기 업데이트
    if (shapeRef.current) {
      shapeRef.current.width(newWidth);
      shapeRef.current.height(newHeight);
    }
    if (textRef.current) {
      textRef.current.width(newWidth);
      textRef.current.height(newHeight);
    }

    // Transformer 강제 업데이트
    if (trRef.current) {
      trRef.current.forceUpdate();
      trRef.current.getLayer()?.batchDraw();
    }

    // 변경된 속성으로 테이블 상태 업데이트
    onChange({
      ...table,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [table, onChange, snapToGrid]);

  // 드래그 중 실시간으로 위치 제한 및 격자 스냅 적용
  const handleDragMove = useCallback((e) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    // 캔버스 경계 내로 제한
    newX = Math.max(0, Math.min(STAGE_WIDTH - table.width - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - table.height - BOUNDARY_PADDING, newY));

    // 격자에 맞춰 스냅
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    node.x(newX);
    node.y(newY);
  }, [table.width, table.height, snapToGrid]);

  // 드래그 종료 시 최종 위치를 React 상태에 반영
  const handleDragEnd = useCallback((e) => {
    const node = e.target;
    onChange({
      ...table,
      x: node.x(), 
      y: node.y(), 
      width: table.width,
      height: table.height,
    });
  }, [table, onChange]);

  return (
    <Group>
      <Group
        ref={groupRef}
        x={table.x}
        y={table.y}
        draggable
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={() => onSelect(table.id)}
        onTap={() => onSelect(table.id)}
      >
        <Rect
          ref={shapeRef}
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          fill={isSelected ? '#3b82f6' : '#f59e0b'}
          stroke={isSelected ? '#1d4ed8' : '#d97706'}
          strokeWidth={2}
          cornerRadius={4}
        />
        <Text
          ref={textRef}
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          text={table.name}
          fontSize={12}
          fontFamily="Arial"
          fill="white"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) {
              return oldBox;
            }

            let newX = newBox.x;
            let newY = newBox.y;
            let newWidth = newBox.width;
            let newHeight = newBox.height;

            if (newX + newWidth > STAGE_WIDTH - BOUNDARY_PADDING) {
                newWidth = STAGE_WIDTH - BOUNDARY_PADDING - newX;
            }
            if (newY + newHeight > STAGE_HEIGHT - BOUNDARY_PADDING) {
                newHeight = STAGE_HEIGHT - BOUNDARY_PADDING - newY;
            }

            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);

            newWidth = Math.max(GRID_SIZE, newWidth);
            newHeight = Math.max(GRID_SIZE, newHeight);

            return {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
            };
          }}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-right',
            'bottom-right', 'bottom-center', 'bottom-left',
            'middle-left',
          ]}
        />
      )}
    </Group>
  );
};

// 드로잉 테이블 컴포넌트 (그리기 중인 임시 테이블)
const DrawingTable = ({ drawingTable }) => {
  if (!drawingTable) return null;

  return (
    <Group>
      <Rect
        x={drawingTable.x}
        y={drawingTable.y}
        width={drawingTable.width}
        height={drawingTable.height}
        fill="#10b981"
        stroke="#059669"
        strokeWidth={2}
        dash={[5, 5]}
        cornerRadius={4}
        opacity={0.7}
        listening={false}
      />
      <Text
        x={drawingTable.x}
        y={drawingTable.y}
        width={drawingTable.width}
        height={drawingTable.height}
        text={drawingTable.name}
        fontSize={12}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};

// 메인 Konva 캔버스 컴포넌트
const KonvaCanvas = ({
  tables,
  selectedId,
  isDrawing,
  drawingTable,
  onStageMouseDown,
  onStageMouseMove,
  onStageMouseUp,
  onStageClick,
  onSelectTable,
  onUpdateTable,
  onDeleteTable,
  stageRef
}) => {
  return (
    <Stage
      ref={stageRef}
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      onMouseDown={onStageMouseDown}
      onMouseMove={onStageMouseMove}
      onMouseUp={onStageMouseUp}
      onClick={onStageClick}
      onTouchStart={onStageMouseDown}
      onTouchMove={onStageMouseMove}
      onTouchEnd={onStageMouseUp}
    >
      <Layer>
        {tables.map(table => (
          <TableShape
            key={table.id}
            table={table}
            isSelected={table.id === selectedId}
            onSelect={onSelectTable}
            onChange={onUpdateTable}
            onDelete={onDeleteTable}
          />
        ))}
        
        {/* 드래그 중인 임시 테이블 */}
        {isDrawing && <DrawingTable drawingTable={drawingTable} />}
      </Layer>
    </Stage>
  );
};

export default KonvaCanvas;