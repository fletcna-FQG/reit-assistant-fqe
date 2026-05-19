# REIT Assistant — Developer Handoff Specifications
**Fletcher Quill Estates Inc.**  
**Version:** 1.0.0  
**Platform:** React Native (iOS/Android) + Web (Next.js)

---

## 📐 Layout Constraints

### Mobile (375×812, 414×896)
- **Safe Area:** Respect `env(safe-area-inset-*)` for notches
- **Bottom Nav:** Fixed, 64px height, includes safe-area padding
- **Header:** Fixed, 56px height
- **Content Scroll:** `padding-bottom: calc(64px + 20px)` to clear bottom nav
- **Touch Targets:** Minimum 44×44pt (88×88px @2x)

### Tablet (768×1024, 1024×1366)
- **Grid:** 2-column deal cards, 4-column metrics
- **Sidebar:** Optional persistent nav if landscape
- **Bottom Nav:** Retained for consistency, or migrate to sidebar at 1024px

### Desktop (1440×900, 1920×1080)
- **Sidebar:** Fixed 280px width, scrollable independently
- **Main Content:** `margin-left: 280px`, max-width 1440px centered
- **Left-Handed Mode:** `margin-right: 280px; margin-left: 0`
- **FAB:** Bottom-right (or bottom-left in left-handed mode)

---

## 🎞️ Animation Specifications

### Screen Transitions
```css
/* Exit */
.screen.exit-left {
  transform: translateX(-30%);
  opacity: 0.5;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}

/* Enter */
.screen.active {
  transform: translateX(0);
  opacity: 1;
  transition: transform 300ms ease-in-out, opacity 300ms ease-in-out;
}
```
**React Native Equivalent:**
```jsx
<Animated.View style={{
  transform: [{ translateX: slideAnim }],
  opacity: fadeAnim
}}>
```

### Tab Switch
```css
.tab-content {
  animation: fadeIn 200ms ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
```

### Card Expansion
```css
.rule-detail {
  max-height: 0;
  overflow: hidden;
  transition: max-height 250ms ease-out;
}
.rule-detail.expanded {
  max-height: 200px;
}
```

### Button Press
```css
.btn:active {
  transform: scale(0.95);
  transition: transform 100ms linear;
}
```
**Haptic Feedback (Mobile):**
```javascript
// React Native
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### Loading Spinner
```css
.spinner {
  animation: spin 1000ms linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Success Checkmark
```css
.checkmark-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawCheck 500ms ease-out forwards;
}
@keyframes drawCheck {
  to { stroke-dashoffset: 0; }
}
```

### Score Gauge
```css
.score-gauge-fill {
  stroke-dasharray: 440;
  stroke-dashoffset: 440;
  transition: stroke-dashoffset 800ms ease-out;
}
/* Trigger via JS: */
element.style.strokeDashoffset = targetOffset;
```

### Error Shake
```css
.form-input.error {
  animation: shake 300ms ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
```

### Badge Appear
```css
.badge {
  animation: badgeAppear 300ms ease-out;
}
@keyframes badgeAppear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Modal Open
```css
.modal-overlay {
  opacity: 0;
  transition: opacity 200ms ease;
}
.modal-overlay.active {
  opacity: 1;
}
.modal {
  transform: scale(0.9);
  transition: transform 200ms ease;
}
.modal-overlay.active .modal {
  transform: scale(1);
}
```

---

## 🖼️ Asset Export Specifications

### Icons
| Size | Format | Usage |
|------|--------|-------|
| 24×24 | SVG | Navigation icons, action icons |
| 20×20 | SVG | Header action buttons |
| 16×16 | SVG | Inline form icons, badges |
| 48×48 | SVG | Empty state icons |

**Icon Style:**
- Stroke width: 2px
- Stroke linecap: round
- Stroke linejoin: round
- Color: `currentColor` (inherits from CSS)

### Logo
| Size | Format | Usage |
|------|--------|-------|
| 120×120 | SVG, PNG @1x, @2x, @3x | Splash screen |
| 40×40 | SVG | Sidebar header, favicon |
| 80×80 | SVG | Login screen |

### Property Images
| Size | Format | Usage |
|------|--------|-------|
| 800×400 | WebP, JPEG fallback | Deal detail carousel |
| 400×300 | WebP, JPEG fallback | Deal card thumbnails |
| 1600×800 | WebP | Full-screen preview modal |

**Optimization:**
- WebP with JPEG fallback
- Lazy loading with blur-up placeholder
- Compression: 80% quality JPEG, 70% WebP

### Empty State Illustrations
| Size | Format | Usage |
|------|--------|-------|
| 200×200 | SVG | No deals, no tasks, offline |

---

## 🔧 Component Implementation Notes

### Bottom Tab Bar (React Native)
```jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();

<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#003366',
    tabBarInactiveTintColor: '#7f8c8d',
    tabBarStyle: {
      height: 64 + safeAreaBottom,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    tabBarItemStyle: {
      paddingVertical: 8,
    },
  }}
>
  <Tab.Screen name="Dashboard" component={DashboardScreen} />
  {/* ... */}
