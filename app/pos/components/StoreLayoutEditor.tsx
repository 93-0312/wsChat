'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Group } from 'react-konva';
import { Trash2, RotateCcw, Save, Grid, Table, Move, Square, Plus, Copy } from 'lucide-react';

// Konva 사용 시 필요한 설정 (상수로 정의)
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 10; // 격자 크기
// const MIN_DRAW_SIZE = GRID_SIZE * 2; // 그리기 모드에서 허용되는 최소 테이블 크기 (가로/세로) - 롤백으로 사용 안 함
// 캔버스 경계선에 테이블이 닿는 것을 방지하기 위한 여백 (GRID_SIZE의 배수여야 함)
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
    // 오른쪽 경계
    if (newX + newWidth > STAGE_WIDTH - BOUNDARY_PADDING) {
        newWidth = STAGE_WIDTH - BOUNDARY_PADDING - newX;
        newWidth = snapToGrid(Math.max(GRID_SIZE, newWidth)); // 최소 크기 보장
    }
    // 아래쪽 경계
    if (newY + newHeight > STAGE_HEIGHT - BOUNDARY_PADDING) {
        newHeight = STAGE_HEIGHT - BOUNDARY_PADDING - newY;
        newHeight = Math.round(Math.max(GRID_SIZE, newHeight) / GRID_SIZE) * GRID_SIZE; // 최소 크기 보장
    }

    // 왼쪽/위쪽 경계 (0보다 작아지지 않도록)
    newX = Math.round(Math.max(0, newX) / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(Math.max(0, newY) / GRID_SIZE) * GRID_SIZE;

    // 스케일 리셋
    node.scaleX(1);
    node.scaleY(1);
    
    // 내부 Rect와 Text 크기 업데이트 (Konva 노드 직접 업데이트)
    if (shapeRef.current) {
      shapeRef.current.width(newWidth);
      shapeRef.current.height(newHeight);
    }
    if (textRef.current) {
      textRef.current.width(newWidth);
      textRef.current.height(newHeight);
    }

    // Transformer 강제 업데이트 (선택 해제 또는 리렌더링 시 필요)
    if (trRef.current) {
      trRef.current.forceUpdate();
      trRef.current.getLayer().batchDraw();
    }

    // 변경된 속성으로 테이블 상태 업데이트
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

    // 캔버스 경계 내로 제한 (BOUNDARY_PADDING 적용)
    newX = Math.max(0, Math.min(STAGE_WIDTH - table.width - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - table.height - BOUNDARY_PADDING, newY));

    // 격자에 맞춰 스냅
    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

    // Konva 노드의 위치를 직접 업데이트하여 실시간으로 경계를 유지
    node.x(newX);
    node.y(newY);
  }, [table.width, table.height]);

  // 드래그 종료 시 최종 위치를 React 상태에 반영
  const handleDragEnd = useCallback((e) => {
    const node = e.target;
    // handleDragMove에서 이미 조정된 최종 x, y를 사용
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
        onDragMove={handleDragMove} // 드래그 중 실시간 위치 제어
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
          fill={isSelected ? '#3b82f6' : '#f59e0b'} // 선택 시 파란색, 기본 주황색
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
          listening={false} // 텍스트는 클릭 이벤트 무시
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false} // 회전 비활성화
          boundBoxFunc={(oldBox, newBox) => {
            // 최소 크기 제한: GRID_SIZE보다 작아질 수 없음
            if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) {
              return oldBox;
            }
            return newBox;
          }}
          // 크기 조절 앵커 지정 (모든 방향에서 가능)
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
  
  // 세로 격자 선
  for (let i = 0; i <= STAGE_WIDTH / GRID_SIZE; i++) {
    lines.push(
      <line
        key={`v${i}`}
        x1={i * GRID_SIZE}
        y1={0}
        x2={i * GRID_SIZE}
        y2={STAGE_HEIGHT}
        stroke="#e5e7eb" // 연한 회색
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
        stroke="#e5e7eb" // 연한 회색
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
        pointerEvents: 'none', // SVG가 마우스 이벤트를 가로채지 않도록
      }}
    >
      {lines}
    </svg>
  );
};

