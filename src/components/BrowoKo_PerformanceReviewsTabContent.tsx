/**
 * PERFORMANCE REVIEWS TAB CONTENT
 * ================================
 * Tab content for employee performance reviews (embedded in MeineDaten)
 */

import { lazy, Suspense } from 'react';
import LoadingState from './LoadingState';

// Lazy load the main screen
const EmployeePerformanceReviewScreen = lazy(() => import('../screens/EmployeePerformanceReviewScreen'));

export function PerformanceReviewsTabContent() {
  return (
    <Suspense fallback={<LoadingState message="Lade Mitarbeitergespräche..." />}>
      <div className="-mx-6 -my-6">
        <EmployeePerformanceReviewScreen />
      </div>
    </Suspense>
  );
}