</Tab.Navigator>
```

### Sidebar (Web/Desktop)
```jsx
<aside className="sidebar" style={{
  position: 'fixed',
  width: 280,
  left: isLeftHanded ? 'auto' : 0,
  right: isLeftHanded ? 0 : 'auto',
}}>
```

### Score Gauge (SVG)
```jsx
const ScoreGauge = ({ score, size = 180 }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  const color = score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke="#e0e0e0" strokeWidth={12}
      />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={color} strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="48" fontWeight="800" fill="#003366">
        {score}
      </text>
    </svg>
  );
};
```

### Virtualized List (1000+ Deals)
```jsx
import { FlatList } from 'react-native';

<FlatList
  data={deals}
  renderItem={({ item }) => <DealCard deal={item} />}
  keyExtractor={item => item.id}
  onEndReached={loadMoreDeals}
  onEndReachedThreshold={0.5}
  getItemLayout={(data, index) => (
    { length: 120, offset: 120 * index, index }
  )}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Offline Detection
```javascript
// React Native
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  setIsOffline(!state.isConnected);
});

// Web
window.addEventListener('offline', () => setIsOffline(true));
window.addEventListener('online', () => setIsOffline(false));
```

### Skeleton Loader
```jsx
const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
    <View style={[styles.skeletonLine, { width: '40%', height: 14, marginTop: 8 }]} />
  </View>
);

// CSS shimmer animation
const styles = StyleSheet.create({
  skeletonLine: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Add animated gradient overlay
});
```

---

## 📱 Haptic Feedback Map

| Action | iOS | Android | Web Fallback |
|--------|-----|---------|--------------|
| Button Press | `UIImpactFeedbackStyle.Light` | `HapticFeedbackConstants.CONTEXT_CLICK` | None |
| Success | `UINotificationFeedbackType.Success` | `HapticFeedbackConstants.CONFIRM` | Toast vibration (if supported) |
| Error | `UINotificationFeedbackType.Error` | `HapticFeedbackConstants.REJECT` | None |
| Toggle Switch | `UIImpactFeedbackStyle.Light` | `HapticFeedbackConstants.TOGGLE_ON` | None |
| Pull to Refresh | `UIImpactFeedbackStyle.Light` | `HapticFeedbackConstants.VIRTUAL_KEY` | None |
| Swipe Delete | `UIImpactFeedbackStyle.Medium` | `HapticFeedbackConstants.GESTURE_START` | None |

---

## 🌐 Responsive Implementation Strategy

### Breakpoint Constants
```javascript
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// React Native (useWindowDimensions)
const { width } = useWindowDimensions();
const isDesktop = width >= BREAKPOINTS.desktop;
```

### Conditional Rendering
```jsx
const Navigation = () => {
  const { width } = useWindowDimensions();

  if (width >= 1024) {
    return <SidebarNavigation />;
  }
  return <BottomTabBar />;
};
```

### CSS Media Queries (Web)
```css
/* Mobile first */
.kpi-scroll { display: flex; gap: 12px; overflow-x: auto; }

/* Tablet */
@media (min-width: 768px) {
  .kpi-scroll { display: grid; grid-template-columns: repeat(2, 1fr); }
  .detail-metrics { grid-template-columns: repeat(4, 1fr); }
  .deals-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .bottom-nav { display: none; }
  .sidebar { display: flex; }
  .main-content { margin-left: 280px; }
}
```

---

## 🗄️ Data Fetching Patterns

### Dashboard KPIs
```javascript
// SWR / React Query
const { data: kpis, isLoading } = useSWR('/api/portfolio/kpis', fetcher, {
  refreshInterval: 30000, // 30s
  dedupingInterval: 5000,
});
```

### Deals List (Infinite Scroll)
```javascript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  ['deals', filters],
  ({ pageParam = 1 }) => fetchDeals({ page: pageParam, ...filters }),
  {
    getNextPageParam: (lastPage) => lastPage.nextPage ?? false,
  }
);
```

### Analysis Submission
```javascript
const mutation = useMutation(submitAnalysis, {
  onSuccess: (data) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Results', { analysisId: data.id });
  },
  onError: (error) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast(error.message, 'error');
  },
});
```

---

## 🔒 Security Requirements

1. **Never display in prototype:**
   - SSN, bank accounts, routing numbers
   - Full investor names (use initials)
   - Exact GPS coordinates (use city/zip only)

2. **API Security:**
   - JWT tokens with 15-minute expiry
   - Refresh token rotation
   - Biometric auth prompt for deal approvals > $1M

3. **Audit Trail:**
   - Every deal status change logged
   - Rule modification tracked with admin ID + timestamp
   - Exportable CSV for compliance review

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Score calculation with edge cases (0, 50, 100)
- [ ] Rule condition evaluation (AND/OR logic)
- [ ] Currency formatting ($5.1M, $346K)
- [ ] Date formatting (relative: "2 hours ago")

### Integration Tests
- [ ] Full analyzer flow: Step 1 → Step 2 → Step 3 → Results
- [ ] Offline submission → queue → sync
- [ ] Bulk rule re-evaluation progress tracking

### E2E Tests
- [ ] Left-handed mode toggle persists across sessions
- [ ] Dark mode toggle persists across sessions
- [ ] 1000+ deals list scrolls at 60fps
- [ ] Analysis completes in < 3 seconds on mid-range device

### Accessibility Tests
- [ ] Screen reader announces score gauge value
- [ ] All color-coded badges have text labels
- [ ] Keyboard navigation through analyzer form
- [ ] Focus trap in modals
- [ ] `prefers-reduced-motion` disables animations