// 메인 레이아웃 에디터 컴포넌트
const StoreLayoutEditor = () => {
  const [tables, setTables] = useState([]); // 모든 테이블 데이터
  const [selectedId, setSelectedId] = useState(null); // 현재 선택된 테이블 ID
  const [showGrid, setShowGrid] = useState(true); // 격자 표시 여부
  const [isDrawing, setIsDrawing] = useState(false); // 그리기 모드 활성화 여부
  const [drawingTable, setDrawingTable] = useState(null); // 그리기 중인 임시 테이블 데이터
  const [startPos, setStartPos] = useState(null); // 드래그 시작 위치 (그리기 모드)
  const [mode, setMode] = useState('select'); // 현재 모드: 'select' (선택/이동), 'draw' (그리기)
  const stageRef = useRef(); // Konva Stage 참조

  // 격자에 맞춰 좌표 정렬 헬퍼 함수
  const snapToGrid = useCallback((x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  }), []);

  // 단일 값용 격자 스냅 함수 추가 (그리기용)
  const snapValue = useCallback((value) => Math.round(value / GRID_SIZE) * GRID_SIZE, []);

  // 새 테이블 추가 (버튼 클릭 시)
  const addTable = useCallback((x = 100, y = 100) => {
    const snappedPos = snapToGrid(x, y);
    const newTable = {
      id: Date.now().toString(),
      x: snappedPos.x,
      y: snappedPos.y,
      width: GRID_SIZE * 4, // 기본 너비
      height: GRID_SIZE * 2, // 기본 높이
      name: `테이블 ${tables.length + 1}`,
    };
    // 캔버스 경계선에 테이블이 닿지 않도록 초기 위치 조정
    newTable.x = Math.min(newTable.x, STAGE_WIDTH - newTable.width - BOUNDARY_PADDING);
    newTable.y = Math.min(newTable.y, STAGE_HEIGHT - newTable.height - BOUNDARY_PADDING);
    newTable.x = Math.max(0, newTable.x);
    newTable.y = Math.max(0, newTable.y);

    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id); // 새로 추가된 테이블 선택
  }, [tables.length, snapToGrid]);

  // 테이블 선택 (Konva 이벤트 핸들러용)
  const selectTable = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // 테이블 속성 업데이트
  const updateTable = useCallback((updatedTable) => {
    setTables(prev =>
      prev.map(table =>
        table.id === updatedTable.id ? updatedTable : table
      )
    );
  }, []);

  // 테이블 삭제
  const deleteTable = useCallback((id) => {
    setTables(prev => prev.filter(table => table.id !== id));
    if (selectedId === id) {
      setSelectedId(null); // 삭제된 테이블이 선택되어 있었다면 선택 해제
    }
  }, [selectedId]);

  // 테이블 복사
  const duplicateTable = useCallback((id) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      let newX = table.x + GRID_SIZE; 
      let newY = table.y + GRID_SIZE; 

      // 복사된 테이블이 캔버스 경계를 벗어나지 않도록 조정 (BOUNDARY_PADDING 적용)
      newX = Math.min(newX, STAGE_WIDTH - table.width - BOUNDARY_PADDING);
      newY = Math.min(newY, STAGE_HEIGHT - table.height - BOUNDARY_PADDING);
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const newTable = {
        ...table,
        id: Date.now().toString(), // 새로운 고유 ID
        x: newX,
        y: newY,
        name: `${table.name} 복사`,
      };
      
      setTables(prev => [...prev, newTable]);
      setSelectedId(newTable.id); // 복사된 테이블 선택
    }
  }, [tables]);

  // Stage 마우스 다운 이벤트 (그리기 시작 또는 선택 해제)
  const handleStageMouseDown = useCallback((e) => {
    // Stage 배경을 클릭했을 때만 처리
    if (e.target !== e.target.getStage()) return;
    
    const pos = e.target.getPointerPosition();
    const snappedPos = snapToGrid(pos.x, pos.y);
    
    if (mode === 'draw') {
      setIsDrawing(true);
      setStartPos(snappedPos); // 그리기 시작 위치
      setSelectedId(null); // 그리기 중에는 선택 해제
      
      // 임시 테이블 생성 (최소 GRID_SIZE 크기로 시작)
      setDrawingTable({
        id: 'temp-' + Date.now(), // 임시 ID
        x: snappedPos.x,
        y: snappedPos.y,
        width: GRID_SIZE, 
        height: GRID_SIZE, 
        name: `테이블 ${tables.length + 1}`,
      });
    } else {
      setSelectedId(null); // 선택 모드에서 빈 공간 클릭 시 선택 해제
    }
  }, [mode, tables.length, snapToGrid]);

  // Stage 마우스 이동 이벤트 (그리기 중 임시 테이블 크기 조절)
  const handleStageMouseMove = useCallback((e) => {
    if (!isDrawing || !startPos) return;

    // 마우스 포인터 위치를 캔버스 경계 내로 클램핑 (가장 중요!)
    // 마우스 포인터가 실제 캔버스 경계선에 닿더라도, 테이블은 BOUNDARY_PADDING 안쪽에 그려지도록 제한
    const rawPos = e.target.getPointerPosition();
    const clampedRawX = Math.max(0, Math.min(STAGE_WIDTH - BOUNDARY_PADDING, rawPos.x));
    const clampedRawY = Math.max(0, Math.min(STAGE_HEIGHT - BOUNDARY_PADDING, rawPos.y));

    // 클램핑된 마우스 위치를 격자에 스냅
    const currentSnapedPos = snapToGrid(clampedRawX, clampedRawY);

    // 테이블의 시작점과 현재 마우스 포인터 위치를 기준으로 x, y, width, height 계산
    const x1 = startPos.x;
    const y1 = startPos.y;
    const x2 = currentSnapedPos.x;
    const y2 = currentSnapedPos.y;

    let newX = Math.min(x1, x2);
    let newY = Math.min(y1, y2);
    
    // 너비와 높이를 계산 (수정: snapToGrid 대신 직접 계산)
    let newWidth = Math.abs(x1 - x2) + GRID_SIZE;
    let newHeight = Math.abs(y1 - y2) + GRID_SIZE;

    // 격자에 맞춰 스냅 (단일 값용 함수 사용)
    newWidth = snapValue(newWidth);
    newHeight = snapValue(newHeight);

    // 최종적으로 테이블의 위치와 크기가 캔버스 경계를 벗어나지 않도록 조정
    // 이 부분에서 다시 한번 BOUNDARY_PADDING을 명시적으로 적용
    newX = Math.max(0, Math.min(STAGE_WIDTH - newWidth - BOUNDARY_PADDING, newX));
    newY = Math.max(0, Math.min(STAGE_HEIGHT - newHeight - BOUNDARY_PADDING, newY));
    
    // 최종적으로 격자에 스냅
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

  // Stage 마우스 업 이벤트 (그리기 완료)
  const handleStageMouseUp = useCallback(() => {
    if (isDrawing && drawingTable) {
        // 최종적으로 추가될 때 캔버스 경계선에 닿지 않도록 한 번 더 확인
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
          id: Date.now().toString(), // 임시 ID를 실제 ID로 변경
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
        };
        setTables(prev => [...prev, newTable]);
        setSelectedId(newTable.id); // 새로 생성된 테이블 선택
    }
    
    // 그리기 모드 초기화
    setIsDrawing(false);
    setDrawingTable(null);
    setStartPos(null);
  }, [isDrawing, drawingTable]);

  // Stage 클릭 이벤트 (선택 해제)
  const handleStageClick = useCallback((e) => {
    // Stage 배경을 클릭했고, 현재 모드가 'select'일 때만 선택 해제
    if (e.target === e.target.getStage() && mode === 'select') {
      setSelectedId(null);
    }
  }, [mode]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Delete 키로 선택된 테이블 삭제
      if (e.key === 'Delete' && selectedId) {
        deleteTable(selectedId);
      }
      // Esc 키로 선택 해제 및 선택 모드로 전환
      if (e.key === 'Escape') {
        setSelectedId(null);
        setMode('select'); 
      }
      // Ctrl+D (또는 Cmd+D)로 선택된 테이블 복사
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault(); // 기본 브라우저 동작 방지 (예: 북마크)
        duplicateTable(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, deleteTable, duplicateTable]);

  // 선택된 테이블의 이름 변경
  const updateTableName = useCallback((id, newName) => {
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, name: newName } : table
      )
    );
  }, []);

  // 모든 테이블 삭제
  const clearAll = useCallback(() => {
    if (window.confirm("모든 테이블을 삭제하시겠습니까?")) {
      setTables([]);
      setSelectedId(null);
    }
  }, []);

  // 레이아웃 저장 (콘솔 로그 또는 API 호출)
  const saveLayout = useCallback(() => {
    const layoutData = {
      tables,
      timestamp: new Date().toISOString(),
      canvasSize: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
    };
    
    console.log('매장 레이아웃 저장:', layoutData);
    alert('레이아웃이 저장되었습니다!');
  }, [tables]);

  // 현재 선택된 테이블 객체 찾기
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
                                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"

              >
                <Move className="w-4 h-4" />
                선택
              </button>
              <button
                onClick={() => setMode('draw')}
                             className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"

              >
                <Square className="w-4 h-4" />
                그리기
              </button>
            </div>

            {/* 테이블 추가 버튼 */}
            <button
              onClick={() => addTable()}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              테이블 추가
            </button>

            {/* 격자 표시/숨기기 토글 버튼 */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              격자
            </button>
            
            {/* 초기화 버튼 */}
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
            
            {/* 저장 버튼 */}
            <button
              onClick={saveLayout}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
        
        {/* 모드별 안내 메시지 및 단축키 */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-600">
            {mode === 'draw' ? '캔버스에서 드래그하여 테이블을 그리세요.' : '테이블을 선택하고 드래그하여 이동하거나 크기를 조정하세요.'}
          </p>
          
          <div className="text-xs text-gray-500">
            단축키: Delete(삭제), Ctrl+D(복사), Esc(선택해제)
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        {/* 캔버스 영역 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <GridBackground visible={showGrid} />
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onClick={handleStageClick}
              // 터치 이벤트 지원 추가
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
                
                {/* 드래그 중인 임시 테이블 (그리기 모드에서만 표시) */}
                {isDrawing && drawingTable && (
                  <Group>
                    <Rect
                      x={drawingTable.x}
                      y={drawingTable.y}
                      width={drawingTable.width}
                      height={drawingTable.height}
                      fill="#10b981" // 초록색 계열
                      stroke="#059669"
                      strokeWidth={2}
                      dash={[5, 5]} // 점선 테두리
                      cornerRadius={4}
                      opacity={0.7}
                      listening={false} // 임시 테이블은 클릭 이벤트 무시
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

        {/* 사이드바 (테이블 관리 및 정보 표시) */}
        <div className="w-80 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">테이블 관리</h2>
          
          {selectedTable && ( // 선택된 테이블이 있을 때만 상세 정보 표시
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

          {/* 통계 및 도움말 */}
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