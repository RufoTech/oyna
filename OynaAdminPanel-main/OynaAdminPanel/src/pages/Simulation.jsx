import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaPlaystation } from 'react-icons/fa';
import { BsPcDisplay } from 'react-icons/bs';
import { MdMeetingRoom } from 'react-icons/md';
import {
  useGetVenuesQuery,
  useGetVenueSpecsQuery,
  useGetVenueLayoutQuery,
  useUpdateVenueLayoutMutation,
  useGetBlockedUsersQuery,
  useBlockUserForVenueMutation,
} from '../store/api/venuesApi';
import { useCheckInReservationMutation, useUpdateReservationStatusMutation, useGetReservationsByVenueQuery, useGetReservationsQuery } from '../store/api/reservationsApi';
import SimulationTutorial from '../components/SimulationTutorial';

const GRID_SIZE = 20;
const CANVAS_SIZE = 2000;
const HISTORY_LIMIT = 50;
const AUTOSAVE_DELAY = 1500;
const DEFAULT_SIZE = {
  tier: { w: 140, h: 140 },
};
const ZOOM_LEVELS = [0.55, 0.65, 0.75, 0.9, 1, 1.15, 1.3];

const TIER_COLOR_PRESETS = [
  { color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300', swatch: 'bg-sky-500' },
  { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', swatch: 'bg-emerald-500' },
  { color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300', swatch: 'bg-violet-500' },
  { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300', swatch: 'bg-amber-500' },
  { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300', swatch: 'bg-cyan-500' },
  { color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300', swatch: 'bg-rose-500' },
  { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300', swatch: 'bg-indigo-500' },
];

const STATUS_META = {
  available: { swatch: 'bg-green-500', label: 'statusAvailable' },
  reserved: { swatch: 'bg-orange-500', label: 'statusReserved' },
  occupied: { swatch: 'bg-red-500', label: 'statusOccupied' },
  disabled: { swatch: 'bg-gray-500', label: 'statusDisabled' },
};

const STATUS_OPTIONS = ['available', 'reserved', 'occupied', 'disabled'];

const REACT_ICONS_MAP = {
  Playstation: <FaPlaystation />,
  'PC Display': <BsPcDisplay />,
  'Meeting Room': <MdMeetingRoom />,
};

const generateId = () => `obj_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;
const rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const checkCollision = (rect, items, ignoreId = null) =>
  items.some((other) => {
    if (other.id === rect.id || other.id === ignoreId) return false;
    return rectsOverlap(rect, other);
  });

const colorForTierIndex = (index) => TIER_COLOR_PRESETS[index % TIER_COLOR_PRESETS.length];

const getIconName = (icon) => {
  if (!icon) return 'monitor';
  if (typeof icon === 'string') return icon;
  if (typeof icon?.name === 'string') return icon.name;
  if (typeof icon?.icon === 'string') return icon.icon;
  return 'monitor';
};

const renderIcon = (icon, sizeStyle = { fontSize: 32 }) => {
  const name = getIconName(icon);
  if (REACT_ICONS_MAP[name]) {
    return (
      <div className="flex items-center justify-center" style={sizeStyle}>
        {REACT_ICONS_MAP[name]}
      </div>
    );
  }

  return (
    <span className="material-symbols-outlined" style={sizeStyle}>
      {name}
    </span>
  );
};

const getClosestAnchors = (a, b) => {
  const anchorsA = [
    { x: a.x + a.w / 2, y: a.y },
    { x: a.x + a.w, y: a.y + a.h / 2 },
    { x: a.x + a.w / 2, y: a.y + a.h },
    { x: a.x, y: a.y + a.h / 2 },
  ];
  const anchorsB = [
    { x: b.x + b.w / 2, y: b.y },
    { x: b.x + b.w, y: b.y + b.h / 2 },
    { x: b.x + b.w / 2, y: b.y + b.h },
    { x: b.x, y: b.y + b.h / 2 },
  ];

  let minDist = Infinity;
  let bestA = anchorsA[0];
  let bestB = anchorsB[0];

  for (const ptA of anchorsA) {
    for (const ptB of anchorsB) {
      const dist = Math.hypot(ptA.x - ptB.x, ptA.y - ptB.y);
      if (dist < minDist) {
        minDist = dist;
        bestA = ptA;
        bestB = ptB;
      }
    }
  }

  return { bestA, bestB };
};

const ConnectionLayer = memo(function ConnectionLayer({ items, dragLine }) {
  return (
    <svg className="absolute inset-0 z-10 h-full w-full pointer-events-none">
      {items.flatMap((item) =>
        (item.connectedTo || []).map((targetId) => {
          const target = items.find((candidate) => candidate.id === targetId);
          if (!target) return null;

          const { bestA, bestB } = getClosestAnchors(item, target);
          return (
            <line
              key={`${item.id}-${targetId}`}
              x1={bestA.x}
              y1={bestA.y}
              x2={bestB.x}
              y2={bestB.y}
              stroke="#64748b"
              strokeWidth="3"
              strokeDasharray="8,8"
            />
          );
        })
      )}
      {dragLine && (
        <line
          x1={dragLine.startX}
          y1={dragLine.startY}
          x2={dragLine.currentX}
          y2={dragLine.currentY}
          stroke="#0058bc"
          strokeWidth="3"
          strokeDasharray="8,8"
        />
      )}
    </svg>
  );
});

const ANCHOR_POSITIONS = [
  { key: 'top', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { key: 'right', className: 'top-1/2 right-0 -translate-y-1/2 translate-x-1/2' },
  { key: 'bottom', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
  { key: 'left', className: 'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2' },
];

const CanvasItem = memo(function CanvasItem({
  item,
  isSelected,
  tier,
  paletteColor,
  onPointerDown,
  onAnchorPointerDown,
  onStatusChange,
}) {
  const { t } = useTranslation();
  const status = STATUS_META[item.status] || STATUS_META.available;
  const iconWrapColor = paletteColor?.color || 'bg-primary/10 text-primary';
  const isReserved = item.status === 'reserved';

  return (
    <div
      data-item-id={item.id}
      onPointerDown={(event) => onPointerDown(event, item.id)}
      className={`absolute flex flex-col items-center justify-center border backdrop-blur-xl transition-all duration-300 touch-none select-none ${
        isReserved
          ? 'z-30 border-orange-400 bg-orange-50/90 shadow-[0_0_30px_rgba(251,146,60,0.4)] dark:bg-orange-950/40 dark:border-orange-500'
          : isSelected
            ? 'z-50 border-primary/50 bg-white/80 shadow-[0_0_40px_rgba(var(--primary),0.25)] ring-2 ring-primary ring-offset-4 ring-offset-transparent dark:bg-slate-900/80'
            : `z-20 border-slate-200/60 bg-white/80 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)] hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(15,23,42,0.2)] dark:bg-slate-900/80 dark:border-slate-700/60`
      } ${item.status === 'disabled' ? 'opacity-60 grayscale' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        borderRadius: 28,
        cursor: 'grab',
        ...(isReserved ? { animation: 'reservedGlow 2s ease-in-out infinite' } : {}),
      }}
    >
      {isSelected && onStatusChange && (
        <div
          className="absolute -top-12 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 shadow-xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {STATUS_OPTIONS.map((statusKey) => {
            const meta = STATUS_META[statusKey];
            const active = item.status === statusKey;
            return (
              <button
                key={statusKey}
                type="button"
                title={t(`simulation.toolbar.${meta.label}`)}
                onClick={(event) => {
                  event.stopPropagation();
                  onStatusChange(item.id, statusKey);
                }}
                className={`h-7 w-7 rounded-md transition ${meta.swatch} ${
                  active
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-white scale-110 dark:ring-offset-slate-900'
                    : 'opacity-60 hover:opacity-100'
                }`}
              />
            );
          })}
        </div>
      )}

      <span className={`absolute -right-2 -top-2 h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-950 ${status.swatch}`} />
      <span className={`absolute left-3 top-3 h-1.5 w-10 rounded-full ${status.swatch}`} />

      {/* "!" badge — shows for ANY reserved table, no socket dependency */}
      {isReserved && (
        <div className="absolute -top-3 -right-3 z-[100] flex h-9 w-9 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl ring-2 ring-white dark:ring-slate-950">
            <span className="text-xs font-black">!</span>
          </span>
        </div>
      )}

      <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${iconWrapColor}`}>
        {renderIcon(tier?.icon, { fontSize: 32 })}
      </div>

      <span
        className="w-full px-3 text-center text-[13px] font-black leading-tight text-on-surface dark:text-white"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.name}
      </span>

      {item.capacity > 0 && (
        <span className="mt-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-on-surface-variant dark:bg-slate-800 dark:text-slate-400">
          {item.capacity} slot
        </span>
      )}

      {isSelected &&
        ANCHOR_POSITIONS.map((anchor) => (
          <span
            key={anchor.key}
            onPointerDown={(event) => onAnchorPointerDown(event, item)}
            className={`absolute ${anchor.className} z-50 h-5 w-5 rounded-full border-[3px] border-white bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-125 dark:border-slate-950`}
            style={{ cursor: 'crosshair' }}
          />
        ))}
    </div>
  );
});

const Simulation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const autosaveRef = useRef(null);
  const clipboardRef = useRef(null);
  const [history, setHistory] = useState({ stack: [[]], step: 0 });
  const historyRef = useRef(history);

  const { data: venues = [], isLoading: venuesLoading } = useGetVenuesQuery();
  const venueId = venues[0]?._id;
  const { data: savedSpecs } = useGetVenueSpecsQuery(venueId, { skip: !venueId });
  const { data: savedLayout, isLoading: layoutLoading } = useGetVenueLayoutQuery(venueId, {
    skip: !venueId,
  });
  const [updateVenueLayout, { isLoading: isSaving }] = useUpdateVenueLayoutMutation();

  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [dragLine, setDragLine] = useState(null);
  const [entryModalOpen, setEntryModalOpen] = useState(true);
  const [studioActive, setStudioActive] = useState(false);
  const [fullscreenAttempted, setFullscreenAttempted] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isExitingStudio, setIsExitingStudio] = useState(false);
  const [zoom, setZoom] = useState(0.75);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingTableIds, setPendingTableIds] = useState(new Set());
  const [simCheckInCode, setSimCheckInCode] = useState('');
  const [checkInReservation, { isLoading: isCheckingIn }] = useCheckInReservationMutation();

  // --- Reservation Dialog for reserved tables ---
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { data: venueReservations = {} } = useGetReservationsByVenueQuery(venueId, { skip: !venueId, pollingInterval: 30000 });
  const [updateReservationStatus, { isLoading: isUpdating }] = useUpdateReservationStatusMutation();

  // --- Search Dialog ---
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchData = {} } = useGetReservationsQuery(
    { page: 1, limit: 15, search: debouncedSearch },
    { skip: !isSearchModalOpen }
  );
  const searchReservations = searchData.reservations || [];

  // --- Block User ---
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockUserForVenue] = useBlockUserForVenueMutation();

  const { data: blockedUsers = [] } = useGetBlockedUsersQuery(selectedReservation?.venueId, {
    skip: !selectedReservation?.venueId,
  });

  const isUserBlocked = selectedReservation?.userEmail ? blockedUsers.includes(selectedReservation.userEmail) : false;

  const confirmBlockToggle = async () => {
    if (!selectedReservation?.userEmail) return;
    const action = isUserBlocked ? 'unblock' : 'block';
    try {
      await blockUserForVenue({
        venueId: selectedReservation.venueId,
        email: selectedReservation.userEmail,
        action
      }).unwrap();
      toast.success(action === 'block' 
        ? t('bookings.toast.userBlocked', 'İstifadəçi bloklandı.') 
        : t('bookings.toast.userUnblocked', 'İstifadəçi blokdan çıxarıldı.'));
      setIsBlockModalOpen(false);
    } catch (err) {
      toast.error(t('bookings.toast.error', 'Xəta baş verdi'));
    }
  };

  const findReservationForTable = useCallback((tableId) => {
    const resList = venueReservations?.reservations || venueReservations || [];
    if (!Array.isArray(resList)) return null;
    return resList.find(r => r.tableId === tableId && (r.status === 'pending' || r.status === 'awaiting_arrival'));
  }, [venueReservations]);

  const handleReservationStatusUpdate = async (id, status) => {
    try {
      if (status === 'rejected' && !rejectReason.trim()) {
        toast.error(t('bookings.toast.rejectReasonRequired'));
        return;
      }
      
      await updateReservationStatus({ id, status, rejectReason: status === 'rejected' ? rejectReason : '' }).unwrap();
      
      const statusText = status === 'accepted' ? t('bookings.toast.acceptedStr') : t('bookings.toast.rejectedStr');
      toast.success(t('bookings.toast.statusSuccess', { status: statusText }));
      
      setReservationDialogOpen(false);
      setSelectedReservation(null);
      setRejectMode(false);
      setRejectReason('');
    } catch (err) {
      toast.error(t('bookings.toast.error'));
      console.error(err);
    }
  };

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Listen for socket events (tablePendingReservation + venueLayoutUpdate)
  useEffect(() => {
    const seenPendingIds = new Set(); // Dedup within same mount to avoid double-toasts

    const handleTablePending = (e) => {
      const { tableId, userName, tableName } = e.detail || {};
      if (tableId) {
        setPendingTableIds(prev => {
          const next = new Set(prev);
          next.add(tableId);
          return next;
        });
        // Only show toast once per tableId (avoid double from newReservation + tablePendingReservation)
        if (!seenPendingIds.has(tableId)) {
          seenPendingIds.add(tableId);
          toast.info(`🔔 "${tableName || 'Masa'}" üçün yeni rezervasiya! (${userName || 'User'})`);
          // Auto-clear from seen after 5s so future reservations for same table still show toast
          setTimeout(() => seenPendingIds.delete(tableId), 5000);
        }
      }
    };

    const handleLayoutUpdate = (e) => {
      const { venueId: eventVenueId, layout } = e.detail || {};
      
      // Only process layout update if it's for the currently open venue simulation
      if (eventVenueId && eventVenueId !== venueId) return;

      if (layout?.items && Array.isArray(layout.items)) {
        setItems(layout.items);
      }
    };

    window.addEventListener('tablePendingReservation', handleTablePending);
    window.addEventListener('venueLayoutUpdate', handleLayoutUpdate);
    return () => {
      window.removeEventListener('tablePendingReservation', handleTablePending);
      window.removeEventListener('venueLayoutUpdate', handleLayoutUpdate);
    };
  }, []);

  useEffect(() => {
    if (!studioActive) return;
    const seen = localStorage.getItem('simulation_tutorial_seen');
    if (!seen) setTutorialOpen(true);
  }, [studioActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setNativeFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (savedLayout?.items && Array.isArray(savedLayout.items)) {
      setItems(savedLayout.items);
      setHistory({ stack: [savedLayout.items], step: 0 });
    }
  }, [savedLayout]);

  const allTiers = useMemo(() => {
    const tiers = savedSpecs?.tiers || [];
    return tiers.map((tier, index) => ({
      ...tier,
      id: tier.id || tier._id || `tier_${index}_${String(tier.title || tier.type || 'pc').replace(/\s+/g, '_')}`,
    }));
  }, [savedSpecs]);

  const tierById = useMemo(() => {
    const map = new Map();
    allTiers.forEach((tier) => map.set(tier.id, tier));
    return map;
  }, [allTiers]);

  const selectedItem = items.find((item) => item.id === selectedId);

  const placedByTier = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (!item.tierId) return acc;
        acc[item.tierId] = (acc[item.tierId] || 0) + 1;
        return acc;
      }, {}),
    [items]
  );

  const statusCounts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { available: 0, reserved: 0, occupied: 0, disabled: 0 }
      ),
    [items]
  );

  const clearPendingAutosave = useCallback(() => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
      autosaveRef.current = null;
    }
  }, []);

  const scheduleAutosave = useCallback(
    (nextItems) => {
      if (!venueId) return;
      clearPendingAutosave();

      autosaveRef.current = setTimeout(async () => {
        try {
          await updateVenueLayout({ venueId, layout: { items: nextItems } }).unwrap();
          setLastSavedAt(Date.now());
        } catch (err) {
          console.error('Autosave failed:', err);
        } finally {
          autosaveRef.current = null;
        }
      }, AUTOSAVE_DELAY);
    },
    [clearPendingAutosave, venueId, updateVenueLayout]
  );

  const commit = useCallback(
    (nextItems) => {
      const h = historyRef.current;
      const truncated = h.stack.slice(0, h.step + 1);
      truncated.push(nextItems);
      const capped = truncated.length > HISTORY_LIMIT ? truncated.slice(-HISTORY_LIMIT) : truncated;
      setHistory({ stack: capped, step: capped.length - 1 });
      setItems(nextItems);
      scheduleAutosave(nextItems);
    },
    [scheduleAutosave]
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.step <= 0) return;

    const nextStep = h.step - 1;
    const snapshot = h.stack[nextStep];
    setHistory({ ...h, step: nextStep });
    setItems(snapshot);
    setSelectedId(null);
    scheduleAutosave(snapshot);
  }, [scheduleAutosave]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.step >= h.stack.length - 1) return;

    const nextStep = h.step + 1;
    const snapshot = h.stack[nextStep];
    setHistory({ ...h, step: nextStep });
    setItems(snapshot);
    setSelectedId(null);
    scheduleAutosave(snapshot);
  }, [scheduleAutosave]);

  const handlePaletteDragStart = (event, payload) => {
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
    setTimeout(() => setSidebarOpen(false), 0);
  };

  const handlePaletteDragEnd = () => {
    setSidebarOpen(true);
  };

  const handleCanvasDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (event) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    let payload;
    try {
      payload = JSON.parse(event.dataTransfer.getData('application/json'));
    } catch {
      return;
    }

    if (!payload || payload.kind !== 'tier') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        snapToGrid((event.clientX - rect.left) / zoom - DEFAULT_SIZE.tier.w / 2),
        CANVAS_SIZE - DEFAULT_SIZE.tier.w
      )
    );
    const y = Math.max(
      0,
      Math.min(
        snapToGrid((event.clientY - rect.top) / zoom - DEFAULT_SIZE.tier.h / 2),
        CANVAS_SIZE - DEFAULT_SIZE.tier.h
      )
    );

    const tier = tierById.get(payload.tierId);
    const newItem = {
      id: generateId(),
      type: tier?.type || 'pc',
      tierId: payload.tierId,
      name: `${tier?.title || 'Obyekt'} ${items.filter((item) => item.tierId === payload.tierId).length + 1}`,
      x,
      y,
      w: DEFAULT_SIZE.tier.w,
      h: DEFAULT_SIZE.tier.h,
      r: 0,
      status: 'available',
      price: Number(tier?.price) || 0,
      capacity: tier?.type === 'playstation' ? 2 : 1,
      connectedTo: [],
    };

    if (checkCollision(newItem, items)) {
      toast.error(t('simulation.toasts.collision'));
      return;
    }

    commit([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleAnchorPointerDown = useCallback(
    (event, item) => {
      event.stopPropagation();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      setDragLine({
        fromId: item.id,
        startX: item.x + item.w / 2,
        startY: item.y + item.h / 2,
        currentX: (event.clientX - rect.left) / zoom,
        currentY: (event.clientY - rect.top) / zoom,
      });
      event.target.setPointerCapture(event.pointerId);
    },
    [zoom]
  );

  const handleItemPointerDown = useCallback((event, id) => {
    if (event.button !== 0) return;
    event.stopPropagation();

    const snapshot = historyRef.current.stack[historyRef.current.step];
    const item = snapshot.find((candidate) => candidate.id === id);
    if (!item) return;

    if (item.status === 'reserved') {
      const reservation = findReservationForTable(item.id);
      if (reservation) {
        setSelectedReservation(reservation);
        setReservationDialogOpen(true);
        setRejectMode(false);
        setRejectReason('');
        return;
      }
    }

    setSelectedId(id);

    setDragInfo({
      id,
      startX: event.clientX,
      startY: event.clientY,
      initX: item.x,
      initY: item.y,
    });
    event.target.setPointerCapture(event.pointerId);
  }, [findReservationForTable]);

  const handleCanvasPointerMove = (event) => {
    if (dragLine) {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (event.clientX - rect.left) / zoom;
      const currentY = (event.clientY - rect.top) / zoom;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragLine((prev) => (prev ? { ...prev, currentX, currentY } : prev));
      });
      return;
    }

    if (!dragInfo) return;

    const dx = (event.clientX - dragInfo.startX) / zoom;
    const dy = (event.clientY - dragInfo.startY) / zoom;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== dragInfo.id) return item;

          const x = Math.max(0, Math.min(snapToGrid(dragInfo.initX + dx), CANVAS_SIZE - item.w));
          const y = Math.max(0, Math.min(snapToGrid(dragInfo.initY + dy), CANVAS_SIZE - item.h));
          return { ...item, x, y };
        })
      );
    });
  };

  const handleCanvasPointerUp = (event) => {
    if (dragLine) {
      try {
        event.target.releasePointerCapture?.(event.pointerId);
      } catch {
        /* noop */
      }

      const element = event.target;
      const previousVisibility = element.style.visibility;
      element.style.visibility = 'hidden';
      const underPointer = document.elementFromPoint(event.clientX, event.clientY);
      element.style.visibility = previousVisibility;

      const targetNode = underPointer?.closest('[data-item-id]');
      if (targetNode) {
        const targetId = targetNode.getAttribute('data-item-id');
        if (targetId && targetId !== dragLine.fromId) {
          const next = items.map((item) =>
            item.id === dragLine.fromId && !(item.connectedTo || []).includes(targetId)
              ? { ...item, connectedTo: [...(item.connectedTo || []), targetId] }
              : item
          );
          commit(next);
        }
      }

      setDragLine(null);
      return;
    }

    if (!dragInfo) return;

    try {
      event.target.releasePointerCapture?.(event.pointerId);
    } catch {
      /* noop */
    }

    const moved = items.find((item) => item.id === dragInfo.id);
    if (!moved) {
      setDragInfo(null);
      return;
    }

    if (checkCollision(moved, items, moved.id)) {
      toast.error(t('simulation.toasts.collision'));
      setItems(historyRef.current.stack[historyRef.current.step]);
      setDragInfo(null);
      return;
    }

    commit(items);
    setDragInfo(null);
  };

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        const next = items
          .filter((item) => item.id !== selectedId)
          .map((item) => ({
            ...item,
            connectedTo: (item.connectedTo || []).filter((id) => id !== selectedId),
          }));
        commit(next);
        setSelectedId(null);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && selectedId) {
        event.preventDefault();
        const source = items.find((item) => item.id === selectedId);
        if (!source) return;
        clipboardRef.current = { ...source, connectedTo: [] };
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x' && selectedId) {
        event.preventDefault();
        const source = items.find((item) => item.id === selectedId);
        if (!source) return;
        clipboardRef.current = { ...source, connectedTo: [] };
        const next = items
          .filter((item) => item.id !== selectedId)
          .map((item) => ({
            ...item,
            connectedTo: (item.connectedTo || []).filter((id) => id !== selectedId),
          }));
        commit(next);
        setSelectedId(null);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && clipboardRef.current) {
        event.preventDefault();
        const source = clipboardRef.current;
        let placed = null;
        for (let step = 1; step <= 20 && !placed; step += 1) {
          const offset = step * GRID_SIZE;
          const candidate = {
            ...source,
            id: generateId(),
            x: Math.max(0, Math.min(source.x + offset, CANVAS_SIZE - source.w)),
            y: Math.max(0, Math.min(source.y + offset, CANVAS_SIZE - source.h)),
            connectedTo: [],
          };
          if (!checkCollision(candidate, items)) placed = candidate;
        }

        if (!placed) {
          toast.error(t('simulation.toasts.collision'));
          return;
        }

        commit([...items, placed]);
        setSelectedId(placed.id);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, selectedId, commit, undo, t]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
        if (venueId) {
          const latest = historyRef.current.stack[historyRef.current.step] || [];
          updateVenueLayout({ venueId, layout: { items: latest } });
        }
      }
    };
  }, [venueId, updateVenueLayout]);

  const updateSelected = (field, value) => {
    if (!selectedId) return;
    const next = items.map((item) => (item.id === selectedId ? { ...item, [field]: value } : item));
    commit(next);
  };

  const handleStatusChange = useCallback(
    (id, status) => {
      setItems((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, status } : item));
        const h = historyRef.current;
        const truncated = h.stack.slice(0, h.step + 1);
        truncated.push(next);
        const capped =
          truncated.length > HISTORY_LIMIT ? truncated.slice(-HISTORY_LIMIT) : truncated;
        setHistory({ stack: capped, step: capped.length - 1 });
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = items
      .filter((item) => item.id !== selectedId)
      .map((item) => ({
        ...item,
        connectedTo: (item.connectedTo || []).filter((id) => id !== selectedId),
      }));
    commit(next);
    setSelectedId(null);
  };

  const clearConnections = () => {
    if (!selectedId) return;
    const next = items.map((item) => ({
      ...item,
      connectedTo:
        item.id === selectedId
          ? []
          : (item.connectedTo || []).filter((id) => id !== selectedId),
    }));
    commit(next);
  };

  const saveNow = async () => {
    if (!venueId) return;
    clearPendingAutosave();

    try {
      await updateVenueLayout({ venueId, layout: { items } }).unwrap();
      setLastSavedAt(Date.now());
      toast.success(t('simulation.toasts.saved'));
    } catch (err) {
      toast.error(err?.data?.message || t('simulation.toasts.saveError'));
    }
  };

  const enterStudio = async () => {
    setEntryModalOpen(false);
    setStudioActive(true);
    setFullscreenAttempted(true);

    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setNativeFullscreen(Boolean(document.fullscreenElement));
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
      setNativeFullscreen(false);
      toast.info(t('simulation.studio.fullscreenFallback'));
    }
  };

  const declineStudio = () => {
    navigate('/dashboard', { replace: true });
  };

  const exitStudio = async () => {
    if (!venueId || isExitingStudio) return;
    setIsExitingStudio(true);
    clearPendingAutosave();

    try {
      await updateVenueLayout({ venueId, layout: { items } }).unwrap();
      setLastSavedAt(Date.now());

      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Fullscreen exit failed:', err);
        }
      }

      setStudioActive(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || t('simulation.studio.exitSaveError'));
      setIsExitingStudio(false);
    }
  };

  if (venuesLoading || layoutLoading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center px-8">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">storefront</span>
          </div>
          <h2 className="mt-4 text-xl font-black text-on-surface dark:text-white">
            {t('simulation.noVenue')}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant dark:text-slate-400">
            {t('simulation.noVenueDesc')}
          </p>
          <button
            onClick={() => navigate('/venues')}
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-container"
          >
            {t('simulation.goToVenues')}
          </button>
        </div>
      </div>
    );
  }

  const canUndo = history.step > 0;
  const canRedo = history.step < history.stack.length - 1;
  const zoomPercent = Math.round(zoom * 100);

  const changeZoom = (direction) => {
    setZoom((currentZoom) => {
      const currentIndex = ZOOM_LEVELS.findIndex((value) => value >= currentZoom);
      if (direction < 0) return ZOOM_LEVELS[Math.max(0, currentIndex - 1)];
      const nextIndex = ZOOM_LEVELS.findIndex((value) => value > currentZoom);
      return ZOOM_LEVELS[nextIndex === -1 ? ZOOM_LEVELS.length - 1 : nextIndex];
    });
  };

  const studioShell = studioActive ? (
    <div className="fixed inset-0 z-[90] flex min-h-0 overflow-hidden bg-[#f4f7fb] text-on-surface dark:bg-slate-950 dark:text-slate-100">
      <SimulationTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      <aside
        className={`shrink-0 overflow-hidden border-r border-slate-200/50 bg-white/80 backdrop-blur-3xl transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] dark:border-slate-800/50 dark:bg-slate-950/80 ${
          sidebarOpen ? 'w-[360px] border-r' : 'w-0 border-r-0'
        }`}
      >
        <div className="flex h-full w-[360px] flex-col">
        <div className="border-b border-slate-200/50 bg-transparent px-6 py-6 dark:border-slate-800/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                title={t('simulation.toolbar.toggleSidebar')}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-xl">menu_open</span>
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black tracking-tight text-on-surface dark:text-white">
                  {t('simulation.title')}
                </h2>
                <p className="text-xs font-medium text-on-surface-variant dark:text-slate-400">
                  {t('simulation.subtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setTutorialOpen(true)}
              title={t('simulation.toolbar.tutorial')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100/50 text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary dark:bg-slate-800/50 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-lg">help</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-100/60 p-3 dark:bg-slate-800/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">
                Tip
              </p>
              <p className="mt-1 text-xl font-black text-on-surface dark:text-white">{allTiers.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-100/60 p-3 dark:bg-slate-800/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">
                Zalda
              </p>
              <p className="mt-1 text-xl font-black text-on-surface dark:text-white">{items.length}</p>
            </div>
            <div className="rounded-2xl bg-green-500/10 p-3 dark:bg-green-500/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-300">
                Bos
              </p>
              <p className="mt-1 text-xl font-black text-green-700 dark:text-green-300">
                {statusCounts.available}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-500/10 p-3 dark:bg-orange-500/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-300">
                Rezerv
              </p>
              <p className="mt-1 text-xl font-black text-orange-700 dark:text-orange-300">
                {statusCounts.reserved}
              </p>
            </div>
            <div className="rounded-2xl bg-red-500/10 p-3 dark:bg-red-500/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-700 dark:text-red-300">
                Dolu
              </p>
              <p className="mt-1 text-xl font-black text-red-700 dark:text-red-300">
                {statusCounts.occupied}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-500/10 p-3 dark:bg-gray-500/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                Xarab
              </p>
              <p className="mt-1 text-xl font-black text-gray-700 dark:text-gray-300">
                {statusCounts.disabled}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Check-In Section */}
        <div className="border-b border-slate-200/50 px-4 py-4 dark:border-slate-800/50">
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-surface-container-highest dark:bg-slate-800 text-on-surface dark:text-white hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 rounded-xl font-bold transition-all group active:scale-95 cursor-pointer border border-transparent dark:border-slate-700"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">search</span>
            <span>{t('bookings.search.title', 'İstifadəçi Axtar')}</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400">
              {t('simulation.palette.pcTypes')}
            </span>
            <button
              onClick={() => navigate('/addSpecs')}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <span className="material-symbols-outlined text-base">add</span>
              {t('simulation.palette.addPcType')}
            </button>
          </div>

          {allTiers.length === 0 ? (
            <div className="rounded-[2rem] bg-primary/5 p-6 text-center shadow-inner">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md text-primary dark:bg-slate-800">
                <span className="material-symbols-outlined text-3xl">computer</span>
              </div>
              <p className="text-base font-black text-on-surface dark:text-white">
                {t('simulation.palette.pcEmpty')}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant dark:text-slate-400">
                Standart, orta ve VIP PC tiplerini Add Specs bolmesinden ekleyin.
              </p>
              <button
                onClick={() => navigate('/addSpecs')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                {t('simulation.palette.addPcType')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {allTiers.map((tier, index) => {
                const color =
                  tier.type === 'pc'
                    ? colorForTierIndex(index)
                    : {
                        color: 'bg-[#003791]/10 text-[#003791] dark:bg-[#2d64ff]/20 dark:text-[#9bb7ff]',
                        swatch: 'bg-[#003791]',
                      };

                return (
                  <div
                    key={tier.id}
                    draggable
                    onDragStart={(event) => handlePaletteDragStart(event, { kind: 'tier', tierId: tier.id })}
                    onDragEnd={handlePaletteDragEnd}
                    className="group relative overflow-hidden rounded-[1.25rem] bg-slate-50/50 p-3 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-primary/10 active:scale-95 active:cursor-grabbing dark:bg-slate-900/50 dark:hover:bg-slate-800/80"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1.5 rounded-l-[1.25rem] opacity-70 transition-opacity group-hover:opacity-100 ${color.swatch}`} />
                    <div className="flex items-center gap-4 pl-3">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${color.color}`}>
                        {renderIcon(tier.icon, { fontSize: 28 })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-on-surface dark:text-white">
                          {tier.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-on-surface-variant dark:text-slate-400">
                          <span>{t('simulation.palette.fromPerHour', { price: tier.price || 0 })}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>{placedByTier[tier.id] || 0} placed</span>
                        </div>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-on-surface-variant transition-colors group-hover:bg-primary group-hover:text-white dark:bg-slate-900 dark:text-slate-500">
                        <span className="material-symbols-outlined">drag_indicator</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/50 bg-transparent px-6 py-5 text-[11px] font-medium text-on-surface-variant dark:border-slate-800/50 dark:text-slate-400">
          <p>{t('simulation.palette.tip')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {['Del', 'Ctrl+Z', 'Ctrl+C', 'Ctrl+X', 'Ctrl+V'].map((key) => (
              <kbd
                key={key}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[10px] font-bold dark:bg-slate-800/60"
              >
                {key}
              </kbd>
            ))}
          </div>
        </div>
        </div>
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title={t('simulation.toolbar.toggleSidebar')}
            className="absolute left-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-on-surface shadow-lg shadow-slate-900/10 backdrop-blur transition hover:border-primary/40 hover:text-primary dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-white"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <div className="pointer-events-none absolute left-6 right-6 top-6 z-40 flex flex-wrap items-start justify-between gap-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/40 bg-white/60 px-4 py-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-primary/20 text-violet-600 dark:text-violet-300">
              <span className="material-symbols-outlined text-xl">dashboard_customize</span>
            </span>
            <div className="min-w-0 pr-2">
              <h1 className="text-[15px] font-black tracking-tight text-on-surface dark:text-white">
                Simulation Studio
              </h1>
              <p className="hidden text-xs font-medium text-on-surface-variant dark:text-slate-400 sm:block">
                {nativeFullscreen
                  ? t('simulation.studio.nativeFullscreen')
                  : fullscreenAttempted
                    ? t('simulation.studio.windowFullscreen')
                    : t('simulation.studio.ready')}
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-3">
            <div className="hidden items-center gap-4 rounded-full border border-white/40 bg-white/60 px-5 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 xl:flex">
              {Object.entries(STATUS_META).map(([key, value]) => (
                <span
                  key={key}
                  className="flex items-center gap-2 text-xs font-bold text-on-surface-variant dark:text-slate-400"
                >
                  <span className={`h-2.5 w-2.5 rounded-full shadow-inner ${value.swatch}`} />
                  {t(`simulation.toolbar.${value.label}`)}
                </span>
              ))}
            </div>

            <div className="flex items-center rounded-full border border-white/40 bg-white/60 p-1.5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
              <button
                onClick={() => changeZoom(-1)}
                title="Zoom out"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-slate-100/50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/50"
              >
                <span className="material-symbols-outlined text-xl">remove</span>
              </button>
              <span className="w-14 text-center text-sm font-black text-on-surface dark:text-white">
                {zoomPercent}%
              </span>
              <button
                onClick={() => changeZoom(1)}
                title="Zoom in"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-slate-100/50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/50"
              >
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>

            <button
              onClick={undo}
              disabled={!canUndo}
              title={t('simulation.toolbar.undo')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/60 text-on-surface-variant shadow-xl shadow-slate-900/5 backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-xl">undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title={t('simulation.toolbar.redo')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/60 text-on-surface-variant shadow-xl shadow-slate-900/5 backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-xl">redo</span>
            </button>

            <button
              onClick={saveNow}
              disabled={isSaving}
              className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-xl ${isSaving ? 'animate-spin' : ''}`}>
                {isSaving ? 'progress_activity' : 'save'}
              </span>
              {isSaving
                ? t('simulation.toolbar.saving')
                : lastSavedAt
                  ? t('simulation.toolbar.saved')
                  : t('simulation.toolbar.save')}
            </button>

            <button
              onClick={exitStudio}
              disabled={isExitingStudio}
              className="flex h-12 items-center gap-2 rounded-full bg-slate-900/90 px-6 text-sm font-black text-white shadow-xl shadow-slate-900/20 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-error disabled:opacity-60 dark:bg-white/90 dark:text-slate-950 dark:hover:bg-error dark:hover:text-white"
            >
              <span className={`material-symbols-outlined text-xl ${isExitingStudio ? 'animate-spin' : ''}`}>
                {isExitingStudio ? 'progress_activity' : 'logout'}
              </span>
              {t('simulation.studio.exit')}
            </button>
          </div>
        </div>

        <div
          className="relative min-h-0 flex-1 overflow-auto bg-[#eef3f9] p-5 pt-24 dark:bg-slate-950"
          onPointerDown={(event) => {
            if (event.target.dataset?.canvas === 'bg') setSelectedId(null);
          }}
        >
          <div
            className="relative"
            style={{ width: CANVAS_SIZE * zoom, height: CANVAS_SIZE * zoom }}
          >
            <div
              ref={canvasRef}
              data-canvas="bg"
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-950"
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                backgroundImage:
                  'linear-gradient(to right, rgba(100,116,139,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.16) 1px, transparent 1px)',
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
            >
              {items.length === 0 && (
                <div className="pointer-events-none absolute left-12 top-12 w-[390px] rounded-lg border border-dashed border-primary/30 bg-white/90 p-5 shadow-lg backdrop-blur dark:border-primary/30 dark:bg-slate-900/90">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">touch_app</span>
                  </div>
                  <p className="text-lg font-black text-on-surface dark:text-white">
                    {t('simulation.studio.emptyTitle')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant dark:text-slate-400">
                    {t('simulation.studio.emptyBody')}
                  </p>
                </div>
              )}

              <ConnectionLayer items={items} dragLine={dragLine} />

              {items.map((item) => {
                const tier = item.tierId ? tierById.get(item.tierId) : null;
                const paletteColor =
                  item.type === 'pc'
                    ? colorForTierIndex(Math.max(0, allTiers.findIndex((tierItem) => tierItem.id === item.tierId)))
                    : null;

                return (
                  <CanvasItem
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    tier={tier}
                    paletteColor={paletteColor}
                    onPointerDown={handleItemPointerDown}
                    onAnchorPointerDown={handleAnchorPointerDown}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {selectedItem && (
          <div className="pointer-events-none absolute bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)]">
            <div className="pointer-events-auto max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[2rem] border border-white/40 bg-white/80 shadow-[0_32px_80px_-16px_rgba(15,23,42,0.25)] backdrop-blur-3xl dark:border-white/10 dark:bg-slate-900/80">
              <div className="border-b border-slate-200/50 px-6 py-5 dark:border-slate-800/50">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-lg font-black text-on-surface dark:text-white">
                    <span className="material-symbols-outlined text-primary text-xl">tune</span>
                    {t('simulation.properties.title')}
                  </h2>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-slate-100/60 hover:text-error dark:text-slate-400 dark:hover:bg-slate-800/60"
                    aria-label="Close inspector"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-[1.25rem] bg-slate-100/50 p-4 dark:bg-slate-800/40">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-slate-800">
                      {renderIcon(tierById.get(selectedItem.tierId)?.icon, { fontSize: 28 })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-on-surface dark:text-white">
                        {selectedItem.name}
                      </p>
                      <p className="text-sm font-bold text-on-surface-variant dark:text-slate-400">
                        {tierById.get(selectedItem.tierId)?.title || 'Obyekt'}
                      </p>
                    </div>
                    <span className={`h-3 w-3 rounded-full shadow-inner ${STATUS_META[selectedItem.status]?.swatch || 'bg-slate-400'}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">
                    {t('simulation.properties.name')}
                  </label>
                  <input
                    type="text"
                    value={selectedItem.name || ''}
                    onChange={(event) => updateSelected('name', event.target.value)}
                    className="w-full rounded-2xl border-none bg-slate-100/70 px-4 py-3.5 text-sm font-bold text-on-surface outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/40 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>

                {(selectedItem.connectedTo || []).length > 0 && (
                  <button
                    onClick={clearConnections}
                    className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-amber-500/10 py-3 text-sm font-black text-amber-700 transition-colors hover:bg-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                  >
                    <span className="material-symbols-outlined text-lg">link_off</span>
                    {t('simulation.properties.clearConnections')}
                  </button>
                )}

                <button
                  onClick={deleteSelected}
                  className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-error/10 py-3 text-sm font-black text-error transition-colors hover:bg-error/20 dark:bg-error/10 dark:text-error/90 dark:hover:bg-error/20"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  {t('simulation.properties.deleteObject')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  ) : null;

  return (
    <>
      {entryModalOpen && !studioActive && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 bg-white/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="border-b border-slate-200/50 bg-slate-50/50 px-8 py-6 dark:border-slate-800/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-4xl">view_quilt</span>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">
                    Simulation Studio
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-on-surface dark:text-white">
                    {t('simulation.studio.entryTitle')}
                  </h2>
                </div>
              </div>
            </div>

            <div className="px-8 py-7">
              <p className="text-base leading-relaxed text-on-surface-variant dark:text-slate-300">
                {t('simulation.studio.entryBody')}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-100/60 p-4 dark:bg-slate-800/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">
                    Tip
                  </p>
                  <p className="mt-1 text-2xl font-black text-on-surface dark:text-white">{allTiers.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-100/60 p-4 dark:bg-slate-800/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">
                    Zalda
                  </p>
                  <p className="mt-1 text-2xl font-black text-on-surface dark:text-white">{items.length}</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4 dark:bg-emerald-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    Bos
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {statusCounts.available}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-500/10 p-4 dark:bg-blue-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">
                    Rezerv
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-300">
                    {statusCounts.reserved}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-4 dark:bg-amber-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                    Dolu
                  </p>
                  <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                    {statusCounts.occupied}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-500/10 p-4 dark:bg-rose-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">
                    Xarab
                  </p>
                  <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
                    {statusCounts.disabled}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={declineStudio}
                  className="rounded-2xl bg-slate-100/60 px-6 py-3.5 text-sm font-black text-on-surface transition-colors hover:bg-error/10 hover:text-error dark:bg-slate-800/40 dark:text-white dark:hover:bg-error/20"
                >
                  {t('simulation.studio.no')}
                </button>
                <button
                  onClick={enterStudio}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-primary/30"
                >
                  <span className="material-symbols-outlined text-xl">fullscreen</span>
                  {t('simulation.studio.yes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Dialog Modal */}
      {reservationDialogOpen && selectedReservation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <section className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
            <header className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/10 dark:border-slate-800">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface dark:text-white">{t('bookings.modal.title', 'Rezervasiya Detalları')}</h2>
              <button onClick={() => {
                setReservationDialogOpen(false);
                setSelectedReservation(null);
                setRejectMode(false);
                setRejectReason('');
              }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
              {/* User Section */}
              <section className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-on-surface dark:text-white">{selectedReservation.userName}</h3>
                  <p className="text-on-surface-variant dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    {selectedReservation.userEmail || t('bookings.modal.noNote', 'Qeyd yoxdur').split(' ')[0]}
                  </p>
                  <p className="text-on-surface-variant dark:text-slate-400 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">call</span>
                    {selectedReservation.userPhone}
                  </p>
                </div>
                <button
                  onClick={() => setIsBlockModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                    isUserBlocked 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isUserBlocked ? 'lock_open' : 'block'}
                  </span>
                  {isUserBlocked 
                    ? t('bookings.modal.unblockUser', 'Blokdan çıxar')
                    : t('bookings.modal.blockUser', 'Blokla')}
                </button>
              </section>

              {/* Booking Info Grid */}
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.venue', 'Məkan')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedReservation.venueName}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.id', 'ID')}</span>
                  <p className="text-lg font-bold text-primary mt-1">{selectedReservation.reservationNumber ?? 'N/A'}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.date', 'Tarix')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedReservation.date}</p>
                </div>
                <div className="bg-surface-container-low dark:bg-slate-800/50 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.time', 'Saat')}</span>
                  <p className="text-lg font-bold text-on-surface dark:text-white mt-1">{selectedReservation.time}</p>
                </div>
              </section>

              {selectedReservation.tierTitle && (
                <section className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 dark:border-primary/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-80">{t('bookings.modal.tier', 'Obyekt')}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold text-on-surface dark:text-white">{selectedReservation.tierTitle}</p>
                    <p className="text-lg font-bold text-primary">{selectedReservation.tierPrice} AZN</p>
                  </div>
                </section>
              )}

              {selectedReservation.description && (
                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400 opacity-60">{t('bookings.modal.userNote', 'İstifadəçi Qeydi')}</h4>
                  <div className="bg-surface-container-low dark:bg-slate-800/50 p-5 rounded-2xl relative">
                    <span className="material-symbols-outlined absolute top-4 right-4 text-outline-variant opacity-40 text-3xl">format_quote</span>
                    <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed pr-8">
                      {selectedReservation.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Check-In Section for awaiting_arrival */}
              {selectedReservation.status === 'awaiting_arrival' && (
                <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">directions_walk</span>
                    <div>
                      <h4 className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {t('bookings.modal.checkInTitle', 'İstifadəçi gəldi?')}
                      </h4>
                      <p className="text-sm text-blue-800/70 dark:text-blue-400/70 mt-1">
                        Məkana daxil olduqda istifadəçinin rezervasiya kodunu bura daxil edin və gəlişini təsdiqləyin.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <input 
                      type="text" 
                      placeholder={t('bookings.modal.checkInPlaceholder', 'Rezervasiya kodunu daxil edin')}
                      value={simCheckInCode}
                      onChange={(e) => setSimCheckInCode(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                    />
                    <button 
                      onClick={async () => {
                        if (!simCheckInCode.trim() || !selectedReservation) return;
                        try {
                          await checkInReservation({ 
                            reservationNumber: simCheckInCode.trim(), 
                            venueId: selectedReservation.venueId 
                          }).unwrap();
                          
                          toast.success(t('bookings.modal.checkInSuccess', 'Check-in uğurlu! İstifadəçi qeydiyyatdan keçdi.'));
                          setReservationDialogOpen(false);
                          setSelectedReservation(null);
                          setSimCheckInCode('');
                        } catch (err) {
                          toast.error(err?.data?.message || t('bookings.modal.checkInError', 'Kod yanlışdır və ya rezervasiya tapılmadı.'));
                        }
                      }}
                      disabled={isCheckingIn || !simCheckInCode.trim()}
                      className="px-6 rounded-xl text-white font-bold bg-blue-600 shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isCheckingIn ? t('common.loading', 'Yüklənir...') : t('bookings.modal.checkInBtn', 'Gəlməsini Təsdiqlə')}
                    </button>
                  </div>
                </section>
              )}
            </div>
            
            {/* Actions Footer */}
            {selectedReservation.status === 'pending' && !rejectMode && (
              <footer className="px-8 py-6 bg-surface-container-low dark:bg-slate-800 flex gap-4 border-t border-outline-variant/10 dark:border-slate-800">
                <button 
                  onClick={() => handleReservationStatusUpdate(selectedReservation._id, 'accepted')}
                  disabled={isUpdating}
                  className="flex-1 py-4 px-6 rounded-xl text-white font-bold bg-gradient-to-br from-green-600 to-green-500 shadow-lg shadow-green-200/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUpdating ? t('common.loading', 'Yüklənir...') : t('bookings.modal.acceptBtn', 'Qəbul Et')}
                </button>
                <button 
                  onClick={() => setRejectMode(true)}
                  disabled={isUpdating}
                  className="flex-1 py-4 px-6 rounded-xl text-error font-bold bg-white dark:bg-slate-900 border border-error/20 hover:bg-error/5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {t('bookings.modal.rejectBtn', 'Rədd Et')}
                </button>
              </footer>
            )}

            {/* Reject Form Footer */}
            {selectedReservation.status === 'pending' && rejectMode && (
              <footer className="px-8 py-6 bg-surface-container-low dark:bg-slate-800 flex flex-col gap-4 border-t border-outline-variant/10 dark:border-slate-800">
                <div className="w-full">
                  <label className="block text-sm font-bold text-on-surface dark:text-white mb-2">{t('bookings.modal.rejectReasonDesc', 'İmtina Səbəbi')}</label>
                  <textarea 
                    autoFocus
                    placeholder={t('bookings.modal.rejectPlaceholder', 'Səbəbi daxil edin...')}
                    className="w-full bg-white dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-700 rounded-xl p-4 text-sm text-on-surface dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-error focus:border-error"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={isUpdating}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setRejectMode(false)}
                    disabled={isUpdating}
                    className="flex-1 py-3 px-6 rounded-xl text-on-surface font-bold bg-outline-variant/10 hover:bg-outline-variant/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {t('common.cancel', 'Ləğv et')}
                  </button>
                  <button 
                    onClick={() => handleReservationStatusUpdate(selectedReservation._id, 'rejected')}
                    disabled={isUpdating || !rejectReason.trim()}
                    className="flex-1 py-3 px-6 rounded-xl text-white font-bold bg-error shadow-lg shadow-error/30 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? t('common.loading', 'Yüklənir...') : t('bookings.modal.rejectBtn', 'Rədd Et')}
                  </button>
                </div>
              </footer>
            )}
          </section>
        </div>
      )}

      {/* Global Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[10vh]">
          <div className="w-full max-w-2xl bg-surface-container-lowest dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-transparent dark:border-slate-800">
            <div className="p-4 border-b border-outline-variant/10 dark:border-slate-800 flex items-center gap-3 bg-surface-container-low/50 dark:bg-slate-800/50">
              <span className="material-symbols-outlined text-outline-variant dark:text-slate-400 pl-2">search</span>
              <input
                autoFocus
                type="text"
                placeholder={t('bookings.search.placeholder', 'İstifadəçi adı, nömrəsi, e-poçtu və ya ID...')}
                className="flex-1 bg-transparent border-none outline-none text-on-surface dark:text-white placeholder:text-outline-variant dark:placeholder:text-slate-500 text-lg py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-colors text-on-surface-variant dark:text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {searchReservations.length > 0 ? (
                <div className="space-y-1">
                  {searchReservations.map(res => (
                    <button
                      key={res._id}
                      onClick={() => {
                        setSelectedReservation(res);
                        setReservationDialogOpen(true);
                        setIsSearchModalOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface dark:text-white text-lg group-hover:text-primary transition-colors">{res.userName}</p>
                          <div className="flex items-center gap-3 text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">call</span>{res.userPhone}</span>
                            {res.userEmail && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">mail</span>{res.userEmail}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/10 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{res.reservationNumber}</span>
                        <div className="text-sm font-medium text-on-surface-variant dark:text-slate-400 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          {res.date} • {res.time}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : debouncedSearch ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high dark:bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-outline-variant dark:text-slate-500">search_off</span>
                  </div>
                  <p className="text-lg font-bold text-on-surface dark:text-white">{t('bookings.search.noResults', 'Nəticə tapılmadı')}</p>
                  <p className="text-on-surface-variant dark:text-slate-400 mt-1">{t('bookings.search.tryDifferent', 'Fərqli açar sözlər yoxlayın')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                  <span className="material-symbols-outlined text-5xl text-outline-variant dark:text-slate-600 mb-4">person_search</span>
                  <p className="text-on-surface-variant dark:text-slate-400">{t('bookings.search.startTyping', 'Axtarmaq üçün yazmağa başlayın...')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isUserBlocked ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {isUserBlocked ? 'lock_open' : 'block'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface dark:text-white mb-2">
              {isUserBlocked ? t('bookings.modal.unblockConfirmTitle', 'Blokdan Çıxar') : t('bookings.modal.blockConfirmTitle', 'İstifadəçini Blokla')}
            </h3>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm mb-6">
              {isUserBlocked 
                ? t('bookings.modal.unblockConfirmDesc', 'Bu istifadəçi artıq yenidən rezervasiya edə biləcək. Davam edilsin?')
                : t('bookings.modal.blockConfirmDesc', 'Bu istifadəçi bu məkanda bir daha rezervasiya edə bilməyəcək. Davam edilsin?')}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-on-surface font-bold bg-outline-variant/10 hover:bg-outline-variant/20 active:scale-95 transition-all"
              >
                {t('common.cancel', 'Ləğv et')}
              </button>
              <button 
                onClick={confirmBlockToggle}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-all ${
                  isUserBlocked 
                    ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                }`}
              >
                {isUserBlocked ? t('bookings.modal.unblockBtn', 'Blokdan Çıxar') : t('bookings.modal.blockBtn', 'Blokla')}
              </button>
            </div>
          </div>
        </div>
      )}

      {studioShell}
    </>
  );
};

export default Simulation;
