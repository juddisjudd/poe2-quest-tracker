import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import type { PassiveTreeData, FullTreeData, PositionedNode } from '../types/passiveTree';
import type { GemProgressionWithLoadouts } from '../types';
import { computePositionedNodes, getTreeBounds, calculateTreeStats } from '../utils/treeDataLoader';
import './PassiveTreeWindow.css';

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface LoadoutInfo {
  id: string;
  name: string;
  hasTree: boolean;
}

// Convert icon path from tree data to relative asset path
// e.g., "Art/2DArt/SkillIcons/passives/damage.dds" -> "tree/passives/damage.webp"
function iconPathToRelativePath(iconPath: string | undefined): string | null {
  if (!iconPath) return null;
  
  // Extract the path after "passives/"
  const match = iconPath.match(/passives\/(.+)\.dds$/i);
  if (!match) return null;
  
  // Convert to lowercase and change extension to webp
  const relativePath = match[1].toLowerCase();
  return `tree/passives/${relativePath}.webp`;
}

const PassiveTreeWindow: React.FC = () => {
  const [passiveTreeData, setPassiveTreeData] = useState<PassiveTreeData | null>(null);
  const [treeStructure, setTreeStructure] = useState<FullTreeData | null>(null);
  const [positionedNodes, setPositionedNodes] = useState<Map<number, PositionedNode> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
  const [loadouts, setLoadouts] = useState<LoadoutInfo[]>([]);
  const [activeLoadoutId, setActiveLoadoutId] = useState<string>('');
  const [renderKey, setRenderKey] = useState(0); // Force re-render when switching loadouts
  const [viewState, setViewState] = useState<ViewState>({
    scale: 0.08,
    offsetX: 0,
    offsetY: 0,
  });

  // Image cache for node icons
  const imageCache = useRef<Map<string, HTMLImageElement | null>>(new Map());
  // Image cache for class/ascendancy illustrations
  const classImageCache = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [classImagesLoaded, setClassImagesLoaded] = useState(false);
  const [assetsBasePath, setAssetsBasePath] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Track mouse position for tooltip

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Memoize allocated nodes set for O(1) lookup
  const allocatedNodesSet = useMemo(() => {
    console.log('Recalculating allocatedNodesSet with', passiveTreeData?.allocatedNodes?.length, 'nodes');
    return new Set(passiveTreeData?.allocatedNodes || []);
  }, [passiveTreeData]); // Depend on the whole object to ensure updates

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingStatus('Loading build data...');

        if (!window.electronAPI) {
          setError('Electron API not available');
          return;
        }

        // Load loadouts info first
        const gemLoadouts = await window.electronAPI.loadGemLoadouts();
        let rawTreeData: any = null;
        let currentActiveLoadoutId = '';
        
        if (gemLoadouts && gemLoadouts.loadouts && gemLoadouts.loadouts.length > 1) {
          const loadoutInfos: LoadoutInfo[] = gemLoadouts.loadouts.map((l: any) => ({
            id: l.id,
            name: l.name,
            hasTree: !!l.passiveTree,
          }));
          setLoadouts(loadoutInfos);
          currentActiveLoadoutId = gemLoadouts.activeLoadoutId || loadoutInfos[0]?.id || '';
          setActiveLoadoutId(currentActiveLoadoutId);
          
          // Try to load tree from the active loadout first
          const activeLoadout = gemLoadouts.loadouts.find((l: any) => l.id === currentActiveLoadoutId);
          if (activeLoadout && activeLoadout.passiveTree) {
            console.log('Loading tree from active loadout:', currentActiveLoadoutId);
            rawTreeData = activeLoadout.passiveTree;
          }
        }

        // If no tree from loadout, fall back to standalone passive tree data file
        if (!rawTreeData) {
          rawTreeData = await window.electronAPI.loadPassiveTreeData();
        }
        
        if (!rawTreeData) {
          setError('No passive tree data found. Import a POB build first.');
          return;
        }
        
        // Convert serialized arrays back to Maps (handle various saved formats)
        const treeData = {
          ...rawTreeData,
          masterySelections: Array.isArray(rawTreeData.masterySelections) 
            ? new Map(rawTreeData.masterySelections) 
            : new Map(),
          jewelSockets: Array.isArray(rawTreeData.jewelSockets) 
            ? new Map(rawTreeData.jewelSockets) 
            : undefined,
        };
        setPassiveTreeData(treeData);
        setLoadingStatus('Loading tree structure...');

        // Load the full tree structure
        const version = treeData.treeVersion || '0_3';
        const structure = await window.electronAPI.loadTreeStructure(version);
        if (!structure) {
          setError(`Tree structure for version ${version} not found. Run the tree conversion script first.`);
          return;
        }
        setTreeStructure(structure);
        setLoadingStatus('Loading assets & computing positions...');

        // Get the assets base path for icon loading
        const basePath = await window.electronAPI.getAssetsPath();
        console.log('Assets base path:', basePath);
        setAssetsBasePath(basePath);

        // Compute positioned nodes
        const positioned = computePositionedNodes(structure);
        setPositionedNodes(positioned);

        // Center view on tree
        const bounds = getTreeBounds(positioned);
        if (containerRef.current) {
          const container = containerRef.current;
          const scale = 0.08;
          setViewState({
            scale,
            offsetX: container.clientWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
            offsetY: container.clientHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
          });
        }

        setLoadingStatus('Ready');
      } catch (err) {
        setError(`Failed to load tree data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Preload images for allocated nodes
  useEffect(() => {
    if (!positionedNodes || !allocatedNodesSet.size || !assetsBasePath) return;
    
    const loadImages = async () => {
      const iconsToLoad: Map<string, string> = new Map(); // relativePath -> fullPath
      
      // Collect all unique icon paths for allocated nodes
      for (const nodeId of allocatedNodesSet) {
        const node = positionedNodes.get(nodeId);
        if (node?.icon) {
          const relativePath = iconPathToRelativePath(node.icon);
          if (relativePath && !imageCache.current.has(relativePath)) {
            const fullPath = `${assetsBasePath}/${relativePath}`;
            iconsToLoad.set(relativePath, fullPath);
          }
        }
      }
      
      console.log(`Loading ${iconsToLoad.size} node icons from ${assetsBasePath}...`);
      if (iconsToLoad.size > 0) {
        console.log('Sample icon paths:', Array.from(iconsToLoad.values()).slice(0, 3));
      }
      
      // Load images in parallel
      let successCount = 0;
      let failCount = 0;
      const loadPromises = Array.from(iconsToLoad.entries()).map(([relativePath, fullPath]) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            imageCache.current.set(relativePath, img);
            successCount++;
            resolve();
          };
          img.onerror = (err) => {
            // Mark as failed so we don't retry
            if (failCount < 3) {
              console.warn(`Failed to load icon: ${fullPath}`, err);
            }
            imageCache.current.set(relativePath, null);
            failCount++;
            resolve();
          };
          img.src = fullPath;
        });
      });
      
      await Promise.all(loadPromises);
      console.log(`Icon loading complete: ${successCount} success, ${failCount} failed`);
      setImagesLoaded(true);
    };
    
    loadImages();
  }, [positionedNodes, allocatedNodesSet, assetsBasePath]);

  // Load class/ascendancy illustrations
  useEffect(() => {
    if (!treeStructure || !passiveTreeData || !assetsBasePath) return;
    
    const loadClassImages = async () => {
      const imagesToLoad: Map<string, string> = new Map();
      
      // Find the current class
      const currentClass = treeStructure.classes.find(c => c.name === passiveTreeData.className);
      if (!currentClass) {
        console.warn('Could not find class:', passiveTreeData.className);
        return;
      }
      
      // Add base class illustration
      if (currentClass.background) {
        const imageName = currentClass.name.toLowerCase().replace(/\s+/g, '') + 'baseillustration';
        const relativePath = `tree/classes/${imageName}.webp`;
        if (!classImageCache.current.has(relativePath)) {
          imagesToLoad.set(relativePath, `${assetsBasePath}/${relativePath}`);
        }
      }
      
      // Add ascendancy illustrations
      for (const asc of currentClass.ascendancies) {
        if (asc.name) {  // Load all ascendancy images (positions are hardcoded)
          // Try multiple naming patterns
          const ascName = asc.name.toLowerCase().replace(/\s+/g, '');
          const patterns = [
            `${ascName}ascendancy`,
            `${ascName}ascendency`,
          ];
          for (const pattern of patterns) {
            const relativePath = `tree/classes/${pattern}.webp`;
            if (!classImageCache.current.has(relativePath)) {
              imagesToLoad.set(relativePath, `${assetsBasePath}/${relativePath}`);
            }
          }
        }
      }
      
      // Add ascendancy background frame (goes on top of class/ascendancy illustrations)
      const frameRelPath = 'tree/ascendancy-background_4000_4000_BC7.webp';
      if (!classImageCache.current.has(frameRelPath)) {
        imagesToLoad.set(frameRelPath, `${assetsBasePath}/${frameRelPath}`);
      }
      
      console.log(`Loading ${imagesToLoad.size} class/ascendancy illustrations...`);
      
      let successCount = 0;
      const loadPromises = Array.from(imagesToLoad.entries()).map(([relativePath, fullPath]) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            classImageCache.current.set(relativePath, img);
            successCount++;
            resolve();
          };
          img.onerror = () => {
            classImageCache.current.set(relativePath, null);
            resolve();
          };
          img.src = fullPath;
        });
      });
      
      await Promise.all(loadPromises);
      console.log(`Class illustration loading complete: ${successCount} loaded`);
      setClassImagesLoaded(true);
    };
    
    loadClassImages();
  }, [treeStructure, passiveTreeData, assetsBasePath]);

  // Handle mouse wheel zoom with native event listener (to use passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      
      setViewState(prev => {
        const newScale = Math.max(0.01, Math.min(0.5, prev.scale * zoomFactor));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        return {
          scale: newScale,
          offsetX: mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale),
          offsetY: mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale),
        };
      });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, [loading]); // Re-run when loading changes to ensure container is mounted

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  // Helper to get node display radius (same logic as rendering)
  const getNodeRadius = useCallback((node: PositionedNode): number => {
    if (node.isClassStart) return 50;    // Increased from 40
    if (node.isKeystone) return 44;      // Increased from 35
    if (node.isJewelSocket) return 38;   // Increased from 30
    if (node.isMastery) return 40;       // Increased from 32
    if (node.ascendancyName) return node.isNotable ? 35 : 28; // Increased
    if (node.isNotable) return 35;       // Increased from 28
    return 25; // Normal node - increased from 20
  }, []);

  // Handle mouse move for panning and hover
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Always update mouse position for tooltip
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (isDragging.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
      }));
    } else if (positionedNodes) {
      // Check for node hover
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const worldX = (e.clientX - rect.left - viewState.offsetX) / viewState.scale;
        const worldY = (e.clientY - rect.top - viewState.offsetY) / viewState.scale;

        // Find node under cursor using actual node size
        let found: PositionedNode | null = null;
        let closestDist = Infinity;

        for (const node of positionedNodes.values()) {
          // Skip non-interactive nodes
          if (node.isOnlyImage) continue;
          
          const dx = node.x - worldX;
          const dy = node.y - worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Use actual node radius plus a small buffer for easier clicking
          const nodeRadius = getNodeRadius(node);
          const hitRadius = nodeRadius * 1.2; // 20% larger hit area
          
          if (dist < hitRadius && dist < closestDist) {
            found = node;
            closestDist = dist;
          }
        }

        setHoveredNode(found);
      }
    }
  }, [positionedNodes, viewState, getNodeRadius]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Render the tree on canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !positionedNodes) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, container.clientWidth, container.clientHeight);

    // Apply transform
    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.scale, viewState.scale);

    // Calculate visible bounds for culling
    const visibleLeft = -viewState.offsetX / viewState.scale - 500;
    const visibleRight = (container.clientWidth - viewState.offsetX) / viewState.scale + 500;
    const visibleTop = -viewState.offsetY / viewState.scale - 500;
    const visibleBottom = (container.clientHeight - viewState.offsetY) / viewState.scale + 500;

    // Get orbit radii from tree structure (or use defaults)
    const orbitRadii = treeStructure?.constants?.orbitRadii || [0, 82, 162, 335, 493, 662, 846, 251, 1080, 1322];

    // Draw class and ascendancy illustrations (behind everything else)
    if (classImagesLoaded && treeStructure && passiveTreeData) {
      const currentClass = treeStructure.classes.find(c => c.name === passiveTreeData.className);
      if (currentClass) {
        ctx.globalAlpha = 0.6; // Semi-transparent backgrounds

        // Draw base class illustration at center (0,0)
        const classImageName = currentClass.name.toLowerCase().replace(/\s+/g, '') + 'baseillustration';
        const classRelPath = `tree/classes/${classImageName}.webp`;
        const classImg = classImageCache.current.get(classRelPath);
        if (classImg) {
          const size = 2790; // 93% of 3000 for better fit
          ctx.drawImage(classImg, -size / 2, -size / 2, size, size);
        }

        // Draw ascendancy illustrations at their positions
        // Hardcoded positions from group data since tree.json doesn't include them in ascendancy objects
        // CORRECT positions from PathOfBuilding tree.lua ascendancy backgrounds
        const ascendancyPositions: Record<string, { x: number; y: number }> = {
          "Pathfinder": { x: 13751.674845732, y: 6121.7981672774 },
          "Deadeye": { x: 14723.961164228, y: 3128.8882207467 },
          "Lich": { x: -1573.4397536271, y: -14970.27926277 },
          "Abyssal Lich": { x: -1573.4397536271, y: -14970.27926277 },
          "Acolyte of Chayula": { x: 13768.118885853, y: -6084.7248260421 },
          "Smith of Kitava": { x: -14318.260769023, y: 4644.607885912 },
          "Amazon": { x: 12178.374348621, y: 8847.1561582513 },
          "Tactician": { x: 3149.1717656234, y: 14719.636240554 },
          "Infernalist": { x: -7526.3698730469, y: -13036.055016673 },
          "Gemling Legionnaire": { x: -3110.1038699583, y: 14727.940378128 },
          "Chronomancer": { x: 4651.5523934462, y: -14316.006223618 },
          "Warbringer": { x: -13039.704139156, y: 7520.0458660114 },
          "Stormweaver": { x: 1573.4397536271, y: -14970.27926277 },
          "Blood Mage": { x: -4651.5523934462, y: -14316.006223618 },
          "Ritualist": { x: 10072.820454151, y: 11185.850971744 },
          "Witchhunter": { x: 19.970347847175, y: 15052.726498839 },
          "Titan": { x: -11191.249866964, y: 10066.821756582 },
          "Invoker": { x: 12202.167028072, y: -8814.3118666561 }
        };

        // Draw ascendancy illustrations at their node positions (only if selected)
        if (passiveTreeData.ascendClassName) {
          const selectedAsc = currentClass.ascendancies.find(a => a.name === passiveTreeData.ascendClassName);
          if (selectedAsc) {
            const ascPos = ascendancyPositions[selectedAsc.name];
            if (ascPos) {
              const ascName = selectedAsc.name.toLowerCase().replace(/\s+/g, '');
              // Try both naming patterns
              let ascImg = classImageCache.current.get(`tree/classes/${ascName}ascendancy.webp`);
              if (!ascImg) {
                ascImg = classImageCache.current.get(`tree/classes/${ascName}ascendency.webp`);
              }
              if (ascImg) {
                // Full opacity for ascendancy (override the 0.6 from class background)
                ctx.globalAlpha = 1.0;
                const width = 1500 * 2; // POB formula: (width || 1500) * 2
                const height = 1500 * 2;
                const x = ascPos.x - width / 2;  // POB formula: x - width/2
                const y = ascPos.y - height / 2; // POB formula: y - height/2
                ctx.drawImage(ascImg, x, y, width, height);
                // Reset alpha back to 0.6 for remaining backgrounds
                ctx.globalAlpha = 0.6;
              }
            }
          }
        }

        // Draw ascendancy background frame on top of class/ascendancy illustrations
        ctx.globalAlpha = 1.0; // Frame at full opacity
        const frameImg = classImageCache.current.get('tree/ascendancy-background_4000_4000_BC7.webp');
        if (frameImg) {
          const frameSize = 3720; // 93% of 4000 for better fit
          ctx.drawImage(frameImg, -frameSize / 2, -frameSize / 2, frameSize, frameSize);
        }

        ctx.globalAlpha = 1.0; // Reset alpha
      }
    }

    // Draw connections first (paths between nodes)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Track which connections we've already drawn to avoid duplicates
    const drawnConnections = new Set<string>();

    // Helper function to draw a connection (arc or line)
    const drawConnection = (node: PositionedNode, target: PositionedNode, conn: { id: number; orbit?: number }, isAllocated: boolean) => {
      // Set line style based on allocation - PathOfBuilding approach: full opacity, color/size distinction
      if (isAllocated) {
        // Allocated path - bright golden, thick
        ctx.strokeStyle = '#c9a032';
        ctx.lineWidth = 8;
        ctx.globalAlpha = 1.0;
      } else {
        // Unallocated - light gray, thin (PathOfBuilding uses white but textures provide visual weight)
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0; // Full opacity like PathOfBuilding
      }

      ctx.beginPath();

      // Determine if we should draw a curved arc or straight line
      // Case 1: connection.orbit !== 0 - curved arc based on orbit radius
      // Case 2: nodes in same group AND same orbit AND connection.orbit === 0 - arc along orbit
      let drewArc = false;

      if (conn.orbit !== undefined && conn.orbit !== 0 && orbitRadii[Math.abs(conn.orbit)] !== undefined) {
        // Curved arc connection using POB's algorithm
        const orbit = Math.abs(conn.orbit);
        const r = orbitRadii[orbit];

        const dx = target.x - node.x;
        const dy = target.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r * 2 && dist > 0) {
          // Calculate the center of the arc circle
          // The arc passes through both nodes with radius r
          const perp = Math.sqrt(r * r - (dist * dist) / 4) * (conn.orbit > 0 ? 1 : -1);
          const cx = node.x + dx / 2 + perp * (dy / dist);
          const cy = node.y + dy / 2 - perp * (dx / dist);

          // Calculate angles from center to each node
          const angle1 = Math.atan2(node.y - cy, node.x - cx);
          const angle2 = Math.atan2(target.y - cy, target.x - cx);

          // Determine arc direction (clockwise vs counterclockwise)
          // We want the shorter arc
          let startAngle = angle1;
          let endAngle = angle2;

          // Normalize angle difference
          let angleDiff = endAngle - startAngle;
          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          // Draw the arc - counterclockwise if angleDiff is negative
          ctx.arc(cx, cy, r, startAngle, endAngle, angleDiff < 0);
          drewArc = true;
        }
      } else if (node.group === target.group && node.orbit === target.orbit && (conn.orbit === 0 || conn.orbit === undefined)) {
        // Nodes are in the same orbit of the same group - draw arc along orbit
        const group = treeStructure?.groups[node.group.toString()];
        if (group) {
          const orbitRadius = orbitRadii[node.orbit] || 0;

          if (orbitRadius > 0) {
            // Use node angles to draw arc
            let startAngle = node.angle;
            let endAngle = target.angle;

            // Ensure we draw the shorter arc
            let angleDiff = endAngle - startAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Convert from POB angle system (0 = up) to canvas angle system (0 = right)
            // POB: x = cx + sin(angle) * r, y = cy - cos(angle) * r
            // This means POB angle 0 = up = canvas angle -π/2
            const canvasStartAngle = startAngle - Math.PI / 2;
            const canvasEndAngle = endAngle - Math.PI / 2;

            ctx.arc(group.x, group.y, orbitRadius, canvasStartAngle, canvasEndAngle, angleDiff < 0);
            drewArc = true;
          }
        }
      }

      if (!drewArc) {
        // Draw straight line
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(target.x, target.y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1.0; // Reset alpha
    };

    // PASS 1: Draw ALL unallocated connections (dim, thin)
    for (const node of positionedNodes.values()) {
      // Skip isOnlyImage nodes (mastery display nodes)
      if (node.isOnlyImage) continue;

      // Skip class start nodes - POB doesn't draw connectors to/from these
      if (node.isClassStart) continue;

      // Cull nodes outside view
      if (node.x < visibleLeft || node.x > visibleRight ||
          node.y < visibleTop || node.y > visibleBottom) continue;

      for (const conn of node.connections) {
        const target = positionedNodes.get(conn.id);
        if (!target) continue;

        // Skip connections to isOnlyImage nodes
        if (target.isOnlyImage) continue;

        // Skip connections to class start nodes
        if (target.isClassStart) continue;

        // Skip cross-ascendancy connections (different ascendancy names)
        if (node.ascendancyName !== target.ascendancyName) continue;

        // Create a unique key for this connection (sorted IDs to ensure consistency)
        const connKey = node.id < conn.id ? `${node.id}-${conn.id}` : `${conn.id}-${node.id}`;
        if (drawnConnections.has(connKey)) continue;
        drawnConnections.add(connKey);

        // Check if BOTH nodes are allocated
        const bothAllocated = allocatedNodesSet.has(node.id) && allocatedNodesSet.has(conn.id);

        // Only draw unallocated connections in this pass
        if (!bothAllocated) {
          drawConnection(node, target, conn, false);
        }
      }
    }

    // PASS 2: Draw allocated connections (bright, thick) - on top
    drawnConnections.clear(); // Reset for second pass
    for (const node of positionedNodes.values()) {
      // Skip isOnlyImage nodes (mastery display nodes)
      if (node.isOnlyImage) continue;

      // Skip class start nodes - POB doesn't draw connectors to/from these
      if (node.isClassStart) continue;

      // Only process allocated nodes in this pass
      if (!allocatedNodesSet.has(node.id)) continue;

      // Cull nodes outside view
      if (node.x < visibleLeft || node.x > visibleRight ||
          node.y < visibleTop || node.y > visibleBottom) continue;

      for (const conn of node.connections) {
        const target = positionedNodes.get(conn.id);
        if (!target) continue;

        // Skip connections to isOnlyImage nodes
        if (target.isOnlyImage) continue;

        // Skip connections to class start nodes
        if (target.isClassStart) continue;

        // Skip cross-ascendancy connections (different ascendancy names)
        if (node.ascendancyName !== target.ascendancyName) continue;

        // Only draw connections to other allocated nodes
        if (!allocatedNodesSet.has(conn.id)) continue;

        // Create a unique key for this connection (sorted IDs to ensure consistency)
        const connKey = node.id < conn.id ? `${node.id}-${conn.id}` : `${conn.id}-${node.id}`;
        if (drawnConnections.has(connKey)) continue;
        drawnConnections.add(connKey);

        // Draw allocated connection
        drawConnection(node, target, conn, true);
      }
    }

    // Helper function to get node radius based on type
    const getNodeRadius = (node: PositionedNode): number => {
      if (node.isClassStart) return 50;  // Class start nodes - increased from 40
      if (node.isKeystone) return 44;    // Keystones - increased from 35
      if (node.isNotable) return 35;     // Notables - increased from 28
      if (node.isMastery) return 38;     // Masteries - increased from 30
      if (node.isJewelSocket) return 32; // Jewel sockets - increased from 25
      if (node.ascendancyName) return node.isNotable ? 35 : 28; // Ascendancy nodes - increased
      return 23; // Normal small passives - increased from 18
    };

    // Draw nodes
    for (const node of positionedNodes.values()) {
      // Skip isOnlyImage nodes (mastery display nodes that shouldn't be rendered)
      if (node.isOnlyImage) continue;
      
      // Cull nodes outside view
      if (node.x < visibleLeft || node.x > visibleRight || 
          node.y < visibleTop || node.y > visibleBottom) continue;

      const isAllocated = allocatedNodesSet.has(node.id);
      const isHovered = hoveredNode?.id === node.id;

      // Get node size based on type
      const radius = getNodeRadius(node);
      const displayRadius = isHovered ? radius * 1.15 : radius;

      // Determine node colors (for fallback and borders)
      let fillColor = '#2a2a3a';
      let strokeColor = '#4a4a5a';
      let glowColor = '';

      if (node.isClassStart) {
        fillColor = isAllocated ? '#1a5a1a' : '#0a2a0a';
        strokeColor = isAllocated ? '#3a9a3a' : '#1a4a1a';
        glowColor = isAllocated ? 'rgba(100, 200, 100, 0.5)' : '';
      } else if (node.isKeystone) {
        fillColor = isAllocated ? '#6a5010' : '#2a2520';
        strokeColor = isAllocated ? '#d4af37' : '#4a4a4a';
        glowColor = isAllocated ? 'rgba(212, 175, 55, 0.6)' : '';
      } else if (node.isNotable) {
        fillColor = isAllocated ? '#5a4010' : '#252520';
        strokeColor = isAllocated ? '#c4a020' : '#4a4a4a';
        glowColor = isAllocated ? 'rgba(196, 160, 32, 0.5)' : '';
      } else if (node.isMastery) {
        fillColor = isAllocated ? '#5a3a1a' : '#2a1a0a';
        strokeColor = isAllocated ? '#cd853f' : '#4a3a2a';
        glowColor = isAllocated ? 'rgba(205, 133, 63, 0.5)' : '';
      } else if (node.isJewelSocket) {
        fillColor = isAllocated ? '#2a4a6a' : '#1a2a3a';
        strokeColor = isAllocated ? '#5a90d0' : '#3a4a5a';
        glowColor = isAllocated ? 'rgba(90, 144, 208, 0.5)' : '';
      } else if (node.ascendancyName) {
        fillColor = isAllocated ? '#5a3010' : '#2a1a0a';
        strokeColor = isAllocated ? '#cd853f' : '#4a3a2a';
        glowColor = isAllocated ? 'rgba(205, 133, 63, 0.5)' : '';
      } else {
        fillColor = isAllocated ? '#4a3a10' : '#1a1a1a';
        strokeColor = isAllocated ? '#a08020' : '#3a3a3a';
        glowColor = isAllocated ? 'rgba(160, 128, 32, 0.4)' : '';
      }

      // PathOfBuilding approach: No opacity dimming, use color distinction only
      // Unallocated nodes are darker colored but still at full opacity
      ctx.globalAlpha = 1.0;

      // Draw glow for allocated nodes
      if (glowColor && isAllocated) {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = displayRadius * 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
        ctx.restore();
      }

      // Try to draw icon for allocated nodes
      let drewIcon = false;
      if (isAllocated && node.icon) {
        const relativePath = iconPathToRelativePath(node.icon);
        if (relativePath) {
          const img = imageCache.current.get(relativePath);
          if (img) {
            // Draw circular clip with icon
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
            ctx.clip();

            // Draw icon centered and scaled
            const iconSize = displayRadius * 2.2; // Slightly larger than circle to fill it
            ctx.drawImage(
              img,
              node.x - iconSize / 2,
              node.y - iconSize / 2,
              iconSize,
              iconSize
            );
            ctx.restore();
            drewIcon = true;
          }
        }
      }

      // Draw fallback circle if no icon
      if (!drewIcon) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      // Draw border
      ctx.beginPath();
      ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Hover highlight ring
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius * 1.1, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Reset opacity
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

  }, [positionedNodes, viewState, allocatedNodesSet, hoveredNode, renderKey, imagesLoaded, classImagesLoaded, treeStructure, passiveTreeData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setViewState(prev => ({ ...prev })); // Trigger re-render
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle close
  const handleClose = useCallback(async () => {
    if (window.electronAPI?.closeTreeWindow) {
      await window.electronAPI.closeTreeWindow();
    }
  }, []);

  // Handle window resize
  const handleResizeStart = useCallback((direction: string) => {
    return async (e: React.MouseEvent) => {
      e.preventDefault();
      if (window.electronAPI?.startTreeWindowResize) {
        await window.electronAPI.startTreeWindowResize(direction);

        const handleMouseMove = async (moveEvent: MouseEvent) => {
          if (window.electronAPI?.resizeTreeWindow) {
            await window.electronAPI.resizeTreeWindow(moveEvent.screenX, moveEvent.screenY);
          }
        };

        const handleMouseUp = async () => {
          if (window.electronAPI?.endTreeWindowResize) {
            await window.electronAPI.endTreeWindowResize();
          }
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    if (!positionedNodes || !containerRef.current) return;

    const bounds = getTreeBounds(positionedNodes);
    const container = containerRef.current;
    const scale = 0.08;

    setViewState({
      scale,
      offsetX: container.clientWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
      offsetY: container.clientHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
    });
  }, [positionedNodes]);

  // Handle loadout switch
  const handleLoadoutSwitch = useCallback(async (loadoutId: string) => {
    if (!window.electronAPI?.switchTreeLoadout || !treeStructure) {
      console.log('Cannot switch: missing API or tree structure');
      return;
    }
    
    console.log('Switching to loadout:', loadoutId, 'from:', activeLoadoutId);
    
    try {
      const newTreeData = await window.electronAPI.switchTreeLoadout(loadoutId);
      console.log('Received tree data:', newTreeData);
      
      if (newTreeData) {
        // Convert serialized data back to proper format
        const treeData: PassiveTreeData = {
          ...newTreeData,
          masterySelections: new Map(Object.entries(newTreeData.masterySelections || {})),
          jewelSockets: newTreeData.jewelSockets ? new Map(Object.entries(newTreeData.jewelSockets)) : undefined,
        };
        
        console.log('Setting new tree data with', treeData.allocatedNodes?.length, 'nodes, class:', treeData.className);
        
        // Update state - use functional updates to ensure React sees the changes
        setPassiveTreeData(treeData);
        setActiveLoadoutId(loadoutId);
        setRenderKey(k => k + 1); // Force canvas re-render
        
        console.log('State updated, activeLoadoutId should now be:', loadoutId);
      } else {
        console.log('No tree data received from switch');
      }
    } catch (error) {
      console.error('Failed to switch loadout:', error);
    }
  }, [treeStructure, activeLoadoutId]);

  // Calculate stats for display
  const stats = useMemo(() => {
    if (!passiveTreeData || !positionedNodes) return null;
    return calculateTreeStats(passiveTreeData.allocatedNodes, positionedNodes);
  }, [passiveTreeData, positionedNodes]);

  if (loading) {
    return (
      <div className="passive-tree-window">
        <div className="tree-loading">
          <div className="loading-spinner"></div>
          <p>{loadingStatus}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="passive-tree-window">
        <div className="tree-error">
          <p>{error}</p>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="passive-tree-window">
      {/* Resize handles */}
      <div className="resize-handle resize-top" onMouseDown={handleResizeStart('top')}></div>
      <div className="resize-handle resize-right" onMouseDown={handleResizeStart('right')}></div>
      <div className="resize-handle resize-bottom" onMouseDown={handleResizeStart('bottom')}></div>
      <div className="resize-handle resize-left" onMouseDown={handleResizeStart('left')}></div>
      <div className="resize-handle resize-top-left" onMouseDown={handleResizeStart('top-left')}></div>
      <div className="resize-handle resize-top-right" onMouseDown={handleResizeStart('top-right')}></div>
      <div className="resize-handle resize-bottom-left" onMouseDown={handleResizeStart('bottom-left')}></div>
      <div className="resize-handle resize-bottom-right" onMouseDown={handleResizeStart('bottom-right')}></div>

      <div className="tree-header">
        <div className="tree-info">
          <span className="tree-title">Passive Tree</span>
          {passiveTreeData && (
            <>
              <span className="tree-class">
                {passiveTreeData.className}
                {passiveTreeData.ascendClassName && passiveTreeData.ascendClassName !== 'None' &&
                  ` - ${passiveTreeData.ascendClassName}`}
              </span>
              <span className="tree-points">
                {passiveTreeData.allocatedNodes?.length || 0} points
              </span>
            </>
          )}
          {/* Loadout Selector */}
          {loadouts.length > 1 && (
            <div className="tree-loadout-selector">
              <select
                key={`loadout-select-${activeLoadoutId}`}
                value={activeLoadoutId}
                onChange={(e) => {
                  const newId = e.target.value;
                  console.log('Dropdown onChange:', newId);
                  handleLoadoutSwitch(newId);
                }}
                className="loadout-dropdown"
              >
                {loadouts.map((loadout) => (
                  <option 
                    key={loadout.id} 
                    value={loadout.id}
                    disabled={!loadout.hasTree}
                  >
                    {loadout.name}{!loadout.hasTree ? ' (no tree)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="tree-controls">
          <span className="zoom-level">{Math.round(viewState.scale * 100)}%</span>
          <button
            className="zoom-btn"
            onClick={() => setViewState(prev => ({ ...prev, scale: Math.min(0.5, prev.scale * 1.2) }))}
          >
            +
          </button>
          <button
            className="zoom-btn"
            onClick={() => setViewState(prev => ({ ...prev, scale: Math.max(0.01, prev.scale / 1.2) }))}
          >
            −
          </button>
          <button className="reset-btn" onClick={handleResetView}>
            Reset
          </button>
          <button 
            className="minimize-btn" 
            onClick={async () => {
              if (window.electronAPI?.minimizeTreeWindow) {
                await window.electronAPI.minimizeTreeWindow();
              }
            }}
            title="Minimize"
          >
            −
          </button>
          <button className="close-btn" onClick={handleClose} title="Close">×</button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="tree-canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="tree-canvas" />

        {/* Node tooltip - follows mouse cursor */}
        {hoveredNode && (
          <div 
            className="node-tooltip"
            style={{
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              right: 'auto',
            }}
          >
            <div className="tooltip-name">{hoveredNode.name}</div>
            {hoveredNode.stats.length > 0 && (
              <div className="tooltip-stats">
                {hoveredNode.stats.map((stat, i) => (
                  <div key={i} className="tooltip-stat">{stat}</div>
                ))}
              </div>
            )}
            {hoveredNode.ascendancyName && (
              <div className="tooltip-ascendancy">{hoveredNode.ascendancyName}</div>
            )}
            <div className="tooltip-allocated">
              {allocatedNodesSet.has(hoveredNode.id) ? '✓ Allocated' : '○ Not allocated'}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="tree-legend">
        <div className="legend-item">
          <span className="legend-dot allocated"></span>
          <span>Allocated</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot notable"></span>
          <span>Notable</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot keystone"></span>
          <span>Keystone</span>
        </div>
      </div>
    </div>
  );
};

export default PassiveTreeWindow;

