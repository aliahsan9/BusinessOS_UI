import { Routes } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';

export const INSIGHTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideMarkdown()],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/insights-list/insights-list.component').then((m) => m.InsightsListComponent),
        title: 'BusinessOS Insights',
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./pages/article-detail/article-detail.component').then((m) => m.ArticleDetailComponent),
        title: 'Article | BusinessOS Insights',
      },
    ],
  },
];
