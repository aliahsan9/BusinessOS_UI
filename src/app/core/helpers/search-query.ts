import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map, skip } from 'rxjs';

/** Search text carried by the top bar as `?search=`. */
export function readSearchQuery(route: ActivatedRoute): string {
  return (route.snapshot.queryParamMap.get('search') ?? '').trim();
}

/**
 * Applies later `?search=` changes without repeating the first load.
 * Callers apply the snapshot themselves, then subscribe so a reused page
 * still picks up a new search from the top bar.
 */
export function followSearchQuery(
  route: ActivatedRoute,
  destroyRef: DestroyRef,
  apply: (term: string) => void,
): void {
  route.queryParamMap
    .pipe(
      map((params) => (params.get('search') ?? '').trim()),
      distinctUntilChanged(),
      skip(1),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(apply);
}
