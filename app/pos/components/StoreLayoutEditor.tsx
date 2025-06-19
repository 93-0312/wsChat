'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Group } from 'react-konva';
import { Trash2, RotateCcw, Save, Grid, Table, Move, Square, Plus, Copy } from 'lucide-react';

// Konva 사용 시 필요한 설정 (상수로 정의)
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 10; // 격자 크기
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

  // 격자에 맞춰 좌표 정렬 헬퍼 함수 (단일 값용)
  const snapToGrid = useCallback((value) => Math.round(value / GRID_SIZE) * GRID_SIZE, []);

  // 선택된 테이블에 Transformer 연결 및 업데이트
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, table.width, table.height, groupRef, trRef]); 

  // 크기 조정 종료 시 호출
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return; 

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 새로운 크기 계산 (최소 GRID_SIZE를 유지하며 격자에 스냅)
    let newWidth = Math.max(GRID_SIZE, Math.round((table.width * scaleX) / GRID_SIZE) * GRID_SIZE);
    let newHeight = Math.max(GRID_SIZE, Math.round((table.height * scaleY) / GRID_SIZE) * GRID_SIZE);
    
    // 새로운 위치 계산
    let newX = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
    let newY = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;

    // 캔버스 경계를 벗어나지 않도록 위치 조정 (BOUNDARY_PADDING 적용)
    if (newX + newWidth > STAGE_WIDTH - BOUNDARY_PADDING) {
        newWidth = STAGE_WIDTH - BOUNDARY_PADDING - newX;
        newWidth = snapToGrid(Math.max(GRID_SIZE, newWidth));
    }
    if (newY + newHeight > STAGE_HEIGHT - BOUNDARY_PADDING) {
        newHeight = STAGE_HEIGHT - BOUNDARY_PADDING - newY;
        newHeight = Math.round(Math.max(GRID_SIZE, newHeight) / GRID_SIZE) * GRID_SIZE;
    }

    newX = Math.round(Math.max(0, newX) / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(Math.max(0, newY) / GRID_SIZE) * GRID_SIZE;

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

    if (trRef.current) {
      trRef.current.forceUpdate();
      trRef.current.getLayer().batchDraw();
    }

    onChange({
      ...table,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [table, onChange]);

  // 드래그 중 실시간으로 위치 제한 및 격자 스냅 적용
  const handleDragMove = useCallback((e) => {
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    newX = Math.max(0, Math.min(STAGE_WIDTH - table.width - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - table.height - BOUNDARY_PADDING, newY));

    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

    node.x(newX);
    node.y(newY);
  }, [table.width, table.height]);

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
            return newBox;
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

// 격자 배경 컴포넌트
const GridBackground = ({ visible }) => {
  if (!visible) return null;

  const lines = [];
  
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

// 메인 레이아웃 에디터 컴포넌트
const StoreLayoutEditor = () => {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingTable, setDrawingTable] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [mode, setMode] = useState('select');
  const stageRef = useRef();
  const canvasContainerRef = useRef(); // 캔버스 컨테이너 참조 추가

  // 격자에 맞춰 좌표 정렬 헬퍼 함수
  const snapToGrid = useCallback((x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  }), []);

  const snapValue = useCallback((value) => Math.round(value / GRID_SIZE) * GRID_SIZE, []);

  // 🔥 모바일 터치 스크롤 방지를 위한 useEffect 추가
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    // 터치 이벤트의 기본 동작(스크롤) 방지
    const preventTouchDefault = (e) => {
      // 그리기 모드이거나 테이블이 선택된 상태에서만 스크롤 방지
      if (mode === 'draw' || selectedId || isDrawing) {
        e.preventDefault();
      }
    };

    // 패시브 리스너를 false로 설정하여 preventDefault() 호출 가능하게 함
    canvasContainer.addEventListener('touchstart', preventTouchDefault, { passive: false });
    canvasContainer.addEventListener('touchmove', preventTouchDefault, { passive: false });
    canvasContainer.addEventListener('touchend', preventTouchDefault, { passive: false });

    return () => {
      canvasContainer.removeEventListener('touchstart', preventTouchDefault);
      canvasContainer.removeEventListener('touchmove', preventTouchDefault);
      canvasContainer.removeEventListener('touchend', preventTouchDefault);
    };
  }, [mode, selectedId, isDrawing]);

  // 새 테이블 추가
  const addTable = useCallback((x = 100, y = 100) => {
    const snappedPos = snapToGrid(x, y);
    const newTable = {
      id: Date.now().toString(),
      x: snappedPos.x,
      y: snappedPos.y,
      width: GRID_SIZE * 4,
      height: GRID_SIZE * 2,
      name: `테이블 ${tables.length + 1}`,
    };
    
    newTable.x = Math.min(newTable.x, STAGE_WIDTH - newTable.width - BOUNDARY_PADDING);
    newTable.y = Math.min(newTable.y, STAGE_HEIGHT - newTable.height - BOUNDARY_PADDING);
    newTable.x = Math.max(0, newTable.x);
    newTable.y = Math.max(0, newTable.y);

    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id);
  }, [tables.length, snapToGrid]);

  const selectTable = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const updateTable = useCallback((updatedTable) => {
    setTables(prev =>
      prev.map(table =>
        table.id === updatedTable.id ? updatedTable : table
      )
    );
  }, []);

  const deleteTable = useCallback((id) => {
    setTables(prev => prev.filter(table => table.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const duplicateTable = useCallback((id) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      let newX = table.x + GRID_SIZE; 
      let newY = table.y + GRID_SIZE; 

      newX = Math.min(newX, STAGE_WIDTH - table.width - BOUNDARY_PADDING);
      newY = Math.min(newY, STAGE_HEIGHT - table.height - BOUNDARY_PADDING);
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const newTable = {
        ...table,
        id: Date.now().toString(),
        x: newX,
        y: newY,
        name: `${table.name} 복사`,
      };
      
      setTables(prev => [...prev, newTable]);
      setSelectedId(newTable.id);
    }
  }, [tables]);

  const handleStageMouseDown = useCallback((e) => {
    if (e.target !== e.target.getStage()) return;
    
    // Stage 객체에서 포인터 위치 가져오기 (안전한 방법)
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const snappedPos = snapToGrid(pos.x, pos.y);
    
    if (mode === 'draw') {
      setIsDrawing(true);
      setStartPos(snappedPos);
      setSelectedId(null);
      
      setDrawingTable({
        id: 'temp-' + Date.now(),
        x: snappedPos.x,
        y: snappedPos.y,
        width: GRID_SIZE, 
        height: GRID_SIZE, 
        name: `테이블 ${tables.length + 1}`,
      });
    } else {
      setSelectedId(null);
    }
  }, [mode, tables.length, snapToGrid]);

  const handleStageMouseMove = useCallback((e) => {
    if (!isDrawing || !startPos) return;

    // Stage 객체에서 포인터 위치 가져오기 (안전한 방법)
    const stage = e.target.getStage();
    const rawPos = stage.getPointerPosition();
    const clampedRawX = Math.max(0, Math.min(STAGE_WIDTH - BOUNDARY_PADDING, rawPos.x));
    const clampedRawY = Math.max(0, Math.min(STAGE_HEIGHT - BOUNDARY_PADDING, rawPos.y));

    const currentSnapedPos = snapToGrid(clampedRawX, clampedRawY);

    const x1 = startPos.x;
    const y1 = startPos.y;
    const x2 = currentSnapedPos.x;
    const y2 = currentSnapedPos.y;

    let newX = Math.min(x1, x2);
    let newY = Math.min(y1, y2);
    
    let newWidth = Math.abs(x1 - x2) + GRID_SIZE;
    let newHeight = Math.abs(y1 - y2) + GRID_SIZE;

    newWidth = snapValue(newWidth);
    newHeight = snapValue(newHeight);

    newX = Math.max(0, Math.min(STAGE_WIDTH - newWidth - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - newHeight - BOUNDARY_PADDING, newY));
    
    const finalSnapped = snapToGrid(newX, newY);
    newX = finalSnapped.x;
    newY = finalSnapped.y;

    setDrawingTable(prev => ({
      ...prev,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    }));
  }, [isDrawing, startPos, snapToGrid, snapValue]);

  const handleStageMouseUp = useCallback(() => {
    if (isDrawing && drawingTable) {
        let finalX = drawingTable.x;
        let finalY = drawingTable.y;
        let finalWidth = drawingTable.width;
        let finalHeight = drawingTable.height;

        finalX = Math.min(finalX, STAGE_WIDTH - finalWidth - BOUNDARY_PADDING);
        finalY = Math.min(finalY, STAGE_HEIGHT - finalHeight - BOUNDARY_PADDING);
        finalX = Math.max(0, finalX);
        finalY = Math.max(0, finalY);

        const newTable = {
          ...drawingTable,
          id: Date.now().toString(),
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
        };
        setTables(prev => [...prev, newTable]);
        setSelectedId(newTable.id);
    }
    
    setIsDrawing(false);
    setDrawingTable(null);
    setStartPos(null);
  }, [isDrawing, drawingTable]);

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage() && mode === 'select') {
      setSelectedId(null);
    }
  }, [mode]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Delete' && selectedId) {
        deleteTable(selectedId);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setMode('select'); 
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateTable(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, deleteTable, duplicateTable]);

  const updateTableName = useCallback((id, newName) => {
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, name: newName } : table
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    if (window.confirm("모든 테이블을 삭제하시겠습니까?")) {
      setTables([]);
      setSelectedId(null);
    }
  }, []);

  const saveLayout = useCallback(() => {
    const layoutData = {
      tables,
      timestamp: new Date().toISOString(),
      canvasSize: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
    };
    
    console.log('매장 레이아웃 저장:', layoutData);
    alert('레이아웃이 저장되었습니다!');
  }, [tables]);

  const selectedTable = tables.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      {/* 상단 툴바 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Table className="w-6 h-6" />
            Konva.js 매장 레이아웃 에디터
          </h1>
          
          <div className="flex items-center gap-2">
            {/* 모드 선택 토글 버튼 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('select')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  mode === 'select' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Move className="w-4 h-4" />
                선택
              </button>
              <button
                onClick={() => setMode('draw')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  mode === 'draw' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Square className="w-4 h-4" />
                그리기
              </button>
            </div>

            <button
              onClick={() => addTable()}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              테이블 추가
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              격자
            </button>
            
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            
            <button
              onClick={saveLayout}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-600">
            {mode === 'draw' ? '캔버스에서 드래그하여 테이블을 그리세요.' : '테이블을 선택하고 드래그하여 이동하거나 크기를 조정하세요.'}
            <span className="text-blue-600 font-medium ml-2">
              📱 모바일 터치 스크롤 방지 기능 활성화
            </span>
          </p>
          
          <div className="text-xs text-gray-500">
            단축키: Delete(삭제), Ctrl+D(복사), Esc(선택해제)
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        {/* 🔥 캔버스 영역 - ref 추가 및 터치 스크롤 방지 스타일 적용 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
          <div 
            ref={canvasContainerRef}
            className="relative border-2 border-gray-300 rounded-lg overflow-hidden"
            style={{
              // CSS로도 터치 액션 제어 (추가 보안)
              touchAction: mode === 'draw' || selectedId ? 'none' : 'auto',
              // 모바일에서 스크롤 방지를 위한 추가 스타일
              overscrollBehavior: 'none',
              // iOS Safari에서 rubber band 효과 방지
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <GridBackground visible={showGrid} />
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onClick={handleStageClick}
              onTouchStart={handleStageMouseDown}
              onTouchMove={handleStageMouseMove}
              onTouchEnd={handleStageMouseUp}
            >
              <Layer>
                {tables.map(table => (
                  <TableShape
                    key={table.id}
                    table={table}
                    isSelected={table.id === selectedId}
                    onSelect={selectTable}
                    onChange={updateTable}
                    onDelete={deleteTable}
                  />
                ))}
                
                {isDrawing && drawingTable && (
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
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="w-80 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">테이블 관리</h2>
          
          {selectedTable && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-3">선택된 테이블</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="tableNameInput" className="block text-sm font-medium text-gray-700 mb-1">
                    테이블 이름
                  </label>
                  <input
                    id="tableNameInput"
                    type="text"
                    value={selectedTable.name}
                    onChange={(e) => updateTableName(selectedTable.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">위치:</span>
                    <div className="font-mono">({selectedTable.x}, {selectedTable.y})</div>
                  </div>
                  <div>
                    <span className="text-gray-500">크기:</span>
                    <div className="font-mono">{selectedTable.width}×{selectedTable.height}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => duplicateTable(selectedTable.id)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    복사
                  </button>
                  <button
                    onClick={() => deleteTable(selectedTable.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <h3 className="font-medium text-gray-700 mb-3">전체 테이블 목록</h3>
          
          {tables.length === 0 ? (
            <p className="text-gray-500 text-sm">
              아직 테이블이 없습니다.<br />
              그리기 모드에서 드래그하여 테이블을 만들거나 "테이블 추가" 버튼을 클릭하세요.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedId === table.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedId(table.id)}
                >
                  <div className="font-medium text-sm">{table.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({table.x}, {table.y}) | {table.width}×{table.height}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">통계</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>총 테이블: {tables.length}개</div>
                <div>현재 모드: <span className="font-semibold">{mode === 'draw' ? '그리기' : '선택'}</span></div>
                <div>캔버스 크기: {STAGE_WIDTH}×{STAGE_HEIGHT}</div>
                <div>격자 크기: {GRID_SIZE}px</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">모바일 최적화</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 터치 스크롤 방지 활성화</div>
                <div>• 그리기/선택 모드별 터치 제어</div>
                <div>• iOS/Android 호환성 개선</div>
                <div>• 부드러운 터치 드래그 지원</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Konva.js 라이브러리 특징</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 부드러운 드래그 & 드롭</div>
                <div>• 실시간 크기 조정</div>
                <div>• 고성능 2D 렌더링</div>
                <div>• 터치 및 마우스 이벤트 지원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLayoutEditor;